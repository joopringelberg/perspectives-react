const PropTypes = require("prop-types");

import RoleInstanceIterator from "./roleinstanceiterator.js";
import RoleInstances from "./roleinstances.js";

export default function Rol(props)
{
  return (<RoleInstances rol={props.rol}>
      <RoleInstanceIterator>{props.children}</RoleInstanceIterator>
    </RoleInstances>)
}

Rol.propTypes = { "rol": PropTypes.string.isRequired };
