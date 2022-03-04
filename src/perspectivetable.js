const React = require("react"); // 2
import PerspectivesComponent from "./perspectivescomponent.js";
const PDRproxy = require("perspectives-proxy").PDRproxy;
import {PSRol, PSContext, AppContext} from "./reactcontexts";
import ActionDropDown from "./actiondropdown.js";
import {deconstructLocalName} from "./urifunctions.js";
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
  constructor (props)
  {
    super(props);
    const component = this;
    this.propertyNames = Object.keys( component.props.perspective.properties );
    // Map role verbs to behaviour.
    this.roleRepresentation = addBehaviour( Card, mapRoleVerbsToBehaviours( component.props.perspective ) );
    this.eventDiv = React.createRef();
    this.handleKeyDown = this.handleKeyDown.bind( this );
    // The first rendered cell sets this to false.
    // Each subsequent cell can than see it is not first.
    this.firstCellSet = false;
    this.deregisterPreviousCell = {f: () => {}};

    component.state =
      { column: this.propertyNames[0]
      , row: Object.keys( component.props.perspective.roleInstances )[0]
      , active: true
      };
  }

  componentDidMount ()
  {
    const component = this;
    component.eventDiv.current.addEventListener('SetRow',
      function (e)
      {
        component.setrow( e.detail );
        e.stopPropagation();
      },
      false);
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
        component.setState( { column: component.props.cardcolumn });
        e.stopPropagation();
      },
      false);
  }

  setrow (cr)
  {
    if (cr !== this.state.row && cr)
    {
      this.setState( {row: cr} );
    }
  }

  handleKeyDown (event)
  {
    const component = this;
    const columnIndex = component.propertyNames.indexOf( component.state.column );
    const roleIds = Object.keys( component.props.perspective.roleInstances );
    const rowIndex = roleIds.indexOf( component.state.row );

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
      case 40: // Down arrow
        if ( rowIndex < roleIds.length - 1 )
        {
          component.setrow( roleIds[rowIndex + 1] );
        }
        event.preventDefault();
        break;
      case 38: // Up arrow
        if (rowIndex > 0)
        {
          component.setrow( roleIds[rowIndex - 1] );
        }
        event.preventDefault();
        break;
      case 39: // Right arrow
        if (columnIndex < component.propertyNames.length - 1)
        {
          component.setState({column: component.propertyNames[columnIndex + 1]});
        }
        event.stopPropagation();
        break;
      case 37: // Left arrow
        if (columnIndex > 0)
        {
          component.setState({column: component.propertyNames[columnIndex - 1]});
        }
        event.stopPropagation();
        break;
      }
  }

  mayCreateInstance()
  {
    const perspective = this.props.perspective;
    return !perspective.isCalculated &&
      (perspective.verbs.includes("Create") || perspective.verbs.includes("CreateAndFill"));
  }

  render()
  {
    const component = this,
      perspective = component.props.perspective;

    return (
      <div ref={component.eventDiv}>
      {
        component.stateIsComplete() ?
        <PSContext.Consumer>{
          pscontext =>
            <>
              <Table
                responsive
                striped
                bordered
                hover
                size="sm"
                className="mb-0">
                <caption>Table for the role { perspective.displayName }</caption>
                <thead>
                  <tr>
                  { component.propertyNames.map( pn =>
                    <th key={pn}>
                      { perspective.properties[pn].displayName }
                    </th>) }
                  </tr>
                </thead>
                <tbody
                  ref={component.eventDiv}
                  onFocus={ () => component.setState( { active: true}) }
                  onKeyDown={ component.handleKeyDown }
                >
                  {
                    Object.keys(perspective.roleInstances).map( roleId =>
                      <TableRow
                        key={roleId}
                        roleinstance={roleId}
                        isselected={ roleId == component.state.row }
                        myroletype={pscontext.myroletype}
                        column={component.state.column}
                        tableisactive = {component.state.active}
                        cardcolumn = {perspective.identifyingProperty}
                        roleRepresentation={component.roleRepresentation}
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
                        />)
                  }
                </tbody>
              </Table>
              <TableControls
                createButton={ component.mayCreateInstance() }
                perspective={ perspective}
                selectedroleinstance={component.state.row}
              />
            </>
        }</PSContext.Consumer>
        :
        null
      }
      </div>);
  }
}

PerspectiveTable.contextType = PSContext;

PerspectiveTable.propTypes =
  {
  // A React component that is displayed in the card column.
  // Is by the default the Card class given above.
  "roleRepresentation": PropTypes.object
  // When given a perspective, the table will not retrieve roleinstances itself.
  , "perspective": PropTypes.object.isRequired
  };

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
    this.roleInstanceWithProps = props.perspective.roleInstances[props.roleinstance];
  }

  handleClick (event)
  {
    event.preventDefault();
    event.stopPropagation();
    // Signal to Table that this row is selected.
    this.ref.current.dispatchEvent( new CustomEvent('SetRow', { detail: this.props.roleinstance, bubbles: true }) );
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
          // Signal to Table that this row is selected
          this.ref.current.dispatchEvent( new CustomEvent('SetRow', { detail: this.props.roleinstance, bubbles: true }) );
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
                  roleinstance={component.props.roleinstance}
                  propertyValues={ component.roleInstanceWithProps.propertyValues[serialisedProperty.id] }
                  iscard = {serialisedProperty.id == component.props.cardcolumn}
                  myroletype = {component.props.myroletype}
                  isselected = { component.props.tableisactive && component.props.isselected && (component.props.column == serialisedProperty.id) }
                  roleRepresentation={component.props.roleRepresentation}
                  isFirstCell={component.props.isFirstCell}
                  deregisterPreviousCell={component.props.deregisterPreviousCell}
                /> )
            }</tr>;
  }
}

