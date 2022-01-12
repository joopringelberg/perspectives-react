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

import React from 'react';
const PropTypes = require("prop-types");

import {PDRproxy} from "perspectives-proxy";
import PerspectivesComponent from "./perspectivescomponent.js";
import {PSRol} from "./reactcontexts";
import {ClippyIcon} from '@primer/octicons-react';

import {OverlayTrigger, Tooltip} from "react-bootstrap";

export default class FormPasteRole extends PerspectivesComponent
{
  constructor( props )
  {
    super(props);
    this.state =
      { compatibleRole: false
      , roleOnClipboard: undefined};
  }

  componentDidMount()
  {
    const component = this;
    let clipboardContent;
    PDRproxy.then(
      function(pproxy)
      {
        pproxy.getProperty(
          component.props.systemexternalrole,
          "model:System$PerspectivesSystem$External$CardClipBoard",
          "model:System$PerspectivesSystem$External",
          function (valArr)
          {
            if (valArr[0])
            {
              clipboardContent = JSON.parse( valArr[0]);
              if ( clipboardContent.roleData && clipboardContent.roleData.rolinstance )
              {
                component.context.checkbinding(
                  {rolinstance: clipboardContent.roleData.rolinstance},
                  function(compatibleRole)
                  {
                    component.setState({compatibleRole, roleOnClipboard: clipboardContent.roleData.rolinstance});
                  });
              }
            }
          });
      });
  }

  handleKeyDown(e)
  {
    const component = this;
    switch (e.keyCode){
      case 13: // Return
      case 32: // space
        component.pasteRole();
        e.stopPropagation();
        break;
    }
  }

  pasteRole()
  {
    const component = this;
    const {roleOnClipboard, compatibleRole} = component.state;
    if ( roleOnClipboard )
    {
      if (compatibleRole && component.context.rolinstance )
      {
        component.context.bind_( {rolinstance: roleOnClipboard} );
      }
      else if ( compatibleRole )
      {
        component.context.bind( {rolinstance: roleOnClipboard} );
      }
    }
  }

  render()
  {
    const component = this;
    const renderTooltip = (props) => (
    <Tooltip id="formPasteRole-tooltip" {...props} show={
       // eslint-disable-next-line react/prop-types
      props.show.toString()}>
      { component.context.rolinstance
        ? ( component.state.compatibleRole
            ? "Fill the role in this form with the role on the clipboard."
            : "The role on the clipboard cannot fill the role in this form."
          )
        : ( component.state.compatibleRole
            ? "Create a new role for this form and then fill it with the role on the clipboard."
            : "The role on the clipboard cannot fill the role in this form."
          )
      }
    </Tooltip> );

    const eventDiv = React.createRef();

    if ( component.stateIsComplete(["roleOnClipboard"]) )
    {
      return  <OverlayTrigger
                      placement="left"
                      delay={{ show: 250, hide: 400 }}
                      overlay={renderTooltip}
                    >
                    <div
                        ref={eventDiv}
                        className="ml-3 mr-3"
                        aria-describedby="formPasteRole-tooltip"
                        tabIndex="0"
                        onKeyDown={ e => component.handleKeyDown(e) }
                        onClick={ () => component.pasteRole()}
                    >
                    <ClippyIcon
                      alt="Paste the role on the clipboard"
                      aria-label="Paste the role on the clipboard"
                      disabled={component.state.compatibleRole}
                      className={component.state.compatibleRole ? "iconStyle" : "disabledIconStyle"}
                      size="medium"
                    />
                    </div>
              </OverlayTrigger>;
    }
    else {
      return null;
    }
  }
}

FormPasteRole.contextType = PSRol;

FormPasteRole.propTypes = {systemexternalrole: PropTypes.string.isRequired };
