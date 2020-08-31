const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;

import PerspectivesComponent from "./perspectivescomponent.js";
import {PSRol} from "./reactcontexts";

export default class RolBinding extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
    this.state.value = undefined;
  }

  componentDidMount ()
  {
    const component = this;
    Perspectives.then(
      function (pproxy)
      {
        component.addUnsubscriber(
          pproxy.getBinding(
            component.props.rolinstance ? component.props.rolinstance : component.context.rolinstance,
            function (binding)
            {
              if (binding[0])
              {
                // Retrieve the type of the binding.
                // This will be the namespace that its properties are defined in.
                component.addUnsubscriber(
                  // TODO. Vraag het type van binding[0] op. (onderstaande faalt als de rol via de props kwam)
                  pproxy.getBindingType(
                    component.context.rolinstance,
                    function (bindingType)
                    {
                      component.setState(
                        {
                          value:
                          { contextinstance: component.context.contextinstance // LET OP: context van de bindende rol
                          , contexttype: component.context.contexttype // IDEM, type van de context van de bindende rol.
                          , roltype: bindingType[0]
                          // bindrol
                          // checkbinding
                          // removerol
                          , rolinstance: binding[0]
                          // isselected
                          }
                        }
                      );
                    }));
              }
              else
              {
                component.setState(
                  {
                    value:
                    { contextinstance: component.context.contextinstance
                    , contexttype: component.context.contexttype
                    }
                  }
                )
              }
            }));
      }
    );
  }

  // Render! props.children contains the nested elements.
  // These should be provided the retrieved binding value.
  // However, this can only be done after state is available.
  render ()
  {
    const component = this;

    if (component.stateIsComplete() && component.state.value.rolinstance && component.state.value.roltype)
    {
      return (<PSRol.Provider value={component.state.value}>
        {component.props.children}
        </PSRol.Provider>)
    }
    else
    {
      return null;
    }
  }

}

RolBinding.contextType = PSRol;

RolBinding.propTypes = {
  namespace: PropTypes.string,
  rolinstance: PropTypes.string,
  rolname: PropTypes.string
};
// RolBinding passes on a PSRol.
