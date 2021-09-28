const React = require("react");
const PropTypes = require("prop-types");
const PDRproxy = require("perspectives-proxy").PDRproxy;

import PerspectivesComponent from "./perspectivescomponent.js";
import {PSRol} from "./reactcontexts";

export default class CreateContext_ extends PerspectivesComponent
{
  // This function returns a promise that will resolve to the identifier of the external role of the new context.
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
    var resolver;
    var p = new Promise(
      function (resolve/*, reject*/)
      {
        resolver = resolve;
      });
    // Move all properties to the default context description to ensure we send a complete description.
    Object.assign(defaultContextDescription, contextDescription);

    PDRproxy.then(
      function(pproxy)
      {
        pproxy.createContext_(
          defaultContextDescription,
          component.props.rolname, // local role name
          component.context.rolinstance,
          component.context.myroletype,
          // [<externalRoleId>(, <contextRoleId>)?]
          function( buitenRolId )
          {
            // Resolve the promise returned by calling create.
            resolver( buitenRolId[0] );
          });
      });
    return p;
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
            return component.create(contextDescription);
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

CreateContext_.contextType = PSRol;

CreateContext_.propTypes = {
  // fully qualified name: the type of Context to create.
  // The core loads the model that defines this type, if it is not locally available.
  contextname: PropTypes.string.isRequired
};

// CreateContext passes on:
// create
