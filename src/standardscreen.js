import React from 'react';

const PropTypes = require("prop-types");
import {PDRproxy, FIREANDFORGET} from "perspectives-proxy";
import PerspectivesComponent from "./perspectivescomponent.js";
import {PSContext} from "./reactcontexts";
import PerspectiveForm from "./perspectiveform.js";
import PerspectiveTable from "./perspectivetable.js";

import {Row, Col, Tabs, Tab, Container} from "react-bootstrap";

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
          component.props.contextinstance,
          component.props.myroletype,
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
    if (this.props != prevProps)
    {
      this.componentDidMount();
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
                      myroletype={component.props.myroletype}
                      contextinstance={component.props.contextinstance}
                      contexttype={component.props.contexttype}/>
                    : <PerspectiveTable perspective={perspective}/>}
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
