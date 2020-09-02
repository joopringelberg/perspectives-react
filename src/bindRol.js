const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;
import PerspectivesComponent from "./perspectivescomponent.js";
import {PSRol, PSContext, PSRolBinding} from "./reactcontexts";

export default class BindRol extends PerspectivesComponent
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
    let rolinstance
    Perspectives.then(
      function (pproxy)
      {
        const updater = {
          rolBindingContext:
            { bindrol: function({rolinstance})
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
                }
                // Can be applied to a PSRol context.
            , checkbinding: function({rolinstance}, callback)
                {
                  // checkBinding( typeOfRolToBindTo, valueToBind )
                  pproxy.checkBinding(
                    component.context.contexttype,
                    component.props.rol,
                    rolinstance,
                    function(psbool)
                    {
                      callback( psbool[0] === "true" );
                    });
                }
            , contextinstance: component.context.contextinstance
            , contexttype: component.context.contexttype
            }
        }
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

BindRol.contextType = PSContext;

// BindRol passes on through PSRol:
// contextinstance
// contexttype
// bindrol
