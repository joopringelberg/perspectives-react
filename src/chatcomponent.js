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

import PDRproxy from "./proxystub.js";

import { PropTypes } from "prop-types"
import PerspectivesComponent from "./perspectivescomponent";
import React, { Component } from "react";

import { MainContainer, ChatContainer, MessageList, Message, MessageInput, ConversationHeader, Avatar, VoiceCallButton, VideoCallButton, InfoButton, TypingIndicator, MessageSeparator, SendButton, AttachmentButton } from '@chatscope/chat-ui-kit-react';
import styles from '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';

import { createAvatar } from '@dicebear/core';
import { initials } from '@dicebear/collection';

import { File as MFile, Storage } from 'megajs'
import { MicrophoneButton } from "./microphoneButton.js";
import { file2PsharedFile } from "./PSharedFile.js";
import { cuid2 } from "./cuid.js";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import i18next from "i18next";
export default class ChatComponent extends Component
{
  constructor(props)
  {
    super(props);
    const component = this;
    component.avatar = createAvatar(initials, {
            seed: "Joop Ringelberg",
          size: 128
        }).toDataUri();
    component.state = 
      { messages: []
      , me: undefined
      , storage: undefined
      };
    PDRproxy
      .then( pproxy => pproxy.getFileShareCredentials() )
      // Mega storage.
      // Notice that for now we assume all storage is Mega. This might change in the future.
      .then( ({accountName, password}) => new Storage({email: accountName, password, userAgent: "Perspectives", keepalive: false}).ready)
      .then( storage => component.setState({storage}))
      .catch( e => console.log(e))
    component.sharedFileStore = {};
    // Request for permission to use audio and store a promise for the audioRecorder in `mediaRecorderPromise`.
    this.mediaRecorderPromise = undefined;
    component.initializeAudio();
  }

  componentDidMount()
  {
      const component = this;
      PDRproxy.then( proxy => 
        {
          proxy.getProperty( 
            component.props.roleinstance,
            component.props.messagesproperty,
            component.props.roletype,
            values => component.setState({messages: component.augmentMessages( values )}))
          proxy.getMe( component.props.externalrole ).then( me => component.setState({me: me}))
        });
  }

