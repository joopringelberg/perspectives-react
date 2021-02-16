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
  }

  componentDidMount ()
  {
    const component = this;
    PDRproxy.then(
      function (pproxy)
      {
        // The context of the rol will be bound to the state prop 'contextInstance'.
        component.addUnsubscriber(
          pproxy.getRolContext(
            component.props.rolinstance,
            function (contextId)
            {
              component.addUnsubscriber(
                pproxy.getContextType(
                  contextId[0],
                  function (contextType)
                  {
                    if ( !component.props.myroletype )
                    {
                      // Get it from the core.
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
                ));
            }));
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
    else if (component.props.myroletype !== prevProps.myroletype )
    {
      component.setState( {myroletype: component.props.myroletype } );
    }
  }

  render ()
  {
    const component = this;

    if (component.stateIsComplete())
    {
      const component = this;
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
  rolinstance: PropTypes.string.isRequired,
  myroletype: PropTypes.string
};
