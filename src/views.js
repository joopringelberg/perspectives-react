const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;
const PerspectivesComponent = require("./perspectivescomponent.js");
const RolBinding = require("./rolbinding.js").RolBinding;
const View = require("./view.js").View;
const ContextOfRole = require("./views.js").ContextOfRole;
const ExternalRole = require("./views.js").ExternalRole;
const InternalRole = require("./views.js").InternalRole;

// Access a View on the BuitenRol bound to a Rol of the surrounding context.
function ExternalViewOfBoundContext(props)
{
  return (<RolBinding rolname={props.rolname} rolinstance={props.rolinstance}>
    <View viewname={props.viewname}>{props.children}</View>
  </RolBinding>);
}

ExternalViewOfBoundContext.propTypes = {
  rolname: PropTypes.string.isRequired,
  viewname: PropTypes.string.isRequired,
  rolinstance: PropTypes.string
};

// Access a View on the BinnenRol bound to a Rol of the surrounding context.
function InternalViewOfBoundContext(props)
{
  return (<RolBinding rolname={props.rolname} rolinstance={props.rolinstance}>
    <ContextOfRole>
      <ViewOnInternalRole viewname={props.viewname}>{props.children}</ViewOnInternalRole>
    </ContextOfRole>
  </RolBinding>);
}

InternalViewOfBoundContext.propTypes = {
  rolname: PropTypes.string.isRequired,
  rolinstance: PropTypes.string,
  viewname: PropTypes.string.isRequired
};

// Access a View on the BuitenRol of a Context.
function ViewOnExternalRole(props)
{
  return (<ExternalRole contextinstance={props.contextinstance} namespace={props.namespace}>
      <View viewname={props.viewname}>{props.children}</View>
    </ExternalRole>)
}

ViewOnExternalRole.propTypes = {
  contextinstance: PropTypes.string,
  namespace: PropTypes.string,
  viewname: PropTypes.string.isRequired
};

// Access a View on the BinnenRol of a Context.
function ViewOnInternalRole(props)
{
  return (<InternalRole contextinstance={props.contextinstance} namespace={props.namespace}>
      <View viewname={props.viewname}>{props.children}</View>
    </InternalRole>)
}

ViewOnInternalRole.propTypes = {
  contextinstance: PropTypes.string,
  namespace: PropTypes.string,
  viewname: PropTypes.string.isRequired
};

module.exports =
  {
    ExternalViewOfBoundContext: ExternalViewOfBoundContext,
    InternalViewOfBoundContext: InternalViewOfBoundContext,
    ViewOnExternalRole: ViewOnExternalRole,
    ViewOnInternalRole: ViewOnInternalRole
  }
