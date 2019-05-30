const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;
const PerspectivesComponent = require("./perspectivescomponent.js");
const RolBinding = require("./rolbinding.js").RolBinding;
const ContextOfRole = require("./contextofrole.js").ContextOfRole;

function BoundContext(props)
{
  return (<RolBinding rolname={props.rolname}>
      <ContextOfRole></ContextOfRole>
    </RolBinding>);
}

BoundContext.propTypes = {
  rolinstance: PropTypes.string,
  rolname: PropTypes.string
}

// BoundContext passes on:
// contextinstance
// namespace

module.exports = BoundContext;
