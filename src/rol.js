const RoleInstanceIterator = require("./roleinstanceiterator.js");
const Role_ = require("./role_.js");

function Rol(props)
{
  return (<Role_ rol={props.rol}>
      <RoleInstanceIterator>{props.children}</RoleInstanceIterator>
    </Role_>)
}

module.exports = Rol;
