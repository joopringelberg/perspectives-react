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

import React from "react";
const Component = React.PureComponent;
import
  { Row
  , Col
  , Form
  } from "react-bootstrap";
import PropTypes from "prop-types";
import SmartFieldControl from "./smartfieldcontrol.js";

export default class SmartFieldControlGroup extends Component
{
  constructor(props)
  {
    super(props);
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

  // The property is only consultable when it just has the verb Consult,
  // or when it is calculated. It will be shown disabled as a consequence.
  propertyOnlyConsultable()
  {
    if (this.props.propertyValues)
    {
      const propertyVerbs = this.props.propertyValues.propertyVerbs;
      const property = this.props.serialisedProperty;
      return (propertyVerbs.indexOf("Consult") > -1 
        && propertyVerbs.length == 1)
        || property.isCalculated;
    }
    else
    {
      return false;
    }
  }

  render()
  {
    const component = this;
    return (
      <Form.Group as={Row}>
        <Form.Label
          column
          sm="3">
          { component.props.serialisedProperty.displayName }
        </Form.Label>
        <Col sm="9">
          <SmartFieldControl
            serialisedProperty = { component.props.serialisedProperty }
            propertyValues = { component.props.propertyValues }
            roleId = { component.props.roleId }
            myroletype = { component.props.myroletype }
            disabled={ component.propertyOnlyConsultable() || !component.props.roleId }
            isselected={true}
          />
        </Col>
      </Form.Group>);
    }
}

SmartFieldControlGroup.propTypes =
  { serialisedProperty:
      PropTypes.shape(
        { id: PropTypes.string.isRequired
        , displayName: PropTypes.string.isRequired
        , isFunctional: PropTypes.bool.isRequired
        , isMandatory: PropTypes.bool.isRequired
        , isCalculated: PropTypes.bool.isRequired
        , range: PropTypes.string.isRequired
        }).isRequired
  // This member is not required, because the state of the role instance
  // may not allow this property.
  , propertyValues:
      PropTypes.shape(
        { values: PropTypes.arrayOf( PropTypes.string ).isRequired
        , propertyVerbs: PropTypes.arrayOf( PropTypes.string).isRequired
      })

  , roleId: PropTypes.string

  , myroletype: PropTypes.string.isRequired
  };
