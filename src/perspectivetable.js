const React = require("react"); // 2
import PerspectivesComponent from "./perspectivescomponent.js";
const PDRproxy = require("perspectives-proxy").PDRproxy;
import {PSRoleInstances, PSRol, PSContext, AppContext} from "./reactcontexts";
import RoleInstances from "./roleinstances.js";
import RoleInstanceIterator from "./roleinstanceiterator.js";
import RoleDropZone from "./roleDropzone.js";
import ActionDropDown from "./actiondropdown.js";
import {deconstructLocalName, getQualifiedPropertyName} from "./urifunctions.js";
import {addBehaviour} from "./behaviourcomponent.js";
import TablePasteRole from "./tablepasterole.js";
import SmartFieldControl from "./smartfieldcontrol.js";
import mapRoleVerbsToBehaviours from "./maproleverbstobehaviours.js";

import {PlusIcon} from '@primer/octicons-react';
import
  { Navbar
  , Table
  , Form
  } from "react-bootstrap";
import "./components.css";
const PropTypes = require("prop-types");

////////////////////////////////////////////////////////////////////////////////
// CARD
////////////////////////////////////////////////////////////////////////////////
// The default component to display in the card column. Shows a plain text control.
// The behaviours granted to the table will be established on this Card component.
// Displays the value of prop cardcolumn of RoleTable (a property of the role).
class Card extends React.Component
{
  componentDidMount()
  {
    // eslint-disable-next-line react/prop-types
    this.props.setSelf(this);
  }
  render()
  {
    const selectedProps = Object.assign({}, this.props);
    delete selectedProps.setSelf;
    delete selectedProps.inputRef;
    delete selectedProps.labelProperty;
    delete selectedProps.systemExternalRole;
    delete selectedProps.formMode;
    delete selectedProps.setEventDispatcher;
    return  <Form.Control
              readOnly
              plaintext
              ref={
                // eslint-disable-next-line react/prop-types
                this.props.inputRef}
              {...selectedProps}
              />;
  }
}
Card.contextType = PSRol;

////////////////////////////////////////////////////////////////////////////////
// PERSPECTIVESTABLE
////////////////////////////////////////////////////////////////////////////////
// Context type of PerspectiveTable is PSContext
export default class PerspectiveTable extends PerspectivesComponent
{
  mayCreateInstance()
  {
    const perspective = this.props.perspective;
    return !perspective.isCalculated &&
      (perspective.verbs.includes("Create") || perspective.verbs.includes("CreateAndFill"));
  }

  render ()
  {
    const component = this;
    const perspective = this.props.perspective;
    let roleRepresentation;
    if (component.props.roleRepresentation)
    {
      roleRepresentation = component.props.roleRepresentation;
    }
    else
    {
      // Map role verbs to behaviour.
      roleRepresentation = addBehaviour( Card, mapRoleVerbsToBehaviours( perspective ) );
    }
    // NOTE that we currently arbitrarily select the first type of context to create.
    return (<RoleInstances
              rol={perspective.roleType}
              contexttocreate={perspective.contextTypesToCreate[0]}
              perspective={perspective}
            >
              <PSRoleInstances.Consumer>{ psrol =>
                <RoleDropZone
                  ariaLabel=""
                  bind={psrol.bind /* As we have a role, just bind the role we drop.*/}
                  checkbinding={psrol.checkbinding}
                >
                  <RoleTable_
                    cardcolumn={component.props.cardcolumn}
                    roleRepresentation={roleRepresentation}
                    perspective={perspective}
                    />
                  <TableControls
                    createButton={ component.mayCreateInstance() }
                    perspective={ perspective}
                    selectedroleinstance={psrol.cursor}
                    contextinstance={psrol.contextinstance}
                    myroletype={component.context.myroletype}
                    />
                </RoleDropZone>
              }</PSRoleInstances.Consumer>
            </RoleInstances>);
  }
}

