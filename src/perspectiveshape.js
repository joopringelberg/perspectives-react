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

// The shape of structures sent from the PDR, describing screens and perspectives.

const PropTypes = require("prop-types");

export const serialisedProperty =
  PropTypes.shape(
    { id: PropTypes.string.isRequired
    , displayName: PropTypes.string.isRequired
    , isFunctional: PropTypes.bool.isRequired
    , isMandatory: PropTypes.bool.isRequired
    , isCalculated: PropTypes.bool.isRequired
    , range: PropTypes.string.isRequired
    , constrainingFacets: PropTypes.shape(
      { minLength: PropTypes.number
      , maxLength: PropTypes.number
      , pattern: PropTypes.shape(
        { regex: PropTypes.string.isRequired
        , label: PropTypes.string.isRequired}
      )
      , whiteSpace: PropTypes.string
      , enumeration: PropTypes.arrayOf(PropTypes.string)
      , maxInclusive: PropTypes.string
      , maxExclusive: PropTypes.string
      , minInclusive: PropTypes.string
      , minExclusive: PropTypes.string
      , totalDigits: PropTypes.number
      , fractionDigits: PropTypes.number
      }).isRequired
    });

export const propertyValues =
  PropTypes.shape(
    { values: PropTypes.arrayOf( PropTypes.string ).isRequired
    , propertyVerbs: PropTypes.arrayOf( PropTypes.string).isRequired
  });

export const roleinstancewithprops = PropTypes.shape(
  { roleId: PropTypes.string
  , objectStateBasedRoleVerbs: PropTypes.arrayOf(PropTypes.string)
  // // keys are the string representation of PropertyType,
  // // so this map can be read as one from PropertyType to PropertyVerbs, too.
  , propertyValues: PropTypes.objectOf(
    // ValuesWithVerbs
    PropTypes.shape(
      { values: PropTypes.arrayOf (PropTypes.string)
      , propertyVerbs: PropTypes.arrayOf (PropTypes.string)
      }))
  , actions: PropTypes.arrayOf(PropTypes.string)
  // This member is not needed on the client side, but we need it to
  // compile a complete list of SerialisedProperties.
  , objectStateBasedProperties: PropTypes.arrayOf(PropTypes.string)
  });

export const SerialisedPerspective =
  {
  ////
  //// Type level properties
  ////
  id: PropTypes.string.isRequired
  , displayName: PropTypes.string.isRequired
  , isFunctional: PropTypes.bool.isRequired
  , isMandatory: PropTypes.bool.isRequired
  , isCalculated: PropTypes.bool.isRequired
  // The RoleType having the Perspective.
  , userRoleType: PropTypes.string.isRequired
  // The RoleType of the object of the Perspective.
  , roleType: /*OPTIONAL*/ PropTypes.string
  , roleKind: /*OPTIONAL*/ PropTypes.string
  , contextType: PropTypes.string
  , contextTypesToCreate: PropTypes.arrayOf(PropTypes.string)
  , identifyingProperty: PropTypes.string.isRequired
  ////
  //// Instance properties
  ////
  , contextInstance: PropTypes.string.isRequired
  , roleInstances: PropTypes.objectOf(roleinstancewithprops)
  ////
  //// State dependent properties
  ////
  , verbs: PropTypes.arrayOf(PropTypes.string)
  // All properties that are available given Context and Subject state,
  // unified with all properties that are available given the Object states of
  // instances. In a table, we should create a column for each.
  , properties: PropTypes.objectOf(serialisedProperty)
  , actions: PropTypes.arrayOf(PropTypes.string)
};

export const WidgetCommonFields =
  { title: PropTypes.string.isRequired
  , perspective: PropTypes.shape( SerialisedPerspective ).isRequired
};

export const ScreenElementDef =
  { row: /*OPTIONAL*/     PropTypes.arrayOf( PropTypes.object ) // ScreenElementDef
  , column: /*OPTIONAL*/  PropTypes.arrayOf( PropTypes.object )
  , table: /*OPTIONAL*/   PropTypes.shape(WidgetCommonFields)
  , form: /*OPTIONAL*/    PropTypes.shape(WidgetCommonFields)
};

export const TabDef =
  { title: PropTypes.string.isRequired
  , elements: PropTypes.arrayOf(ScreenElementDef).isRequired
};

export const ScreenDefinition =
  { title: PropTypes.string.isRequired
  , tabs: /*OPTIONAL*/    PropTypes.arrayOf(TabDef)
  , rows: /*OPTIONAL*/    PropTypes.arrayOf(ScreenElementDef)
  , columns: /*OPTIONAL*/ PropTypes.arrayOf(ScreenElementDef)
};

