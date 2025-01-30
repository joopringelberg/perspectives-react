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
import {string} from "prop-types";

import {PDRproxy, CONTINUOUS} from "perspectives-proxy";
import PerspectivesComponent from "./perspectivescomponent.js";
import {PSContext} from "./reactcontexts";
import PerspectiveBasedForm from "./perspectivebasedform.js";
import PerspectiveTable from "./perspectivetable.js";
import mapRoleVerbsToBehaviours from "./maproleverbstobehaviours.js";
import PerspectivesTabs from "./perspectivestabs.js";
import {UserMessagingPromise} from "./userMessaging.js";
import i18next from "i18next";

import {Tabs, Tab, Container, Card, Button, Row, Col} from "react-bootstrap";
import {MarkDownWidget} from './markdownWidget.js';
import SmartFieldControl from './smartfieldcontrol.js';
import ChatComponent from './chatcomponent.js';
import { externalRole } from './urifunctions.js';

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
    this.activeTabKey = 0;
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
            console.log( screens[0] );
            component.setState({screen: screens[0] ? screens[0] : "TryAnotherRole"});
          }
          ,CONTINUOUS
          ,function()
          {
            component.setState({screen: "Reload"});
          }
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
                //id will be set in the core.
                prototype : undefined,
                ctype: perspective.contextTypesToCreate[0], // Arbitrary choice, for now.
                rollen: {},
                externeProperties: {}
              },
              perspective.roleType,                       // qualified role name
              perspective.contextIdToAddRoleInstanceTo,   // context instance to add to.
              component.props.myroletype)
            .catch(e => UserMessagingPromise.then( um => 
              um.addMessageForEndUser(
                { title: i18next.t("createContext_title", { ns: 'preact' }) 
                , message: i18next.t("createContext_message", {ns: 'preact', type: component.props.contexttype})
                , error: e.toString()
                })));
        }
        else
        {
          pproxy
            .createRole(
              component.props.contextinstance,
              perspective.roleType,
              component.props.myroletype)
            .catch(e => UserMessagingPromise.then( um => 
              um.addMessageForEndUser(
                { title: i18next.t("createRole_title", { ns: 'preact' }) 
                , message: i18next.t("createRole_message", {ns: 'preact', roletype: perspective.roleType})
                , error: e.toString()
                })))
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
            { screen.title ? <h3>{screen.title}</h3> : null }
            {
              contents
            }
            </Container>);
  }
  buildTabs(tabs)
  {
    const component = this;
    let defaultActiveKey = 0;
    tabs.forEach( function (tab, index){
      if (tab.isDefault)
      {
        defaultActiveKey = index;
      }
    } );
    return  <PerspectivesTabs tabs={tabs} defaultActiveKey={defaultActiveKey}>
            {
              tabs.map((tab, index) =>
                <Tab.Pane key={index} eventKey={index} title={tab.title}>
                  <Container>
                  { tab.elements.map( component.screenElement) }
                  </Container>
                </Tab.Pane>)
            }
            </PerspectivesTabs>;
  }
  screenElement(element, index)
  {
    const component = this;
    switch (element.elementType){
      case "RowElementD":
        return component.buildRow( element.element, index );
      case "ColumnElementD":
        return component.buildColumn( element.element, index );    
      case "TableElementD":
        return (
          <div
            className="border-bottom pb-4 pt-4 widget"
            key={index}
            >
          { element.element.fields.title ? <h4>{element.element.fields.title}</h4> : null }
          { component.buildTable( element.element, index ) }
          </div>);
      case "FormElementD":
        return (
          <div
            className="border-bottom pb-4 pt-4 widget"
            key={index}
            >
          { element.element.fields.title ? <h4>{element.element.fields.title}</h4> : null }
          { component.buildForm( element.element, index ) }
          </div>);
      case "MarkDownElementD":
        return (
          <div 
            key={index}
          >{ component.buildMarkDown( element.element, index)}</div>
        )
      case "ChatElementD":
        return (
          <div
            key={index}
          >{ component.buildChat( element.element.fields)}</div>
        )
    }
  }
  buildRow({elements}, index)
  {
    const component = this;
    return (
      <Row key={index}>
      {
        elements.map(component.screenElement)
      }
      </Row>
    );
  } 
  buildColumn({elements}, index)
  {
    const component = this;
    return (
      <Col key={index}>
      {
        elements.map(component.screenElement)
      }
      </Col>
    );
  }
  buildTable({fields})
  {
    const perspective = fields.perspective;
    // const title = widgetCommonFields.title;
    return (
      <PerspectiveTable
        cardcolumn={ perspective.identifyingProperty }
        //roleRepresentation
        perspective={perspective}
        />);
  }
  buildForm({fields})
  {
    const component = this;
    const perspective = fields.perspective;
    // const title = widgetCommonFields.title;
    return (
      <PerspectiveBasedForm
        perspective={perspective}
        behaviours={mapRoleVerbsToBehaviours( perspective )}
        cardtitle={ perspective.identifyingProperty }
        />);
  }
  buildChat({chatRole, chatInstance, messageProperty, mediaProperty})
  {
    const component = this;
    if (chatInstance)
    {
      return <ChatComponent 
              externalrole={externalRole( component.props.contextinstance) }
              roleinstance={chatInstance}
              roletype={chatRole}
              messagesproperty={messageProperty}
              mediaproperty={mediaProperty}
              myroletype={component.props.myroletype}
            >
            </ChatComponent>;
    }
    else
    {
      return <div/>;
    }
  }
  buildMarkDown({tag, element})
  {
    const component = this;
      // The property is only consultable when it just has the verb Consult,
      // or when it is calculated. It will be shown disabled as a consequence.
      function propertyOnlyConsultable(roleInstance)
      {
        if (roleInstance.propertyValues)
        {
          const propertyVerbs = roleInstance.propertyValues[ markDownProperty ].propertyVerbs;
          return (propertyVerbs.indexOf("Consult") > -1 
            && propertyVerbs.length == 1)
            || perspective.properties[markDownProperty].isCalculated;
        }
        else
        {
          return false;
        }
      }

      let perspective, markDownProperty, conditionProperty;
      switch (tag) {
        // MarkDownConstant is by construction functional.
        case "MarkDownConstantDef":
        return <MarkDownWidget markdown={element.text} contextid={component.props.contextinstance} myroletype={component.props.myroletype}/>;
        // MarkDownExpression is required to be functional.
        case "MarkDownExpressionDef":
        // text is wrapped in Maybe
        if (element.text)
          {
            return <MarkDownWidget markdown={element.text} contextid={component.props.contextinstance} myroletype={component.props.myroletype}/>;
          }
        else
        {
          return null;
        }
      // MarkDownPerspective may be on a relational role.
      //   MarkDownPerspectiveDef { widgetFields :: WidgetCommonFieldsDef, conditionProperty :: Maybe PropertyType} |
      case "MarkDownPerspectiveDef":
        perspective = element.widgetFields.perspective;
        conditionProperty = element.conditionProperty ? element.conditionProperty.value : undefined;
        markDownProperty = Object.keys( perspective.properties ).filter( prop => prop != conditionProperty )[0];  
        return  <Container>{
                  Object.values( perspective.roleInstances )
                    .filter( roleInstance => !!conditionProperty ? roleInstance.propertyValues[ conditionProperty ].values[0] == "true" : true)
                    .map( roleInstance => 
                    <Row key= { roleInstance.roleId }>
                      <Col>
                        <SmartFieldControl
                          // By construction, a single property is allowed and it must be the property with the MarkDown Range.
                          serialisedProperty = { perspective.properties[ markDownProperty ] }
                          propertyValues = { roleInstance.propertyValues[ markDownProperty ] }
                          roleId = { roleInstance.roleId }
                          myroletype = { perspective.userRoleType }
                          disabled={ propertyOnlyConsultable(roleInstance) || !roleInstance.roleId }
                          isselected={true}
                          contextinstance={component.props.contextinstance}
                        />
                      </Col>
                    </Row>
                  )
                }</Container>
    }
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
      switch (screen) {
        case "Reload":
          return    <Container>
                      <Card>
                        <Card.Body>
                          <Card.Title>An error condition occurred</Card.Title>
                          <Card.Text>
                            The program could not compute a screen. This may be caused by missing data.
                            This may have been fixed automatically. Try navigating back and forth again.
                          </Card.Text>
                        </Card.Body>
                        </Card>
                    </Container>;
          break;
        case "TryAnotherRole":
          return    <Container>
                      <Card>
                        <Card.Body>
                          <Card.Title>Nothing to show</Card.Title>
                          <Card.Text>
                            It may be that the role you currently have in this context has no perspectives. Try another role.
                          </Card.Text>
                        </Card.Body>
                        </Card>
                    </Container>;
        default:
          return component.buildScreen(screen);;
      }
    }
    else
    {
      return  <Container>
                <h3 className="text-center pt-5">{ i18next.t( "openContext", { ns: 'preact' }) }</h3>
              </Container>
    }
  }
}

ScreenDefinitionInterpreter.contextType = PSContext;

// These are exactly the props in PSContext.
// However, we need them as props to compare them with previous props in componentDidUpdate.
ScreenDefinitionInterpreter.propTypes =
  { contextinstance: string.isRequired
  , contexttype: string.isRequired
  , myroletype: string.isRequired
  };
