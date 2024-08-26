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

import { MainContainer, ChatContainer, MessageList, Message, MessageInput, ConversationHeader, Avatar, VoiceCallButton, VideoCallButton, InfoButton, TypingIndicator, MessageSeparator } from '@chatscope/chat-ui-kit-react';
import styles from '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';

// Various components from react-bootstrap
import Container from 'react-bootstrap/Container';

import { createAvatar } from '@dicebear/core';
import { initials } from '@dicebear/collection';

import { File as MFile, Storage } from 'megajs'

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
    component.imageStore = {};
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
      this.retrieveFileFromMega().then( imageFromMega => component.setState({imageFromMega: imageFromMega})); 
  }

  augmentMessages( messages )
  {
    const component = this;
    function isImageMessage ({payload})
    {
      return typeof payload == 'object' && payload.src;
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
      // Set object url:
      if (isImageMessage(message))
      {
        // TODO: load from Mega if not already in local store.
        message.payload.src = component.imageStore[message.payload.src];
      }
      return message;
    }
    )
  }

  componentDidUpdate(prevProps, prevState)
  {
  }

  componentWillUnmount ()
  {
    Object.values( this.imageStore ).forEach( objectUrl => URL.revokeObjectURL( objectUrl ));
  }

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
  retrieveFileFromMega()
  { 
      // Get the file object from the URL
      const file = MFile.fromURL('https://mega.nz/file/O2oBUAQb#9KqUbW7u4sAU9vi9m7p1muydR2qQR2p7XkbnAQVtVKw')

      // Load file attributes
      return file.loadAttributes()
        .then(() => file.downloadBuffer())
        .then( data => 
          {
            const f = new Blob([data], {type: 'image/png'})
            // Now create an image url:
            return URL.createObjectURL(f);  
          }          
        );
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
                  [JSON.stringify({
                    sharedStorageId: "Some kind of identifier",
                    megaUrl
                  })]
                ));
                // then create an object url and add to the map with the mega url as index
                component.imageStore[megaUrl] = URL.createObjectURL(theFile);
                // then create and send a message with the mega url.
                component.handleSend(
                  { src: megaUrl
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

  render()
  {
      const component = this;
      return (
        <MainContainer>
          <Container>
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
                    component.state.messages.map( (message, i) => 
                      <Message key={i} model={message} type={message.payload.src ? 'image' : 'text'}>
                        <Avatar name={message.sender} size="sm" src={component.getAvatar(message.sender)}/>
                      </Message>)
                  }
              </MessageList>
              <MessageInput 
                placeholder="Type message here" 
                onSend={text => component.handleSend(text)}
                onAttachClick={ () => document.getElementById('__fileupload__').click()}
                />
              </ChatContainer>
          </Container>
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