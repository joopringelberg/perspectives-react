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

import React, { createRef } from "react"; // 2
import ReactDOM from "react-dom";
import PerspectivesComponent from "./perspectivesComponent";
import {deconstructLocalName} from "./urifunctions.js";
import SmartFieldControl from "./smartfieldcontrol.js";
import RoleInstance from "./roleinstance.js";

import "./components.css";
import {string, bool, func, object} from "prop-types";
import { PropertyType, RoleInstanceT, RoleType, Perspective, PropertyValues, SerialisedProperty } from "perspectives-proxy";
import { CardProperties } from "./cardbehaviour";

////////////////////////////////////////////////////////////////////////////////
// NAVIGATING IN A GRID AND A CELL
////////////////////////////////////////////////////////////////////////////////
// https://www.w3.org/TR/wai-aria-practices-1.1/#keyboard-interaction-for-data-grids
// https://www.w3.org/TR/wai-aria-practices-1.1/#gridNav_inside

////////////////////////////////////////////////////////////////////////////////
// TABINDEX VALUES
////////////////////////////////////////////////////////////////////////////////
// A negative value means that the element should be focusable,
// but should not be reachable via sequential keyboard navigation;
// Presumably this means clicking on it or setting it from Javascript.
const focusable = -1;

// 0 means that the element should be focusable and reachable via sequential keyboard navigation,
// but its relative order is defined by the platform convention;
const receiveFocusByKeyboard = 0;


////////////////////////////////////////////////////////////////////////////////
// TABLECELL
////////////////////////////////////////////////////////////////////////////////
interface TableCellProps
{
  propertyname: PropertyType;
  myroletype: RoleType;
  isselected: boolean;
  iscard: boolean;
  roleinstance: RoleInstanceT;
  roleRepresentation:  React.ComponentType<CardProperties>;
  serialisedProperty: SerialisedProperty;
  propertyValues?: PropertyValues;
  perspective: Perspective;
}

interface TableCellState
{
  editable: boolean;
}

export default class TableCell extends PerspectivesComponent<TableCellProps, TableCellState>
{
  inputRef: React.RefObject<HTMLElement | null>;
  constructor (props : TableCellProps)
  {
    super(props);
    // Being editable is not determined by props, but entirely by interaction with the cell
    // through the keyboard.
    this.state = { editable: false };
    this.handleClick = this.handleClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    // A reference to the Form.Control that handles input.
    // It is used to dispatch the custom SetRow and SetColumn events.
    // It also receives focus.
    this.inputRef = createRef();
  }

  componentDidMount()
  {
    if (this.props.isselected)
    {
      if (this.inputRef.current)
      {
        // We need to use findDOMNode because the Form.Control element does not
        // actually forward the ref we pass in to the DOM node.
        //eslint-disable-next-line react/no-find-dom-node
        this.inputRef.current.focus();
      }
    }
  }

  // State is determined by being editable.
  // Being selected is determined by the props.
  // When selected, the cell should have focus.
  // When the value changes, we stop editing.
  // When we start editing, we should re-establish the focus.
  componentDidUpdate(prevProps : TableCellProps)
  {
    const component = this;

    function setFocus()
    {
      if ( component.inputRef.current )
      {
        // We need to use findDOMNode because the Form.Control element does not
        // actually forward the ref we pass in to the DOM node.
        //eslint-disable-next-line react/no-find-dom-node
        component.inputRef.current.focus();
      }
      else
      {
        // THIS IS A HACK, admittedly. However, React doesn't fullfil its
        // promise to resolve refs before the componentDidUpdate function is called.
        // Probably I've nested the ref too deep, but anyway this is the only way
        // that I could make it work.
        setTimeout( setFocus, 100);
      }
    }

    if (component.props.isselected)
    {
      setFocus();
    }

    if (prevProps.isselected && !component.props.isselected && component.state.editable)
    {
      component.setState({editable: false});
    }
  }

