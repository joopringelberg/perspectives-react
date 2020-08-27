const React = require("react");

import PerspectivesComponent from "./perspectivescomponent.js";

import {PSRoleInstances} from "./reactcontexts";

import RoleInstances from "./roleinstances.js";

import RoleInstanceIterator from "./roleinstanceiterator.js"

// import {PropTypes} from "prop-types";
const PropTypes = require("prop-types");

////////////////////////////////////////////////////////////////////////////////
// CARDLIST
////////////////////////////////////////////////////////////////////////////////
export function CardList (props)
{
  return (<RoleInstances rol={props.rol}>
      <CardList_>{props.children}</CardList_>
    </RoleInstances>)
}

CardList.propTypes = { "rol": PropTypes.string.isRequired };

class CardList_ extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.eventDiv = React.createRef();
  }

  // -1 if not found.
  indexOfCurrentRole ()
  {
    return this.context.instances.indexOf(this.context.cursor);
  }

  handleKeyPress (event)
    {
      const component = this;
      const i = component.indexOfCurrentRole();

      // keydown only occurs after the component received focus, hence if there are instances, there is a value for currentRole.
      if (component.context.cursor)
      {
        // Check for up/down key presses
        switch(event.keyCode){
          case 40: // Down arrow
            if ( i < component.context.instances.length - 1 )
            {
              component.context.setcursor( component.context.instances[i + 1] );
            }
            event.preventDefault();
            break;
          case 38: // Up arrow
            if (i > 0)
            {
              component.context.setcursor( component.context.instances[i - 1] );
            }
            event.preventDefault();
            break;
        }
      }
  }

  componentDidMount ()
  {
    const component = this;
    component.eventDiv.current.addEventListener('RoleInstanceClicked',
      function (e)
      {
        component.context.setcursor( e.detail );
      },
      false);
  }

  render ()
  {
    const component = this;
    return (<div
              onKeyDown={ component.handleKeyPress }
              ref={component.eventDiv}
              >
        <RoleInstanceIterator>{ this.props.children }</RoleInstanceIterator>
      </div>)
  }
}

CardList_.contextType = PSRoleInstances;
