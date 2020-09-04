const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;

import PerspectivesComponent from "./perspectivescomponent.js";
import {PSRol, PSRoleInstances, PSRolBinding} from "./reactcontexts";

export default function RoleInstanceIterator (props)
{
  return <PSContext.Consumer>{ pscontext => <RoleInstanceIterator_ myroletype={pscontext.myroletype}/> }</PSContext.Consumer>;
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
    return (
      { contextinstance: component.context.contextinstance
      , contexttype: component.context.contexttype
      , roltype: component.context.roltype
      , bindrol: rolBindingContext.bindrol
      , checkbinding: rolBindingContext.checkbinding
      , removerol: function()
        {
          Perspectives.then(
            function (pproxy)
            {
              pproxy.removeRol( component.context.contextinstance, component.context.roltype, rolInstance, component.props.myroletype )
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
           // Can be applied to a PSRol context.
          , bindrol: function({rolinstance})
            {
              if (rolinstance)
              {
                // checkBinding( typeOfRolToBindTo, valueToBind )
                Perspectives.then(
                  function (pproxy)
                  {
                    pproxy.checkBinding(
                      component.context.contexttype,
                      component.context.rol,
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
                            component.props.myroletype,
                            function( rolId ){});
                        }
                        else
                        {
                          alert("Cannot bind!")
                        }
                      });
                });
              }
            }
          , checkbinding: function({rolinstance}, callback)
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
