const React = require("react");
const PropTypes = require("prop-types");
const PDRproxy = require("perspectives-proxy").PDRproxy;

import PerspectivesComponent from "./perspectivescomponent.js";
import {PSRol, PSContext} from "./reactcontexts";

export default function CreateContextInExistingRol(props)
{
  return <PSContext.Consumer>{ pscontext => <CreateContextInExistingRol_
        contextname={props.contextname}
        myroletype={pscontext.myroletype}
      >{props.children}</CreateContextInExistingRol_> }</PSContext.Consumer>
}

class CreateContextInExistingRol_ extends PerspectivesComponent
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

    PDRproxy.then(
      function(pproxy)
      {
        const component = this;
        pproxy.createContext(
          defaultContextDescription,
          component.props.myroletype,
          // [<externalRoleId>(, <contextRoleId>)?]
          function( contextAndExternalRole )
          {
            pproxy.setBinding( component.context.rolinstance, contextAndExternalRole[0], component.props.myroletype );
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

CreateContextInExistingRol_.contextType = PSRol;

CreateContextInExistingRol_.propTypes = {
  contextname: PropTypes.string.isRequired, // fully qualified name
  myroletype: PropTypes.string.isRequired
};

// CreateContext passes on:
// create
