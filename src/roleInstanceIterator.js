const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;
const PerspectivesComponent = require("./perspectivescomponent.js");
import {PSRol, PSRoleInstances, PSRolBinding} from "./reactcontexts";

class RoleInstanceIterator extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
    this.state.instances = undefined;
    this.state.cursor = undefined;
  }

  computeInstanceData (rolInstance)
  {
    const component = this;
    const currentCursor = component.context.cursor
    return (
      { contextinstance: component.context.contextinstance
      , contexttype: component.context.contexttype
      , rolinstance: rolInstance
      , roltype: component.context.roltype
      , isselected: currentCursor === rolInstance
      , removerol: function()
        {
          Perspectives.then(
            function (pproxy)
            {
              pproxy.removeRol( component.context.contextinstance, component.context.roltype, rolInstance)
            });
        }
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
        updater[rolInstance] = component.computeInstanceData(rolInstance);
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
          updater[rolInstance] = component.computeInstanceData(rolInstance);
        });
      component.setState( updater );
    }
    // If only the cursor has changed, we just recompute the corresponding element.
    if ( currentCursor !== previousCursor )
    {
      updater[previousCursor] = component.computeInstanceData( previousCursor );
      updater[currentCursor] = component.computeInstanceData( currentCursor );
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

RoleInstanceIterator.contextType = PSRoleInstances;

RoleInstanceIterator.propTypes = {};

// Rol passes on through PSRol:
// contextinstance
// contexttype
// roltype
// rolinstance

module.exports = RoleInstanceIterator;
