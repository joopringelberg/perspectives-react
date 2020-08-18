const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;
const PerspectivesComponent = require("./perspectivescomponent.js");
import {PSRol, PSRole_, PSRolBinding} from "./reactcontexts";

class RoleInstanceIterator extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
    const component = this;
    component.state.bindRol = undefined;
    component.state.checkBinding = undefined;
    component.state.instances = undefined;
  }

  componentDidMount ()
  {
    const component = this;
    // Add a function to bind a role in a new instance of component.context.rol.
    const updater = {
      // Can be applied to a PSRol context.
      bindRol: function({rolinstance})
      {
        if (rolinstance)
        {
          // checkBinding( typeOfRolToBindTo, valueToBind )
          Perspectives.then(
            function (pproxy)
            {
              pproxy.checkBinding(
                component.context.contexttype,
                component.context.rol, // component.context.roltype ??
                rolinstance,
                function(psbool)
                {
                  if ( psbool[0] === "true" )
                  {
                    // We use 'createRolWithLocalName' rather than 'bindInNewRol' because we only have the local rol name, not its qualified name.
                    pproxy.createRolWithLocalName(
                      component.context.contextinstance,
                      component.context.rol,
                      component.context.contexttype,
                      {properties: {}, binding: rolinstance},
                      function( rolId ){});
                  }
                  else
                  {
                    alert("Cannot bind!")
                  }
                });
          });
        }
      },
      // Can be applied to a PSRol context.
      checkBinding: function({rolinstance}, callback)
        {
          Perspectives.then(
            function (pproxy)
            {
              // checkBinding( typeOfRolToBindTo, valueToBind )
              pproxy.checkBinding(
                component.context.contexttype,
                component.context.rol,
                rolinstance,
                function(psbool)
                {
                  if ( psbool[0] === "true" )
                  {
                    callback();
                  }
                });
            });
        },
      instances: component.context.instances
    }
    component.context.instances.forEach(
      function( rolInstance )
      {
        updater[rolInstance] =
          { contextinstance: component.context.contextinstance
          , contexttype: component.context.contexttype
          , rolinstance: rolInstance
          , roltype: component.context.roltype
          , removeRol: function()
            {
              Perspectives.then(
                function (pproxy)
                {
                  pproxy.removeRol( component.context.contextinstance, component.context.roltype, rolInstance)
                });
            }
          }
      });
      component.setState(updater);

  }

  render ()
  {
    const component = this;
    let defaultElement, children, rolBindingContext;
    if (component.stateIsComplete())
    {
      if (React.Children.count( component.props.children ) == 1)
      {
        children = component.props.children
      }
      else
      {
        children = React.Children.toArray( component.props.children );
        defaultElement = children[0];
        children = children.slice(1);
      }
      if (component.context.instances.length == 0 )
      {
        if (defaultElement)
        {
          rolBindingContext =
            { contextinstance: component.context.contextinstance
            , contexttype: component.context.contexttype
            , bindrol: component.state.bindRol
            , checkbinding: component.state.checkBinding
          }
          return (<PSRolBinding.Provider value={rolBindingContext}>{defaultElement}</PSRolBinding.Provider>);
        }
        else
        {
          return null;
        }
      }
      else
      {
        return component.context.instances.map(
          function( rolInstance )
          {
            return (<PSRol.Provider key={rolInstance} value={component.state[rolInstance]}>
              {children}
              </PSRol.Provider>)
          }
        );
      }
    }
    else
    {
      return null;
    }
  }
}

RoleInstanceIterator.contextType = PSRole_;

RoleInstanceIterator.propTypes = {};

// Rol passes on through PSRol:
// contextinstance
// contexttype
// roltype
// rolinstance

module.exports = RoleInstanceIterator;
