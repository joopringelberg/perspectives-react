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
import {PSContext} from "./reactcontexts";
import PerspectiveBasedForm from "./perspectivebasedform.js";
import PerspectiveTable from "./perspectivetable.js";
import mapRoleVerbsToBehaviours from "./maproleverbstobehaviours.js";


import {Tabs, Tab, Container, Card, Button} from "react-bootstrap";

export default class StandardScreen extends PerspectivesComponent
{
  constructor( props )
  {
    super(props);
    this.state =
      { perspectives: undefined };
  }
  componentDidMount ()
  {
    const component = this;
    PDRproxy.then(function(pproxy)
      {
        // (contextInstance, userRoleInstance, userRoleType, receiveValues, fireAndForget)
        pproxy.getPerspectives(
          component.context.contextinstance
          ,component.context.myroletype
          ,function( perspectives )
          {
            console.log(perspectives);
            component.setState({perspectives: perspectives});
          }
          // ,FIREANDFORGET
        );
      });
  }

  componentDidUpdate(prevProps)
  {
    if (this.props.contextinstance != prevProps.contextinstance ||
        this.props.myroletype != prevProps.myroletype )
    {
      this.componentDidMount();
    }
  }


  mayCreateInstance( perspective )
  {
    return !perspective.isCalculated &&
      (perspective.verbs.includes("Create") || perspective.verbs.includes("CreateAndFill"));
  }

  showFormOrTable (perspective)
  {
    const component = this;
    return  <Tab key={perspective.id} eventKey={perspective.id} title={perspective.displayName}>
            <Container>
              { perspective.isFunctional ?
                <PerspectiveBasedForm
                  perspective={perspective}
                  myroletype={component.context.myroletype}
                  contextinstance={component.context.contextinstance}
                  contexttype={component.context.contexttype}
                  behaviours={mapRoleVerbsToBehaviours( perspective )}
                  cardtitle={ perspective.identifyingProperty }
                  />
                : <PerspectiveTable
                    cardcolumn={ perspective.identifyingProperty }
                    //roleRepresentation
                    perspective={perspective}
                    />}
            </Container>
          </Tab>;
  }

  createRoleInstance( perspective )
  {
    const component = this;
    PDRproxy.then( function (pproxy)
      {
        // If a ContextRole Kind, create a new context, too.
        if (perspective.roleKind == "ContextRole" && perspective.contextTypesToCreate.length > 0)
        {
          pproxy.createContext (
            {
              id: "", // will be set in the core.
              prototype : undefined,
              ctype: perspective.contextTypesToCreate[0], // Arbitrary choice, for now.
              rollen: {},
              externeProperties: {}
            },
            perspective.roleType,
            component.context.contextinstance,
            component.context.contexttype,
            component.context.myroletype,
            function(){});
        }
        else
        {
          pproxy.createRole(
                component.context.contextinstance,
                perspective.roleType,
                component.context.myroletype);
        }
      });
  }

  handleKeyDown (event, perspective)
    {
      const component = this;
        switch(event.keyCode){
          case 13: // Return
          case 32: // Space
            component.createRoleInstance( perspective );
            event.preventDefault();
            event.stopPropagation();
            break;
        }
  }

  render()
  {
    const component = this;
    if (component.stateIsComplete())
    {
      if (component.state.perspectives[0])
      {
        return (
          <Container role="application">
            <Tabs defaultActiveKey={component.state.perspectives[0].id} id="perspective-tabs">
            {
              component.state.perspectives.map( perspective =>
                {
                  if (Object.keys( perspective.roleInstances ).length > 0 )
                  {
                    // We have instances
                    return component.showFormOrTable(perspective);
                  }
                  else if (component.mayCreateInstance(perspective))
                  {
                    if (Object.keys( perspective.properties ).length > 0 )
                    {
                      // No instances, but properties anyway:
                      return component.showFormOrTable(perspective);
                    }
                    else
                    {
                      // There may be properties for instances when they are made. Just show a create button.
                      return  <Tab key={perspective.id} eventKey={perspective.id} title={perspective.displayName}>
                                <Button
                                  tabIndex="0"
                                  variant="secondary"
                                  onClick={component.createRoleInstance}
                                  onKeyDown={ ev => component.handleKeyDown(ev, perspective)}
                                  alt="Add an instance"
                                  aria-label="Click or press space or return to add a row"
                                  >Create
                                </Button>
                              </Tab>;
                    }
                  }
                  else
                  {
                    return null;
                  }
              }
              )
            }
            </Tabs>
          </Container>);
      }
      else {
        return    <Container>
                    <Card>
                      <Card.Body>
                        <Card.Title>An error condition occurred</Card.Title>
                        <Card.Text>
                          The role you currently have in this context has no perspectives. Try another role.
                        </Card.Text>
                      </Card.Body>
                      </Card>
                  </Container>;
      }
    }
    else
    {
      return null;
    }
  }
}

StandardScreen.contextType = PSContext;
StandardScreen.propTypes =
  { contextinstance: PropTypes.string.isRequired
  , contexttype: PropTypes.string.isRequired
  , myroletype: PropTypes.string.isRequired
  };
