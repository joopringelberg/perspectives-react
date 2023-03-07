const React = require("react");
const PDRproxy = require("perspectives-proxy").PDRproxy;

import PerspectivesComponent from "./perspectivescomponent.js";
import {PSContext} from "./reactcontexts.js";
import { default as ModelDependencies } from "./modelDependencies.js";

export default class MySystem extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
    this.state = {
      contextinstance: undefined,
      contexttype: ModelDependencies.system,
      myroletype:  ModelDependencies.sysUser
    };
  }

  componentDidMount ()
  {
    const component = this;
    PDRproxy.then(
      function (pproxy)
      {
        pproxy.getUserIdentifier(
          function(sysId)
          {
            component.setState({contextinstance: "def:#" + sysId[0]});
          }
        );
      });
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
    else {
      return <div/>;
    }
  }
}
