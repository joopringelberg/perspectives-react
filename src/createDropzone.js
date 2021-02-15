import React from "react";
import PropTypes from "prop-types";

import {AppContext} from "./reactcontexts.js";

import PerspectivesComponent from "./perspectivescomponent.js";

const PDRproxy = require("perspectives-proxy").PDRproxy;

////////////////////////////////////////////////////////////////////////////////
// CREATEDROPZONE
////////////////////////////////////////////////////////////////////////////////
/*
The user can add an instance to a role with this component by dropping a binding
on it. The new instance will be created and the dropped role fills it.
It can be used both inside a Functional Role and inside an MultiRole: as a descendant
of either a RoleInstance or a RolInstances component.
We require two functions on the props:
  * bind
  * checkBinding

There is a functional overlap between some methods in this component and the
behaviour we can add to components that represent a role instance (and therefore
require a PSRol context).
The overlap is unfortunate, but unavoidable.
A note to implementers: consider the example of addFillWithRole to be leading for the
implementation choices in CreateDropZone (try to follow that code as much as possible).
*/
export default function CreateDropZone(props)
{
  return  <AppContext.Consumer>
          {
            appcontext => <CreateDropZone_ systemExternalRole={appcontext.systemExternalRole} {...props}>{
              //eslint-disable-next-line react/prop-types
              props.children}</CreateDropZone_>
          }
          </AppContext.Consumer>;
}

class CreateDropZone_ extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
    this.eventDiv = React.createRef();
  }

  // Subscribe to the clipboard. NOTE; do we need a subscription?
  // rather a fireAndForget situation.
  readClipBoard( receiveResults )
  {
    const component = this;
    PDRproxy.then(
      function(pproxy)
      {
        component.addUnsubscriber(
          pproxy.getProperty(
            component.props.systemExternalRole,
            "model:System$PerspectivesSystem$External$CardClipBoard",
            "model:System$PerspectivesSystem$External",
            function (valArr)
            {
              if (valArr[0])
              {
                const {selectedRole} = JSON.parse( valArr[0]);
                receiveResults( {rolinstance: selectedRole} );

              }
              else
              {
                receiveResults({});
              }
            }));
      });
  }

  tryToBind (event, rolData )
  {
    const component = this;
    component.props.checkbinding( rolData,
      function( bindingAllowed )
      {
        if ( bindingAllowed)
        {
          component.props.bind( rolData );
          // Empty clipboard.
          // {request: "DeleteProperty", subject: rolID, predicate: propertyName, authoringRole: myroletype}
          PDRproxy.then( pproxy => pproxy.deleteProperty(
            component.props.systemExternalRole,
            "model:System$PerspectivesSystem$External$CardClipBoard",
            "model:System$PerspectivesSystem$User") );
        }
        else {
          component.eventDiv.current.classList.add("failure");
          component.eventDiv.current.focus();
        }
      } );
  }

  handleKeyDown ( event )
  {
    const component = this;
    switch(event.keyCode){
      case 13: // Enter
      case 32: // space
      component.readClipBoard( function( roleData )
        {
          if (roleData.rolinstance)
          {
            component.tryToBind( event, roleData );
          }
        });
        event.preventDefault();
      }
  }

  render ()
  {
    const component = this;
    return  <div
              ref={component.eventDiv}
              tabIndex="0"

              onDragEnter={ event => {
                event.preventDefault();
                event.stopPropagation();
                component.eventDiv.current.blur();
                component.eventDiv.current.classList.add("dropHere");
              } }
              // No drop without this...
              onDragOver ={ event => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onDragLeave={ ev => ev.target.classList.remove("dropHere")}
              onBlur={ ev => ev.target.classList.remove("dropHere", "failure")}

              onDrop={ ev => component.tryToBind( ev, JSON.parse( ev.dataTransfer.getData("PSRol") ) ) }
              onKeyDown={ ev => component.handleKeyDown( ev )}

              style={ {flexGrow: 1} }
              className="p-2"

              aria-dropeffect="execute"
              aria-label={component.props.ariaLabel}
            >
                {component.props.children}
            </div>;
  }
}

CreateDropZone_.propTypes =
  {
    ariaLabel: PropTypes.string.isRequired
  , bind: PropTypes.func.isRequired
  , checkbinding: PropTypes.func.isRequired
  };
