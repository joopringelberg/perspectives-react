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


import {Tabs, Tab, Container, Card, Button, Row, Col} from "react-bootstrap";

export default class ScreenDefinitionInterpreter extends PerspectivesComponent
{
  constructor( props )
  {
    super(props);
    this.state =
      { screen: undefined };
    this.screenElement = this.screenElement.bind(this);
    this.buildForm = this.buildForm.bind(this);
    this.buildTable = this.buildTable.bind(this);
    this.buildRow = this.buildRow.bind(this);
    this.buildColumn = this.buildColumn.bind(this);
  }
  componentDidMount()
  {
    this.getScreen();
    this.unsubscriber = undefined;
  }
  componentDidUpdate(prevProps)
  {
    if (this.props.contextinstance != prevProps.contextinstance ||
        this.props.myroletype != prevProps.myroletype )
    {
      if (this.state.screen)
      {
        this.setState({screen: undefined});
      }
      this.getScreen();
    }
  }
  getScreen ()
  {
    const component = this;
    PDRproxy.then(function(pproxy)
      {
        if (component.unsubscriber)
        {
          pproxy.send(component.unsubscriber, function(){});
        }
        // { request: "GetScreen", subject: UserRoleType, object: ContextInstance }
        pproxy.getScreen(
          component.props.myroletype
          ,component.props.contextinstance
          ,component.props.contexttype
          ,function( screens )
          {
            console.log(screens);
            if (screens[0])
            {
              component.setState({screen: screens[0]});
            }
          }
          // ,FIREANDFORGET
        ).then( function(unsubscriber)
          {
            unsubscriber.request = "Unsubscribe";
            component.unsubscriber = unsubscriber;
          });
      });
  }
  mayCreateInstance( perspective )
  {
    return !perspective.isCalculated &&
      (perspective.verbs.includes("Create") || perspective.verbs.includes("CreateAndFill"));
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
            component.props.contextinstance,
            component.props.contexttype,
            component.props.myroletype,
            function(){});
        }
        else
        {
          pproxy.createRole(
                component.props.contextinstance,
                perspective.roleType,
                component.props.myroletype);
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
  buildScreen(screen)
  {
    const component = this;
    let contents;
    if (screen.tabs)
    {
      contents = component.buildTabs(screen.tabs);
    }
    else if (screen.rows)
      {
        contents = screen.rows.map( component.screenElement );
      }
    else if (screen.columns)
      {
        contents = screen.columns.map( component.screenElement );
      }
    return  (<Container role="application">
            { screen.title != "" ? <h3>{screen.title}</h3> : null }
            {
              contents
            }
            </Container>);
  }
  buildTabs(tabs)
  {
    const component = this;
    const defaultKey = tabs[0] ? tabs[0].title : "";
    return (
      <Tabs defaultActiveKey={defaultKey} id="perspective-tabs">
      {
        tabs.map((tab, index) =>
          <Tab key={tab.title} eventKey={index} title={tab.title}>
            <Container>
            { tab.elements.map( component.screenElement) }
            </Container>
          </Tab>
        )
      }
      </Tabs>
    );
  }
  screenElement(element, index)
  {
    const component = this;
    if (element.row)
    {
      return component.buildRow( element.row, index );
    }
    else if (element.column)
    {
      return component.buildColumn( element.column, index );
    }
    else if (element.table)
    {
      return (
        <div
          className="border-bottom pb-4 pt-4 widget"
          key={index}
          >
        { element.table.title ? <h4>{element.table.title}</h4> : null }
        { component.buildTable( element.table, index ) }
        </div>);
    }
    else if (element.form)
    {
      return (
        <div
          className="border-bottom pb-4 pt-4 widget"
          key={index}
          >
        { element.form.title ? <h4>{element.form.title}</h4> : null }
        { component.buildForm( element.form, index ) }
        </div>);
    }
  }
  buildRow(screenElements, index)
  {
    const component = this;
    return (
      <Row key={index}>
      {
        screenElements.map(component.screenElement)
      }
      </Row>
    );
  }
  buildColumn(screenElements, index)
  {
    const component = this;
    return (
      <Col key={index}>
      {
        screenElements.map(component.screenElement)
      }
      </Col>
    );
  }
  buildTable(widgetCommonFields)
  {
    const perspective = widgetCommonFields.perspective;
    // const title = widgetCommonFields.title;
    return (
      <PerspectiveTable
        cardcolumn={ perspective.identifyingProperty }
        //roleRepresentation
        perspective={perspective}
        />);
  }
  buildForm(widgetCommonFields)
  {
    const component = this;
    const perspective = widgetCommonFields.perspective;
    // const title = widgetCommonFields.title;
    return (
      <PerspectiveBasedForm
        perspective={perspective}
        myroletype={component.props.myroletype}
        contextinstance={component.props.contextinstance}
        contexttype={component.props.contexttype}
        behaviours={mapRoleVerbsToBehaviours( perspective )}
        cardtitle={ perspective.identifyingProperty }
        />);
  }
  widgetOrButton(widgetCommonFields, widgetFunction, index)
  {
    const component = this;
    const perspective = widgetCommonFields.perspective;
    if (Object.keys( perspective.roleInstances ).length > 0 )
    {
      return (
        <div
          className="border-bottom pb-4 pt-4 widget"
          key={index}
          >
        { widgetCommonFields.title ? <h4>{widgetCommonFields.title}</h4> : null }
        { widgetFunction( widgetCommonFields, index ) }
        </div>);
    }
    else
    {
      // There may be properties for instances when they are made. Just show a create button.
      return  <div
                className="border-bottom pb-4 pt-4 widget"
                key={index}
              >
                { widgetCommonFields.title ? <h5>{widgetCommonFields.title}</h5> : null }
                <Button
                  tabIndex="0"
                  variant="secondary"
                  onClick={ () => component.createRoleInstance(perspective)}
                  onKeyDown={ ev => component.handleKeyDown(ev, perspective)}
                  alt="Add an instance"
                  aria-label="Click or press space or return to add a row"
                  >Create
                </Button>
              </div>;
    }
  }
  render()
  {
    const component = this;
    let screen;
    if (component.stateIsComplete())
    {
      screen = component.state.screen;
      // Fetched perspectives from the server, but do we have one?
      if (screen)
      {
        return component.buildScreen(screen);
      }
      else
      {
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

ScreenDefinitionInterpreter.contextType = PSContext;

// These are exactly the props in PSContext.
// However, we need them as props to compare them with previous props in componentDidUpdate.
ScreenDefinitionInterpreter.propTypes =
  { contextinstance: PropTypes.string.isRequired
  , contexttype: PropTypes.string.isRequired
  , myroletype: PropTypes.string.isRequired
  };
