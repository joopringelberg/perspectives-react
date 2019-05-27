const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;
const PerspectivesComponent = require("perspectivescomponent").PerspectivesComponent;

class Context extends Component
{
  constructor (props)
  {
    super(props);
  }
  render ()
  {
    const component = this;
    let children;

    if (Array.isArray(component.props.children))
    {
      children = component.props.children;
    }
    else
    {
      children = [component.props.children];
    }

    return React.Children.map(
      children,
      function (child)
      {
        return React.cloneElement(
          child,
          {
            contextinstance: component.props.contextinstance,
            namespace: component.props.type
          });
      });
  }
}
Context.propTypes = {
  contextinstance: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired
};
// Context passes on:
// contextinstance
// namespace

module.exports = {Context: Context};
