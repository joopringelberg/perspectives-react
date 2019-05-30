const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;
const Component = React.Component;
const PerspectivesComponent = require("./perspectivescomponent.js");
const PSContext = require("./reactcontexts.js").PSContext;

class Context extends Component
{
  constructor (props)
  {
    super(props);
    this.state = { value: {
      contextinstance: this.props.contextinstance,
      contexttype: this.props.contexttype
    }};
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
    return (<PSContext.Provider value={component.state.value}>
        {children}
      </PSContext.Provider>)
  }
}
Context.propTypes = {
  contextinstance: PropTypes.string.isRequired,
  contexttype: PropTypes.string.isRequired
};
// Context passes on through PSContext:
// contextinstance
// contexttype

module.exports = Context;
