const PropTypes = require("prop-types");
const RoleInstanceIterator = require("./roleinstanceiterator.js");
const RoleInstances = require("./roleinstances.js");

function Rol(props)
{
  return (<RoleInstances rol={props.rol}>
      <RoleInstanceIterator>{props.children}</RoleInstanceIterator>
    </RoleInstances>)
}

Rol.propTypes = { "rol": PropTypes.string.isRequired };

module.exports = Rol;
