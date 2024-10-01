// BEGIN LICENSE
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
//
// Full text of this license can be found in the LICENSE file in the projects root.
// END LICENSE

import {PDRproxy} from "perspectives-proxy";

import { PropTypes } from "prop-types"
import PerspectivesComponent from "./perspectivescomponent";
import React from "react";

import { MainContainer, ChatContainer, MessageList, Message, MessageInput, ConversationHeader, Avatar, VoiceCallButton, VideoCallButton, InfoButton, TypingIndicator, MessageSeparator, SendButton, AttachmentButton, AvatarGroup } from '@chatscope/chat-ui-kit-react';
import styles from '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';

import { createAvatar } from '@dicebear/core';
import { initials } from '@dicebear/collection';

import { File as MFile, Storage } from 'megajs'
import { MicrophoneButton } from "./microphoneButton.js";
import { file2PsharedFile } from "./PSharedFile.js";
import { cuid2 } from "./cuid.js";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import i18next from "i18next";
import PPStorage from "./ppsharedfilestorage.js";

const ppStorageLimit = parseInt( '__PPSTORAGELIMIT__');

export default class ChatComponent extends PerspectivesComponent
{
  constructor(props)
  {
    super(props);
    let storageType_, sharedStorageId_;
    const component = this;
    component.state = 
      { messages: []
      , me: undefined
      // storage is either the Mega Storage object, or an instance of PPStorage.
      , storage: undefined
      , storageType: undefined
      , sharedStorageId: undefined
      , sharedFileServerKey: undefined
      , participants: []
      };
    PDRproxy
      .then( pproxy => pproxy.getFileShareCredentials() )
      // Mega storage.
      // Notice that for now we assume all storage is Mega. This might change in the future.
      .then( (credentials) => 
        {
          if (credentials)
          {
            switch (credentials.storageType) {
              case "ppstorage":
                PDRproxy.then( pproxy => {
                  component.addUnsubscriber(
                    pproxy.getProperty( 
                      component.props.roleinstance,
                      component.props.mediaproperty,
                      component.props.roletype,
                      values => component.guardUploadLimit( values )
                    ))});
                // Notice that password is overloaded for ppstorage.
                component.setState({storage: new PPStorage( credentials.password ), storageType: credentials.storageType} );
                break;
            
              case "mega":
                // {accountName, password, storageType, sharedStorageId}
                storageType_ = credentials.storageType;
                sharedStorageId_ = credentials.sharedStorageId;
                new Storage({email: credentials.accountName, password: credentials.password, userAgent: "Perspectives", keepalive: false}).ready
                  .then( storage => component.setState({storage, storageType: storageType_, sharedStorageId: sharedStorageId_}));

              default:
                break;
            }
          }
        })
      // TODO: give proper feedback.
      .catch( e => console.log(e))
    // Participants might change during the conversation.
    PDRproxy.then( pproxy => component.addUnsubscriber (
        pproxy.getChatParticipants(
          component.props.roleinstance,
          component.props.messagesproperty,
          (participants => component.augmentParticipants(participants)))));
    component.sharedFileStore = {};
    // Request for permission to use audio and store a promise for the audioRecorder in `mediaRecorderPromise`.
    this.mediaRecorderPromise = new Promise((resolve) => component.mediaRecorderPromiseResolver = resolve);
  }

  componentDidUpdate(prevProps, prevState)
  {
    const component = this;
    if (component.state.storage && ! prevState.storage)
    {
      // Only initialise the audio when we have storage!
      component.initializeAudio();
    }
  }

  componentDidMount()
  {
      const component = this;
      PDRproxy.then( proxy => 
        {
          component.addUnsubscriber(
            proxy.getProperty( 
              component.props.roleinstance,
              component.props.messagesproperty,
              component.props.roletype,
              values => component.augmentMessages( values ).then( augmentedMessages => component.setState({messages: augmentedMessages}))
            ));
          proxy.getMeInContext( component.props.externalrole ).then( me => component.setState({me: me[0]}))
        });
  }

  componentWillUnmount ()
  {
    super.componentWillUnmount();
    Object.values( this.sharedFileStore ).forEach( objectUrl => URL.revokeObjectURL( objectUrl ));
  }

  guardUploadLimit(files)
  {
    const component = this;
    if ( files.map( JSON.parse ).filter( ({storageType}) => storageType == "ppstorage").length > ppStorageLimit )
    {
      PDRproxy.then( pproxy => pproxy.setProperty(
        component.props.roleinstance,
        "model://perspectives.domains#SharedFileServices$SharedFileServices$DefaultFileServer$Disabled",
        ["false"],
        component.props.myroletype
      ));
      component.setState({storage: undefined, storageType: undefined});
      component.mediaRecorderPromise = new Promise(() => {});
      // TODO: provide better feedback.
      alert( "Max number of file uploads reached!");
    }
  }

