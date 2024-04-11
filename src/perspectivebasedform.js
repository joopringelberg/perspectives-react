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

import React from "react";
const Component = React.PureComponent;
import {PSRol} from "./reactcontexts.js";
import {PDRproxy} from "perspectives-proxy";
import RoleDropZone from "./roleDropzone.js";
import {addBehaviour} from "./behaviourcomponent.js";
import PerspectivesComponent from "./perspectivescomponent.js";
import RoleInstance from "./roleinstance.js";
import SmartFieldControlGroup from "./smartfieldcontrolgroup.js";
import { SerialisedPerspective } from "./perspectiveshape.js";
import FormControls from "./formcontrols.js";
import
  { Card
  } from "react-bootstrap";
import PropTypes from "prop-types";
import {UserMessagingPromise} from "./userMessaging.js";
import i18next from "i18next";

////////////////////////////////////////////////////////////////////////////////
// PERSPECTIVEBASEDFORM
// This component requires a perspective on its props.
// It may have a prop roleinstance and when present it is used to index the
// instances of the perspective.
////////////////////////////////////////////////////////////////////////////////

export default class PerspectiveBasedForm extends PerspectivesComponent
{
  constructor(props)
  {
    super(props);
    // Note that rolintanceWithprops may be undefined.
    this.state = {roleInstanceWithProps: this.computeRoleInstanceWithProps()};
    this.checkBinding = this.checkBinding.bind(this);
    this.bind_ = this.bind_.bind(this);
    this.createRoleInstance = this.createRoleInstance.bind(this);
    this.DraggableCard = addBehaviour( RoleCard, this.props.behaviours );
  }

  // Possibly returns an object with this shape: roleinstancewithprops (see perspectivesshape.js).
  computeRoleInstanceWithProps()
  {
    const component = this;
    if (component.props.roleinstance)
    {
      return Object.values( this.props.perspective.roleInstances )
        .filter( inst => inst.roleId == component.props.roleinstance)[0];
    }
    else
    {
      return Object.values( component.props.perspective.roleInstances )[0];
    }

  }

  // Always returns an array of strings (possibly empty).
  findValue( propId )
  {
    const component = this;
    if (component.state.roleInstanceWithProps && component.state.roleInstanceWithProps.propertyValues[propId])
    {
      return component.state.roleInstanceWithProps.propertyValues[propId].values;
    }
    else
    {
      return [];
    }
  }

  // Always returns an object with this shape:
  // PropTypes.shape(
  //   { values: PropTypes.arrayOf( PropTypes.string ).isRequired
  //   , propertyVerbs: PropTypes.arrayOf( PropTypes.string).isRequired
  //   })
  findValues( propId )
  {
    const component = this;
    if (component.state.roleInstanceWithProps)
    {
      return component.state.roleInstanceWithProps.propertyValues[propId];
    }
    else
    {
      return {values:[], propertyVerbs:[]};
    }
  }

  componentDidMount()
  {
    const component = this;
    if (!component.state.roleInstanceWithProps && !component.props.perspective.isCalculated && component.props.perspective.isMandatory)
    {
      component.createRoleInstance();
    }
  }

  componentDidUpdate()
  {
    const component = this;
    // Set state if the current role instance has changed, or if the perspective has changed.
    if (!component.props.perspective.seenInForm)
    {
      component.props.perspective.seenInForm = true;
      component.setState(
        { roleInstanceWithProps: component.computeRoleInstanceWithProps()
        });
    }
  }

  createRoleInstance()
  {
    const component = this;
    PDRproxy.then(
      function (pproxy)
      {
        return pproxy
          .createRole(
            component.props.perspective.contextInstance,
            component.props.perspective.roleType,
            component.props.perspective.userRoleType)
          .catch(e => UserMessagingPromise.then( um => 
            um.addMessageForEndUser(
              { title: i18next.t("createRole_title", { ns: 'preact' }) 
              , message: i18next.t("createRole_message", {ns: 'preact', roletype: component.props.perspective.roleType})
              , error: e.toString()
              })));
      }
    );
  }

