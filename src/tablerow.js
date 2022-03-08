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

const React = require("react"); // 2
import PerspectivesComponent from "./perspectivescomponent.js";
import TableCell from "./tablecell.js";
import "./components.css";
const PropTypes = require("prop-types");


////////////////////////////////////////////////////////////////////////////////
// TABLEROW
////////////////////////////////////////////////////////////////////////////////
export default class TableRow extends PerspectivesComponent
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
    const roleInstanceWithProps = component.props.perspective.roleInstances[component.props.roleinstance];
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
                  propertyValues={ roleInstanceWithProps.propertyValues[serialisedProperty.id] }
                  iscard = {serialisedProperty.id == component.props.cardcolumn}
                  myroletype = {component.props.myroletype}
                  isselected = { component.props.isselected && (component.props.column == serialisedProperty.id) }
                  roleRepresentation={component.props.roleRepresentation}
                  isFirstCell={component.props.isFirstCell}
                  deregisterPreviousCell={component.props.deregisterPreviousCell}
                  perspective={component.props.perspective}
                /> )
            }</tr>;
  }
}

TableRow.propTypes =
  { myroletype: PropTypes.string.isRequired
  , roleinstance: PropTypes.string.isRequired
  , column: PropTypes.string.isRequired
  , isselected: PropTypes.bool.isRequired
  , cardcolumn: PropTypes.string.isRequired
  , roleRepresentation: PropTypes.func.isRequired
  // This is a function provided by the table itself. Only the topmost and left-most cell
  // is the first cell.
  , isFirstCell: PropTypes.func.isRequired
  , deregisterPreviousCell: PropTypes.object.isRequired
  , perspective: PropTypes.object.isRequired
};
