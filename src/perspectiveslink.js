const React = require("react");
const PropTypes = require("prop-types");

export default function PerspectivesLink(props)
{
  function handleClick(e, rolinstance)
  {
    if (e.shiftKey || e.ctrlKey || e.metaKey)
    {
      window.open("/?" + rolinstance);
    }
    else
    {
      props.handler(rolinstance);
    }
  }
  return <span onClick={ e => handleClick(e, props.rolinstance) }><a href={"/?" + props.rolinstance} tabIndex="-1">{props.linktext}</a></span>;
}

PerspectivesLink.propTypes =
  { rolinstance: PropTypes.string.isRequired
  , linktext: PropTypes.string.isRequired
  , handler: PropTypes.func.isRequired
  };
