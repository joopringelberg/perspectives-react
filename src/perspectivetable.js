const React = require("react"); // 2

import PerspectivesComponent from "./perspectivescomponent.js";

const PDRproxy = require("perspectives-proxy").PDRproxy;

import {PSRoleInstances, PSRol, PSContext} from "./reactcontexts";

import RoleInstances from "./roleinstances.js";

import RoleInstanceIterator from "./roleinstanceiterator.js";

import RoleDropZone from "./roleDropzone.js";

import {deconstructLocalName, getQualifiedPropertyName} from "./urifunctions.js";

import {addBehaviour} from "./behaviourcomponent.js";

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
// ROLETABLE
////////////////////////////////////////////////////////////////////////////////
// Context type of RoleTable is PSContext
export default class PerspectiveTable extends PerspectivesComponent
{
  render ()
  {
    const
      component = this,
      roleType = component.props.perspective.roleType || component.props.roletype;
    let roleRepresentation;
    if (component.props.roleRepresentation)
    {
      roleRepresentation = component.props.roleRepresentation;
    }
    else
    {
      // Map role verbs to behaviour.
      roleRepresentation = addBehaviour( Card, component.props.behaviours || [] );
    }
    return (<RoleInstances
              rol={roleType}
              contexttocreate={component.props.contexttocreate}
              perspective={component.props.perspective}>
          <PSRoleInstances.Consumer>{ psrol =>
            <RoleDropZone
              ariaLabel=""
              bind={psrol.bind /* As we have a role, just bind the role we drop.*/}
              checkbinding={psrol.checkbinding}
            >
              <RoleTable_
                viewname={component.props.viewname}
                cardcolumn={component.props.cardcolumn}
                roleRepresentation={roleRepresentation}
                perspective={component.props.perspective}
                />
              <TableControls createButton={ component.props.createButton }/>
            </RoleDropZone>
          }</PSRoleInstances.Consumer>
      </RoleInstances>);
  }
}

PerspectiveTable.propTypes =
  // The columns in the table are the properties in the view.
  { "viewname": PropTypes.string.isRequired
  // must be the local name of one of the properties in the view.
  // This column is displayed as a mini card showing this property's value
  // and can be clicked to open the role or the context behind it.
  , "cardcolumn": PropTypes.string.isRequired
  // The qualified or local name of the role that the table displays.
  // May use default prefixes.
  , "roletype": PropTypes.string.isRequired
  // The type of the context to create, if the table displays a context role.
  // Must be a qualified context type, possibly constructed with a default
  // namespace (such as sys:).
  // Is passed on to RoleInstances
  , "contexttocreate": PropTypes.string
  // If true, a button will be displayed to create a new role (and possibly a context)
  , "createButton": PropTypes.bool
  // A React component that is displayed in the card column.
  // Is by the default the Card class given above.
  , "roleRepresentation": PropTypes.object
  // Behaviours added to the roleRepresentation component.
  , "behaviours": PropTypes.arrayOf(PropTypes.func)
  // When given a perspective, the table will not retrieve roleinstances itself.
  , "perspective": PropTypes.object
  };

PerspectiveTable.contextType = PSContext;