PerspectiveTable.propTypes =
  {
  // must be the local name of one of the properties in the view.
  // This column is displayed as a mini card showing this property's value
  // and can be clicked to open the role or the context behind it.
  "cardcolumn": PropTypes.string.isRequired
  // A React component that is displayed in the card column.
  // Is by the default the Card class given above.
  , "roleRepresentation": PropTypes.object
  // When given a perspective, the table will not retrieve roleinstances itself.
  , "perspective": PropTypes.object.isRequired
  };

PerspectiveTable.contextType = PSContext;

// Context type of RoleTable_ is PSRoleInstances.
class RoleTable_ extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
    const component = this;
    const propertyNames = Object.keys( component.props.perspective.properties );
    component.state =
      { propertyNames
      , column: propertyNames[0]
      , active: true
      };
    this.eventDiv = React.createRef();
    this.handleKeyDown = this.handleKeyDown.bind( this );
    // The first rendered cell sets this to false.
    // Each subsequent cell can than see it is not first.
    this.firstCellSet = false;
    this.deregisterPreviousCell = {f: () => {}};
  }

  componentDidUpdate(prevProps, prevState)
  {
    const component = this;
    // Do this when we've just retrieved the propertyNames for the first time
    // and when there is a value to the ref.
    if (component.eventDiv.current && !prevState.propertyNames)
    {
      component.eventDiv.current.addEventListener('SetColumn',
        function (e)
        {
          if (e.detail !== component.state.column)
          {
            component.setState({column: e.detail});
          }
          e.stopPropagation();
        },
        false);
      component.eventDiv.current.addEventListener('SetSelectRow',
        function (e)
        {
          // By definition of row selection, the card column now becomes the current column.
          component.setState( { column: getQualifiedPropertyName( component.props.cardcolumn, component.state.propertyNames)});
          e.stopPropagation();
        },
        false);
    }
  }

  handleKeyDown (event)
  {
    const component = this;
    const i = component.state.propertyNames.indexOf( component.state.column );

    switch(event.keyCode){
      case 9: // Horizontal Tab
      case 11: // Vertical Tab
        if (event.shiftKey)
        {
          // TODO. DIT WERKT NIET.
          // If shift-tab, stop the event and throw another shift-tab.
          // event.stopPropagation();
          // event.preventDefault();
          // See: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/KeyboardEvent
          // component.eventDiv.current.dispatchEvent( new KeyboardEvent("keypress", {key: "\t", shiftKey: true}) );
        }
        // Leaving the table.
        component.setState({active: false});
        break;
      case 39: // Right arrow
        if (i < component.state.propertyNames.length - 1)
        {
          component.setState({column: component.state.propertyNames[i + 1]});
        }
        event.stopPropagation();
        break;
      case 37: // Left arrow
        if (i > 0)
        {
          component.setState({column: component.state.propertyNames[i - 1]});
        }
        event.stopPropagation();
        break;
      }
  }

  render()
  {
    const component = this,
      perspective = component.props.perspective,
      tableName = perspective ? perspective.displayName : deconstructLocalName( component.context.roltype );
    var qualifiedColumnName;

    if (component.stateIsComplete())
    {
      qualifiedColumnName = getQualifiedPropertyName( component.props.cardcolumn, component.state.propertyNames);
      return (<PSContext.Consumer>{
                pscontext =>
                  <Table responsive striped bordered hover size="sm" className="mb-0">
                    <caption>Table for the role { tableName }</caption>
                    <thead>
                      <tr>
                      { component.state.propertyNames.map( pn =>
                        <th key={pn}>
                          { perspective.properties[pn].displayName }
                        </th>) }
                      </tr>
                    </thead>
                    <tbody
                      // tabIndex="0"
                      ref={component.eventDiv}
                      onFocus={ () => component.setState( { active: true}) }
                      onKeyDown={ component.handleKeyDown }
                    >
                      <RoleInstanceIterator>
                        <TableRow
                          myroletype={pscontext.myroletype}
                          column={component.state.column}
                          tableisactive = {component.state.active}
                          cardcolumn = {qualifiedColumnName}
                          roleRepresentation={component.props.roleRepresentation}
                          isFirstCell={function()
                            {
                              if (!component.firstCellSet)
                              {
                                component.firstCellSet = true;
                                return true;
                              }
                              return false;
                            }}
                          deregisterPreviousCell={component.deregisterPreviousCell}
                          perspective={component.props.perspective}
                          />
                      </RoleInstanceIterator>
                    </tbody>
                  </Table>
              }</PSContext.Consumer>);
    }
    else {
      return null;
    }
  }
}

