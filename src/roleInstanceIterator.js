const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;

import PerspectivesComponent from "./perspectivescomponent.js";
import {PSRol, PSRoleInstances, PSRolBinding, PSContext} from "./reactcontexts";

// WHen there is more than one child, the first child is taken to be the default one.
// If there are no role instances, the default child is rendered in a PSRolBinding context that has bind.
// If there are instances, the other children are rendered in a PSRol context that has both bind and bind_.
export default function RoleInstanceIterator (props)
{
  return <PSContext.Consumer>{ pscontext => <RoleInstanceIterator_
      myroletype={pscontext.myroletype}
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
    const currentCursor = component.context.cursor
    function bind_(rolInstance)
    {
      return function({rolinstance})
        {
          if (rolinstance)
          {
            // checkBinding( <contexttype>, <localRolName>, <binding>, [() -> undefined] )
            Perspectives.then(
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
                        function( rolId ){});
                    }
                    else
                    {
                      alert("Cannot bind_!")
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
          Perspectives.then(
            function (pproxy)
            {
              pproxy.removeRol( component.context.contexttype, component.context.roltype, rolInstance, component.props.myroletype )
            });
        }
      , rolinstance: rolInstance
      , isselected: currentCursor === rolInstance
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
                  Perspectives.then(
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
                              function( rolId ){});
                          }
                          else
                          {
                            alert("Cannot bind!")
                          }
                        });
                    });
                  // checkBinding( <contexttype>, <localRolName>, <binding>, [() -> undefined] )
                }
              }
          , checkbinding: function({rolinstance}, callback)
            {
              Perspectives.then(
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

  componentDidUpdate (prevProps, prevState)
  {
    function equalArrays (array1, array2)
    {
      return array1.length === array2.length && array1.every(function(value, index) { return value === array2[index]})
    }
    const component = this,
      previousCursor = component.state.cursor,
      currentCursor = component.context.cursor;
    let updater = {};

    if ( !equalArrays( component.context.instances, component.state.instances ) )
    {
      updater = { instances: component.context.instances }
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
      updater.cursor = currentCursor
      component.setState( updater );
    }
  }

  render ()
  {
    const component = this;
    let defaultElement, children;
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
      // By using the previous instances, we make sure React does not update the children.
      if (component.state.instances.length == 0 )
      {
        if (defaultElement)
        {
          return (<PSRolBinding.Provider value={component.state.rolBindingContext}>{defaultElement}</PSRolBinding.Provider>);
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
    else
    {
      return <div/>
    }
  }
}

RoleInstanceIterator_.contextType = PSRoleInstances;

RoleInstanceIterator_.propTypes = {};
