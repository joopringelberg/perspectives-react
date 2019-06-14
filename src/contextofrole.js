const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;
const PerspectivesComponent = require("./perspectivescomponent.js");
import {PSContext, PSRol} from "./reactcontexts";

class ContextOfRole extends PerspectivesComponent
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
        // The context of the rol will be bound to the state prop 'contextInstance'.
        component.addUnsubscriber(
          pproxy.getRolContext(
            component.context.rolinstance,
            function (contextId)
            {
              component.addUnsubscriber(
                pproxy.getContextType(
                  contextId[0],
                  function (contextType)
                  {
                    component.setState({ value:
                      { contextinstance: contextId[0]
                      , contexttype: contextType[0]
                      }})
                  }
                ));
            }));
      }
    );
  }

  render ()
  {
    const component = this;

    if (component.stateIsComplete())
    {
      const component = this;
      return (<PSContext.Provider value={component.state.value}>
          {component.props.children}
        </PSContext.Provider>)
    }
    else
    {
      return null;
    }
  }

}

ContextOfRole.contextType = PSRol;

ContextOfRole.propTypes = {
  rolinstance: PropTypes.string
};
// ContextOfRole passes on:
// contextinstance

module.exports = ContextOfRole;