RoleTable_.propTypes =
  { cardcolumn: PropTypes.string.isRequired
  , roleRepresentation: PropTypes.func.isRequired
  , perspective: PropTypes.object.isRequired
};

RoleTable_.contextType = PSRoleInstances;

////////////////////////////////////////////////////////////////////////////////
// TABLEROW
////////////////////////////////////////////////////////////////////////////////
class TableRow extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
    this.handleClick = this.handleClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.ref = React.createRef();
  }

  componentDidMount()
  {
    this.setState( {roleInstanceWithProps: this.computeRoleInstanceWithProps()} );
  }

  componentDidUpdate()
  {
    const component = this;
    // Set state if the current role instance has changed, or if the perspective has changed.
    if (!component.props.perspective.seenInTable)
    {
      component.props.perspective.seenInTable = true;
      component.setState(
        { roleInstanceWithProps: component.computeRoleInstanceWithProps()
        });
    }
  }

  computeRoleInstanceWithProps()
  {
    const component = this;
    return Object.values( this.props.perspective.roleInstances )
      .filter( inst => inst.roleId == component.context.rolinstance)[0];
  }

  findValues( propId )
  {
    const component = this;
    if (component.state.roleInstanceWithProps)
    {
      return component.state.roleInstanceWithProps.propertyValues[propId];
    }
  }

  handleClick (event)
  {
    event.preventDefault();
    event.stopPropagation();
    // Signal to RoleInstances that the role instance on this row now has the cursor.
    this.ref.current.dispatchEvent( new CustomEvent('SetCursor', { detail: this.context.rolinstance, bubbles: true }) );
    // When shift is held, the card column becomes selected.
    if ( event.shiftKey )
    {
      this.ref.current.dispatchEvent( new CustomEvent('SetSelectRow', { bubbles: true }) );
    }
  }

  handleKeyDown (event)
  {
    switch(event.keyCode){
      case 32: // Space
        if (event.shiftKey)
        {
          event.preventDefault();
          event.stopPropagation();
          // Signal to RoleInstances that the role instance on this row now has the cursor.
          this.ref.current.dispatchEvent( new CustomEvent('SetCursor', { detail: this.context.rolinstance, bubbles: true }) );
        }
        // When shift is held, the card column becomes selected.
        if ( event.shiftKey )
        {
          this.ref.current.dispatchEvent( new CustomEvent('SetSelectRow', { bubbles: true }) );
        }
      }
  }

  render()
  {
    const component = this;
    const perspective = component.props.perspective;
    return  <tr
              onClick={component.handleClick}
              onKeyDown={component.handleKeyDown}
              ref={component.ref}
            >{
              Object.values(perspective.properties).map( serialisedProperty =>
                <TableCell
                  key = {serialisedProperty.id}
                  propertyname = {serialisedProperty.id}
                  serialisedProperty={serialisedProperty}
                  propertyValues={component.findValues( serialisedProperty.id )}
                  iscard = {serialisedProperty.id == component.props.cardcolumn}
                  psrol= {component.context}
                  myroletype = {component.props.myroletype}
                  isselected = { component.props.tableisactive && !!component.context.isselected && (component.props.column == serialisedProperty.id) }
                  roleRepresentation={component.props.roleRepresentation}
                  isFirstCell={component.props.isFirstCell}
                  deregisterPreviousCell={component.props.deregisterPreviousCell}
                /> )
            }</tr>;
  }
}

TableRow.contextType = PSRol;

