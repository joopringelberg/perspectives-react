const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;
const PerspectivesComponent = require("./perspectivescomponent.js");
import {PSRol, PSContext, PSRolBinding} from "./reactcontexts";

class BindRol extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
    const component = this;
    component.state.bindRol = undefined;
  }

  componentDidMount ()
  {
    const component = this;
    let rolinstance
    ///////////////
    console.log("BindRol did mount.")
    ///////////////
    Perspectives.then(
      function (pproxy)
      {
        const updater = {
          bindRol: function(rolInstance)
            {
              pproxy.createRolWithLocalName(
                component.context.contextinstance,
                component.props.rol,
                component.context.contexttype,
                {properties: {}, binding: rolInstance},
                function( rolId ){});
            }
        }
        component.setState(updater);
      });
  }

  render ()
  {
    const component = this;
    let rolBindingContext;

    if (component.stateIsComplete())
    {
      rolBindingContext =
        { contextinstance: component.context.contextinstance
        , contexttype: component.context.contexttype
        , bindrol: component.state.bindRol
      }
      return (<PSRolBinding.Provider value={rolBindingContext}>{component.props.children}</PSRolBinding.Provider>);
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

module.exports = BindRol;
