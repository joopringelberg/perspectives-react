const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;

import PerspectivesComponent from "./perspectivescomponent.js";
import {PSRoleInstances, PSContext} from "./reactcontexts";

export default class RoleInstances extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
    const component = this;
    component.state.instances = undefined;
    this.eventDiv = React.createRef();
    this.handleKeyPress = this.handleKeyPress.bind(this);
  }

  componentDidMount ()
  {
    const component = this;
    let rolinstance
    Perspectives.then(
      function (pproxy)
      {
        component.addUnsubscriber(
          pproxy.getUnqualifiedRolType(
            component.context.contexttype,
            component.props.rol,
            function(rolTypeArr)
            {
              const rolType = rolTypeArr[0];
              if (!rolType)
              {
                throw("Rol: could not establish qualified name of Rol '" + component.props.rol + "' for Context '" + component.context.contexttype + "'.");
              }
              component.addUnsubscriber(
                pproxy.getRol(
                  component.context.contextinstance,
                  rolType,
                  function(rolIdArr)
                  {
                    component.setState( function( oldState )
                      {
                        let nextCursor;
                        if ( rolIdArr.indexOf(oldState.cursor) < 0 )
                        {
                          nextCursor = nextCursor = rolIdArr[0] || -1;
                        }
                        else {
                          nextCursor = oldState.cursor;
                        }
                        return  { contextinstance: component.context.contextinstance
                                , contexttype: component.context.contexttype
                                , rol: component.props.rol
                                , roltype: rolType
                                , instances: rolIdArr.sort()
                                , cursor: nextCursor
                                , setcursor: function(cr)
                                  {
                                    if (cr !== component.state.cursor )
                                    {
                                      component.setState( {cursor: cr} );
                                    }
                                  }
                                , createRole: function (receiveResponse)
                                  {
                                    pproxy.createRole (
                                      component.context.contextinstance,
                                      rolType,
                                      component.context.myroletype,
                                      function(newRoleId_)
                                      {
                                        receiveResponse( newRoleId_[0] );
                                      }
                                      );
                                  }
                                };
                      }
                    )
                  }
              ))
            }
        ))
      });
      if (component.stateIsComplete())
      {
        component.eventDiv.current.addEventListener('SetCursor',
          function (e)
          {
            component.state.setcursor( e.detail );
            e.stopPropagation();
          },
          false);
      }
  }

  componentDidUpdate (prevProps, prevState)
  {
    const component = this;
    if ( component.stateIsComplete() && !prevState.instances )
    {
      component.eventDiv.current.addEventListener('SetCursor',
        function (e)
        {
          component.state.setcursor( e.detail );
          e.stopPropagation();
        },
        false);
    }
  }

  // -1 if not found.
  indexOfCurrentRole ()
  {
    return this.state.instances.indexOf(this.state.cursor);
  }

  handleKeyPress (event)
    {
      const component = this;
      const i = component.indexOfCurrentRole();

      // keydown only occurs after the component received focus, hence if there are instances, there is a value for currentRole.
      if (component.state.cursor)
      {
        // Check for up/down key presses
        switch(event.keyCode){
          case 40: // Down arrow
            if ( i < component.state.instances.length - 1 )
            {
              component.state.setcursor( component.state.instances[i + 1] );
            }
            event.preventDefault();
            break;
          case 38: // Up arrow
            if (i > 0)
            {
              component.state.setcursor( component.state.instances[i - 1] );
            }
            event.preventDefault();
            break;
        }
      }
  }

  render ()
  {
    const component = this;
    if (component.stateIsComplete())
    {
      return (<PSRoleInstances.Provider value={component.state}>
          <div
            ref={component.eventDiv}
            onKeyDown={ component.handleKeyPress }
          >
            {component.props.children}
          </div>
        </PSRoleInstances.Provider>)
    }
    else return null;
  }
}

RoleInstances.contextType = PSContext;

RoleInstances.propTypes = { rol: PropTypes.string.isRequired };

// Rol_ passes on through PSRol_:
// contextinstance
// contexttype
// rol
// roltype
// instances
