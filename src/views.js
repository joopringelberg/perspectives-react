const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;
const PerspectivesComponent = require("./perspectivescomponent.js");
const RolBinding = require("./rolbinding.js");
const View = require("./view.js");
const ContextOfRole = require("./contextofrole.js");
const ExternalRole = require("./externalrole.js");
const InternalRole = require("./internalrole.js");

// Access a View on the BuitenRol bound to a Rol of the surrounding context.
function ExternalViewOfBoundContext(props)
{
  return (<RolBinding>
    <View viewname={props.viewname}>{props.children}</View>
  </RolBinding>);
}

ExternalViewOfBoundContext.propTypes = {
  viewname: PropTypes.string.isRequired
};

// Access a View on the BinnenRol bound to a Rol of the surrounding context.
function InternalViewOfBoundContext(props)
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
function ViewOnExternalRole(props)
{
  return (<ExternalRole>
      <View viewname={props.viewname}>{props.children}</View>
    </ExternalRole>)
}

ViewOnExternalRole.propTypes = {
  viewname: PropTypes.string.isRequired
};

// Access a View on the BinnenRol of a Context.
function ViewOnInternalRole(props)
{
  return (<InternalRole>
      <View viewname={props.viewname}>{props.children}</View>
    </InternalRole>)
}

ViewOnInternalRole.propTypes = {
  viewname: PropTypes.string.isRequired
};

module.exports =
  {
    ExternalViewOfBoundContext: ExternalViewOfBoundContext,
    InternalViewOfBoundContext: InternalViewOfBoundContext,
    ViewOnExternalRole: ViewOnExternalRole,
    ViewOnInternalRole: ViewOnInternalRole
  }
