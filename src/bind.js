const React = require("react");
const Perspectives = require("perspectives-proxy").Perspectives;
import PerspectivesComponent from "./perspectivescomponent.js";
import {PSContext, PSRolBinding} from "./reactcontexts";

export default class Bind extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
    const component = this;
    component.state.rolBindingContext = undefined;
  }

  componentDidMount ()
  {
    const component = this;
    Perspectives.then(
      function (pproxy)
      {
        function bind ({rolinstance})
        {
          if (rolinstance)
          {
            // checkBinding( <contexttype>, <localRolName>, <binding>, [() -> undefined] )
            pproxy.checkBinding(
              component.context.contexttype,
              component.props.rol,
              rolinstance,
              function(psbool)
              {
                if ( psbool[0] === "true" )
                {
                  pproxy.bind(
                    component.context.contextinstance,
                    component.props.rol,
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
          }
        }

        // Returns a promise with the binders.
        function getUnqualifiedRoleBinders({rolinstance})
        {
          var resolver;
          // Create a promise
          const promisedBinders = new Promise( (resolve) => {resolver = resolve;} );
          Perspectives.then(
            function (pproxy)
            {
              if (rolinstance)
              {
                component.addUnsubscriber(
                  pproxy.getUnqualifiedRoleBinders(
                    rolinstance, // rolID
                    component.props.rol, // roleType
                    function(binders)
                    {
                      // resolve the promise with the binders
                      resolver(binders);
                    }
                  ));
              }
            });
          // return the promise
          return promisedBinders;
        }
        function checkbinding({rolinstance}, callback)
            {
              // checkBinding( <contexttype>, <localRolName>, <binding>, [() -> undefined] )
              pproxy.checkBinding(
                component.context.contexttype,
                component.props.rol,
                rolinstance,
                function(psbool)
                {
                  callback( psbool[0] === "true" );
                });
            }

        const updater = {
          rolBindingContext:
            { bind: bind
            , getUnqualifiedRoleBinders: getUnqualifiedRoleBinders
                // Can be applied to a PSRol context.
            , checkbinding: checkbinding
            , contextinstance: component.context.contextinstance
            , contexttype: component.context.contexttype
            }
        };
        component.setState(updater);
      });
  }

  render ()
  {
    const component = this;

    if (component.stateIsComplete())
    {
      return (<PSRolBinding.Provider value={component.state.rolBindingContext}>{component.props.children}</PSRolBinding.Provider>);
    }
    else
    {
      return null;
    }
  }
}

Bind.contextType = PSContext;

// Bind passes on through PSRol:
// contextinstance
// contexttype
// bind_
