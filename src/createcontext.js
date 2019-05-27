const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;
const PerspectivesComponent = require("perspectivescomponent").PerspectivesComponent;

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
    Object.assign(contextDescription, defaultContextDescription);

    Perspectives.then(
      function(pproxy)
      {
        if ( component.props.rolinstance )
        {
          // Create a new Context and bind it in the existing rolinstance.
          pproxy.createContext(
            defaultContextDescription,
            function( buitenRolId )
            {
              pproxy.setBinding( component.props.rolinstance, buitenRolId[0] );
            });
        }
        else if ( component.props.contextinstance && component.props.rolname )
        {
          // Create a new Context and bind it in a new rolinstance.
          pproxy.createContext(
            defaultContextDescription,
            function( buitenRolId )
            {
              pproxy.createRol(
                component.props.contextinstance,
                // dit moet namespace zijn.
                component.props.namespace + "$" + component.props.rolname,
                {properties: {}},
                function( rolId )
                {
                  pproxy.setBinding( rolId[0], buitenRolId[0] );
                });
            });
        }
        else
        {
          // Create a new Context.
          pproxy.createContext(
            defaultContextDescription,
            function( buitenRolId ) {});
        }
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

CreateContext.propTypes = {
  contextinstance: PropTypes.string,
  contextname: PropTypes.string.isRequired,
  namespace: PropTypes.string,
  rolinstance: PropTypes.string,
  rolname: PropTypes.string
};

// CreateContext passes on:
// create

module.exports = {CreateContext: CreateContext};
