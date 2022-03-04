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
//
// type RoleInstanceWithProperties =
// { roleId :: String
// , objectStateBasedRoleVerbs :: Array String
// , objectStateBasedSerialisedProperties :: Object SerialisedProperty
//      Notice that the keys of this object are property types!
// , propertyValues :: Object ValuesWithVerbs
// , actions :: Array String
// }
//
// The verbs in this type contain both those based on context- and subject state,
// and those based on object state.
//
// type ValuesWithVerbs =
//   { values :: Array String
//   , propertyVerbs :: Array String
//   }
//
// type SerialisedProperty =
//   { id :: String
//   , displayName :: String
//   , isFunctional :: Boolean
//   , isMandatory :: Boolean
//   , isCalculated :: Boolean
//   , range :: String
//   , verbs :: Array String
//   }

const React = require("react");
const Component = React.PureComponent;
const PDRproxy = require("perspectives-proxy").PDRproxy;
import
  { Form
  } from "react-bootstrap";
const PropTypes = require("prop-types");

export default class SmartFieldControl extends Component
{
  constructor(props)
  {
    super(props);
    this.state = {value: this.originalValue()};
  }

  originalValue()
  {
    return this.props.propertyValues ? this.props.propertyValues.values : "";
  }

  componentDidUpdate(prevProps)
  {
    if (prevProps.propertyValues != this.props.propertyValues)
    {
      this.setState({value: this.props.propertyValues ? this.props.propertyValues.values : ""});
    }
  }

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
    }
  }

  changeValue (val)
  {
    const component = this;
    const oldValue = component.state.value;
    if ( Array.isArray( val ) )
    {
      throw "Perspectives-react, View: supply a single string value to the function 'setvalue'.";
    }
    if (
        !oldValue ||
        oldValue.length == 0 ||
        oldValue[0] != val
    )
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

  handleKeyDown (event, newvalue)
  {
    const component = this;
    if (!component.isDisabled())
    {
      switch( event.keyCode )
      {
        // Safe on leaving the cell, allow event to bubble.
        case 37: // left arrow. Allow to bubble when at position 0.
          if (event.target.selectionStart != 0)
          {
            event.stopPropagation();
          }
          else
          {
            component.changeValue(newvalue);
          }
          break;
        case 39: // right arrow. Allow to bubble when at the end.
          if (event.target.selectionStart < event.target.value.length)
          {
            event.stopPropagation();
          }
          else
          {
            component.changeValue(newvalue);
          }
          break;
        case 38: // Up arrow
        case 40: // Down arrow
        case 9:  // Horizontal Tab.
        case 11: // Vertical Tab.
        case 13: // Return
          component.changeValue(newvalue);
          break;
        case 27: // Escape
          component.setState( {value: component.originalValue()});
          event.preventDefault();
          break;
      }
    }
  }

  isDisabled()
  {
    return !this.props.propertyValues || this.props.disabled;
  }

  render()
  {
    const component = this;
    const controlType = component.mapRange( component.props.serialisedProperty.range );
    switch ( controlType ){
      case "checkbox":
        return (
          <div onKeyDown={e => component.handleKeyDown(e, e.target.checked.toString())}>
            <Form.Check
              ref= { component.props.inputRef}
              aria-label={ component.props.serialisedProperty.displayName }
              readOnly={ component.isDisabled() }
              value={ component.state.value }
              onChange={e => component.setState({value: e.target.value}) }
              onBlur={e => component.changeValue(e.target.checked.toString())}
            />
          </div>
);
      default:
        return (
          <div onKeyDown={e => component.handleKeyDown(e, e.target.value)}>
            <Form.Control
              ref= { component.props.inputRef}
              aria-label={ component.props.serialisedProperty.displayName }
              readOnly={ component.isDisabled() }
              value={ component.state.value }
              onChange={e => component.setState({value: e.target.value}) }
              onBlur={e => component.changeValue(e.target.value)}
              type={controlType}
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
        }).isRequired

  , propertyValues:
      PropTypes.shape(
        { values: PropTypes.arrayOf( PropTypes.string ).isRequired
        , propertyVerbs: PropTypes.arrayOf( PropTypes.string).isRequired
        })

  , roleId: PropTypes.string

  , myroletype: PropTypes.string.isRequired

  , inputRef: PropTypes.any

  , disabled: PropTypes.bool.isRequired
  };
