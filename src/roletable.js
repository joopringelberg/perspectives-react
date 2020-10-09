const React = require("react"); // 2

import ReactDOM from 'react-dom';

import PerspectivesComponent from "./perspectivescomponent.js";

const Perspectives = require("perspectives-proxy").Perspectives;

import {PSRoleInstances, PSRol, PSContext} from "./reactcontexts";

import RoleInstances from "./roleinstances.js";

import roleInstance from "./roleinstance.js";

import RoleInstanceIterator from "./roleinstanceiterator.js";

import {deconstructLocalName} from "./urifunctions.js";

import {PlusIcon} from '@primer/octicons-react'

import
  { Row
  , Navbar
  , Table
  , Form
  } from "react-bootstrap";

import "./components.css";

const PropTypes = require("prop-types");

////////////////////////////////////////////////////////////////////////////////
// ROLETABLE
////////////////////////////////////////////////////////////////////////////////
export default class RoleTable extends PerspectivesComponent
{
  render ()
  {
    const component = this;
    return (<RoleInstances rol={component.props.roletype}>
        <RoleTable_ viewname={component.props.viewname}/>
        <TableControls/>
      </RoleInstances>)
  }
}

RoleTable.propTypes =
  { "viewname": PropTypes.string.isRequired
  };

RoleTable.contextType = PSContext;

