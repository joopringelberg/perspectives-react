const React = require("react"); // 2
import PerspectivesComponent from "./perspectivescomponent.js";
import {PSRol, PSContext} from "./reactcontexts";
import {addBehaviour} from "./behaviourcomponent.js";
import mapRoleVerbsToBehaviours from "./maproleverbstobehaviours.js";
import TableRow from "./tablerow.js";
import TableControls from "./tablecontrols.js";

import
  { Table
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

    component.state =
      { column: this.propertyNames[0]
      , row: Object.keys( component.props.perspective.roleInstances )[0]
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

  componentDidUpdate()
  {
    // If the selected row has been deleted, set `row` to the first row.
    if (!this.props.perspective.roleInstances[this.state.row])
    {
      this.setState({row: Object.keys( this.props.perspective.roleInstances )[0]});
    }
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
          event.preventDefault();
          component.setState({column: component.propertyNames[columnIndex + 1]});
        }
        event.stopPropagation();
        break;
      case 37: // Left arrow
        if (columnIndex > 0)
        {
          event.preventDefault();
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
      <div>
      {
        component.stateIsComplete(["row"]) ?
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
                        cardcolumn = {perspective.identifyingProperty}
                        roleRepresentation={component.roleRepresentation}
                        roleinstancewithprops={perspective.roleInstances[roleId]}
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
