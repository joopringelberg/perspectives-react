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

// This component optionally has a roleinstance prop. If not present, it will provide a create button.

import React from "react";
import {PDRproxy} from "perspectives-proxy";
import PerspectivesComponent from "./perspectivescomponent.js";
import {AppContext} from "./reactcontexts.js";
import ActionDropDown from "./actiondropdown.js";
import FormPasteRole from "./formpasterole.js";
import { SerialisedPerspective } from "./perspectiveshape.js";
import CreateContextDropDown from "./createContextDropdown.js";
import
  { Navbar
  } from "react-bootstrap";
import PropTypes from "prop-types";
import {UserMessagingPromise} from "./userMessaging.js";
import i18next from "i18next";

////////////////////////////////////////////////////////////////////////////////
// FORMCONTROLS
////////////////////////////////////////////////////////////////////////////////
export default class FormControls extends PerspectivesComponent
{
  constructor()
  {
    super();
    this.runAction = this.runAction.bind(this);
    this.state = {actions: []};
  }

  componentDidMount()
  {
    const component = this;
    const actions = component.computeActions();
      if (actions.length > 0)
      {
        component.setState(
          { actions
          });  
      }
  }

  componentDidUpdate()
  {
    const component = this;
    let actions;
    // Set state if the current role instance has changed, or if the perspective has changed.
    if (!component.props.perspective.seenInControls)
    {
      component.props.perspective.seenInControls = true;
      actions = component.computeActions();
      if (actions.length > 0)
      {
        component.setState(
          { actions
          });  
      }
    }
  }
  createRole (receiveResponse, contextToCreate)
  {
    const component = this;
    const roleType = component.props.perspective.roleType;
    const contextIdToAddRoleInstanceTo = component.props.perspective.contextIdToAddRoleInstanceTo;
    PDRproxy.then( function (pproxy)
    {
      // If a ContextRole Kind, create a new context, too.
      if (  component.props.perspective.roleKind == "ContextRole" &&
            contextToCreate != "JustTheRole" &&
            roleType &&
            contextIdToAddRoleInstanceTo)
      {
        pproxy.createContext (
            {
              //id will be set in the core.
              prototype : undefined,
              ctype: contextToCreate,
              rollen: {},
              externeProperties: {}
            },
            // the qualified identifier of the role type to create.
            roleType,
            // The context instance to create the role instance in.
            component.props.perspective.contextIdToAddRoleInstanceTo,
            component.props.perspective.userRoleType
            )
          .then(contextAndExternalRole => contextAndExternalRole[1])
          .catch(e => UserMessagingPromise.then( um => 
            um.addMessageForEndUser(
              { title: i18next.t("createContext_title", { ns: 'preact' }) 
              , message: i18next.t("createContext_message", {ns: 'preact', type: contextToCreate})
              , error: e.toString()
              })));
        ;
      }
      else if (roleType)
      {
        pproxy
          .createRole (
            component.props.perspective.contextIdToAddRoleInstanceTo,
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

  runAction( actionName )
  {
    const component = this;
    PDRproxy.then(
      function (pproxy)
      {
        if (component.props.roleinstance)
          {
            pproxy.action(
              component.props.roleinstance
              , component.props.contextinstance
              , component.props.perspective.id
              , actionName
              , component.props.myroletype) // authoringRole
            .catch(e => UserMessagingPromise.then( um => 
              um.addMessageForEndUser(
                { title: i18next.t("action_title", { ns: 'preact' }) 
                , message: i18next.t("action_message", {ns: 'preact', action: actionName})
                , error: e.toString()
                })));              
          }
      });
  }

  computeActions()
  {
    const component = this;
    let roleInstance;
    if (component.props.roleinstance)
    {
      roleInstance = component.props.perspective.roleInstances[ component.props.roleinstance ];
      if (roleInstance)
      {
        return component.props.perspective.actions.concat( roleInstance.actions );
      }
      else
      {
        return [];
      }
    }
    else
    {
      return [];
    }
  }
  mayCreateInstance()
  {
    const perspective = this.props.perspective;
    return !this.props.roleinstance &&
      (perspective.verbs.includes("Create") && !perspective.verbs.includes("CreateAndFill"));
  }

  mayCreateContext()
  {
    const perspective = this.props.perspective;
    return !this.props.roleinstance &&
      perspective.verbs.includes("CreateAndFill");
  }

  render ()
  {
    const component = this;
    const mayCreateContext = component.mayCreateContext()
    const mayCreateRoleInstance = component.mayCreateInstance();

    if ( component.stateIsComplete(["roleinstance", "card"]) )
    {
      return  <Navbar bg="light" expand="lg" role="banner" aria-label="Controls for form" className="mt-2">
                {
                  mayCreateContext ?
                  <CreateContextDropDown 
                    contexts={component.props.perspective.contextTypesToCreate}
                    create={ contextToCreate => component.createRole( function() {}, contextToCreate)}
                    createcontext={mayCreateContext}
                    createinstance={mayCreateRoleInstance}
                  />
                  : mayCreateRoleInstance ?
                  <CreateContextDropDown 
                    contexts={[]}
                    create={ () => component.createRole( function() {}, "JustTheRole")}
                    createcontext={mayCreateContext}
                    createinstance={mayCreateRoleInstance}
                  />
                  : null
                }
                <AppContext.Consumer>
                  { appcontext => <FormPasteRole systemexternalrole={appcontext.systemExternalRole}/> }
                </AppContext.Consumer>
                { component.state.actions.length > 0 && component.props.roleinstance ?
                  <ActionDropDown
                    actions={ component.state.actions }
                    runaction={component.runAction}
                  />
                  : null }
                { component.props.card }
              </Navbar>;
    }
    else
    {
      return null;
    }
  }
}

FormControls.propTypes =
  { perspective: PropTypes.shape( SerialisedPerspective ).isRequired
  , contextinstance: PropTypes.string.isRequired
  , roleinstance: PropTypes.string
  , myroletype: PropTypes.string.isRequired
  , card: PropTypes.element
  };
