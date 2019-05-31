const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;
const PerspectivesComponent = require("./perspectivescomponent.js");
import {PSContext} from "./reactcontexts";

class CreateContext extends PerspectivesComponent
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
    Object.assign(defaultContextDescription, contextDescription);

    Perspectives.then(
      function(pproxy)
      {
        pproxy.createContext(
          defaultContextDescription,
          function( buitenRolId )
          {
            pproxy.createRolWithLocalName(
              component.context.contextinstance,
              component.props.rolname,
              component.context.contexttype,
              {properties: {}},
              function( rolId )
              {
                pproxy.setBinding( rolId[0], buitenRolId[0] );
              });
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

CreateContext.contextType = PSContext;

CreateContext.propTypes = {
  contextname: PropTypes.string.isRequired, // fully qualified name
  rolname: PropTypes.string.isRequired // local name
};

// CreateContext passes on:
// create

module.exports = CreateContext;
