// BEGIN LICENSE
// Perspectives Distributed Runtime
// Copyright (C) 2019 Joop Ringelberg (joopringelberg@perspect.it), Cor Baars
//
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

import React, {Component} from "react";
import { string } from "prop-types";
import {PDRproxy, PropertyType, RoleInstanceT} from "perspectives-proxy"; 


// Import highlight library (NOTE: this is the complete module, can be done with smaller footprint!)
// https://highlightjs.readthedocs.io/en/latest/readme.html#es6-modules-import
import hljs from 'highlight.js/lib/core';

// Import perspectives-arc as a third party language
import {default as perspectivesarc} from "perspectives-highlightjs";

import i18next from "i18next";
import {UserMessagingPromise} from "./userMessaging.js";

// Import a stylesheet
import "highlight.js/styles/base16/solar-flare.css";

// Register the language, so it can be used as a value for the language prop.
hljs.registerLanguage("perspectives-arc", perspectivesarc); 

// Various components from react-bootstrap
import {Container} from 'react-bootstrap';

interface ArcViewerProps {
  propId: PropertyType,
  roleId: RoleInstanceT,
  fileName: string
}

interface ArcViewerState {
  sourceText: string | undefined,
  file: File | undefined
}

export class ArcViewer extends Component<ArcViewerProps, ArcViewerState>
{
  constructor(props : ArcViewerProps)
  {
    super(props);
    this.state = 
      { sourceText: undefined
      , file: undefined
      };
  }

  componentDidMount()
  {
    const component = this;
    component.retrieveFile()
      .then( file => component.changeText(file));

    // Couchdb might not yet have finished synchronizing the write- and read database, so try again.
    setTimeout(() => 
      component.retrieveFile()
      .then( file => component.changeText(file))
      .catch(e => UserMessagingPromise.then( (um) => 
        um.addMessageForEndUser(
          { title: i18next.t("retrieveFile_title", { ns: 'preact' }) 
          , message: i18next.t("retrieveFile_message", {ns: 'preact'})
          , error: e.toString()
          }))), 400)
  }

  changeText(file : File)
  {
    if (this.state.file != file)
    {
      file.text().then( sourceText => this.setState({sourceText}) );
    }
  }

  componentDidUpdate()
  {
      hljs.highlightAll();
  }

  retrieveFile(): Promise<File>
  {
    const component = this; 
    return PDRproxy
      .then( pproxy => pproxy.getFile( component.props.roleId, component.props.propId ) )
  }

  render()
  {
      const component = this;
      return (
          <Container>
            <pre><code 
                className="perspectives-arc"
                style={{'maxHeight': '42vh'}}
                >{
                component.state.sourceText
            }</code></pre>
          </Container>
      );
  }
}
