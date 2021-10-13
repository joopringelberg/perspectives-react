import React from 'react';
const PropTypes = require("prop-types");

import {PDRproxy, FIREANDFORGET} from "perspectives-proxy";
import PerspectivesComponent from "./perspectivescomponent.js";
import {PSContext} from "./reactcontexts";
import PerspectiveForm from "./perspectiveform.js";
import PerspectiveTable from "./perspectivetable.js";

import {Tabs, Tab, Container} from "react-bootstrap";

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
          component.context.contextinstance,
          component.context.myroletype,
          function( perspectives )
          {
            console.log(perspectives);
            component.setState({perspectives: perspectives});
          },
          FIREANDFORGET );
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

  computeCardColumn( perspective )
  {
    const propMatchingName = Object.keys(perspective.properties).find( propName => propName.match(/Name/) );
    if ( perspective.properties["model:System$RootContext$External$Name"])
    {
      return "model:System$RootContext$External$Name";
    }
    else if ( propMatchingName )
    {
      return propMatchingName;
    }
    else
    {
      return Object.keys(perspective.properties)[0];
    }
  }

  render()
  {
    const component = this;
    if (component.stateIsComplete())
    {
      // return <div>{this.props.contextinstance}</div>;
      return (
        <Container role="application">
          <Tabs defaultActiveKey={component.state.perspectives[0].id} id="perspective-tabs">
          {
            component.state.perspectives.map( perspective =>
              <Tab key={perspective.id} eventKey={perspective.id} title={perspective.displayName}>
                <Container>
                  { perspective.isFunctional ?
                    <PerspectiveForm
                      perspective={perspective}
                      myroletype={component.context.myroletype}
                      contextinstance={component.context.contextinstance}
                      contexttype={component.context.contexttype}/>
                    : <PerspectiveTable
                        viewname=""
                        cardcolumn={component.computeCardColumn( perspective )}
                        roletype={perspective.roleType || ""}
                        //contexttocreate   // We must be able to derive this from the Perspective.
                        createButton={true} // Make contingent on the RoleVerbs!
                        //roleRepresentation
                        //behaviours // Make contingent on the RoleVerbs!
                        perspective={perspective}
                        />}
                </Container>
              </Tab>
            )
          }
          </Tabs>
        </Container>);
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