// Context type of RoleTable_ is PSRoleInstances.
class RoleTable_ extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
    this.state.propertyNames = undefined;
    this.state.column = undefined;
    this.state.active = false;
    this.eventDiv = React.createRef();
    this.handleKeyDown = this.handleKeyDown.bind( this );
    // The first rendered cell sets this to false.
    // Each subsequent cell can than see it is not first.
    this.firstCellSet = false;
    this.deregisterPreviousCell = {f: () => {}};
  }

  componentDidMount ()
  {
    // TODO. Find out whether the roletype is a context role type.
    const component = this;
    let propertyNames;
    if (component.props.perspective)
    {
      propertyNames = Object.keys( component.props.perspective.properties );
      component.setState(
        { propertyNames: propertyNames
        , column: propertyNames[0]
      });
    }
    else
    {
      PDRproxy.then(
        function (pproxy)
        {
          component.addUnsubscriber(
            pproxy.getViewProperties(
              component.context.roltype,
              component.props.viewname,
              function(propertyNames)
              {
                component.setState(
                  { propertyNames: propertyNames
                  , column: propertyNames[0]
                });
              }));
        });
    }
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
          // By definition of row selection, the current column now becomes the card column.
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

    function propertyDisplayName( qualifiedName )
    {
      if (perspective)
      {
        return perspective.properties[qualifiedName].displayName;
      }
      else
      {
        deconstructLocalName( qualifiedName );
      }
    }

    if (component.stateIsComplete())
    {
      qualifiedColumnName = getQualifiedPropertyName( component.props.cardcolumn, component.state.propertyNames);
      return (<PSContext.Consumer>{
                pscontext =>
                  <Table responsive striped bordered hover size="sm" className="mb-0">
                    <caption>Table for the role { tableName }</caption>
                    <thead>
                      <tr>
                      { component.state.propertyNames.map( pn => <th key={pn}>{ propertyDisplayName( pn ) }</th>) }
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
                          propertynames={ component.state.propertyNames }
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
  { viewname: PropTypes.string.isRequired
  , cardcolumn: PropTypes.string.isRequired
  , roleRepresentation: PropTypes.func.isRequired
  , perspective: PropTypes.object
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
    return  <tr
              onClick={component.handleClick}
              onKeyDown={component.handleKeyDown}
              ref={component.ref}
            >{
              component.props.propertynames.map( pn =>
                <TableCell
                  key = {pn}
                  propertyname = {pn}
                  iscard = {pn == component.props.cardcolumn}
                  psrol= {component.context}
                  myroletype = {component.props.myroletype}
                  isselected = { component.props.tableisactive && !!component.context.isselected && (component.props.column == pn) }
                  roleRepresentation={component.props.roleRepresentation}
                  isFirstCell={component.props.isFirstCell}
                  deregisterPreviousCell={component.props.deregisterPreviousCell}
                  perspective={component.props.perspective}
                /> )
            }</tr>;
  }
}

TableRow.contextType = PSRol;

TableRow.propTypes =
  { propertynames: PropTypes.arrayOf(PropTypes.string)
  , myroletype: PropTypes.string.isRequired
  , column: PropTypes.string.isRequired
  , tableisactive: PropTypes.bool.isRequired
  , cardcolumn: PropTypes.string.isRequired
  , roleRepresentation: PropTypes.func.isRequired
  , isFirstCell: PropTypes.func.isRequired
  , deregisterPreviousCell: PropTypes.object.isRequired
  , perspective: PropTypes.object
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
    this.isCalculated = props.perspective.properties[component.props.propertyname].isCalculated;
    // value is an array of strings.
    this.state.value = undefined;
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
    // A reference to the Form.Control that handles input.
    // It is used to dispatch the custom SetCursor and SetColumn events.
    // It also receives focus.
    this.inputRef = React.createRef();
  }

  componentDidMount ()
  {
    const component = this;
    const perspective = component.props.perspective;
    let roleInstanceWithProperties;
    if (perspective)
    {
      roleInstanceWithProperties = perspective.roleInstances[component.props.psrol.rolinstance];
      if (roleInstanceWithProperties)
      {
        component.setState({value: roleInstanceWithProperties.propertyValues[component.props.propertyname].values});
      }
      else
      {
        component.setState({value: []});
      }
    }
    else
    {
      PDRproxy.then(
        function( pproxy )
        {
          component.addUnsubscriber(
            pproxy.getProperty(
              component.props.psrol.rolinstance,
              component.props.propertyname,
              component.props.psrol.roltype,
              function (propertyValues)
              {
                component.setState({value: propertyValues});
              })
          );
        }
      );
    }
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
  }

  handleKeyDown (event)
  {
    const component = this;
    if (!component.state.editable && !event.shiftKey && !component.isCalculated)
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
        case 37: // Left Arrow
          event.stopPropagation();
          break;
        case 39: // Right Arrow
          event.stopPropagation();
      }
    }
    // if (event.keyCode == 9 || event.keyCode == 11)
    // {
    //   // Make sure tabIndex = 0;
    //   this.setState({lastCellBeforeTableInactivated: true});
    // }
  }

  render ()
  {
    const component = this;
    const RoleRepresentation = component.props.roleRepresentation;
    if (component.props.isselected)
    {
      // SELECTED
      if (component.state.editable)
      {
        // SELECTED, EDITABLE
        return (
          <td >
            <Form.Control
              ref={ component.inputRef }
              tabIndex="-1"
              aria-label={deconstructLocalName(component.props.propertyname)}
              defaultValue={component.state.value}
              onKeyDown={ component.handleKeyDown }
              onBlur={function(e)
                {
                  component.changeValue(e.target.value);
                  component.setState({editable: false});
                }}
              onClick={ component.handleClick }
            />
          </td>);
      }
      else
      {
        // SELECTED, NOT EDITABLE
        if (component.props.iscard)
        {
          // SELECTED, NOT EDITABLE, CARD
          return (
            <td onKeyDown={component.handleKeyDown}>
                <RoleRepresentation
                  inputRef={component.inputRef}
                  tabIndex={component.state.lastCellBeforeTableInactivated ? "0" : "-1"}
                  // if we set defaultValue, the value on screen does not update.
                  defaultValue={component.state.value}
                  className="shadow bg-info"
                  onClick={component.handleClick}
                  labelProperty={deconstructLocalName ( component.props.propertyname )}
                />
            </td>);
        }
        else
        {
          // SELECTED, NOT EDITABLE, OTHERWISE
          return (
            <td>
              <Form.Control readOnly plaintext
                ref={ component.inputRef }
                tabIndex={component.state.lastCellBeforeTableInactivated ? "0" : "-1"}
                aria-label={deconstructLocalName(component.props.propertyname)}
                onKeyDown={ component.handleKeyDown }
                onClick={ component.handleClick }
                defaultValue={component.state.value}
              />
            </td>);
        }
      }
    }
    else
    {
      // NOT SELECTED
      if (component.props.iscard)
      {
        // NOT SELECTED, CARD
        return <td>
          <RoleRepresentation
            inputRef={component.inputRef}
            tabIndex={component.state.lastCellBeforeTableInactivated ? "0" : "-1"}
            defaultValue={component.state.value}
            className="shadow"
            onClick={component.handleClick}
          />
        </td>;
      }
      else
      {
        // NOT SELECTED, OTHERWISE
        return (
          <td>
            <Form.Control
              readOnly
              plaintext
              className={component.props.iscard ? "shadow" : null}
              ref={component.inputRef}
              tabIndex={component.state.lastCellBeforeTableInactivated ? "0" : "-1"}
              aria-label={component.state.value}
              onClick={component.handleClick}
              defaultValue={component.state.value}
            />
          </td>);
        }
    }
  }
}