class RoleTable_ extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
    this.state.propertyNames = undefined;
    this.state.column = undefined;
    this.state.active = false;
    this.eventDiv = React.createRef();
    this.activateTable = this.activateTable.bind( this );
    this.handleKeyPress = this.handleKeyPress.bind( this );
  }

  componentDidMount ()
  {
    const component = this;
    Perspectives.then(
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
    }
  }

  activateTable ()
  {
    const component = this;
    component.setState( { active: true});
  }

  handleKeyPress (event)
  {
    const component = this;
      switch(event.keyCode){
        case 9: // Horizontal Tab
        case 11: // Vertical Tab
          component.setState({active: false});
          break;
        }
  }

  render()
  {
    const component = this;

    if (component.stateIsComplete())
    {
      return (<PSContext.Consumer>{
                pscontext =>
                  <Table striped bordered hover size="sm">
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
                      onKeyDown={ component.handleKeyPress }
                    >
                      <RoleInstanceIterator>
                        <TableRow
                          propertynames={ component.state.propertyNames }
                          myroletype={pscontext.myroletype}
                          column={component.state.column}
                          tableisactive = {component.state.active}
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
    const component = this;
    component.state.propertyNames = props.propertynames;
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.ref = React.createRef();
  }

  indexOfCurrentColumn()
  {
    return this.state.propertyNames.indexOf( this.props.column );
  }

  handleKeyPress (event)
  {
    const component = this;
    const i = component.indexOfCurrentColumn();

    if (component.props.tableisactive)
    {
      switch(event.keyCode){
        case 39: // Right arrow
          if (i < component.state.propertyNames.length - 1)
          {
            component.ref.current.dispatchEvent( new CustomEvent('SetColumn', { detail: component.props.propertynames[i + 1], bubbles: true }) );
          }
          event.stopPropagation();
          break;
        case 37: // Left arrow
          if (i > 0)
          {
            component.ref.current.dispatchEvent( new CustomEvent('SetColumn', { detail: component.props.propertynames[i - 1], bubbles: true }) );
          }
          event.stopPropagation();
          break;
        }
    }
  }

  render()
  {
    const component = this;
    return  <PSContext.Consumer>{
              pscontext =>  <tr onKeyDown={ component.handleKeyPress} ref={component.ref}
                            >{ component.props.propertynames.map( pn =>
                              <TableCell
                                key = {pn}
                                propertyname = {pn}
                                roleinstance = {component.context.rolinstance}
                                roletype = {component.context.roltype}
                                myroletype = {pscontext.myroletype}
                                isselected = { component.props.tableisactive && !!component.context.isselected && (component.props.column == pn) }
                              /> ) }
                            </tr>
            }</PSContext.Consumer>
  }
}

TableRow.contextType = PSRol;

TableRow.propTypes =
  { propertynames: PropTypes.arrayOf(PropTypes.string)
  , myroletype: PropTypes.string.isRequired
  , column: PropTypes.string.isRequired
  , tableisactive: PropTypes.bool.isRequired
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
    this.select = this.select.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.ref = React.createRef();
  }

  componentDidMount ()
  {
    const component = this;
    Perspectives.then(
      function( pproxy )
      {
        component.addUnsubscriber(
          pproxy.getProperty(
            component.props.roleinstance,
            component.props.propertyname,
            component.props.roletype,
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
      Perspectives.then(
        function(pproxy)
        {
          pproxy.setProperty(
            component.props.roleinstance,
            component.props.propertyname,
            val,
            component.props.myroletype );
        });
    }
  }

  // Set the cursor in the surrounding RoleInstances, set the column in the RoleTable_.
  // React will then re-render, giving TableCell the value true for the isselected prop.
  select ()
  {
    event.preventDefault();
    event.stopPropagation();
    this.ref.current.dispatchEvent( new CustomEvent('SetCursor', { detail: this.props.roleinstance, bubbles: true }) );
    this.ref.current.dispatchEvent( new CustomEvent('SetColumn', { detail: this.props.propertyname, bubbles: true }) );
  }

  componentDidUpdate(prevProps, prevState)
  {
    const component = this;
    if (!prevProps.isselected && component.props.isselected)
    {
      component.ref.current.focus();
    }
  }

  handleKeyPress (event)
    {
      const component = this;
      if (component.props.isselected && !component.state.editable)
      {
        switch(event.keyCode){
          case 13: // Return
          case 32: // Space
            component.setState({editable:true})
            event.preventDefault();
            break;
          }
      }
      else if (component.props.isselected && component.state.editable)
      {
        switch( event.keyCode ){
          case 13: // Return
            component.changeValue(event.target.value);
            component.setState({editable: false})
            event.preventDefault();
            event.stopPropagation()
            break;
          case 27: // Escape
            component.setState({editable: false})
            ReactDOM.findDOMNode(component.ref.current).value = component.state.value;
            event.preventDefault();
            event.stopPropagation()
        }
      }
    }

  render ()
  {
    const component = this;
    if (component.props.isselected && component.state.editable)
    {
      return (
        <td className="mediumDotted border-primary">
          <Form.Control
            ref={ component.ref }
            aria-label={deconstructLocalName(component.props.propertyname)}
            defaultValue={component.state.value}
            onKeyDown={ component.handleKeyPress }
            onBlur={function(e)
              {
                component.changeValue(e.target.value);
                component.setState({editable: false})
              }}
            onClick={ component.select }
          />
        </td>)
    }
    else if (component.props.isselected)
    {
      return (
        <td className="mediumDotted border-primary">
          <Form.Control readOnly plaintext
            ref={ component.ref }
            tabIndex="-1"
            aria-label={deconstructLocalName(component.props.propertyname)}
            defaultValue={component.state.value}
            onKeyDown={ component.handleKeyPress }
            onClick={ component.select }
            onFocus={ component.select }
          />
        </td>)
    }
    else
    {
      return (
        <td
        >
          <Form.Control readOnly plaintext
            ref={ component.ref }
            tabIndex="-1"
            aria-label={deconstructLocalName(component.props.propertyname)}
            defaultValue={component.state.value}
            onClick={ component.select }
            onFocus={ component.select }
          />
        </td>)
    }

  }
}

TableCell.propTypes =
  { propertyname: PropTypes.string.isRequired
  , roleinstance: PropTypes.string.isRequired
  , roletype: PropTypes.string.isRequired
  , myroletype: PropTypes.string.isRequired
  , isselected: PropTypes.bool.isRequired
  }

////////////////////////////////////////////////////////////////////////////////
// TABLECONTROLS
////////////////////////////////////////////////////////////////////////////////
class TableControls extends PerspectivesComponent
{
  render ()
  {
    const component = this;
    return  <Navbar bg="light" expand="lg" role="banner" aria-label="Controls for table">
              <div
                className="ml-3 mr-3"
                tabIndex="0"
                onClick={ ev => component.context.createRole( function() {}) }
              >
                <PlusIcon alt="Add row" aria-label="Click to add a row" size='medium'/>
              </div>
          	</Navbar>
  }
}

TableControls.contextType = PSRoleInstances;
