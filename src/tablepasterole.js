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
import {PSRoleInstances} from "./reactcontexts";
import { default as ModelDependencies } from "./modelDependencies.js";
import {ClippyIcon} from '@primer/octicons-react';
import {UserMessagingPromise} from "./userMessaging.js";
import i18next from "i18next";

import {OverlayTrigger, Tooltip} from "react-bootstrap";

export default class TablePasteRole extends PerspectivesComponent
{
  constructor( props )
  {
    super(props);
    this.state =
      { compatibleRole: false
      , roleOnClipboard: undefined
    };
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
          ModelDependencies.cardClipBoard,
          ModelDependencies.systemExternal,
          function (valArr)
          {
            if ( valArr[0] && valArr[0] )
            {
              clipboardContent = JSON.parse( valArr[0]);
              if ( clipboardContent.roleData && clipboardContent.roleData.rolinstance && clipboardContent.roleData.rolinstance != component.state.roleOnClipboard )
              {
                // checkBinding( <(QUALIFIED)RolName>, <binding>, [() -> undefined] )
                PDRproxy.then( pproxy => pproxy.checkBindingP( component.props.roletype, clipboardContent.roleData.rolinstance ).then( compatibleRole => component.setState({compatibleRole, roleOnClipboard: clipboardContent.roleData.rolinstance})));
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
    if ( roleOnClipboard && compatibleRole)
    {
      if (component.props.selectedroleinstance)
      {
        PDRproxy.then(
          function (pproxy)
          {
            // (binder, binding, myroletype)
            pproxy.bind_(
              component.props.selectedroleinstance,
              roleOnClipboard,
              component.props.myroletype,
              function( /*rolId*/ ){});
          });
        }
      else
      {
        // component.context.bind( {rolinstance: roleOnClipboard} );
        PDRproxy.then(
          function (pproxy)
          {
            pproxy
              .bind(
                component.props.contextinstance,
                component.props.roletype, // may be a local name.
                component.props.contexttype,
                {properties: {}, binding: roleOnClipboard},
                component.props.myroletype)
              .catch(e => UserMessagingPromise.then( um => 
                {
                  um.addMessageForEndUser(
                    { title: i18next.t("fillRole_title", { ns: 'preact' }) 
                    , message: i18next.t("fillRole_message", {ns: 'preact' })
                    , error: e.toString()
                  });
                  component.setState({showRemoveContextModal: false})
                }));
            });
      }
    }
  }

  render()
  {
    const component = this;
    const renderTooltip = (props) => (
    <Tooltip id="tablePasteRole-tooltip" {...props} show={
       // eslint-disable-next-line react/prop-types
      props.show.toString()}>
      { ( component.state.compatibleRole
          ? i18next.t("tablePasteRole_Create", {ns: "preact"})
          : i18next.t("tablePasteRole_Incompatible", {ns: "preact"})
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
                        aria-describedby="tablePasteRole-tooltip"
                        tabIndex="0"
                        onKeyDown={ e => component.handleKeyDown(e) }
                        onClick={ () => component.pasteRole()}
                    >
                    <ClippyIcon
                      alt={ i18next.t("tablePasteRole_Alt", {ns: "preact"}) }
                      aria-label={ i18next.t("tablePasteRole_Alt", {ns: "preact"}) }
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

TablePasteRole.contextType = PSRoleInstances;

TablePasteRole.propTypes = 
  { systemexternalrole: PropTypes.string.isRequired 
  , contextinstance: PropTypes.string.isRequired
  , contexttype: PropTypes.string.isRequired
  , roletype: PropTypes.string.isRequired
  , selectedroleinstance: PropTypes.string
  , myroletype: PropTypes.string.isRequired
  };
