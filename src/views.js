const React = require("react");
const PropTypes = require("prop-types");

import View from "./view.js";
import ExternalRole from "./externalrole.js";

// Access a View on the BuitenRol of a Context.
export function ViewOnExternalRole(props)
{
  return (<ExternalRole>
      <View viewname={props.viewname}>{props.children}</View>
    </ExternalRole>);
}

ViewOnExternalRole.propTypes = {
  viewname: PropTypes.string.isRequired
};
