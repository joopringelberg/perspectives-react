import React from 'react';
const PropTypes = require("prop-types");

import {PDRproxy} from "perspectives-proxy";
import PerspectivesComponent from "./perspectivescomponent.js";
import {PSContext} from "./reactcontexts";
import PerspectiveForm from "./perspectiveform.js";
import PerspectiveTable from "./perspectivetable.js";
import * as Behaviours from "./cardbehaviour.js";

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

  // Maps the role verbs in the perspective to an array of behaviours.
  mapRoleVerbsToBehaviours(perspective)
  {
    function mapRoleVerb(verb)
    {
      switch (verb)
      {
        case "Remove":
          return Behaviours.addRemoveRoleFromContext;
        case "Delete":
          return Behaviours.addRemoveRoleFromContext;
        case "Fill":
          return Behaviours.addFillWithRole;
        case "Unbind":
          return Behaviours.addRemoveFiller;
        case "RemoveFiller":
          return Behaviours.addRemoveFiller;
        // There is no behaviour on the role that matches Create, CreateAndFill and Move.
        // We return addFillARole as default because it must be added anyway and we have
        // to return a value from this function.
        default:
          return Behaviours.addFillARole;
      }
    }
    if (perspective)
    {
      return [...new Set( perspective.verbs.map( mapRoleVerb ) )].concat(
        [Behaviours.addOpenContextOrRoleForm, Behaviours.addFillARole]);
    }
    else
    {
      return [];
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
                <PerspectiveForm
                  perspective={perspective}
                  myroletype={component.context.myroletype}
                  contextinstance={component.context.contextinstance}
                  contexttype={component.context.contexttype}
                  behaviours={component.mapRoleVerbsToBehaviours( perspective )}
                  cardtitle={ perspective.identifyingProperty }
                  />
                : <PerspectiveTable
                    viewname=""
                    cardcolumn={ perspective.identifyingProperty }
                    roletype={perspective.roleType || ""}
                    contexttocreate={perspective.contextTypesToCreate[0]}
                    createButton={component.mayCreateInstance( perspective )}
                    //roleRepresentation
                    behaviours={component.mapRoleVerbsToBehaviours( perspective )}
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