TableRow.propTypes =
  { myroletype: PropTypes.string.isRequired
  , column: PropTypes.string.isRequired
  , tableisactive: PropTypes.bool.isRequired
  , cardcolumn: PropTypes.string.isRequired
  , roleRepresentation: PropTypes.func.isRequired
  , isFirstCell: PropTypes.func.isRequired
  , deregisterPreviousCell: PropTypes.object.isRequired
  , perspective: PropTypes.object.isRequired
};

////////////////////////////////////////////////////////////////////////////////
// TABLECELL
////////////////////////////////////////////////////////////////////////////////
/*
 * Renders a Form.Control, fetches the value for propertyname on roleinstance,
 * sets a new value if the content of the control has changed on losing focus.
*/

class TableCell extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
    const component = this;
    this.state = {};
    // value is an array of strings.
    this.state.value = props.propertyValues ? props.propertyValues.values : [];

    this.state.editable = false;
    this.state.lastCellBeforeTableInactivated = this.props.isFirstCell();
    if (this.state.lastCellBeforeTableInactivated)
    {
      // Set a new deregister function that will make the current cell forget it
      // was the last selected cell before the table inactivated.
      this.props.deregisterPreviousCell.f = function()
        {
          component.setState({lastCellBeforeTableInactivated: false});
        };
    }
    this.handleClick = this.handleClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyDownOnCard = this.handleKeyDownOnCard.bind(this);
    // A reference to the Form.Control that handles input.
    // It is used to dispatch the custom SetCursor and SetColumn events.
    // It also receives focus.
    this.inputRef = React.createRef();
  }

  componentDidUpdate(prevProps/*, prevState*/)
  {
    const component = this;
    // The card component loses focus for an unknown reason as soon as we start editing it.
    // This prevents that.
    if ( component.props.isselected && (!prevProps.isselected || component.props.iscard))
    {
      // Gives the Form.Control the focus, activating it.
      component.inputRef.current.focus();
      // Deregister the previous selected cell:
      this.props.deregisterPreviousCell.f();
      // In case we jump back later into the table, make the current cell think
      // it was the last selected cell before the table inactivated.
      this.setState({lastCellBeforeTableInactivated: true});
      // Set a new deregister function that will make the current cell forget it
      // was the last selected cell before the table inactivated.
      this.props.deregisterPreviousCell.f = function()
        {
          component.setState({lastCellBeforeTableInactivated: false});
        };
    }
    // NOTE: we just compare the first value.
    if (!prevProps.propertyValues || (prevProps.propertyValues && prevProps.propertyValues.values[0] != component.props.propertyValues.values[0]))
    {
      this.setState(
        { value: this.props.propertyValues.values
        , editable: false
        });
    }
  }

  findValue()
  {
    return this.state.roleInstanceWithProps.propertyValues[this.props.propertyname].values;
  }

  // val is a string.
  // Notice that this makes the value of the property equal to [val], whatever
  // the previous value was.
  changeValue (val)
  {
    const component = this;
    if (component.state.value.length != 1 || component.state.value[0] != val)
    {
      PDRproxy.then(
        function(pproxy)
        {
          pproxy.setProperty(
            component.props.psrol.rolinstance,
            component.props.propertyname,
            val,
            component.props.myroletype );
        });
    }
  }

  // Set the column in the RoleTable_.
  // React will then re-render, giving TableCell the value true for the isselected prop.
  handleClick ()
  {
    this.inputRef.current.dispatchEvent( new CustomEvent('SetColumn', { detail: this.props.propertyname, bubbles: true }) );
  }

  handleKeyDownOnCard(event)
  {
    const component = this;
    if (component.props.isselected)
    {
      if (component.state.editable)
      {
        switch( event.keyCode )
        {
          // Stop editing, allow event to bubble.
          // Content has been restored in the SmartFieldControl.
          // We stop editing with value change from the PDR!
          case 27: // Escape
            component.setState({editable: false});
            break;
        }
      }
      else if (!event.shiftKey && !component.props.serialisedProperty.isCalculated)
      {
        switch(event.keyCode){
          case 32: // Space
          case 13: // Return
            component.setState({editable:true});
            event.preventDefault();
            event.stopPropagation();
            break;
          }
      }
    }
  }

  handleKeyDown (event)
  {
    const component = this;
    if (!component.state.editable && !event.shiftKey && !component.props.serialisedProperty.isCalculated)
    {
      switch(event.keyCode){
        case 32: // Space
        case 13: // Return
          component.setState({editable:true});
          event.preventDefault();
          event.stopPropagation();
          break;
        }
    }
    else
    {
      switch( event.keyCode )
      {
        // Safe on leaving the cell, allow event to bubble.
        case 37: // left arrow
        case 39: // right arrow
          event.stopPropagation();
          break;
        case 38: // Up arrow
        case 40: // Down arrow
        case 9:  // Tab key
          component.changeValue(event.target.value);
          component.setState({editable: false});
          break;
        case 13: // Return
          component.changeValue(event.target.value);
          component.setState({editable: false});
          event.preventDefault();
          event.stopPropagation();
          break;
        case 27: // Escape
          component.setState({editable: false});
          // Make the Form.Control display the original value. DO WE STILL NEED THIS?
          component.inputRef.current.value = component.state.value;
          event.preventDefault();
          event.stopPropagation();
          break;
      }
    }
  }

  render ()
  {
    const component = this;
    const RoleRepresentation = component.props.roleRepresentation;
    if (component.props.iscard)
    {
      if (component.props.isselected)
      {
        if (component.state.editable)
        {
          return (
            <td onKeyDown={component.handleKeyDownOnCard}>
              <SmartFieldControl
                inputRef={component.inputRef}
                aria-label={deconstructLocalName(component.props.propertyname)}
                onClick={ component.handleClick }
                serialisedProperty={component.props.serialisedProperty}
                propertyValues={component.props.propertyValues}
                roleId={component.props.psrol.rolinstance}
                myroletype={component.props.myroletype}
              />
            </td>);
        }
        else
        {
          // Zoals het was
          return (
            <td onKeyDown={component.handleKeyDownOnCard}>
                <RoleRepresentation
                  inputRef={component.inputRef}
                  tabIndex={component.state.lastCellBeforeTableInactivated ? "0" : "-1"}
                  // if we set defaultValue, the value on screen does not update.
                  value={component.state.value}
                  className="shadow bg-info"
                  onClick={component.handleClick}
                  labelProperty={deconstructLocalName ( component.props.propertyname )}
                />
            </td>);
        }
      }
      else
      {
        return (
          <td>
              <RoleRepresentation
                inputRef={component.inputRef}
                tabIndex={component.state.lastCellBeforeTableInactivated ? "0" : "-1"}
                // if we set defaultValue, the value on screen does not update.
                value={component.state.value}
                className="shadow"
                onClick={component.handleClick}
                labelProperty={deconstructLocalName ( component.props.propertyname )}
              />
          </td>);
      }
    }
    else
    {
      return (
        <td onClick={component.handleClick}>
          <SmartFieldControl
            inputRef={component.inputRef}
            aria-label={deconstructLocalName(component.props.propertyname)}
            serialisedProperty={component.props.serialisedProperty}
            propertyValues={component.props.propertyValues}
            roleId={component.props.psrol.rolinstance}
            myroletype={component.props.myroletype}
          />
        </td>);
    }
  }
}

