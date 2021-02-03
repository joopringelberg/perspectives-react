import React from "react";
import PropTypes from "prop-types";

import {AppContext, PSRol} from "./reactcontexts.js";

import PerspectivesComponent from "./perspectivescomponent.js";

const PDRproxy = require("perspectives-proxy").PDRproxy;

////////////////////////////////////////////////////////////////////////////////
// DROPZONE
////////////////////////////////////////////////////////////////////////////////
export default function CreateDropZone(props)
{
  return  <AppContext.Consumer>
          {
            appcontext => <BindDropZone_ systemExternalRole={appcontext.systemExternalRole} {...props}>{props.children}</BindDropZone_>
          }
          </AppContext.Consumer>;
}

class BindDropZone_ extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
    this.eventDiv = React.createRef();
  }

  componentDidMount()
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
              let info;
              if (valArr[0])
              {
                info = JSON.parse( valArr[0]);
                if (info.selectedRole && info.cardTitle)
                {
                  component.setState(info);
                }
                else
                {
                  component.setState({selectedRole: undefined, cardTitle: undefined}); // WERKT DIT WEL?
                }
              }
              else
              {
                component.setState({selectedRole: undefined, cardTitle: undefined}); // WERKT DIT WEL?
              }
            }));
      });
  }

// The dropzone only captures keys when a Card is on the CardClipboard.
  checkBinding ( event, roleId )
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
          // bind_ (binder, binding, myroletype)
          component.context.bind_( rolData );
          // Empty clipboard.
          PDRproxy.then( pproxy => pproxy.deleteProperty(
            component.props.systemExternalRole,
            "model:System$PerspectivesSystem$External$CardClipBoard",
            "model:System$PerspectivesSystem$External") );
        }
        else {
          component.eventDiv.current.classList.add("border-danger", "border");
        }
      } );
  }

  // The dropzone only captures keys when a Card is on the CardClipboard
  // (and when it has focus).
  handleKeyDown ( event )
  {
    const component = this;
    switch(event.keyCode){
      case 13: // Enter
      case 32: // space
        if ( component.allowedInstance === component.state.selectedRole )
        {
          // Bind the role.
          // bind_ (binder, binding, myroletype)
          component.context.bind_( {rolinstance: component.state.selectedRole} );
          // Empty clipboard.
          PDRproxy.then( pproxy => pproxy.deleteProperty(
            component.props.systemExternalRole,
            "model:System$PerspectivesSystem$External$CardClipBoard",
            "model:System$PerspectivesSystem$External") );
        }
        event.preventDefault();
        break;
      }
  }

  render ()
  {
    const component = this;
    const selectedRole = component.state.selectedRole;
    return  <div
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
              onFocus={ ev => { if (selectedRole) { component.checkBinding( ev, selectedRole ); } } }
              onDragLeave={ ev => ev.target.classList.remove("border-danger", "border", "border-success")}
              onBlur={ ev => ev.target.classList.remove("border-danger", "border", "border-success")}

              onDrop={ ev => component.handleDrop( ev, JSON.parse( ev.dataTransfer.getData("PSRol") ) ) }
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

BindDropZone_.propTypes =
  {
    ariaLabel: PropTypes.string.isRequired
  };

BindDropZone_.contextType = PSRol;
// we use bind and checkBinding.
