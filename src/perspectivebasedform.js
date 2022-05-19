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

const React = require("react");
const Component = React.PureComponent;
import {PSRol, AppContext} from "./reactcontexts.js";
const PDRproxy = require("perspectives-proxy").PDRproxy;
import RoleDropZone from "./roleDropzone.js";
import {addBehaviour} from "./behaviourcomponent.js";
import PerspectivesComponent from "./perspectivescomponent.js";
import RoleInstance from "./roleinstance.js";
import ActionDropDown from "./actiondropdown.js";
import FormPasteRole from "./formpasterole.js";
import SmartFieldControlGroup from "./smartfieldcontrolgroup.js";
import {PlusIcon} from '@primer/octicons-react';
import
  { Card
  , Navbar
  } from "react-bootstrap";
const PropTypes = require("prop-types");

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
    this.state = {roleInstanceWithProps: this.computeRoleInstanceWithProps()};
    this.checkBinding = this.checkBinding.bind(this);
    this.bind_ = this.bind_.bind(this);
    this.createRoleInstance = this.createRoleInstance.bind(this);
    this.DraggableCard = addBehaviour( RoleCard, this.props.behaviours );
  }

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
    if (component.state.roleInstanceWithProps)
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
        pproxy.createRole(
          component.props.contextinstance,
          component.props.perspective.roleType,
          component.props.myroletype);
      }
    );
  }

  checkBinding({rolinstance}, callback)
  {
    const component = this;
    PDRproxy.then( pproxy =>
    // checkBinding( <contexttype>, <localRolName>, <binding>, [() -> undefined] )
    pproxy.checkBinding(
      component.props.contexttype,
      component.props.perspective.roleType,
      rolinstance,
      function(psbool)
      {
        callback( psbool[0] === "true" );
      }));
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
            component.props.myroletype,
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
                role={component.props.perspective.roleType}
                contextinstance={component.props.contextinstance}
              >
                <FormControls
                  createButton={ true }
                  perspective={ component.props.perspective}
                  contextinstance={ component.props.contextinstance }
                  // No roleinstance.
                  myroletype={component.props.myroletype}
                  create={ component.createRoleInstance }
                  />
                <FormControls
                  createButton={ false }
                  perspective={ component.props.perspective}
                  contextinstance={ component.props.contextinstance }
                  roleinstance={component.state.roleInstanceWithProps ? component.state.roleInstanceWithProps.roleId : null}
                  myroletype={component.props.myroletype}
                  create={ component.createRoleInstance }
                  card={ <DraggableCard labelProperty={component.props.cardtitle} title={title && title[0] ? title[0] : component.props.perspective.displayName}/> }
                />
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
      title = component.findValue(component.props.cardtitle);
      return (
        <>
          <RoleDropZone
            bind={component.bind_}
            checkbinding={component.checkBinding}
            ariaLabel="To fill the role whose properties are displayed here, drag another role onto it."
          >
          {
            Object.values(perspective.properties).map(serialisedProperty =>
              <SmartFieldControlGroup
                key={serialisedProperty.id}
                serialisedProperty={serialisedProperty}
                propertyValues={component.findValues( serialisedProperty.id )}
                roleId={component.state.roleInstanceWithProps ? component.state.roleInstanceWithProps.roleId : null}
                myroletype={component.props.myroletype}
              />
            )
          }
          </RoleDropZone>
          <Controls/>
        </>);
    }      
  }
}

PerspectiveBasedForm.propTypes =
  { perspective: PropTypes.object.isRequired
  , roleinstance: PropTypes.string
  , myroletype: PropTypes.string.isRequired
  , contextinstance: PropTypes.string.isRequired
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

////////////////////////////////////////////////////////////////////////////////
// FORMCONTROLS
////////////////////////////////////////////////////////////////////////////////
class FormControls extends PerspectivesComponent
{
  constructor()
  {
    super();
    this.runAction = this.runAction.bind(this);
    this.state = {actions: []};
  }

  handleKeyDown (event)
    {
      const component = this;
        switch(event.keyCode){
          case 13: // Return
          case 32: // Space
            component.props.create();
            event.preventDefault();
            event.stopPropagation();
            break;
        }
  }

  componentDidMount()
  {
    this.setState( { actions: this.computeActions() } );
  }

  componentDidUpdate()
  {
    const component = this;
    // Set state if the current role instance has changed, or if the perspective has changed.
    if (!component.props.perspective.seenInControls)
    {
      component.props.perspective.seenInControls = true;
      component.setState(
        { actions: component.computeActions()
        });
    }
  }

  runAction( actionName )
  {
    const component = this;
    PDRproxy.then(
      function (pproxy)
      {
          pproxy.action(
            component.props.roleinstance
            , component.props.contextinstance
            , component.props.perspective.id
            , actionName
            , component.props.myroletype); // authoringRole
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

  render ()
  {
    const component = this;
    if ( component.stateIsComplete() )
    {
      return  <Navbar bg="light" expand="lg" role="banner" aria-label="Controls for table">
                {
                  component.props.createButton ?
                  <div
                    className="ml-3 mr-3"
                    tabIndex="0"
                    onClick={ component.props.create }
                    onKeyDown={ ev => component.handleKeyDown(ev)}
                  >
                    <PlusIcon alt="Add row" aria-label="Click to add a row" size='medium'/>
                  </div>
                  : null
                }
                <AppContext.Consumer>
                  { appcontext => <FormPasteRole systemexternalrole={appcontext.systemExternalRole}/> }
                </AppContext.Consumer>
                { component.state.actions.length > 0 ?
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
  { createButton: PropTypes.bool
  , perspective: PropTypes.object.isRequired
  , contextinstance: PropTypes.string.isRequired
  , roleinstance: PropTypes.string
  , myroletype: PropTypes.string.isRequired
  , create: PropTypes.func
  , card: PropTypes.element
  };
