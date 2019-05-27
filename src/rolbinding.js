const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;
const PerspectivesComponent = require("perspectivescomponent").PerspectivesComponent;

class RolBinding extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
    this.state.binding = undefined;
    this.state.bindingType = undefined;
  }

  componentDidMount ()
  {
    const component = this;
    Perspectives.then(
      function (pproxy)
      {
        component.addUnsubscriber(
          pproxy.getBinding(
            component.props.rolinstance,
            function (binding)
            {
              component.setState({binding: binding[0]});
            }));
        // Retrieve the type of the binding.
        // This will be the namespace that its properties are defined in.
        component.addUnsubscriber(
          pproxy.getBindingType(
            component.props.rolinstance,
            function (bindingType)
            {
              component.setState({bindingType: bindingType[0]});
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

    if (component.stateIsComplete())
    {
      if (Array.isArray(component.props.children))
      {
        return React.Children.map(
          component.props.children,
          function (child)
          {
            return React.cloneElement(
              child,
              {
                rolinstance: component.state.binding,
                namespace: component.state.bindingType
              });
          });
      }
      else
      {
        return React.cloneElement(
          component.props.children,
          {
            rolinstance: component.state.binding,
            namespace: component.state.bindingType
          });
      }
    }
    else
    {
      return <div />;
    }
  }

}

RolBinding.propTypes = {
  namespace: PropTypes.string,
  rolinstance: PropTypes.string,
  rolname: PropTypes.string
};
// RolBinding passes on:
// rolinstance
// namespace (= the type of the binding).

module.exports = {RolBinding: RolBinding};
