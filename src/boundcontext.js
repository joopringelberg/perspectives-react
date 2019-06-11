const React = require("react"); 
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;
const PerspectivesComponent = require("./perspectivescomponent.js");
const RolBinding = require("./rolbinding.js");
const ContextOfRole = require("./contextofrole.js");

function BoundContext(props)
{
  return (<RolBinding>
      <ContextOfRole>{props.children}</ContextOfRole>
    </RolBinding>);
}

// BoundContext passes on the PSContext that comes from ContextOfRole:

module.exports = BoundContext;