  // returns a promise for a boolean value.
  checkBinding({rolinstance})
  {
    const component = this;
    return PDRproxy.then( pproxy =>
      // checkBinding( <contexttype>, <localRolName>, <binding>, [() -> undefined] )
      pproxy
        .checkBindingP(
          component.props.perspective.roleType,
          rolinstance)
        .then( psbool => psbool[0] === "true") )
  }

  bind_(rolInstance)
  {
    const component = this;
    const rolinstance = rolInstance.rolinstance;
    if (rolinstance)
    {
      PDRproxy.then(
        function (pproxy)
        {
          pproxy.bind_(
            component.state.roleInstanceWithProps.roleId,
            rolinstance, // binding
            component.props.perspective.userRoleType,
            function( /*rolId*/ ){});
        });
    }
  }

  render ()
  {
    const component = this;
    const perspective = this.props.perspective;
    const DraggableCard = this.DraggableCard;
    let title;

    function Controls()
    {
      return  <RoleInstance
                roleinstance={component.state.roleInstanceWithProps ? component.state.roleInstanceWithProps.roleId : null}
                roletype={component.props.perspective.roleType}
                rolekind={component.props.perspective.roleKind}
                contextinstance={component.props.perspective.contextInstance}
                contexttype={component.props.perspective.contextType}
                myroletype={component.props.perspective.userRoleType}
              >
                {/* The default element for the RoleInstance. The controls will have a create button. 
                When there is no role instance, this will be rendered by the RoleInstance component.
                */}
                <FormControls
                  perspective={ component.props.perspective}
                  contextinstance={ component.props.perspective.contextInstance }
                  // No roleinstance.
                  myroletype={component.props.perspective.userRoleType}
                  />

                {/* This will be displayed by RoleInstance if there is a role instance. */}
                <RoleDropZone
                  bind={component.bind_}
                  checkbinding={component.checkBinding}
                  ariaLabel="To fill the role whose properties are displayed here, drag another role onto it."
                >
                  <FormControls
                    perspective={ component.props.perspective}
                    contextinstance={ component.props.perspective.contextInstance }
                    roleinstance={component.state.roleInstanceWithProps ? component.state.roleInstanceWithProps.roleId : null}
                    myroletype={component.props.perspective.userRoleType}
                    card={ <DraggableCard labelProperty={component.props.cardtitle} title={title ? title : component.props.perspective.displayName}/> }
                  />
                </RoleDropZone>
              </RoleInstance>;
    }

    // If there are no properties defined on this role type,
    // Just show the form controls.
    if (Object.keys( component.props.perspective.properties).length === 0 )
    {
      return <Controls/>;
    }
    else
    {
      title = component.findValue(component.props.cardtitle)[0];
      if (title)
      {
        title = title.substring(0,25);
        if (title.length == 25)
        {
          title = title + "..."
        }
      }
      return (
        <>
          {
            Object.values(perspective.properties).map(serialisedProperty =>
              <SmartFieldControlGroup
                key={serialisedProperty.id}
                serialisedProperty={serialisedProperty}
                propertyValues={component.findValues( serialisedProperty.id )}
                roleId={component.state.roleInstanceWithProps ? component.state.roleInstanceWithProps.roleId : null}
                myroletype={component.props.perspective.userRoleType}
              />
            )
          }
          <Controls/>
        </>);
    }
  }
}

PerspectiveBasedForm.propTypes =
  { perspective: PropTypes.shape( SerialisedPerspective ).isRequired
  // Used to index the roleinstances in the perspective! NOT REQUIRED.
  , roleinstance: PropTypes.string
  , behaviours: PropTypes.arrayOf(PropTypes.func)
  , cardtitle: PropTypes.string.isRequired
  };

class RoleCard extends Component
{
  componentDidMount()
  {
    this.props.setSelf(this);
  }
  render()
  {
    const component = this;
      return  <Card tabIndex="0" aria-label="Drag this card to manipulate this role." className="ml-3 mr-3">
                <Card.Body className="navbarCard">
                  <Card.Text>
                    {component.props.title}
                  </Card.Text>
                </Card.Body>
              </Card>;
  }
}
RoleCard.contextType = PSRol;

RoleCard.propTypes =
  { setSelf: PropTypes.func
  , title: PropTypes.string.isRequired
  , labelProperty: PropTypes.string.isRequired

  };

