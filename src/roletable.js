const React = require("react"); // 2

import PerspectivesComponent from "./perspectivescomponent.js";

const PDRproxy = require("perspectives-proxy").PDRproxy;

import {PSRoleInstances, PSRol, PSContext, AppContext} from "./reactcontexts";

import RoleInstances from "./roleinstances.js";

import RoleInstanceIterator from "./roleinstanceiterator.js";

import {deconstructLocalName, getQualifiedPropertyName} from "./urifunctions.js";

import {PlusIcon} from '@primer/octicons-react';

import
  { Navbar
  , Table
  , Form
  } from "react-bootstrap";

import "./components.css";

const PropTypes = require("prop-types");

////////////////////////////////////////////////////////////////////////////////
// ROLETABLE
////////////////////////////////////////////////////////////////////////////////
// Context type of RoleTable is PSContext
export default class RoleTable extends PerspectivesComponent
{
  render ()
  {
    const component = this;
    return (<RoleInstances rol={component.props.roletype} contexttocreate={component.props.contexttocreate}>
        <RoleTable_ viewname={component.props.viewname} cardcolumn={component.props.cardcolumn}/>
        <TableControls createButton={ component.props.createButton }/>
      </RoleInstances>);
  }
}

RoleTable.propTypes =
  { "viewname": PropTypes.string.isRequired
  , "cardcolumn": PropTypes.string.isRequired
  , "roletype": PropTypes.string.isRequired
  , "contexttocreate": PropTypes.string
  };

RoleTable.contextType = PSContext;

