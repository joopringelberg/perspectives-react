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

import {string, bool, shape, number, arrayOf, objectOf, object} from "prop-types";

export const serialisedProperty =
  shape(
    { id: string.isRequired
    , displayName: string.isRequired
    , isFunctional: bool.isRequired
    , isMandatory: bool.isRequired
    , isCalculated: bool.isRequired
    , range: string.isRequired
    , constrainingFacets: shape(
      { minLength: number
      , maxLength: number
      , pattern: shape(
        { regex: string.isRequired
        , label: string.isRequired}
      )
      , whiteSpace: string
      , enumeration: arrayOf(string)
      , maxInclusive: string
      , maxExclusive: string
      , minInclusive: string
      , minExclusive: string
      , totalDigits: number
      , fractionDigits: number
      }).isRequired
    });

export const propertyValues =
  shape(
    { values: arrayOf( string ).isRequired
    , propertyVerbs: arrayOf( string).isRequired
  });

export const roleinstancewithprops = shape(
  { roleId: string
  , objectStateBasedRoleVerbs: arrayOf(string)
  // // keys are the string representation of PropertyType,
  // // so this map can be read as one from PropertyType to PropertyVerbs, too.
  , propertyValues: objectOf(
    // ValuesWithVerbs
    shape(
      { values: arrayOf (string)
      , propertyVerbs: arrayOf (string)
      }))
  , actions: objectOf(string)
  // This member is not needed on the client side, but we need it to
  // compile a complete list of SerialisedProperties.
  , objectStateBasedProperties: arrayOf(shape(
      { type: string.isRequired
      , value: string.isRequired
      }))
  , publicUrl: string
  , filler : string
  });

export const SerialisedPerspective =
  {
  ////
  //// Type level properties
  ////
  id: string.isRequired
  , displayName: string.isRequired
  , isFunctional: bool.isRequired
  , isMandatory: bool.isRequired
  , isCalculated: bool.isRequired
  // The RoleType having the Perspective.
  , userRoleType: string.isRequired
  // The RoleType of the object of the Perspective.
  , roleType: /*OPTIONAL*/ string
  , roleKind: /*OPTIONAL*/ string
  , contextType: string
  , contextIdToAddRoleInstanceTo: string
  , contextTypesToCreate: objectOf(string)
  , identifyingProperty: string.isRequired
  ////
  //// Instance properties
  ////
  , contextInstance: string.isRequired
  , roleInstances: objectOf(roleinstancewithprops)
  ////
  //// State dependent properties
  ////
  , verbs: arrayOf(string)
  // All properties that are available given Context and Subject state,
  // unified with all properties that are available given the Object states of
  // instances. In a table, we should create a column for each.
  , properties: objectOf(serialisedProperty)
  , actions: objectOf(string)
};

// Note we have a forward reference problem here if we try to define and use RowDef and ColumnDef.

export const WidgetCommonFields = shape(
  { title: string.isRequired
  , perspective: shape( SerialisedPerspective ).isRequired
});

export const ScreenElementDef = shape(
  { row: /*OPTIONAL*/     arrayOf( object ) // ScreenElementDef
  , column: /*OPTIONAL*/  arrayOf( object )
  , table: /*OPTIONAL*/   shape(WidgetCommonFields)
  , form: /*OPTIONAL*/    shape(WidgetCommonFields)
  , markDown: /*OPTIONAL*/object
  , chat: /*OPTIONAL*/    shape(
    { chatRole: string.isRequired
    , chatInstance: string
    , messagesProperty: string.isRequired
    , mediaProperty: string.isRequired
    }
  )
  , 
  // , MarkDownElementD MarkDownDef
});

export const TabDef = shape(
  { title: string.isRequired
  , elements: arrayOf(ScreenElementDef).isRequired
});

export const ScreenDefinition = shape(
  { title: string.isRequired
  , tabs: /*OPTIONAL*/    arrayOf(TabDef)
  , rows: /*OPTIONAL*/    arrayOf(ScreenElementDef)
  , columns: /*OPTIONAL*/ arrayOf(ScreenElementDef)
});

export const RoleData =
  { addedBehaviour: arrayOf(string)
    , myroletype: string
    , roleData:
      { rolinstance: string
      , cardTitle: string
      , roleType: string
      , contextType: string
      }
  };

export const PerspectivesFileShape = 
  { fileName: string.isRequired                 // The name associated with the file on creating or uploading it. Use only client side.
  , propertyType: string.isRequired             // The identifier of the attachment of the role instance.
  , mimeType: string.isRequired                 // The property holding the PerspectivesFile.
  , database: String                            // The database where the role instance is stored (is Nothing for IndexedDB).
  , roleFileName: string.isRequired             // The name of the role instance document. 
  }
