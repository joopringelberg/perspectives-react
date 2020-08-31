const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;

import PerspectivesComponent from "./perspectivescomponent.js";
import {PSRol} from "./reactcontexts";

export default class CreateContextInExistingRol extends PerspectivesComponent
{
  create (contextDescription)
  {
    const component = this;
    const defaultContextDescription = {
      id: "", // will be set in the core.
      prototype : undefined,
      ctype: component.props.contextname,
      rollen: {},
      interneProperties: {},
      externeProperties: {}
    };
    // Move all properties to the default context description to ensure we send a complete description.
    Object.assign(contextDescription, defaultContextDescription);

    Perspectives.then(
      function(pproxy)
      {
        const component = this;
        pproxy.createContext(
          defaultContextDescription,
          function( buitenRolId )
          {
            pproxy.setBinding( component.context.rolinstance, buitenRolId[0] );
          });
      });
  }

  // Render! props.children contains the nested elements that provide input controls.
  // These should be provided these props:
  //  - create
  render ()
  {
    const component = this;

    function cloneChild (child)
    {
      return React.cloneElement(
        child,
        {
          create: function(contextDescription)
          {
            component.create(contextDescription);
          }
        });
    }

    if (Array.isArray(component.props.children))
    {
      return React.Children.map(
        component.props.children,
        cloneChild);
    }
    else
    {
      return cloneChild(component.props.children);
    }
  }
}

CreateContextInExistingRol.contextType = PSRol;

CreateContextInExistingRol.propTypes = {
  contextname: PropTypes.string.isRequired // fully qualified name
};

// CreateContext passes on:
// create
