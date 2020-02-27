const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;
const PerspectivesComponent = require("./perspectivescomponent.js");
import {PSRol, PSContext} from "./reactcontexts";
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
    let children;
    if (component.state.instances.length == 0 )
    {
      return null;
    }
    else
    {
      return component.state.instances.map(
        function( rolInstance )
        {
          return (<PSRol.Provider key={rolInstance} value={component.state[rolInstance]}>
            {component.props.children}
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
