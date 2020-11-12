const React = require("react");
const Component = React.PureComponent;

import PropTypes from "prop-types";

import Screen from "./screen.js";

import
  { Button
  , Container
  } from "react-bootstrap";

// Embed the React component that embodies a users' perspectives on a context type in a PerspectivesContainer
// to add functionality to open a subcontext and navigate back to it again.
// Navigating is event-based:
//  - Dispatch `OpenContext` with a payload that identifies the context instance to open
//  - Dispatch `BackToEnclosingContext` without payload to navigate back.
export class PerspectivesContainer extends Component
{
  constructor(props)
  {
    super(props);
    this.state = {selectedSubContext: undefined};
    this.containerRef = React.createRef();
  }

  componentDidMount ()
  {
    const component = this;
    this.containerRef.current.addEventListener( "OpenContext",
      function(e)
      {
        component.setState( {selectedSubContext: e.detail });
        e.stopPropagation();
      });
    this.containerRef.current.addEventListener( "BackToEnclosingContext",
      function(e)
      {
        if ( component.state.selectedSubContext )
        {
          component.setState( {selectedSubContext: undefined });
          e.stopPropagation();
        }
        // If this component had not already opened a subcontext, this event is targeted for its parent.
      });
  }

  render ()
  {
    const component = this;
    // Move all props given to PerspectivesContainer, except for the children, to Container.
    const props = {};
    Object.assign(props, component.props)
    props.children = undefined;

    return  <Container ref={component.containerRef} {...props}>
            {
              component.state.selectedSubContext
              ?
              <Screen rolinstance={component.state.selectedSubContext}/>
              :
              component.props.children
           }</Container>;
  }
}

// Use like this:
//  <BackButton buttontext="Back to all chats"/>
export function BackButton(props)
{
  const ref = React.createRef();
  function back()
  {
    ref.current.dispatchEvent( new CustomEvent( "BackToEnclosingContext", {bubbles: true}) );
  }
  return <Button ref={ref} href="#" onClick={e => back()}>{ props.buttontext }</Button>
}

BackButton.propTypes = {buttontext: PropTypes.string.isRequired};
