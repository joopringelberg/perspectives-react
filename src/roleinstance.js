const React = require("react");

import PerspectivesComponent from "./perspectivescomponent.js";

import {PSRol, AppContext} from "./reactcontexts";

import {Container, Form, Row, Col, Card} from "react-bootstrap";


////////////////////////////////////////////////////////////////////////////////
// ROLEINSTANCE
////////////////////////////////////////////////////////////////////////////////
// The result of roleInstance is a Component that wraps a displaying component with behaviour.
// The displaying component is draggable and selectable.
// CardComponent should be constructed with React.forwardRef.
export default function roleInstance (CardComponent)
{
  class RoleInstance extends PerspectivesComponent
  {
    constructor (props)
    {
      super(props);
      this.cardRef = React.createRef();
      this.roleInstanceRef = React.createRef();
      this.handleKeyDown = this.handleKeyDown.bind(this);
      this.handleClick = this.handleClick.bind(this);
    }

    handleKeyDown (event, setSelectedCard)
    {
      const component = this;
      switch(event.keyCode){
        case 13: // Enter
        case 32: // space
          setSelectedCard(component.cardRef.current, component.context.rolinstance);
          event.preventDefault();
          break;
      }
    }

    handleClick( event )
    {
      event.preventDefault();
      this.roleInstanceRef.current.dispatchEvent( new CustomEvent('RoleInstanceClicked', { detail: this.context.rolinstance, bubbles: true }) );
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
      return  <AppContext.Consumer>{ value =>
                <div draggable
                  tabIndex={component.context.isselected ? "0" : "-1"}
                  ref={component.roleInstanceRef}
                  key={this.context.rolinstance}
                  onDragStart={ev => ev.dataTransfer.setData("PSRol", JSON.stringify(this.context))}
                  onKeyDown={ev => component.handleKeyDown(ev, value.setSelectedCard)}
                  onClick={component.handleClick}
                  className="mb-2"
                 >
                  <CardComponent ref={component.cardRef}/>
                 </div>}
              </AppContext.Consumer>
    }
  }
  RoleInstance.contextType = PSRol;

  return RoleInstance;
}