  augmentParticipants(participants)
  {
    const component = this;
    Promise.all(
      participants.map( participant =>
      {
        if (participant.avatar)
        {
          return component.getPsharedFile(participant.avatar)
            .then( objectUrl => 
              {
                participant.avatar = objectUrl;
                return participant;
              } );
        }
        else
        {
          return new Promise( (resolve) =>
          {
            participant.avatar = createAvatar(initials, {
              seed: participant.firstname + " " + participant.lastname,
              size: 128
              }).toDataUri();
            resolve( participant );
          })
        }
      }))
      .then( participantsWithAvatars => component.setState({participants: participantsWithAvatars}))
  }
  /////////////////////////////////////////////////////////////////////////////////////////////////
  ////            SHARING FILES
  /////////////////////////////////////////////////////////////////////////////////////////////////

  handleFileUpload(fileList)
  {
    const theFile = fileList.item(0);
    const component = this;
    if ( theFile )
    {
      if (component.state.storage)
      {
        component.uploadMediaFile( theFile )
      }
      // No storage. By now the client will have received an answer from the PDR, so we can safely assume
      // the user has no private storage and has exceeded the complimentary storage limit.
    }
  }

  uploadMediaFile( theFile )
  {
    const component = this;
    switch (component.state.storageType) {
      case "mega":
        const reader = new FileReader();
        reader.onload = function(event) {
            const arrayBuffer = event.target.result; // ArrayBuffer from FileReader
            const uint8Array = new Uint8Array(arrayBuffer); // Create Uint8Array from ArrayBuffer
            component.state.storage.upload( {name: theFile.name, size: theFile.size}, uint8Array ).complete
              .then( file => file.link() )
              // then add to the map with the mega url as index
              .then( megaUrl => component.cacheAndSendMessage (theFile, megaUrl) )
              // TODO: meldt in een dialog.
              .catch( message => alert(message))
              };
        reader.readAsArrayBuffer(theFile);
        break;

      case "ppstorage":
        component.state.storage.upload(theFile)
          .then( megaUrl => component.cacheAndSendMessage( theFile, megaUrl ))
          // TODO: meld in een dialog.
          .catch( message => alert(message));
      default:
        break;
    }
  }


  cacheAndSendMessage (theFile, megaUrl)
  {
    const component = this;
    // then save the mega url in the 'media' PDR property
    PDRproxy.then( pproxy => pproxy.addProperty(
      component.props.roleinstance,
      component.props.mediaproperty,
      JSON.stringify( file2PsharedFile(theFile, component.state.sharedStorageId, component.state.storageType, megaUrl) ),
      component.props.myroletype
    ));
    // then create an object url and add to the map with the mega url as index
    component.sharedFileStore[megaUrl] = URL.createObjectURL(theFile);
    // then create and send a message with the mega url.
    component.handleSend(
      { src: file2PsharedFile(theFile, component.state.sharedStorageId, component.state.storageType, megaUrl)
      , alt: theFile.name
      , width: "100%"
      })
  }

  // returns a promise for an object url.
  // Invariant: the sharedFileStore will contain an entry for psharedFile.url holding the object url.
  getPsharedFile( psharedFile )
  {
    const component = this;
    if ( component.sharedFileStore[psharedFile.url] )
      {
        return new Promise((resolve) => resolve( component.sharedFileStore[psharedFile.url] ));
      }
      else
      {
        return component.retrieveFileFromStorage(psharedFile);
      }
  }
  // returns a promise for an object url.
  // Adds the object url to sharedFileStore under key psharedFile.url.
  retrieveFileFromStorage(psharedFile)
  {
    switch (psharedFile.storageType) {
      case "ppstorage":
      case "mega":
        return this.retrieveFileFromMega(psharedFile)

      default:
        // TODO: possibly handle in another way, like provide a default image?
        return new Promise((reject) => reject("Unknown storage type"));
        break;
    }
  }

