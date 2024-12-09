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

import * as Behaviours from "./cardbehaviour.js";

// Maps the role verbs in the perspective to an array of behaviours.
export default function mapRoleVerbsToBehaviours(perspective)
{
  function mapRoleVerb(verb)
  {
    switch (verb)
    {
      case "RemoveContext":
        return Behaviours.addRemoveContext;
      case "Remove":
      case "Delete":
        return Behaviours.addRemoveRoleFromContext;
      case "Fill":
        return Behaviours.addFillWithRole;
      case "Unbind":
        return Behaviours.addRemoveFiller;
      case "RemoveFiller":
        return Behaviours.addRemoveFiller;
      // There is no behaviour on the role that matches Create, CreateAndFill and Move.
      // We return addFillARole as default because it must be added anyway and we have
      // to return a value from this function.
      default:
        return Behaviours.addFillARole;
    }
  }
  if (perspective)
  {
    return [...new Set( perspective.verbs.map( mapRoleVerb ) )].concat(
      [Behaviours.addOpenContextOrRoleForm, Behaviours.addFillARole]);
  }
  else
  {
    return [];
  }
}