  // Add `direction`, `position` and if the payload is a PSharedFile, set the payload src to an object url.
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
    return messages.map( (messageString, i) => 
    {
      const message = JSON.parse(messageString);
      const previousMessage = messages[i-1];
      const nextMessage = messages[i+1];
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
        if ( component.sharedFileStore[message.payload.src.url] )
        {
          // the mimeType property of payload is our own addition.
          message.payload.mimeType = message.payload.src.type;
          message.payload.src = component.sharedFileStore[message.payload.src.url];
        }
        else
        {
          component.retrieveFileFromStorage( message.payload )
            .then( objectUrl => 
              {
                message.payload.mimeType = message.payload.src.type;
                message.payload.src = objectUrl
              } )
        }
      }
      return message;
    }
    )
  }

  // returns a promise for an object url.
  retrieveFileFromStorage(psharedFile)
  {
    switch (psharedFile.storageType) {
      case "mega":
        return this.retrieveFileFromMega(psharedFile)

      default:
        // TODO: possibly handle in another way, like provide a default image?
        return new Promise((reject) => reject("Unknown storage type"));
        break;
    }
  }

  retrieveFileFromMega( {src, type} )
  { 
    const component = this;
    // Get the file object from the URL
    const file = MFile.fromURL(src)
    // Load file attributes
    return file.loadAttributes()
      .then(() => file.downloadBuffer())
      .then( data => 
        {
          const f = new Blob([data], {type})
          // Now create an object url:
          const objectUrl =  URL.createObjectURL(f)
          component.sharedFileStore[src] = objectUrl
          return objectUrl;  
        }          
      );
  }

  componentWillUnmount ()
  {
    Object.values( this.sharedFileStore ).forEach( objectUrl => URL.revokeObjectURL( objectUrl ));
  }

  // payload is either a string, or a {src, alt, width} structure where src is a PSharedFile.
  handleSend( payload )
  {
    const component = this;
    PDRproxy.then( proxy => 
      proxy.addProperty(
        component.props.roleinstance,
        component.props.messagesproperty,
        [JSON.stringify({
          payload,
          sender: component.state.me,
          sentTime: '15 mins ago'
        })]
      )
   ) 
  }
  
  handleFileUpload(fileList)
  {
    const theFile = fileList.item(0);
    const component = this;
    if ( theFile )
    {
      if (component.state.storage)
      {
        const reader = new FileReader();

        reader.onload = function(event) {
            const arrayBuffer = event.target.result; // ArrayBuffer from FileReader
            const uint8Array = new Uint8Array(arrayBuffer); // Create Uint8Array from ArrayBuffer
    
            component.state.storage.upload( {name: theFile.name, size: theFile.size}, uint8Array ).complete
              .then( file => file.link()
              .then( megaUrl => 
              {
                // then save the mega url in the 'media' PDR property
                PDRproxy.then( pproxy => pproxy.addProperty(
                  component.props.roleinstance,
                  component.props.mediaproperty,
                  [JSON.stringify( file2PsharedFile(theFile, "myMegaStorageRoleId", "mega", megaUrl) ) ]
                ));
                // then create an object url and add to the map with the mega url as index
                component.sharedFileStore[megaUrl] = URL.createObjectURL(theFile);
                // then create and send a message with the mega url.
                component.handleSend(
                  { src: file2PsharedFile(theFile, "myMegaStorageRoleId", "mega", megaUrl)
                  , alt: theFile.name
                  , width: "100%"
                  })
              }
              ))
      };
    
        reader.readAsArrayBuffer(theFile); // Read the file as an ArrayBuffer
      }
      // Provide some warning.
    }
  }

  getAvatar( user )
  {
    if (user == 'Emily')
    {
      return "https://chatscope.io/storybook/react/assets/emily-xzL8sDL2.svg";
    }
    else if (user == 'ThisUser')
    {
      return this.avatar;
    }
  }

  // Creates a promise for the mediaRecorder in the component property `mediaRecorderPromise`.
  // When the recorder is started and then stopped:
  //    Saves the audio file to Mega.
  //    Adds a megaUrl - objectUrl mapping to the local sharedFileStore.
  //    Saves a PSharedFile.
  //    Sends the recording as a message.
  initializeAudio(ev)
  {
    const component = this;

    // Request access to the user's microphone
    component.mediaRecorderPromise = navigator.mediaDevices.getUserMedia({ audio: true })
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
              const audioFile = new File([audioBlob], cuid2() + ".ogg", { type: 'audio/ogg; codecs=opus' }); 
              const objectUrl = URL.createObjectURL(audioBlob);
              
              const reader = new FileReader();
              reader.onload = function(event) {
                  const arrayBuffer = event.target.result; // ArrayBuffer from FileReader
                  const uint8Array = new Uint8Array(arrayBuffer); // Create Uint8Array from ArrayBuffer
                  component.state.storage.upload( {name: audioFile.name, size: audioFile.size}, uint8Array ).complete
                    .then( file => file.link() )
                    // then add to the map with the mega url as index
                    .then( megaUrl => 
                      {
                        component.sharedFileStore[megaUrl] = objectUrl;
                        // then save the audio url in the 'media' PDR property
                        PDRproxy.then( pproxy => pproxy.addProperty(
                          component.props.roleinstance,
                          component.props.mediaproperty,
                          [JSON.stringify( file2PsharedFile(audioFile, "myMegaStorageRoleId", "mega", megaUrl) ) ]
                        ));
                        // then create and send a message with the mega url.
                        component.handleSend(
                          { src: file2PsharedFile(audioFile, "myMegaStorageRoleId", "mega", megaUrl)
                          , alt: audioFile.name
                          , width: "100%"
                          })
                      } )
                    };
              reader.readAsArrayBuffer(audioFile); // Read the file as an ArrayBuffer
          };
          return mediaRecorder
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

  // message types according to https://chatscope.io/storybook/react/?path=/docs/components-message--docs:
  // type: 'html' | 'text' | 'image' | 'custom'
  // Notice that here we work with payload.mimeType (a mime-type valued property we add to the payload structure that chatscope exclusively uses for images).
  // payload = {type, ...}
  buildMessage( message, i)
  {
    const component = this;
    if (typeof message.payload == 'string')
    {
      return (<Message key={i} model={message} type='string'>
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
        // delegate the mapping to payload2Type. It will 
        return (<Message key={i} model={message} type='image'>
            <Avatar name={message.sender} size="sm" src={component.getAvatar(message.sender)}/>
          </Message>);
      }
    }
  }
  // message types according to https://chatscope.io/storybook/react/?path=/docs/components-message--docs:
  // type: 'html' | 'text' | 'image' | 'custom'
  // Notice that here we map payload.mimeType (a mime-type valued property we add to the payload structure that chatscope exclusively uses for images)
  // to message.type.
  // payload = {type, ...}
  payload2Type (payload)
  {
    if ( payload.mimeType && payload.mimeType.match( /^text/))
      {
        return 'text'
      }
    else if ( payload.mimeType && payload.mimeType.match( /^image/))
    {
      return 'image'
    }
    else 
    {
      // e.g. audio.
      return 'custom';
    }
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
    return (
      <MainContainer responsive>
            <ChatContainer
            style={{
                height: '100%'
            }}
            >
            <ConversationHeader>
                <Avatar
                name="Emily"
                src={component.avatar}
                />
                <ConversationHeader.Content
                info="Active 10 mins ago"
                userName="Emily"
                />
                <ConversationHeader.Actions>
                </ConversationHeader.Actions>
            </ConversationHeader>
            <MessageList>
                <MessageSeparator content="Saturday, 30 November 2019" />
                {
                  // Handle custom type audio.
                  component.state.messages.map( (message, i) => component.buildMessage(message, i) ) 
                }
            </MessageList>
            <div as={MessageInput} style={{display:"flex", flexDirection:"row", borderTop: "1px dashed #d1dbe4"}}>
              <MessageInput
                placeholder="Type message here" 
                sendButton={false}
                attachButton={false}
                onSend={text => component.handleSend(text)}
                style={{ flexGrow: 1, borderTop: 0, flexShrink:"initial",  }} />
              <SendButton style={{fontSize:"1.2em", marginLeft:0, paddingLeft: "0.2em", paddingRight:"0.2em"}} />
              <AttachmentButton onClick={ () => document.getElementById('__fileupload__').click()} style={{fontSize:"1.2em", paddingLeft: "0.2em", paddingRight:"0.2em"}} />
              <OverlayTrigger
                  placement="left"
                  delay={{ show: 250, hide: 400 }}
                  overlay={renderTooltip}
                >
                <MicrophoneButton 
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
  }