// Context type of RoleTable_ is PSRoleInstances.
class RoleTable_ extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
    this.state.propertyNames = undefined;
    this.state.column = undefined;
    this.state.active = false;
    this.state.rowSelected = false;
    this.eventDiv = React.createRef();
    this.activateTable = this.activateTable.bind( this );
    this.handleKeyDown = this.handleKeyDown.bind( this );
  }

  componentDidMount ()
  {
    // TODO. Find out whether the roletype is a context role type.
    const component = this;
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

  componentDidUpdate(prevProps, prevState)
  {
    const component = this;
    // Do this when we've just retrieved the propertyNames for the first time
    // and when there is a value to the ref.
    if (component.eventDiv.current && !!prevState.propertyNames)
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
          // e.detail must be a boolean value.
          if ( e.detail )
          {
            component.setState(
              { rowSelected: e.detail
              , column: getQualifiedPropertyName( component.props.cardcolumn, component.state.propertyNames)});
          }
          else
          {
            component.setState( { rowSelected: e.detail } );
          }
          e.stopPropagation();
        },
        false);
    }
  }

  activateTable ()
  {
    const component = this;
    component.setState( { active: true});
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
    const component = this;
    var qualifiedColumnName;
    if (component.stateIsComplete())
    {
      qualifiedColumnName = getQualifiedPropertyName( component.props.cardcolumn, component.state.propertyNames);
      return (<PSContext.Consumer>{
                pscontext =>
                  <Table responsive striped bordered hover size="sm" className="mb-0">
                    <caption>Table for the role { deconstructLocalName( component.context.roltype )}</caption>
                    <thead>
                      <tr>
                      { component.state.propertyNames.map( pn => <th key={pn}>{ deconstructLocalName( pn ) }</th>) }
                      </tr>
                    </thead>
                    <tbody
                      tabIndex="0"
                      ref={component.eventDiv}
                      onFocus={ component.activateTable }
                      onKeyDown={ component.handleKeyDown }
                    >
                      <RoleInstanceIterator>
                        <TableRow
                          propertynames={ component.state.propertyNames }
                          myroletype={pscontext.myroletype}
                          column={component.state.column}
                          tableisactive = {component.state.active}
                          cardcolumn = {qualifiedColumnName}
                          rowSelected = {component.state.rowSelected}
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

RoleTable_.contextType = PSRoleInstances;

////////////////////////////////////////////////////////////////////////////////
// TABLEROW
////////////////////////////////////////////////////////////////////////////////
class TableRow extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
  }

  render()
  {
    const component = this;
    return  <PSContext.Consumer>{
              pscontext =>  <tr>{
                              component.props.propertynames.map( pn =>
                                <TableCell
                                  key = {pn}
                                  propertyname = {pn}
                                  iscard = {pn == component.props.cardcolumn}
                                  psrol= {component.context}
                                  myroletype = {pscontext.myroletype}
                                  isselected = { component.props.tableisactive && !!component.context.isselected && (component.props.column == pn) }
                                  rowSelected = {component.props.rowSelected}
                                /> )
                            }</tr>
            }</PSContext.Consumer>;
  }
}

TableRow.contextType = PSRol;

TableRow.propTypes =
  { propertynames: PropTypes.arrayOf(PropTypes.string)
  , myroletype: PropTypes.string.isRequired
  , column: PropTypes.string.isRequired
  , tableisactive: PropTypes.bool.isRequired
  , cardcolumn: PropTypes.string.isRequired
  , rowSelected: PropTypes.bool.isRequired
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
    // value is an array of strings.
    this.state.value = undefined;
    this.state.editable = false;
    this.state.cardIsSelected = false;
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

  // Set the cursor in the surrounding RoleInstances, set the column in the RoleTable_.
  // React will then re-render, giving TableCell the value true for the isselected prop.
  // Only called in click handlers.
  // When used with shift, selects the card instead.
  handleClick (event)
  {
    const component = this;
    event.preventDefault();
    event.stopPropagation();
    // If selected, open the context.
    if (component.props.rowSelected)
    {
      // Open context.
      // TODO. We may have a table of roles that are not context roles! We should not try to open a context in such cases.
      component.inputRef.current.dispatchEvent( new CustomEvent('OpenContext', { detail: component.props.psrol.rolinstance, bubbles: true }) );
    }
    else if ( event.shiftKey )
    {
      this.inputRef.current.dispatchEvent( new CustomEvent('SetCursor', { detail: this.props.psrol.rolinstance, bubbles: true }) );
      this.inputRef.current.dispatchEvent( new CustomEvent('SetColumn', { detail: this.props.propertyname, bubbles: true }) );
      this.inputRef.current.dispatchEvent( new CustomEvent('SetSelectRow', { detail: true, bubbles: true }) );
    }
    else
    {
      this.inputRef.current.dispatchEvent( new CustomEvent('SetCursor', { detail: this.props.psrol.rolinstance, bubbles: true }) );
      this.inputRef.current.dispatchEvent( new CustomEvent('SetColumn', { detail: this.props.propertyname, bubbles: true }) );
    }
  }

  componentDidUpdate(prevProps/*, prevState*/)
  {
    const component = this;
    if (component.props.isselected && (!prevProps.isselected || component.props.iscard))
    {
      // Gives the Form.Control the focus, activating it.
      component.inputRef.current.focus();
    }
  }

  handleKeyDown (event, systemExternalRole)
    {
      const component = this;
      if (component.props.isselected && !component.state.editable)
      {
        switch(event.keyCode){
          case 13: // Return
            if (component.props.rowSelected)
            {
              if (event.shiftKey)
              {
                // Open context.
                component.inputRef.current.dispatchEvent( new CustomEvent('OpenContext', { detail: component.props.psrol.rolinstance, bubbles: true }) );
              }
            }
            else
            {
              component.setState({editable:true});
              component.inputRef.current.dispatchEvent( new CustomEvent('SetSelectRow', { detail: false, bubbles: true }) );
            }
            event.preventDefault();
            event.stopPropagation();
            break;
          case 32: // Space
            if (component.props.rowSelected)
            {
              if (event.shiftKey)
              {
                // Open context.
                component.inputRef.current.dispatchEvent( new CustomEvent('OpenContext', { detail: component.props.psrol.rolinstance, bubbles: true }) );
              }
            }
            else if (event.shiftKey)
            {
              component.inputRef.current.dispatchEvent( new CustomEvent('SetSelectRow', { detail: true, bubbles: true }) );
            }
            else
            {
              component.setState({editable:true});
              component.inputRef.current.dispatchEvent( new CustomEvent('SetSelectRow', { detail: false, bubbles: true }) );
            }
            event.preventDefault();
            event.stopPropagation();
            break;
          case 8: // backspace
            if (component.props.rowSelected)
            {
              component.props.psrol.removerol();
              event.stopPropagation();
              event.preventDefault();
            }
            break;
          case 67: // c
            if (event.ctrlKey)
            {
              // card to clipboard
              PDRproxy.then( pproxy => pproxy.setProperty(
                systemExternalRole,
                "model:System$PerspectivesSystem$External$CardClipBoard",
                JSON.stringify(
                  { roleData:
                    { rolinstance: component.props.psrol.rolinstance
                    , cardTitle: component.state.value
                    , roleType: component.props.psrol.roltype
                    , contextType: component.props.psrol.contexttype
                    }
                  , addedBehaviour: [ "fillARole", "removeFiller", "removeRoleFromContext"]
                  , myroletype: component.props.myroletype
                  }),
                component.props.myroletype));
                event.stopPropagation();
                event.preventDefault();
              }
              break;
          default:
            // any other key will deselect the card.
            component.inputRef.current.dispatchEvent( new CustomEvent('SetSelectRow', { detail: false, bubbles: true }) );
          }
      }
      else if (component.props.isselected && component.state.editable)
      {
        switch( event.keyCode ){
          case 13: // Return
            component.changeValue(event.target.value);
            component.setState({editable: false});
            event.preventDefault();
            event.stopPropagation();
            break;
          case 27: // Escape
            component.setState({editable: false});
            // Make the Form.Control display the original value.
            // ReactDOM.findDOMNode(component.inputRef.current).value = component.state.value;
            component.inputRef.current.value = component.state.value;
            event.preventDefault();
            event.stopPropagation();
            break;
          default:
            // Let all other keys be handled by the control.
            event.stopPropagation();
        }
      }
    }

  render ()
  {
    const component = this;
    ////// EDITABLE
    if (component.props.isselected && component.state.editable)
    {
      return (
        <td >
          <Form.Control
            ref={ component.inputRef }
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
    ///// SELECTED
    else if (component.props.isselected)
    {
      if ( component.props.iscard )
      {
        return (
          <td >
            <AppContext.Consumer>{ appcontext =>
              <Form.Control
                readOnly
                plaintext
                ref={component.inputRef}
                tabIndex="-1"
                aria-label={component.state.value}
                onKeyDown={ ev => component.handleKeyDown(ev, appcontext.systemExternalRole ) }
                onClick={component.handleClick}
                defaultValue={component.state.value}

                className={component.props.rowSelected ? "bg-info shadow" : "shadow"}
                draggable
                onDragStart={ev => ev.dataTransfer.setData("PSRol",
                  JSON.stringify(
                    { roleData:
                      { rolinstance: component.props.psrol.rolinstance
                      , cardTitle: component.state.value
                      , roleType: component.props.psrol.roltype
                      , contextType: component.props.psrol.contexttype
                      }
                    , addedBehaviour: [ "fillARole", "removeFiller", "removeRoleFromContext"]
                    , myroletype: component.props.myroletype
                    })
                  )}
              />}
            </AppContext.Consumer>
          </td>);
      }
      else
      {
        return (
          <td>
            <Form.Control readOnly plaintext
              ref={ component.inputRef }
              tabIndex="-1"
              aria-label={deconstructLocalName(component.props.propertyname)}
              onKeyDown={ component.handleKeyDown }
              onClick={ component.handleClick }
              defaultValue={component.state.value}
            />
          </td>);
      }
    }
    ///// NEITHER EDITABLE NOR SELECTED
    else
    {
      return (
        <td>
          <Form.Control
            readOnly
            plaintext
            className={component.props.iscard ? "shadow" : null}
            ref={component.inputRef}
            tabIndex="-1"
            aria-label={component.state.value}
            onClick={component.handleClick}
            defaultValue={component.state.value}
          />
        </td>);
    }
  }
}

TableCell.propTypes =
  { propertyname: PropTypes.string.isRequired
  , myroletype: PropTypes.string.isRequired
  , isselected: PropTypes.bool.isRequired
  , rowSelected: PropTypes.bool.isRequired
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
    if ( component.props.createButton == undefined || component.props.createButton )
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
