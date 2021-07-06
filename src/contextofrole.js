const React = require("react");
const PropTypes = require("prop-types");
const PDRproxy = require("perspectives-proxy").PDRproxy;
import PerspectivesComponent from "./perspectivescomponent.js";
import {PSContext} from "./reactcontexts";

export default class ContextOfRole extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
    this.state.contextinstance = undefined;
    this.state.contexttype = undefined;
    this.state.myroletype = undefined;
    this.state.children = undefined;
  }

  componentDidMount ()
  {
    const component = this;
    PDRproxy.then(
      function (pproxy)
      {
        // The context of the rol will be bound to the state prop 'contextInstance'.
        pproxy.getRolContext(
          component.props.rolinstance,
          function (contextId)
          {
            pproxy.getContextType(
              contextId[0],
              function (contextType)
              {
                if ( !component.props.myroletype )
                {
                  // Get it from the core.
                  // This we subscribe to: it may change.
                  component.addUnsubscriber(
                    pproxy.getMeForContext( component.props.rolinstance,
                      function(myroletype)
                      {
                        component.setState(
                          { contextinstance: contextId[0]
                          , contexttype: contextType[0]
                          , myroletype: myroletype[0]
                          });
                      }));
                }
                else {
                  component.setState(
                    { contextinstance: contextId[0]
                    , contexttype: contextType[0]
                    , myroletype: component.props.myroletype
                    });
                }
              }
            ), true; // fireandforget: the type of the context will never change.
          }, true); // fireandforget: the context of a role will never change.
      }
    );
  }

  componentDidUpdate (prevProps)
  {
    const component = this;
    if (component.props.rolinstance !== prevProps.rolinstance)
    {
      component.componentDidMount();
    }
  }

  render ()
  {
    const component = this;

    if (component.stateIsComplete())
    {
      return (<PSContext.Provider value={component.state}>
          {component.props.children}
        </PSContext.Provider>);
    }
    else
    {
      return null;
    }
  }

}

ContextOfRole.propTypes = {
  rolinstance: PropTypes.string.isRequired
};