TableCell.propTypes =
  { propertyname: PropTypes.string.isRequired
  , myroletype: PropTypes.string.isRequired
  , isselected: PropTypes.bool.isRequired
  , iscard: PropTypes.bool.isRequired
  , psrol:
    PropTypes.shape(
      { contextinstance: PropTypes.string.isRequired
      , contexttype: PropTypes.string.isRequired
      , roltype: PropTypes.string.isRequired
      , bind_: PropTypes.func
      , checkbinding: PropTypes.func
      , removerol: PropTypes.func
      , rolinstance: PropTypes.string.isRequired
      , isselected: PropTypes.bool.isRequired
      }).isRequired
  , roleRepresentation: PropTypes.func.isRequired
  , deregisterPreviousCell: PropTypes.object.isRequired
  , serialisedProperty:
      PropTypes.shape(
        { id: PropTypes.string.isRequired
        , displayName: PropTypes.string.isRequired
        , isFunctional: PropTypes.bool.isRequired
        , isMandatory: PropTypes.bool.isRequired
        , isCalculated: PropTypes.bool.isRequired
        , range: PropTypes.string.isRequired
        , verbs: PropTypes.arrayOf( PropTypes.string ).isRequired
        }).isRequired
};

////////////////////////////////////////////////////////////////////////////////
// TABLECONTROLS
////////////////////////////////////////////////////////////////////////////////
class TableControls extends PerspectivesComponent
{
  constructor()
  {
    super();
    this.runAction = this.runAction.bind(this);
    this.state =
      { currentRoleInstance: undefined
      , actions: undefined };
  }

