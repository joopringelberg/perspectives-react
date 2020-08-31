const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;
import PerspectivesComponent from "./perspectivescomponent.js";
import RolBinding from "./rolbinding.js";
import ContextOfRole from "./contextofrole.js";

export default function BoundContext(props)
{
  return (<RolBinding>
      <ContextOfRole>{props.children}</ContextOfRole>
    </RolBinding>);
}

// BoundContext passes on the PSContext that comes from ContextOfRole:
