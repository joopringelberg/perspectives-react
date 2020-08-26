const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;
const PerspectivesComponent = require("./perspectivescomponent.js");
const PSContext = require("./reactcontexts.js").PSContext;

class MySystem extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
    this.state = {
      contextinstance: undefined,
      contexttype: "model:System$PerspectivesSystem"
    };
  }

  componentDidMount ()
  {
    const component = this;
    let rolinstance
    Perspectives.then(
      function (pproxy)
      {
        pproxy.getUserIdentifier(
          function(sysId)
          {
            component.setState({contextinstance: "model:User$" + sysId[0]});
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
      </PSContext.Provider>)
    }
    else {
      return <div/>;
    }
  }
}

MySystem.propTypes = {};
// Context passes on through PSContext:
// contextinstance
// contexttype

module.exports = MySystem;
