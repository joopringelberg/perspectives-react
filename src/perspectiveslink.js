const React = require("react");
const PropTypes = require("prop-types");

import {PSRol} from "./reactcontexts";

export default class PerspectivesLink extends React.PureComponent
{
  constructor(props)
  {
    super(props);
    // A ref to dispatch an event from.
    this.ref = React.createRef();

  }
  render()
  {
    const component = this;
    function handleClick(e)
    {
      if (e.shiftKey || e.ctrlKey || e.metaKey)
      {
        window.open("/?" + component.context.rolinstance);
      }
      else
      {
        component.ref.current.dispatchEvent( new CustomEvent('OpenContext', { detail: component.context.rolinstance, bubbles: true }) );
      }
    }
    // function handleKeyDown(e)
    // {
    //   switch (event.keyCode)
    //   {
    //     case 32: // space
    //     case 13: // enter
    //       if (event.shiftKey)
    //       {
    //         window.open("/?" + props.rolinstance);
    //       }
    //       else
    //       {
    //
    //       }
    //   }
    // }

    return  <span ref={component.ref} onClick={ e => handleClick(e) }
              // onKeyDown={ e => handleKeyDown(e) }
            >
              <a href={"/?" + component.context.rolinstance}
                tabIndex="-1"
              >
                {component.props.linktext}
              </a>
            </span>;

  }
}

PerspectivesLink.contextType = PSRol;

PerspectivesLink.propTypes =
  { linktext: PropTypes.string.isRequired
  };
