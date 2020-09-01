import React from "react";

import {AppContext, PSRolBinding} from "./reactcontexts.js";

////////////////////////////////////////////////////////////////////////////////
// DROPZONE
////////////////////////////////////////////////////////////////////////////////
export default class DropZone extends React.PureComponent
{
  constructor (props)
  {
    super(props);
    this.eventDiv = React.createRef();
  }

  // The dropzone only captures keys when a Card is on the CardClipboard.
  checkBinding ( event, roleId, setSelectedCard, setPositionToMoveTo )
  {
    const component = this;
    const eventDivRect = component.eventDiv.current.getBoundingClientRect()
    component.context.checkbinding( {rolinstance: roleId},
      function( bindingAllowed )
      {
        if ( bindingAllowed )
        {
          // component.eventDiv.classList.add("border-success", "border");
          // component.eventDiv.focus(); // verstoort dit niet de drag?
          component.allowedInstance = roleId;
        }
        else {
          component.eventDiv.classList.add("border-danger", "border");
          component.eventDiv.blur(); //???? Waar gaat de focus heen?
        }
      } );
    event.preventDefault();
  }

  handleDrop (event, rolData )
  {
    const component = this;
    if ( component.allowedInstance === rolData.rolinstance )
    {
      component.context.bindrol( rolData );
      component.eventDiv.current.blur();
    }
  }

  // The dropzone only captures keys when a Card is on the CardClipboard
  // (and when it has focus).
  handleKeyDown ( event, roleId )
  {
    const component = this;
    const eventDivRect = component.eventDiv.current.getBoundingClientRect()
    switch(event.keyCode){
      case 13: // Enter
      case 32: // space
        if ( component.allowedInstance === rolData.rolinstance )
        {
          // Animate the movement of the card to the dropzone.
          setPositionToMoveTo( {x: eventDivRect.x + "px", y: eventDivRect.y + "px"} );
          // Bind the role.
          component.context.bindrol( {rolinstance: roleId} );
          // Wait for the animation to end.
          setTimeout( function()
            {
              setSelectedCard();
              setPositionToMoveTo();
              component.eventDiv.current.blur();
            },
            900)
        }
        else {
          //Do what?
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
                // onDragEnter={ ev => component.checkBinding( ev, selectedRole, setSelectedCard )}
                onDragEnter={ ev => ev.target.focus() }
                onFocus={ ev => component.checkBinding( ev, selectedRole, setSelectedCard )}
                onDragLeave={ ev => ev.target.classList.remove("border-danger", "border", "border-success")}

                onDrop={ ev => component.handleDrop( JSON.parse( ev.dataTransfer.getData("PSRol") ) ) }
                onKeyDown={ ev => component.handleKeyDown( ev, selectedRole, setSelectedCard, setPositionToMoveTo )}

                style={ {flexGrow: 1} }
                className="p-2"
              >
                {component.props.children}
              </div>}
            </AppContext.Consumer>
  }
}

DropZone.contextType = PSRolBinding;
