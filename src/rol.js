const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;
const PerspectivesComponent = require("./perspectivescomponent.js");
import {PSRol, PSContext, PSRolBinding} from "./reactcontexts";
// Force build 1.
class Rol extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
    const component = this;
    component.state.instances = [];
  }

  componentDidMount ()
  {
    const component = this;
    let rolinstance
    Perspectives.then(
      function (pproxy)
      {
        // Add a function to bind a role in a new instance of component.props.rol.
        const updater = {
          // Can be applied to a PSRol context.
          bindRol: function({rolinstance})
          {
            if (rolinstance)
            {
              // checkBinding( typeOfRolToBindTo, valueToBind )
              pproxy.checkBinding(
                component.context.contexttype,
                component.props.rol,
                rolinstance,
                function(psbool)
                {
                  if ( psbool[0] === "true" )
                  {
                    // We use 'createRolWithLocalName' rather than 'bindInNewRol' because we only have the local rol name, not its qualified name.
                    pproxy.createRolWithLocalName(
                      component.context.contextinstance,
                      component.props.rol,
                      component.context.contexttype,
                      {properties: {}, binding: rolinstance},
                      function( rolId ){});
                  }
                  else
                  {
                    alert("Cannot bind!")
                  }
                });
            }
          },
          // Can be applied to a PSRol context.
          checkBinding: function({rolinstance}, callback)
            {
              // checkBinding( typeOfRolToBindTo, valueToBind )
              pproxy.checkBinding(
                component.context.contexttype,
                component.props.rol,
                rolinstance,
                function(psbool)
                {
                  if ( psbool[0] === "true" )
                  {
                    callback();
                  }
                });
            }
        }
        component.setState(updater);

        component.addUnsubscriber(
          pproxy.getUnqualifiedRolType(
            component.context.contexttype,
            component.props.rol,
            function(rolTypeArr)
            {
              const rolType = rolTypeArr[0];
              if (!rolType)
              {
                throw("Rol: could not establish qualified name of Rol '" + component.props.rol + "' for Context '" + component.context.contexttype + "'.");
              }
              // TODO. Voeg bindRol en checkBinding hier toe, maar dan met de gekwalificeerde rolnaam. ja.
              component.addUnsubscriber(
                pproxy.getRol(
                  component.context.contextinstance,
                  rolType,
                  function(rolIdArr)
                  {
                    const updater = {
                      instances: rolIdArr.sort()
                    };
                    rolIdArr.forEach(
                      function( rolInstance )
                      {
                        updater[rolInstance] =
                          { contextinstance: component.context.contextinstance
                          , contexttype: component.context.contexttype
                          , rolinstance: rolInstance
                          , roltype: rolType
                          , removeRol: function()
                            {
                              pproxy.removeRol( component.context.contextinstance, rolType, rolInstance)
                            }
                          }
                      });
                    component.setState(updater);
                  }
                )
              );
            }
          )
        );
      });
  }

  render ()
  {
    const component = this;
    let defaultElement, children, rolBindingContext;
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
    if (component.state.instances.length == 0 )
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
      return component.state.instances.map(
        function( rolInstance )
        {
          return (<PSRol.Provider key={rolInstance} value={component.state[rolInstance]}>
            {children}
            </PSRol.Provider>)
        }
      );
    }
  }
}

Rol.contextType = PSContext;

Rol.propTypes = {};

// Rol passes on through PSRol:
// contextinstance
// contexttype
// rolinstance
// roltype

module.exports = Rol;