  // Adds the object url to sharedFileStore under key psharedFile.url.
  retrieveFileFromMega( {url, type} )
  { 
    const component = this;
    // Get the file object from the URL
    const file = MFile.fromURL(url)
    // Load file attributes
    return file.loadAttributes()
      .then(() => file.downloadBuffer())
      .then( data => 
        {
          const f = new Blob([data], {type})
          // Now create an object url:
          const objectUrl =  URL.createObjectURL(f)
          component.sharedFileStore[url] = objectUrl
          return objectUrl;  
        }          
      );
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////
  ////            AUDIO
  /////////////////////////////////////////////////////////////////////////////////////////////////
  // Creates a promise for the mediaRecorder in the component property `mediaRecorderPromise`.
  // When the recorder is started and then stopped:
  //    Saves the audio file to Mega.
  //    Adds a megaUrl - objectUrl mapping to the local sharedFileStore.
  //    Saves a PSharedFile.
  //    Sends the recording as a message.
  initializeAudio()
  {
    const component = this;

    // Request access to the user's microphone
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then( stream => 
        {
          // Initialize the chunks.
          let audioChunks = [];
          // Initialize MediaRecorder with the stream
          const mediaRecorder = new MediaRecorder(stream);

          // Event listener to collect audio data when available
          mediaRecorder.ondataavailable = (event) => {
              audioChunks.push(event.data);
          };

          // Event listener to handle when recording stops
          mediaRecorder.onstop = () => {
              // Create a Blob from the audio data
              const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
              // Clear the audioChunks array for future recordings
              audioChunks = [];
              // Save the audio file
              const audioFile = new File([audioBlob], cuid2(), { type: mediaRecorder.mimeType }); 
              component.uploadMediaFile( audioFile );
          };
          // Finally resolve the promise 'mediaRecorderPromise' created in the constructor.
          component.mediaRecorderPromiseResolver( mediaRecorder );
        });
  }

  startRecording(ev)
  {
    ev.stopPropagation();
    ev.preventDefault();
    console.log("Start recording.");
    this.mediaRecorderPromise.then( mediaRecorder => mediaRecorder.start());
  }

  stopRecording(ev)
  {
    ev.stopPropagation();
    ev.preventDefault();
    console.log("Stop recording.");
    this.mediaRecorderPromise.then( mediaRecorder => mediaRecorder.stop());
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////
  ////            SEND MESSAGE
  /////////////////////////////////////////////////////////////////////////////////////////////////
  // payload is either a string, or a {src, alt, width} structure where src is a PSharedFile.
  handleSend( payload )
  {
    const component = this;
    PDRproxy.then( proxy => 
      proxy.addProperty(
        component.props.roleinstance,
        component.props.messagesproperty,
        JSON.stringify({
          payload,
          sender: component.state.me,
          sentTime: Date.now()
        }),
        component.props.myroletype
      )
   ) 
  }
  

  /////////////////////////////////////////////////////////////////////////////////////////////////
  ////            CONSTRUCTING MESSAGES
  /////////////////////////////////////////////////////////////////////////////////////////////////
  // Returns a promise for augmented messages.
  // Add `direction`, `position` and if the payload is an object whose src is a PSharedFile, set the payload src to an object url.
  // {
  //   message: string, WE DON'T USE THIS BUT PAYLOAD INSTEAD!
  //   sentTime: string,
  //   sender: string,
  //   direction: 'incoming' | 'outgoing' | 0 | 1,
  //   position: 'single' | 'first' | 'normal' | 'last' | 0 | 1 | 2 | 3,
  //   type: 'html' | 'text' | 'image' | 'custom',
  //   payload: string | object | allowedChildren([MessageCustomContent])
  // }
  // If payload is not a string, it is an image object {src, alt, width} where src is a PSharedFile object.
  augmentMessages( messages )
  {
    const component = this;
    function isPSharedFile ({payload})
    {
      return typeof payload == 'object' && payload.src && payload.src.storageType;
    }
    return Promise.all( messages.map( (messageString, i) => 
    {
      const message = JSON.parse(messageString);
      const previousMessage = messages[i-1];
      const nextMessage = messages[i+1];
      // Make time readable
      message.sentTime = new Date(message.sentTime).toLocaleTimeString();
      // Set direction.
      if (message.sender == component.state.me)
      {
        message.direction = 'outgoing';
      }
      else
      {
        message.direction = 'incoming';
      }
      // Set position.
      if (previousMessage && previousMessage.sender == message.sender)
      {
        // a A
        if (nextMessage && nextMessage.sender == message.sender)  
        {
          // a A a
          message.position = 'normal';
        }
        else
        {
          // a A b
          message.position = 'last';
        }
      }
      // b A
      else if (nextMessage && message.sender == nextMessage.sender)
      {
        // b A a
        message.position = 'first';
      }
      else
      {
        // b A b
        message.position = 'single';
      }
      // Create an image payload where the src is an object url:
      if (isPSharedFile(message))
      {
        return component.getPsharedFile( message.payload.src )
          .then( objectUrl => 
            {
              message.payload.mimeType = message.payload.src.type;
              message.payload.src = objectUrl
              return message
            } )
      }
      else
      {
        return new Promise((resolve) => resolve(message));
      }
    }));
  }

  // message types according to https://chatscope.io/storybook/react/?path=/docs/components-message--docs:
  // type: 'html' | 'text' | 'image' | 'custom'
  // Notice that here we work with payload.mimeType (a mime-type valued property we add to the payload structure that chatscope exclusively uses for images).
  // payload = {type, ...}
  buildMessage( message, i)
  {
    const component = this;
    if (typeof message.payload == 'string')
    {
      return (<Message key={i} model={message} type='text'>
          <Message.Header sentTime={message.sentTime}/>
          <Avatar name={message.sender} size="sm" src={component.getAvatar(message.sender)}/>
        </Message>);
    }
    if (typeof message.payload == 'object')
    {
      // Now payload.mimeType **MUST** exist.
      if (message.payload.mimeType.match(/^audio/))
      {
        return (<Message key= {i} model={{
                  direction: message.direction,
                  type: "custom"
                }}>
                  <Avatar name={message.sender} size="sm" src={component.getAvatar(message.sender)}/>
                  <Message.CustomContent>
                    <audio controls>
                      <source src={message.payload.src} type={message.payload.mimeType}/>
                    </audio>
                  </Message.CustomContent>
                </Message>)
      }
      else if (message.payload.mimeType.match(/^image/))
      {
        return (<Message key={i} model={message} type='image'>
            <Avatar name={message.sender} size="sm" src={component.getAvatar(message.sender)}/>
          </Message>);
      }
    }
  }

  buildMessageList()
  {
    const component = this;
    const messageList = [];
    for (let index = 0; index < component.state.messages.length; index++) {
      const previousMessage = component.state.messages[index-1];
      const currentMessage = component.state.messages[index];
      if (previousMessage && new Date(previousMessage.sentTime).getDate() < new Date(currentMessage.sentTime).getDate())
      {
        messageList.push( <MessageSeparator content={new Date(currentMessage.sentTime).toLocaleDateString()} /> )
      }
      messageList.push( component.buildMessage(currentMessage, messageList.length));
    }
    return messageList;
  }

  getAvatar( userId )
  {
    return this.state.participants.find( ({roleInstance}) => roleInstance == userId ).avatar
  }

  render()
  {
    const renderTooltip = (props) => (
      <Tooltip id="recordAudio-tooltip" {...props} show={
         // eslint-disable-next-line react/prop-types
        props.show.toString()}>
        { i18next.t("chatComponent_recordAudio", {ns: "preact"}) }
      </Tooltip> );
  
    const component = this;
    let audioAvailabe = false;
    component.mediaRecorderPromise.then( () => audioAvailabe = true);
    return (
      <MainContainer responsive>
            <ChatContainer
            style={{
                height: '100%'
            }}
            >
            <ConversationHeader>
                <ConversationHeader.Content>
                  <AvatarGroup>
                    {
                      component.state.participants.map( ({firstname, avatar}, i) => <Avatar key={i} name={firstname} src={avatar} />)
                    }
                  </AvatarGroup>
                </ConversationHeader.Content>
                <ConversationHeader.Actions>
                </ConversationHeader.Actions>
            </ConversationHeader>
            <MessageList>{ component.buildMessageList()}</MessageList>
            <div as={MessageInput} style={{display:"flex", flexDirection:"row", borderTop: "1px dashed #d1dbe4"}}>
              <MessageInput
                placeholder="Type message here" 
                sendButton={false}
                attachButton={false}
                onSend={text => component.handleSend(text)}
                style={{ flexGrow: 1, borderTop: 0, flexShrink:"initial",  }} />
              <SendButton style={{fontSize:"1.2em", marginLeft:0, paddingLeft: "0.2em", paddingRight:"0.2em"}} />
              <AttachmentButton 
                disabled={audioAvailabe}
                onClick={ () => document.getElementById('__fileupload__').click()} style={{fontSize:"1.2em", paddingLeft: "0.2em", paddingRight:"0.2em"}} 
              />
              <OverlayTrigger
                  placement="left"
                  delay={{ show: 250, hide: 400 }}
                  overlay={renderTooltip}
                >
                <MicrophoneButton 
                  disabled={audioAvailabe}
                  onMouseDown={ ev => component.startRecording(ev)}
                  onMouseUp={ ev => component.stopRecording(ev)}
                  style={{fontSize:"1.2em", paddingLeft: "0.2em", paddingRight:"0.2em"}}  
                  />
              </OverlayTrigger>
            </div>
            </ChatContainer>
        <input 
            type="file" 
            id="__fileupload__"
            style={{display: "none"}} 
            onChange={ ev => 
            {
              component.handleFileUpload(ev.target.files)
            }}
          />
      </MainContainer>
    );
  }
}

ChatComponent.propTypes = 
  { externalrole: PropTypes.string.isRequired
  , roleinstance: PropTypes.string.isRequired
  , roletype: PropTypes.string.isRequired
  , messagesproperty: PropTypes.string.isRequired
  , mediaproperty: PropTypes.string.isRequired
  , myroletype: PropTypes.string.isRequired
  }