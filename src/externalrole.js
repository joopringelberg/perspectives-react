const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;
const PerspectivesComponent = require("./perspectivescomponent.js");
const {buitenRol, deconstructNamespace} = require("./urifunctions.js");
import {PSRol, PSContext} from "./reactcontexts";

class ExternalRole extends PerspectivesComponent
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
            buitenRol( component.context.contextinstance),
            function(rolType)
            {
              const updater = {value:
                { contextinstance: component.context.contextinstance
                , contexttype: component.context.contexttype
                , rolinstance: buitenRol( component.context.contextinstance)
                , roltype: rolType[0]
                }}
              component.setState( updater );
            }
          )
        )
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
      return <div/>;
    }
  }
}

ExternalRole.contextType = PSContext;

// ExternalRole passes on a PSRol ReactContext.

module.exports = ExternalRole;
