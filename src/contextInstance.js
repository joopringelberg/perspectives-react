const React = require("react");
const PDRproxy = require("perspectives-proxy").PDRproxy;

import PerspectivesComponent from "./perspectivescomponent.js";
import {PSContext} from "./reactcontexts";
const PropTypes = require("prop-types");

export default class ContextInstance extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
    this.state =
      { contextinstance: this.props.contextinstance
      , contexttype: undefined
      , myroletype: undefined };
  }
  componentDidMount()
  {
    const component = this;
    PDRproxy.then(
      function (pproxy)
      {
        component.addUnsubscriber(
          pproxy.getContextType(
            component.props.contextinstance,
            function(contextTypeArr)
            {
              component.setState(
                { contexttype: contextTypeArr[0]
                , myroletype: component.context.myroletype } );
            }
          )
        );
      }
    );
  }

  componentDidUpdate()
  {
    this.componentDidMount();
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

ContextInstance.contextType = PSContext;

ContextInstance.propTypes = { contextinstance: PropTypes.string.isRequired };
