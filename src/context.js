const React = require("react");
const PropTypes = require("prop-types");
const Component = React.Component;
import {PSContext} from "./reactcontexts.js";

export class Context extends Component
{
  constructor (props)
  {
    super(props);
    this.state = { value: {
      contextinstance: this.props.contextinstance,
      contexttype: this.props.contexttype,
      myroletype: "model:System$PerspectivesSystem$User"
    }};
  }
  render ()
  {
    const component = this;
    return (<PSContext.Provider value={component.state.value}>
        {component.props.children}
      </PSContext.Provider>);
  }
}
Context.propTypes = {
  contextinstance: PropTypes.string.isRequired,
  contexttype: PropTypes.string.isRequired
};
// Context passes on through PSContext:
// contextinstance
// contexttype