TableCell.propTypes =
  { propertyname: PropTypes.string.isRequired
  , myroletype: PropTypes.string.isRequired
  , isselected: PropTypes.bool.isRequired
  , iscard: PropTypes.bool.isRequired
  , psrol: PropTypes.shape(
    { contextinstance: PropTypes.string.isRequired
    , contexttype: PropTypes.string.isRequired
    , roltype: PropTypes.string.isRequired
    , bind_: PropTypes.func
    , checkbinding: PropTypes.func
    , removerol: PropTypes.func
    , rolinstance: PropTypes.string.isRequired
    , isselected: PropTypes.bool.isRequired
    }
  ).isRequired
  , roleRepresentation: PropTypes.func.isRequired
  , deregisterPreviousCell: PropTypes.object.isRequired
  , perspective: PropTypes.object
};

////////////////////////////////////////////////////////////////////////////////
// TABLECONTROLS
////////////////////////////////////////////////////////////////////////////////
class TableControls extends PerspectivesComponent
{
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
  render ()
  {
    const component = this;
    if ( component.props.createButton )
    {
      return  <Navbar bg="light" expand="lg" role="banner" aria-label="Controls for table" className="mb-5">
                <div
                  className="ml-3 mr-3"
                  tabIndex="0"
                  onClick={ () => component.context.createRole( function() {}) }
                  onKeyDown={ ev => component.handleKeyDown(ev)}
                >
                  <PlusIcon alt="Add row" aria-label="Click to add a row" size='medium'/>
                </div>
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
  { createButton: PropTypes.bool };
