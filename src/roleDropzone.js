import React from "react";
import PropTypes from "prop-types";

import {AppContext} from "./reactcontexts.js";

import PerspectivesComponent from "./perspectivescomponent.js";

// const PDRproxy = require("perspectives-proxy").PDRproxy;
import {PDRproxy, FIREANDFORGET} from "perspectives-proxy";

////////////////////////////////////////////////////////////////////////////////
// ROLEDROPZONE
////////////////////////////////////////////////////////////////////////////////
/*
The user can add an instance to a role with this component by dropping a binding
on it. The new instance will be created and the dropped role fills it.
It can be used both inside a Functional Role and inside an MultiRole: as a descendant
of either a RoleInstance or a RolInstances component, but does not require them
as ReactContext.
Instead, we require two functions on the props:
  * bind: either use PSRol.bind, PSRol.bind_ or PSRoleInstances.bind
  * checkBinding

There is a functional overlap between some methods in this component and the
behaviour we can add to components that represent a role instance (and therefore
require a PSRol context).
The overlap is unfortunate, but unavoidable.
A note to implementers: consider the example of addFillWithRole to be leading for the
implementation choices in RoleDropZone (try to follow that code as much as possible).
*/
export default function RoleDropZone(props)
{
  return  <AppContext.Consumer>
          {
            appcontext => <RoleDropZone_ systemExternalRole={appcontext.systemExternalRole} {...props}>{
              //eslint-disable-next-line react/prop-types
              props.children}</RoleDropZone_>
          }
          </AppContext.Consumer>;
}

RoleDropZone.propTypes =
  {
    ariaLabel: PropTypes.string.isRequired
  , bind: PropTypes.func.isRequired
  , checkbinding: PropTypes.func.isRequired
  };

class RoleDropZone_ extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
    this.eventDiv = React.createRef();
  }

  readClipBoard( receiveResults )
  {
    const component = this;
    PDRproxy.then(
      function(pproxy)
      {
        pproxy.getProperty(
          component.props.systemExternalRole,
          "model:System$PerspectivesSystem$External$CardClipBoard",
          "model:System$PerspectivesSystem$External",
          function (valArr)
          {
            if (valArr[0])
            {
              receiveResults( JSON.parse( valArr[0]) );
            }
            else
            {
              receiveResults({roleData: {}});
            }
          },
          FIREANDFORGET);
      });
  }

  tryToBind (event, {roleData, addedBehaviour} )
  {
    const component = this;
    if ( addedBehaviour.includes("fillARole"))
    {
      component.props.checkbinding( roleData,
        function( bindingAllowed )
        {
          if ( bindingAllowed)
          {
            component.props.bind( roleData );
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
  }

  handleKeyDown ( event )
  {
    const component = this;
    switch(event.keyCode){
      case 13: // Enter
      case 32: // space
      component.readClipBoard( function( roleDataAndBehaviour )
        {
          if (roleDataAndBehaviour.roleData.rolinstance)
          {
            component.tryToBind( event, roleDataAndBehaviour );
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
              className="p-2 dropzone"

              aria-dropeffect="execute"
              aria-label={component.props.ariaLabel}
            >
                {component.props.children}
            </div>;
  }
}

RoleDropZone_.propTypes =
  {
    ariaLabel: PropTypes.string.isRequired
  , bind: PropTypes.func.isRequired
  , checkbinding: PropTypes.func.isRequired
  , systemExternalRole: PropTypes.string.isRequired
  };
