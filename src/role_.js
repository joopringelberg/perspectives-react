const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;
const PerspectivesComponent = require("./perspectivescomponent.js");
import {PSRole_, PSContext} from "./reactcontexts";

class Role_ extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
    const component = this;
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
                    component.setState(
                      { contextinstance: component.context.contextinstance
                      , contexttype: component.context.contexttype
                      , rol: component.props.rol
                      , roltype: rolType
                      , instances: rolIdArr.sort()
                      });
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
    if (component.state.instances)
    {
      return (<PSRole_.Provider value={component.state}>
        {component.props.children}
        </PSRole_.Provider>)
    }
    else return null;
  }
}

Role_.contextType = PSContext;

Role_.propTypes = {};

// Rol_ passes on through PSRol_:
// contextinstance
// contexttype
// rol
// roltype
// instances

module.exports = Role_;
