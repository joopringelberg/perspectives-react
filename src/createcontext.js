const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;
const PerspectivesComponent = require("./perspectivescomponent.js");
import {PSContext} from "./reactcontexts";

class CreateContext extends PerspectivesComponent
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
      function (resolve, reject)
      {
        resolver = resolve;
      });
    // Move all properties to the default context description to ensure we send a complete description.
    Object.assign(defaultContextDescription, contextDescription);

    Perspectives.then(
      function(pproxy)
      {
        pproxy.createContext(
          defaultContextDescription,
          function( buitenRolId )
          {
            // Don't try to bind the context in a new role if props.donotbind is true!
            // By default, this attribute is not given, hence undefined, hence the condition succeeds and
            // the new context will be bound to a role.
            if (!component.props.donotbind)
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
            }
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

CreateContext.contextType = PSContext;

CreateContext.propTypes = {
  contextname: PropTypes.string.isRequired, // fully qualified name
  rolname: PropTypes.string.isRequired, // local name
  donotbind: PropTypes.bool
};

// CreateContext passes on:
// create

module.exports = CreateContext;
