const React = require("react");

import PropTypes from "prop-types";

import PerspectivesComponent from "./perspectivescomponent.js";

import {PSRol, AppContext, PSContext} from "./reactcontexts";

const PDRproxy = require("perspectives-proxy").PDRproxy;


////////////////////////////////////////////////////////////////////////////////
// ROLEINSTANCE
////////////////////////////////////////////////////////////////////////////////
// The result of roleInstance is a Component that wraps a displaying component with behaviour.
// The displaying component is draggable and selectable.
// It can also be selected with tab.
// Once it has focus, 'enter' and 'space' will select this element as the cursor
// of a surrounding Rol.
// Use shift in combination with 'enter' and 'space' instead to simulate a click on
// the CardComponent.
// CardComponent should be constructed with React.forwardRef.
export default function roleInstance (CardComponent)
{
  class RoleInstance extends PerspectivesComponent
  {
    constructor (props)
    {
      super(props);
      // This is a reference to the DOM element that displays the card itself.
      // It will be passed on to CardComponent through its `ref` prop.
      // We need it to send a click to the card to trigger its custom behaviour such as opening a context.
      // We need it to select the card (so it moves to the clipboard).
      this.cardRef = React.createRef();
      // This is the reference to the div DOM element that will be dragged and dropped.
      // It receives focus and is used to dispatch the SetCursor custom event.
      this.roleInstanceRef = React.createRef();
      this.handleKeyDown = this.handleKeyDown.bind(this);
      this.setCursor = this.setCursor.bind(this);
    }

    handleKeyDown (event, systemExternalRole, myroletype)
    {
      const component = this;
      switch(event.keyCode){
        case 13: // Enter
        case 32: // space
          if ( event.shiftKey )
          {
            // Click card to trigger custom behaviour associated with it,
            // like opening a context.
            this.cardRef.current.dispatchEvent( new MouseEvent("click",
              {
                bubbles: true,
                cancelable: true,
                view: window
              }) );
          }
          else
          {
            // Set information in the CardClipboard external property of model:System$PerspectivesSystem.
            PDRproxy.then( pproxy =>
              pproxy.getPropertyFromLocalName(
                component.context.rolinstance,
                component.props.labelProperty,
                component.context.roltype,
                function(valArr)
                {
                  pproxy.setProperty(
                    systemExternalRole,
                    "model:System$PerspectivesSystem$External$CardClipBoard",
                    JSON.stringify(
                      { selectedRole: component.context.rolinstance
                      , cardTitle: valArr[0]
                      , roleType: component.context.roltype
                      , contextType: component.context.contexttype
                      }),
                    myroletype);
                }
              )
            );
          }
          event.preventDefault();
          event.stopPropagation();
          break;
        case 8: // Backspace
          component.context.removerol();
          event.preventDefault();
          event.stopPropagation();
          break;
      }
    }

    setCursor( event )
    {
      event.preventDefault();
      event.stopPropagation();
      this.roleInstanceRef.current.dispatchEvent( new CustomEvent('SetCursor', { detail: this.context.rolinstance, bubbles: true }) );
    }

    componentDidUpdate ()
    {
      const component = this;
      if (component.context.isselected)
      {
        this.roleInstanceRef.current.focus();
      }
    }

    render ()
    {
      const component = this;
      const props = Object.assign({ref: component.cardRef}, component.props);
      return  <PSContext.Consumer>{ pscontext =>
                <AppContext.Consumer>{ appcontext =>
                  <div draggable
                    aria-label={component.props.label}
                    tabIndex={component.context.isselected ? "0" : "-1"}
                    ref={component.roleInstanceRef}
                    key={component.context.rolinstance}
                    onDragStart={ev => ev.dataTransfer.setData("PSRol", JSON.stringify(component.context))}
                    onKeyDown={ev => component.handleKeyDown(ev, appcontext.systemExternalRole, pscontext.myroletype)}
                    onClick={component.setCursor}
                    className="mb-2"
                    onFocus={component.setCursor}
                   >
                    <CardComponent {...props}/>
                   </div>}
                </AppContext.Consumer>
              }</PSContext.Consumer>;
    }
  }
  RoleInstance.contextType = PSRol;
  RoleInstance.propTypes = {labelProperty: PropTypes.string.isRequired};

  return RoleInstance;
}
