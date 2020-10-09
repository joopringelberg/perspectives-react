const React = require("react");

import PerspectivesComponent from "./perspectivescomponent.js";

import {PSRoleInstances} from "./reactcontexts";

import RoleInstances from "./roleinstances.js";

import RoleInstanceIterator from "./roleinstanceiterator.js"

const PropTypes = require("prop-types");

////////////////////////////////////////////////////////////////////////////////
// CARDLIST
////////////////////////////////////////////////////////////////////////////////
export default function CardList (props)
{
  return (<RoleInstances rol={props.rol}>
      <RoleInstanceIterator>{props.children}</RoleInstanceIterator>
    </RoleInstances>)
}

CardList.propTypes = { "rol": PropTypes.string.isRequired };
