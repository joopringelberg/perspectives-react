const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;
const PerspectivesComponent = require("perspectivescomponent").PerspectivesComponent;

class ContextOfRole extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
    this.state.contextInstance = undefined;
    this.state.contextType = undefined;
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
            component.props.rolinstance,
            function (contextId)
            {
              component.setState({contextInstance: contextId[0]});
              // The type of the contextInstance.
              component.addUnsubscriber(
                pproxy.getContextType(
                  contextId[0],
                  function (contextType)
                  {
                    component.setState({contextType: contextType[0]});
                  },
                  component.addUnsubscriber.bind(component)
                ));
            },
            component.addUnsubscriber.bind(component)
          ));
      }
    );
  }

  render ()
  {
    const component = this;

    if (component.stateIsComplete())
    {
      return (<Context contextinstance={component.state.contextInstance} type={component.state.contextType}>
        {component.props.children}
      </Context>);
    }
    else
    {
      return <div />;
    }
  }

}
ContextOfRole.propTypes = {
  rolinstance: PropTypes.string
};
// ContextOfRole passes on:
// contextinstance

module.exports = {ContextOfRole: ContextOfRole};