  // Set the column in the RoleTable_.
  // React will then re-render, giving TableCell the value true for the isselected prop.
  handleClick ()
  {
    //eslint-disable-next-line react/no-find-dom-node
    this.inputRef.current!.dispatchEvent( new CustomEvent('SetColumn', { detail: this.props.propertyname, bubbles: true }) );
  }

  handleKeyDown(event : React.KeyboardEvent)
  {
    const component = this;
    if (component.props.isselected)
    {
      if (component.state.editable)
      {
        switch( event.code )
        {
          // Stop editing, allow event to bubble.
          // Content has been restored in the SmartFieldControl.
          // We stop editing with value change from the PDR!
          case "Enter":
          case "Escape":
            component.setState({editable: false});
            break;
        }
      }
      else if (!event.shiftKey
                && !component.props.serialisedProperty.isCalculated
                && !component.propertyOnlyConsultable()
              )
      {
        switch(event.code){
          case "Enter":
            component.setState({editable:true});
            event.preventDefault();
            event.stopPropagation();
            break;
          }
      }
    }
  }

  propertyOnlyConsultable()
  {
    if (this.props.propertyValues)
    {
      const propertyVerbs = this.props.propertyValues.propertyVerbs;
      return propertyVerbs.indexOf("Consult") > -1 && propertyVerbs.length == 1;
    }
    else
    {
      return false;
    }
  }

  values()
  {
    if (this.props.propertyValues)
    {
      return this.props.propertyValues.values;
    }
    else
    {
      return [];
    }
  }

  render ()
  {
    const component = this;

    if (component.props.iscard)
    {
      if (component.props.isselected)
      {
        if (component.state.editable)
        {
          return (
            <td 
              onKeyDown={component.handleKeyDown}
              onClick={ component.handleClick }
            >
              <SmartFieldControl
                inputRef={component.inputRef as React.RefObject<HTMLElement>}
                aria-label={deconstructLocalName(component.props.propertyname)}
                serialisedProperty={component.props.serialisedProperty}
                propertyValues={component.props.propertyValues}
                roleId={component.props.roleinstance}
                myroletype={component.props.myroletype}
                disabled={false}
                isselected={component.props.isselected}
                contextinstance={component.props.perspective.contextInstance}
              />
            </td>);
        }
        else
        {
          return (
            <td onKeyDown={component.handleKeyDown}>
              <RoleInstance
                roleinstance={component.props.roleinstance}
                contextinstance={component.props.perspective.contextInstance}
                contexttype={component.props.perspective.contextType}
                roletype={component.props.perspective.roleType}
                rolekind={component.props.perspective.roleKind}
                myroletype={component.props.myroletype}
                allowedtoremovecontext={component.props.perspective.verbs.includes("RemoveContext") || component.props.perspective.verbs.includes("DeleteContext")}
              >
                {[
                  <component.props.roleRepresentation
                    title={component.values().join(", ")}
                    labelProperty={component.props.propertyname} // deconstructLocalName ( component.props.propertyname )
                    // Other properties to pass on.
                    tabIndex={receiveFocusByKeyboard}
                    className="shadow bg-info"
                    onClick={component.handleClick}
                  />
                ]}
              </RoleInstance>
            </td>);
        }
      }
      else
      {
        return (
          <td>
              <component.props.roleRepresentation
                tabIndex={focusable}
                title={component.values().join(", ")}
                className="shadow"
                onClick={component.handleClick}
                labelProperty={component.props.propertyname} // deconstructLocalName ( component.props.propertyname )
              />
          </td>);
      }
    }
    else
    {
      return (
        <td
          onClick={component.handleClick}
         onKeyDown={component.handleKeyDown}
        >
          <SmartFieldControl
            inputRef={component.inputRef  as React.RefObject<HTMLElement>}
            aria-label={deconstructLocalName(component.props.propertyname)}
            serialisedProperty={component.props.serialisedProperty}
            propertyValues={component.props.propertyValues}
            roleId={component.props.roleinstance}
            myroletype={component.props.myroletype}
            disabled={!component.state.editable}
            isselected={component.props.isselected}
            contextinstance={component.props.perspective.contextInstance}
          />
        </td>);
    }
  }
}
