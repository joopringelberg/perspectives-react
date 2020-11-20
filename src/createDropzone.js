import React from "react";
import PropTypes from "prop-types";

import {AppContext, PSRoleInstances} from "./reactcontexts.js";

////////////////////////////////////////////////////////////////////////////////
// DROPZONE
////////////////////////////////////////////////////////////////////////////////
export default class CreateDropZone extends React.PureComponent
{
  constructor (props)
  {
    super(props);
    this.eventDiv = React.createRef();
  }

  // The dropzone only captures keys when a Card is on the CardClipboard.
  checkBinding ( event, roleId /*, setSelectedCard, setPositionToMoveTo*/ )
  {
    const component = this;
    // const eventDivRect = component.eventDiv.current.getBoundingClientRect()
    component.context.checkbinding( {rolinstance: roleId},
      function( bindingAllowed )
      {
        if ( bindingAllowed)
        {
          component.allowedInstance = roleId;
        }
        else {
          component.eventDiv.current.classList.add("border-danger", "border");
        }
      } );
    event.preventDefault();
  }

  handleDrop (event, rolData )
  {
    const component = this;
    component.context.checkbinding( rolData,
      function( bindingAllowed )
      {
        if ( bindingAllowed)
        {
          component.context.bind( rolData );
        }
        else {
          component.eventDiv.current.classList.add("border-danger", "border");
        }
      } );
  }

  // The dropzone only captures keys when a Card is on the CardClipboard
  // (and when it has focus).
  handleKeyDown ( event, roleId, setSelectedCard, setPositionToMoveTo )
  {
    const component = this;
    const eventDivRect = component.eventDiv.current.getBoundingClientRect();
    switch(event.keyCode){
      case 13: // Enter
      case 32: // space
        if ( component.allowedInstance === roleId )
        {
          // Animate the movement of the card to the dropzone.
          setPositionToMoveTo( {x: eventDivRect.x + "px", y: eventDivRect.y + "px"} );
          // Bind the role.
          component.context.bind( {rolinstance: roleId} );
          // Wait for the animation to end.
          setTimeout( function()
            {
              setSelectedCard();
              setPositionToMoveTo();
            },
            900);
        }
        else {
          setPositionToMoveTo( {x: eventDivRect.x + "px", y: eventDivRect.y + "px"} );
          // Wait for the animation to end.
          setTimeout( function()
            {
              //move back!
              setPositionToMoveTo({x: "-1px", y: "-1px"});
            },
            900);
        }
        event.preventDefault();
        break;
      }
  }

  render ()
  {
    const component = this;
    return  <AppContext.Consumer>{ ({selectedRole, setSelectedCard, setPositionToMoveTo}) =>
              <div
                ref={component.eventDiv}
                tabIndex={ selectedRole ? 0 : null }

                onDragEnter={ event => {
                  event.preventDefault();
                  event.stopPropagation();
                  component.eventDiv.current.tabIndex = 0;
                  component.eventDiv.current.focus();
                } }
                // No drop without this...
                onDragOver ={ event => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onFocus={ ev => { if (selectedRole) { component.checkBinding( ev, selectedRole, setSelectedCard ); } } }
                onDragLeave={ ev => ev.target.classList.remove("border-danger", "border", "border-success")}

                onDrop={ ev => component.handleDrop( ev, JSON.parse( ev.dataTransfer.getData("PSRol") ) ) }
                onKeyDown={ ev => component.handleKeyDown( ev, selectedRole, setSelectedCard, setPositionToMoveTo )}

                style={ {flexGrow: 1} }
                className="p-2"

                aria-dropeffect="execute"
                aria-label={component.props.ariaLabel}
              >
                {component.props.children}
              </div>}
            </AppContext.Consumer>;
  }
}

CreateDropZone.propTypes =
  {
    ariaLabel: PropTypes.string.isRequired
  };

CreateDropZone.contextType = PSRoleInstances;
// we use bind and checkBinding.