  handleKeyDown (event)
    {
      const component = this;
        switch(event.keyCode){
          case 13: // Return
          case 32: // Space
            component.context.createRole( function() {});
            event.preventDefault();
            event.stopPropagation();
            break;
        }
  }

  componentDidMount()
  {
    const component = this;
    component.setState(
      { currentRoleInstance: component.props.selectedroleinstance
      , actions: component.computeActions()
      });
  }

  componentDidUpdate()
  {
    const component = this;
    // Set state if the current role instance has changed, or if the perspective has changed.
    if ((component.props.selectedroleinstance && component.props.selectedroleinstance != component.state.currentRoleInstance) || !component.props.perspective.seenBefore)
    {
      component.setState(
        { currentRoleInstance: component.props.selectedroleinstance
        , actions: component.computeActions()
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
            component.state.currentRoleInstance
            , component.props.contextinstance
            , component.props.perspective.id
            , actionName
            , component.props.myroletype); // authoringRole
      });
  }

  // Computes the actions available based on context- and subject state, combined with those
  // available based on object state.
  computeActions()
  {
    const component = this;
    let objectStateActions = [];
    if (component.props.perspective)
    {
      // It happens that the perspective is not always yet updated when we compute actions.
      if (component.props.selectedroleinstance && component.props.perspective.roleInstances[ component.props.selectedroleinstance])
      {
        objectStateActions = component.props.perspective.roleInstances[ component.props.selectedroleinstance].actions;
      }
      return component.props.perspective.actions.concat( objectStateActions );
    }
    else
    {
      return [];
    }
  }

  render ()
  {
    const component = this;
    if ( component.stateIsComplete(["currentRoleInstance"]) )
    {
      return  <Navbar bg="light" expand="lg" role="banner" aria-label="Controls for table" className="mb-5">
                {
                  component.props.createButton ?
                  <div
                    className="ml-3 mr-3"
                    tabIndex="0"
                    onClick={ () => component.context.createRole( function() {}) }
                    onKeyDown={ ev => component.handleKeyDown(ev)}
                  >
                    <PlusIcon alt="Add row" aria-label="Click to add a row" size='medium'/>
                  </div>
                  : null
                }
                <AppContext.Consumer>
                  { appcontext => <TablePasteRole systemexternalrole={appcontext.systemExternalRole}/> }
                </AppContext.Consumer>
                { component.state.actions.length > 0 ?
                  <ActionDropDown
                    actions={ component.state.actions }
                    runaction={component.runAction}
                  />
                  : null }
              </Navbar>;
    }
    else
    {
      return null;
    }
  }
}

TableControls.contextType = PSRoleInstances;
TableControls.propTypes =
  { createButton: PropTypes.bool
  , perspective: PropTypes.object
  // This is the cursor of the PSRoleInstances, by default the first instance.
  , selectedroleinstance: PropTypes.string
  , contextinstance: PropTypes.string
  , myroletype: PropTypes.string
  };
