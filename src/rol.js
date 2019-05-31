const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;
const PerspectivesComponent = require("./perspectivescomponent.js");
import {PSRol, PSContext} from "./reactcontexts";

class Rol extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
    const component = this;
    const rol = component.props.rol;
    component.state.instances = undefined;
  }

  componentDidMount ()
  {
    const component = this;
    let rolinstance
    Perspectives.then(
      function (pproxy)
      {
        component.addUnsubscriber(
          pproxy.getUnqualifiedRol(
            component.context.contextinstance,
            component.props.rol,
            function (rolIds)
            {
              // TODO. Hoe hanteer je verdwenen rollen?
              const anInstance = rolIds[0];
              if (anInstance)
              {
                // Now get the type for one of the rolIds.
                // TODO. Haal het type op vóór de instanties. Dan doe je het maar één keer.
                pproxy.getRolType(
                  anInstance,
                  function(rolTypeArr) // An array!
                  {
                    const rolType = rolTypeArr[0];
                    const updater = {
                      instances: rolIds
                    };
                    if (rolType)
                    {
                      rolIds.forEach(
                        function( rolInstance )
                        {
                          updater[rolInstance] =
                            { contextinstance: component.context.contextinstance
                            , contexttype: component.context.contexttype
                            , rolinstance: rolInstance
                            , roltype: rolType
                            }
                        });
                      component.setState(updater);
                    }
                  }
                );
              }
            }));
      });
  }

  render ()
  {
    const component = this;
    let children;

    if (component.stateIsComplete())
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
    else
    {
      return <div />;
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
