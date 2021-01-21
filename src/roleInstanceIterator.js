const React = require("react");
const PDRproxy = require("perspectives-proxy").PDRproxy;//3

import PerspectivesComponent from "./perspectivescomponent.js";
import {PSRol, PSRoleInstances, PSContext} from "./reactcontexts";

export default function RoleInstanceIterator (props)
{
  return <PSContext.Consumer>{ pscontext => <RoleInstanceIterator_
      myroletype={pscontext.myroletype}
      /*eslint-disable-next-line react/prop-types*/
    >{props.children}</RoleInstanceIterator_> }</PSContext.Consumer>;
}

class RoleInstanceIterator_ extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
    this.state.instances = undefined;
    this.state.cursor = undefined;
  }

  // Compute a PSRol instance for the rolInstance.
  computeInstanceData (rolInstance, rolBindingContext)
  {
    const component = this;
    function bind_(rolInstance)
    {
      return function({rolinstance})
        {
          if (rolinstance)
          {
            // checkBinding( <contexttype>, <localRolName>, <binding>, [() -> undefined] )
            PDRproxy.then(
              function (pproxy)
              {
                pproxy.checkBinding(
                  component.context.contexttype,
                  component.context.roltype,
                  rolinstance,
                  function(psbool)
                  {
                    if ( psbool[0] === "true" )
                    {
                      pproxy.bind_(
                        rolInstance,
                        rolinstance,
                        component.props.myroletype,
                        function( /*rolId*/ ){});
                    }
                    else
                    {
                      alert("Cannot bind_!");
                    }
                  });
            });
          }
        };
    }
    return (
      { contextinstance: component.context.contextinstance
      , contexttype: component.context.contexttype
      , roltype: component.context.roltype
      , bind: rolBindingContext.bind
      , bind_: bind_( rolInstance )
      , checkbinding: rolBindingContext.checkbinding
      , removerol: function()
        {
          PDRproxy.then(
            function (pproxy)
            {
              pproxy.removeRol( component.context.contexttype, component.context.roltype, rolInstance, component.props.myroletype );
            });
        }
      , rolinstance: rolInstance
      , isselected: component.context.cursor === rolInstance
      });
  }

  componentDidMount ()
  {
    const component = this;
    const updater =
      { rolBindingContext:
          { contextinstance: component.context.contextinstance
          , contexttype: component.context.contexttype
          , bind: function({rolinstance})
              {
                if (rolinstance)
                {
                  PDRproxy.then(
                    function (pproxy)
                    {
                      pproxy.checkBinding(
                        component.context.contexttype,
                        component.context.roltype,
                        rolinstance,
                        function(psbool)
                        {
                          if ( psbool[0] === "true" )
                          {
                            pproxy.bind(
                              component.context.contextinstance,
                              component.context.roltype,
                              component.context.contexttype,
                              {properties: {}, binding: rolinstance},
                              component.context.myroletype,
                              function( /*rolId*/ ){});
                          }
                          else
                          {
                            alert("Cannot bind!");
                          }
                        });
                    });
                  // checkBinding( <contexttype>, <localRolName>, <binding>, [() -> undefined] )
                }
              }
          , checkbinding: function({rolinstance}, callback)
            {
              PDRproxy.then(
                function (pproxy)
                {
                  // checkBinding( <contexttype>, <localRolName>, <binding>, [() -> undefined] )
                  pproxy.checkBinding(
                    component.context.contexttype,
                    component.context.roltype,
                    rolinstance,
                    function(psbool)
                    {
                      callback (psbool[0] === "true");
                    });
                });
            }
          }
      , instances: component.context.instances
      , cursor: component.context.cursor
      };
    component.context.instances.forEach( function (rolInstance)
      {
        updater[rolInstance] = component.computeInstanceData(rolInstance, updater.rolBindingContext);
      });
    component.setState(updater);
  }

  componentDidUpdate (/*prevProps, prevState*/)
  {
    function equalArrays (array1, array2)
    {
      return array1.length === array2.length && array1.every(function(value, index) { return value === array2[index];});
    }
    const component = this,
      previousCursor = component.state.cursor,
      currentCursor = component.context.cursor;
    let updater = {};

    if ( !equalArrays( component.context.instances, component.state.instances ) )
    {
      updater = { instances: component.context.instances };
      component.context.instances.forEach( function (rolInstance)
        {
          updater[rolInstance] = component.computeInstanceData(rolInstance, component.state.rolBindingContext);
        });
      component.setState( updater );
    }
    // If only the cursor has changed, we just recompute the corresponding element.
    if ( currentCursor !== previousCursor )
    {
      updater[previousCursor] = component.computeInstanceData( previousCursor, component.state.rolBindingContext );
      updater[currentCursor] = component.computeInstanceData( currentCursor, component.state.rolBindingContext );
      updater.cursor = currentCursor;
      component.setState( updater );
    }
  }

  render ()
  {
    const component = this;
    if (component.stateIsComplete())
    {
      return component.state.instances.map(
        function( rolInstance )
        {
          return (<PSRol.Provider key={rolInstance} value={component.state[rolInstance]}>
            {component.props.children}
            </PSRol.Provider>);
        }
      );
        }
    else
    {
      return null;
    }
  }
}

RoleInstanceIterator_.contextType = PSRoleInstances;

RoleInstanceIterator_.propTypes = {};
