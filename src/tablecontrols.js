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

const React = require("react"); // 2
import PerspectivesComponent from "./perspectivescomponent.js";
const PDRproxy = require("perspectives-proxy").PDRproxy;
import {AppContext} from "./reactcontexts";
import ActionDropDown from "./actiondropdown.js";
import CreateContextDropDown from "./createContextDropdown.js";
import {PSContext} from "./reactcontexts";
import TablePasteRole from "./tablepasterole.js";
import OpenPublicResource from "./openpublicresource.js";
import { SerialisedPerspective } from "./perspectiveshape.js";
import {UserMessagingPromise} from "./userMessaging.js";
import i18next from "i18next";

import
  { Navbar
  } from "react-bootstrap";
import "./components.css";
const PropTypes = require("prop-types");

////////////////////////////////////////////////////////////////////////////////
// TABLECONTROLS
////////////////////////////////////////////////////////////////////////////////
export default class TableControls extends PerspectivesComponent
{
  constructor()
  {
    super();
    this.runAction = this.runAction.bind(this);
  }

  createRole (receiveResponse, contextToCreate)
  {
    const component = this;
    const roleType = component.props.perspective.roleType;
    PDRproxy.then( function (pproxy)
    {
      // If a ContextRole Kind, create a new context, too.
      if (  component.props.perspective.roleKind == "ContextRole" &&
            contextToCreate &&
            roleType)
      {
        pproxy.createContext (
            {
              //id will be set in the core.
              prototype : undefined,
              ctype: contextToCreate,
              rollen: {},
              externeProperties: {}
            },
            roleType,
            component.props.perspective.contextInstance,
            // The type of the embedding context.
            component.context.contexttype,
            component.props.perspective.userRoleType)
          .then(contextAndExternalRole => contextAndExternalRole[1])
          .catch(e => UserMessagingPromise.then( um => 
            um.addMessageForEndUser(
              { title: i18next.t("createContext_title", { ns: 'preact' }) 
              , message: i18next.t("createContext_message", {ns: 'preact', type: component.context.contexttype})
              , error: e.toString()
              })));
        ;
      }
      else if (roleType)
      {
        pproxy
          .createRole (
            component.props.perspective.contextInstance,
            roleType,
            component.props.perspective.userRoleType)
          .then( newRoleId_ => receiveResponse( newRoleId_[0] ) )
          .catch(e => UserMessagingPromise.then( um => 
            um.addMessageForEndUser(
              { title: i18next.t("createRole_title", { ns: 'preact' }) 
              , message: i18next.t("createRole_message", {ns: 'preact', roletype: roleType})
              , error: e.toString()
              })))
    }
    });
  }

  handleKeyDown (event)
    {
      const component = this;
        switch(event.keyCode){
          case 13: // Return
          case 32: // Space
            component.createRole( function() {});
            event.preventDefault();
            event.stopPropagation();
            break;
        }
  }

  runAction( actionName )
  {
    const component = this;
    PDRproxy.then(
      function (pproxy)
      {
          pproxy.action(
            component.props.selectedroleinstance
            , component.props.perspective.contextInstance
            , component.props.perspective.id
            , actionName
            , component.props.perspective.userRoleType) // authoringRole
          .catch(e => UserMessagingPromise.then( um => 
            um.addMessageForEndUser(
              { title: i18next.t("action_title", { ns: 'preact' }) 
              , message: i18next.t("action_message", {ns: 'preact', action: actionName})
              , error: e.toString()
              })));  
      });
  }

  // Computes the actions available based on context- and subject state, combined with those
  // available based on object state.
  computeActions()
  {
    const props = this.props;
    const perspective = this.props.perspective;
    let objectStateActions = [];
    // It happens that the perspective is not always yet updated when we compute actions.
    // It also happens that the selectedroleinstance is not updated while the perspectives are?
    if (props.selectedroleinstance && perspective.roleInstances[ props.selectedroleinstance])
    {
      objectStateActions = perspective.roleInstances[ props.selectedroleinstance ].actions;
    }
    return perspective.actions.concat( objectStateActions );
  }

  render ()
  {
    const component = this;
    const actions = component.computeActions();
    const instances = component.props.perspective.roleInstances;
    const instance = instances[component.props.selectedroleinstance];
    if  ( component.stateIsComplete(["currentRoleInstance"]) && 
          component.props.mayCreate ||
          actions.length > 0 && Object.keys(instances).length > 0 ||
          instance && instance.publicUrl
        )
    {
      return  <Navbar bg="light" expand="lg" role="banner" aria-label="Controls for table">
                {
                  component.props.mayCreate ?
                  <CreateContextDropDown 
                    contexts={component.props.perspective.contextTypesToCreate}
                    create={ contextToCreate => component.createRole( function() {}, contextToCreate)}
                  />
                  : null
                }
                {
                  component.props.mayCreate ?
                  <AppContext.Consumer>
                  { appcontext => <TablePasteRole 
                    systemexternalrole={appcontext.systemExternalRole}
                    contextinstance={component.props.perspective.contextInstance}
                    contexttype={component.props.perspective.contextType}
                    roletype={component.props.perspective.roleType}
                    selectedroleinstance={component.props.selectedroleinstance}
                    myroletype={component.props.perspective.userRoleType}
                    /> 
                  }
                </AppContext.Consumer>
                  : null
                }
                { actions.length > 0 && Object.keys(instances).length > 0 ?
                  <ActionDropDown
                    actions={ actions }
                    runaction={component.runAction}
                  />
                  : null }
                {
                  instance && instance.publicUrl ?
                  <OpenPublicResource publicurl={ instance.publicUrl } rolekind={ component.props.perspective.roleKind }/>
                  :
                  null
                }
              </Navbar>;
    }
    else
    {
      return null;
    }
  }
}

TableControls.contextType = PSContext;

TableControls.propTypes =
  { mayCreate: PropTypes.bool.isRequired
  , perspective: PropTypes.shape( SerialisedPerspective ).isRequired
  // This is the row that is selected in the table, possibly none.
  , selectedroleinstance: PropTypes.string
  };
