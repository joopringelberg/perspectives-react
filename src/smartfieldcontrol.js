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

// This Component is built upon the data sent from the PDR for a single property.

const React = require("react");
const Component = React.PureComponent;
const PDRproxy = require("perspectives-proxy").PDRproxy;
import
  { Form
  } from "react-bootstrap";
const PropTypes = require("prop-types");

import {serialisedProperty, propertyValues} from "./perspectiveshape.js";
import {UserMessagingPromise} from "./userMessaging.js";
import i18next from "i18next";

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

export default class SmartFieldControl extends Component
{
  constructor(props)
  {
    super(props);
    // `value` is a string.
    this.state = { value: this.valueOnProps() };
    this.leaveControl = this.leaveControl.bind(this);
    this.inputType = this.mapRange( this.props.serialisedProperty.range );
    this.controlType = this.htmlControlType();
  }

  componentDidUpdate(prevProps)
  {
    if (prevProps.propertyValues
        && this.props.propertyValues
        && prevProps.propertyValues.values[0] != this.props.propertyValues.values[0])
    {
      this.setState({ value: this.valueOnProps()});
    }
  }

  htmlControlType ()
  {
    const controlType = this.mapRange(this.props.serialisedProperty.range );
    if (controlType == "checkbox")
    {
      return "checkbox";
    }
    if (controlType == "text")
    {
      if (this.minLength(controlType) > 80)
      {
        return "textarea";
      }
      else if (this.enumeration().length > 0)
      {
        return "select";
      }
      else
      {
        return "input";
      }
    }
  }

  // Returns the first value in the `propertyValues` prop, or the empty string.
  valueOnProps()
  {
    if (this.props.propertyValues)
    {
      return this.props.propertyValues.values[0] || "";
    }
    else
    {
      return "";
    }
  }

  // Zie: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input
  mapRange( range )
  {
    switch (range) {
      case "PString":
        return "text";
      case "PBool":
        return "checkbox";
      case "PDate":
        return "date";
      case "PNumber":
        return "number";
      case "PEmail":
        return "email";
    }
  }

  // `val` is a string.
  changeValue (val)
  {
    const component = this;
    const oldValue = component.valueOnProps();
    if ( oldValue != val )
    {
      PDRproxy.then(
        function(pproxy)
        {
          pproxy.setProperty(
            component.props.roleId,
            component.props.serialisedProperty.id,
            val,
            component.props.myroletype )
            .catch(e => UserMessagingPromise.then( um => 
              um.addMessageForEndUser(
                { title: i18next.t("setProperty_title", { ns: 'preact' }) 
                , message: i18next.t("setProperty_message", {ns: 'preact', property: component.props.serialisedProperty.id})
                , error: e.toString()
                })));
          });
    }
  }

  // newvalue should be a string.
  handleKeyDown (event, newvalue)
  {
    const component = this;
    if (!component.props.disabled)
    {
      switch( event.keyCode )
      {
        // Assuming this code only runs when the field control is active,
        // let it handle the navigation keys locally but do not bubble.
        case 37: // left arrow.
        case 39: // right arrow.
        case 38: // Up arrow
        case 40: // Down arrow
        case 9:  // Horizontal Tab.
        case 11: // Vertical Tab.
        case 32: // Space
          event.stopPropagation();
          break;
        case 13: // Return
          // Safe changes, allow event to bubble.
          if (component.reportValidity(event))
          {
            component.changeValue(newvalue);
          }
          else
          {
            event.stopPropagation();
          }
          break;
        case 27: // Escape
          // Discard changes, allow event to bubble.
          component.setState( {value: component.valueOnProps()});
          event.preventDefault();
          break;
      }
    }
  }

  // This method is called onBlur, i.e. when the user navigates away
  // from the SmartFieldControl.
  // Event target is the input control.
  leaveControl(e)
  {
    this.changeValue(e.target.value);
    return this.reportValidity(e);
  }

  // The event should have the input element as target. Returns true iff no constraints are violated.
  reportValidity(event)
  {
    // A ValidityState object. See: https://developer.mozilla.org/en-US/docs/Web/API/ValidityState
    const validity = event.target.validity;
    if (validity.patternMismatch)
    {
      // We now expect a pattern in the perspective.
      const label = this.pattern(this.inputType).label;
      event.target.setCustomValidity( label );
    }
    else
    {
      event.target.setCustomValidity( "" );
    }
    return event.target.reportValidity();
  }

  // Returns an integer or undefined.
  minLength()
  {
    const component = this;
    if (["text", "search", "url", "tel", "email", "password"].indexOf(this.inputType) >= 0)
    {
      return component.props.serialisedProperty.constrainingFacets.minLength;
    }
  }