TableRow.propTypes =
  { myroletype: PropTypes.string.isRequired
  , roleinstance: PropTypes.string.isRequired
  , column: PropTypes.string.isRequired
  , tableisactive: PropTypes.bool.isRequired
  , isselected: PropTypes.bool.isRequired
  , cardcolumn: PropTypes.string.isRequired
  , roleRepresentation: PropTypes.func.isRequired
  , isFirstCell: PropTypes.func.isRequired
  , deregisterPreviousCell: PropTypes.object.isRequired
  , perspective: PropTypes.object.isRequired
};

////////////////////////////////////////////////////////////////////////////////
// TABLECELL
////////////////////////////////////////////////////////////////////////////////
class TableCell extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
    const component = this;
    this.state = { editable: false };
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
    this.handleKeyDownOnCard = this.handleKeyDownOnCard.bind(this);
    // A reference to the Form.Control that handles input.
    // It is used to dispatch the custom SetRow and SetColumn events.
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
                roleId={component.props.rolinstance}
                myroletype={component.props.myroletype}
                disabled={false}
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
                  value={component.props.propertyValues.values}
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
                value={component.props.propertyValues.values}
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
        <td
          onClick={component.handleClick}
         onKeyDown={component.handleKeyDownOnCard}
        >
          <SmartFieldControl
            inputRef={component.inputRef}
            tabIndex={component.state.lastCellBeforeTableInactivated ? "0" : "-1"}
            aria-label={deconstructLocalName(component.props.propertyname)}
            serialisedProperty={component.props.serialisedProperty}
            propertyValues={component.props.propertyValues}
            roleId={component.props.rolinstance}
            myroletype={component.props.myroletype}
            disabled={!component.state.editable}
            focus={component.isselected}
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
  , roleinstance: PropTypes.string.isRequired
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
  , propertyValues:
      PropTypes.shape(
        { values: PropTypes.arrayOf( PropTypes.string ).isRequired
        , propertyVerbs: PropTypes.arrayOf( PropTypes.string).isRequired
        })
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
  }

  createRole (receiveResponse)
  {
    const component = this;
    PDRproxy.then( function (pproxy)
    {
      // If a ContextRole Kind, create a new context, too.
      if (component.props.perspective.roleKind == "ContextRole" && component.props.contexttocreate)
      {
        pproxy.createContext (
          {
            id: "", // will be set in the core.
            prototype : undefined,
            ctype: component.props.contexttocreate,
            rollen: {},
            externeProperties: {}
          },
          component.props.rol, //May be a local name.
          component.props.perspective.contextinstance,
          // NOTE we just take the first context type here, for now!
          component.props.perspective.contextTypesToCreate[0],
          component.props.perspective.userRoleType,
          // [<externalRoleId>(, <contextRoleId>)?]
          function(contextAndExternalRole)
          {
            // Return the new context role identifier!
            receiveResponse( contextAndExternalRole[1] );
          });
      }
      else
      {
        pproxy.createRole (
          component.props.perspective.contextinstance,
          component.props.perspective.roleType,
          component.props.perspective.userRoleType,
          function(newRoleId_)
          {
            receiveResponse( newRoleId_[0] );
          });
      }
    });
  }

  handleKeyDown (event)
    {
      const component = this;
        switch(event.keyCode){
          case 13: // Return
          case 32: // Space
            component.createRole( function() {});
            event.preventDefault();
            event.stopPropagation();
            break;
        }
  }

  runAction( actionName )
  {
    const component = this;
    PDRproxy.then(
      function (pproxy)
      {
          pproxy.action(
            component.props.selectedroleinstance
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
    // It happens that the perspective is not always yet updated when we compute actions.
    if (component.props.selectedroleinstance)
    {
      objectStateActions = component.props.perspective.roleInstances[ component.props.selectedroleinstance].actions;
    }
    return component.props.perspective.actions.concat( objectStateActions );
  }

  render ()
  {
    const component = this;
    const actions = component.computeActions();
    if ( component.stateIsComplete(["currentRoleInstance"]) )
    {
      return  <Navbar bg="light" expand="lg" role="banner" aria-label="Controls for table" className="mb-5">
                {
                  component.props.createButton ?
                  <div
                    className="ml-3 mr-3"
                    tabIndex="0"
                    onClick={ () => component.createRole( function() {}) }
                    onKeyDown={ ev => component.handleKeyDown(ev)}
                  >
                    <PlusIcon alt="Add row" aria-label="Click to add a row" size='medium'/>
                  </div>
                  : null
                }
                <AppContext.Consumer>
                  { appcontext => <TablePasteRole systemexternalrole={appcontext.systemExternalRole}/> }
                </AppContext.Consumer>
                { actions.length > 0 ?
                  <ActionDropDown
                    actions={ actions }
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

TableControls.propTypes =
  { createButton: PropTypes.bool
  , perspective: PropTypes.object
  // This is the row that is selected in the table.
  , selectedroleinstance: PropTypes.string
  };
