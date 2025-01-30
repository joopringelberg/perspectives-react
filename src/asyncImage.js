
import React, { PureComponent } from "react";

import {PDRproxy} from "perspectives-proxy";
import { string } from "prop-types";
const Component = PureComponent;
import i18next from "i18next";
import {UserMessagingPromise} from "./userMessaging.js";
import { Image } from 'react-bootstrap';


export class AsyncImage extends Component
{
  constructor(props)
  {
    super(props);
    this.state = 
      { fileUrl: undefined
      , file: undefined
      };
  }

  componentDidMount()
  {
    const component = this;
    component.retrieveFile()
      .then( file => component.changeUrl(file));

    // Couchdb might not yet have finished synchronizing the write- and read database, so try again.
    setTimeout(() => 
      component.retrieveFile()
      .then( file => component.changeUrl(file))
      .catch(e => UserMessagingPromise.then( um => 
        um.addMessageForEndUser(
          { title: i18next.t("retrieveFile_title", { ns: 'preact' }) 
          , message: i18next.t("retrieveFile_message", {ns: 'preact'})
          , error: e.toString()
          }))), 400)
  }

  changeUrl(file)
  {
    if (this.state.file != file)
    {
      this.setState({fileUrl: window.URL.createObjectURL(file), file});
    }
  }

  componentWillUnmount ()
  {
    super.componentWillUnmount();
    URL.revokeObjectURL( this.state.fileUrl );
  }

  retrieveFile()
  {
    const component = this; 
    return PDRproxy
      .then( pproxy => pproxy.getFile( component.props.roleId, component.props.propId ) )
      .then( fileArray => 
        {
          if (fileArray[0])
          { 
            return fileArray[0];
          }
          else
          {
            throw "";
          }
        });
  }

  render()
  {
    if (this.state.fileUrl)
    {
      return <Image src={this.state.fileUrl} fluid/>
    }
    else 
    {
      return null;
    }
  }
}

AsyncImage.propTypes =
  { propId: string.isRequired
  , roleId: string
  , fileName: string
  }