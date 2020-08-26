const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;
const PerspectivesComponent = require("./perspectivescomponent.js");
import {PSRoleInstances, PSContext} from "./reactcontexts";

class RoleInstances extends PerspectivesComponent
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
                    component.setState( function( oldState )
                      {
                        let nextCursor;
                        if ( rolIdArr.indexOf(oldState.cursor) < 0 )
                        {
                          nextCursor = nextCursor = rolIdArr[0];;
                        }
                        else {
                          nextCursor = oldState.cursor;
                        }
                        return  { contextinstance: component.context.contextinstance
                                , contexttype: component.context.contexttype
                                , rol: component.props.rol
                                , roltype: rolType
                                , instances: rolIdArr.sort()
                                , cursor: nextCursor
                                , setcursor: function(cr)
                                  {
                                    component.setState( {cursor: cr} );
                                  }
                                };
                      }
                    )
                  }
              ))
            }
        ))
      });
  }

  render ()
  {
    const component = this;
    if (component.stateIsComplete())
    {
      return (<PSRoleInstances.Provider value={component.state}>
        {component.props.children}
        </PSRoleInstances.Provider>)
    }
    else return null;
  }
}

RoleInstances.contextType = PSContext;

RoleInstances.propTypes = {};

// Rol_ passes on through PSRol_:
// contextinstance
// contexttype
// rol
// roltype
// instances

module.exports = RoleInstances;
