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
  }

  componentDidUpdate(prevProps)
  {
    if (prevProps.propertyValues.values[0] != this.props.propertyValues.values[0])
    {
      this.setState({ value: this.valueOnProps()});
    }
  }

  // Returns the first value in the `propertyValues` prop, or the empty string.
  valueOnProps()
  {
    return this.props.propertyValues.values[0] || "";
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
            component.props.myroletype );
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
          if (event.target.reportValidity())
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
  leaveControl(e)
  {
    this.changeValue(e.target.value);
    return e.target.reportValidity();
  }

  // Returns an integer or undefined.
  minLength(controlType)
  {
    const component = this;
    if (["text", "search", "url", "tel", "email", "password"].indexOf(controlType) >= 0)
    {
      return component.props.serialisedProperty.constrainingFacets.minLength;
    }
  }

  // Returns an integer or undefined.
  maxLength(controlType)
  {
    const component = this;
    if (["text", "search", "url", "tel", "email", "password"].indexOf(controlType) >= 0)
    {
      return component.props.serialisedProperty.constrainingFacets.maxLength;
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
    const component = this;
    const controlType = component.mapRange( component.props.serialisedProperty.range );
    const mandatory = component.props.serialisedProperty.isMandatory;
    switch ( controlType ){
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
          </div>
);
      default:
        return (
          <div onKeyDown={e => component.handleKeyDown(e, e.target.value)}>
            <Form.Control
              as={ controlType == "text" && component.minLength(controlType) > 80 ? "textarea" : "input" }
              ref= { component.props.inputRef}
              tabIndex={component.props.isselected ? receiveFocusByKeyboard : focusable}
              aria-label={ component.props.serialisedProperty.displayName }
              readOnly={ component.props.disabled }
              value={ component.state.value }
              onChange={e => component.setState({value: e.target.value}) }
              onBlur={component.leaveControl}
              type={controlType}
              required={mandatory}
              minLength={component.minLength(controlType)}
              maxLength={component.maxLength(controlType)}
            />
          </div>);
    }
  }
}

SmartFieldControl.propTypes =
  { serialisedProperty:
      PropTypes.shape(
        { id: PropTypes.string.isRequired
        , displayName: PropTypes.string.isRequired
        , isFunctional: PropTypes.bool.isRequired
        , isMandatory: PropTypes.bool.isRequired
        , isCalculated: PropTypes.bool.isRequired
        , range: PropTypes.string.isRequired
        , verbs: PropTypes.arrayOf( PropTypes.string ).isRequired
        , constrainingFacets: PropTypes.shape(
          { minLength: PropTypes.number
          , maxLength: PropTypes.number
          , pattern: PropTypes.string
          , whiteSpace: PropTypes.string
          , enumeration: PropTypes.arrayOf(PropTypes.String)
          , maxInclusive: PropTypes.string
          , maxExclusive: PropTypes.string
          , minInclusive: PropTypes.string
          , minExclusive: PropTypes.string
          , totalDigits: PropTypes.number
          , fractionDigits: PropTypes.number
          }).isRequired
        }).isRequired

  , propertyValues:
      PropTypes.shape(
        { values: PropTypes.arrayOf( PropTypes.string ).isRequired
        , propertyVerbs: PropTypes.arrayOf( PropTypes.string).isRequired
      }).isRequired

  , roleId: PropTypes.string

  , myroletype: PropTypes.string.isRequired

  , inputRef: PropTypes.any

  , disabled: PropTypes.bool.isRequired

  , isselected: PropTypes.bool.isRequired
  };