  // Returns an integer or undefined.
  maxLength()
  {
    const component = this;
    if (["text", "search", "url", "tel", "email", "password"].indexOf(this.inputType) >= 0)
    {
      return component.props.serialisedProperty.constrainingFacets.maxLength;
    }
  }

  // Returns an integer or undefined.
  minInclusive()
  {
    const component = this;
    if (["range", "number", "date", "month", "week", "datetime", "datetime-local", "time"].indexOf(this.inputType) >= 0)
    {
      return component.props.serialisedProperty.constrainingFacets.minInclusive;
    }
  }

  // Returns an integer or undefined.
  maxInclusive()
  {
    const component = this;
    if (["range", "number", "date", "month", "week", "datetime", "datetime-local", "time"].indexOf(this.inputType) >= 0)
    {
      return component.props.serialisedProperty.constrainingFacets.maxInclusive;
    }
  }

  // Returns an array of strings.
  enumeration()
  {
    return this.props.serialisedProperty.constrainingFacets.enumeration || [];
  }

  // Returns object of this shape:
  // { regex: PropTypes.string.isRequired
  // , label: PropTypes.string.isRequired}
  pattern()
  {
    const component = this;
    if (["text", "search", "url", "tel", "email", "password"].indexOf(this.inputType) >= 0)
    {
      return component.props.serialisedProperty.constrainingFacets.pattern;
    }
  }

  render()
  {
    function toggleValue()
    {
      const newvalue = (component.state.value != "true").toString();
      if ( !component.props.disabled )
      {
        component.changeValue(newvalue);
      }
    }
    // Expects object of this shape:
    // { regex: PropTypes.string.isRequired
    // , label: PropTypes.string.isRequired}
    // Returns the string that represents just the regex, no flags.
    // label has the shape /regex/flags.
    // flags will be ignored.
    function patternToSource(p)
    {
      const r = /\/(.*)\//;
      return p.regex.match(r)[1];
    }

    const component = this;
    const mandatory = component.props.serialisedProperty.isMandatory;
    const pattern = component.pattern();
    switch ( this.controlType ){
      case "checkbox":
        return (
          <div onKeyDown={e => component.handleKeyDown(e, component.state.value)}>
            <Form.Check
              ref= { component.props.inputRef}
              tabIndex={component.props.isselected ? receiveFocusByKeyboard : focusable}
              aria-label={ component.props.serialisedProperty.displayName }
              readOnly={ component.props.disabled }
              checked={ component.state.value == "true" }
              onChange={ toggleValue }
              required={mandatory}
            />
          </div>);
      case "select":
        return (
          <div onKeyDown={e => component.handleKeyDown(e, e.target.value)}>
            <Form.Control
              as="select"
              ref= { component.props.inputRef}
              tabIndex={component.props.isselected ? receiveFocusByKeyboard : focusable}
              aria-label={ component.props.serialisedProperty.displayName }
              readOnly={ component.props.disabled }
              disabled={ component.props.disabled }
              value={ component.state.value }
              onChange={e => component.setState({value: e.target.value}) }
              onBlur={component.leaveControl}
              required={mandatory}
            >
            {
              component.enumeration().map( value => <option key={value}>{value}</option>)
            }
            </Form.Control>
          </div>);
      default:
        return (
          <div onKeyDown={e => component.handleKeyDown(e, e.target.value)}>
            <Form.Control
              as={ component.controlType }
              ref= { component.props.inputRef}
              tabIndex={component.props.isselected ? receiveFocusByKeyboard : focusable}
              aria-label={ pattern? pattern.label : component.props.serialisedProperty.displayName }
              readOnly={ component.props.disabled }
              value={ component.state.value }
              onChange={e => component.setState({value: e.target.value}) }
              onBlur={component.leaveControl}
              type={component.inputType}
              required={mandatory}
              minLength={component.minLength()}
              maxLength={component.maxLength()}
              min={component.minInclusive()}
              max={component.maxInclusive()}
              pattern={ pattern ? patternToSource(pattern) : null }
            />
          </div>);
    }
  }
}

SmartFieldControl.propTypes =
  { serialisedProperty: serialisedProperty.isRequired

  // This member is not required, because the state of the role instance
  // may not allow this property.
  , propertyValues: propertyValues

  , roleId: PropTypes.string

  , myroletype: PropTypes.string.isRequired

  , inputRef: PropTypes.any

  , disabled: PropTypes.bool.isRequired

  , isselected: PropTypes.bool.isRequired
  };
