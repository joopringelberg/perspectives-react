const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;

import PerspectivesComponent from "./perspectivescomponent.js";
import {externalRole} from "./urifunctions.js";
import {PSRol, PSContext} from "./reactcontexts";

export default class ExternalRole extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
    this.state.value = undefined;
  }
  componentDidMount()
  {
    const component = this;
    Perspectives.then(
      function (pproxy)
      {
        component.addUnsubscriber(
          pproxy.getRolType(
            externalRole( component.context.contextinstance ),
            function(rolType)
            {
              const updater = {value:
                { contextinstance: component.context.contextinstance
                , contexttype: component.context.contexttype
                , rolinstance: externalRole( component.context.contextinstance)
                , roltype: rolType[0]
                }}
              component.setState( updater );
            }
          )
        );
      }
    );
  }

  render ()
  {
    const component = this;
    if (component.stateIsComplete())
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

ExternalRole.contextType = PSContext;

// ExternalRole passes on a PSRol ReactContext.
