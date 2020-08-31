const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;
import PerspectivesComponent from "./perspectivescomponent.js";

import RolBinding from "./rolbinding.js";
import View from "./view.js";
import ContextOfRole from "./contextofrole.js";
import ExternalRole from "./externalrole.js";

// Access a View on the BuitenRol bound to a Rol of the surrounding context.
export function ExternalViewOfBoundContext(props)
{
  return (<RolBinding>
    <View viewname={props.viewname}>{props.children}</View>
  </RolBinding>);
}

ExternalViewOfBoundContext.propTypes = {
  viewname: PropTypes.string.isRequired
};

// Access a View on the BinnenRol bound to a Rol of the surrounding context.
export function InternalViewOfBoundContext(props)
{
  return (
    <RolBinding>
      <ContextOfRole>
        <ViewOnInternalRole viewname={props.viewname}>{props.children}</ViewOnInternalRole>
      </ContextOfRole>
    </RolBinding>);
}

InternalViewOfBoundContext.propTypes = {
  viewname: PropTypes.string.isRequired
};

// Access a View on the BuitenRol of a Context.
export function ViewOnExternalRole(props)
{
  return (<ExternalRole>
      <View viewname={props.viewname}>{props.children}</View>
    </ExternalRole>)
}

ViewOnExternalRole.propTypes = {
  viewname: PropTypes.string.isRequired
};
