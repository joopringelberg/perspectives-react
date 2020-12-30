const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;

import PerspectivesComponent from "./perspectivescomponent.js";
import {PSRoleInstances, PSContext} from "./reactcontexts";
import {isQualifiedName} from "./urifunctions.js";

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
    Perspectives.then(
      function (pproxy)
      {
        function bind ({rolinstance})
        {
          if (rolinstance)
          {
            // checkBinding( <contexttype>, <localRolName>, <binding>, [() -> undefined] )
            pproxy.checkBinding(
              component.context.contexttype,
              component.props.rol,
              rolinstance,
              function(psbool)
              {
                if ( psbool[0] === "true" )
                {
                  pproxy.bind(
                    component.context.contextinstance,
                    component.props.rol,
                    component.context.contexttype,
                    {properties: {}, binding: rolinstance},
                    component.context.myroletype,
                    function( /*rolId*/ ){});
                }
                else
                {
                  alert("Cannot bind!");
                }
              });
          }
        }

        function checkbinding({rolinstance}, callback)
        {
          // checkBinding( <contexttype>, <localRolName>, <binding>, [() -> undefined] )
          pproxy.checkBinding(
            component.context.contexttype,
            component.props.rol,
            rolinstance,
            function(psbool)
            {
              callback( psbool[0] === "true" );
            });
        }

        function getRol(rolTypeArr)
        {
          const rolType = rolTypeArr[0];
          if (!rolType)
          {
            throw("Rol: could not establish qualified name of Rol '" + component.props.rol + "' for Context '" + component.context.contexttype + "'.");
          }
          // Get the role kind. No need to unsubscribe: the result won't change.
          pproxy.getRoleKind( rolType,
            function(roleKindArr)
            {
              // Get role instances.
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
                                    const roleKind = roleKindArr[0];
                                    // If a ContextRole Kind, create a new context, too.
                                    if (roleKind == "ContextRole" && component.props.contexttocreate)
                                    {
                                      pproxy.createContext (
                                        {
                                          id: "", // will be set in the core.
                                          prototype : undefined,
                                          ctype: component.props.contexttocreate,
                                          rollen: {},
                                          externeProperties: {}
                                        },
                                        component.props.rol,
                                        component.context.contextinstance,
                                        component.context.contexttype,
                                        component.context.myroletype,
                                        // [<externalRoleId>(, <contextRoleId>)?]
                                        function(contextAndExternalRole)
                                        {
                                          // Return the new context role identifier!
                                          receiveResponse( contextAndExternalRole[1] );
                                        });
                                    }
                                    else
                                    {
                                      pproxy.createRole (
                                        component.context.contextinstance,
                                        rolType,
                                        component.context.myroletype,
                                        function(newRoleId_)
                                        {
                                          receiveResponse( newRoleId_[0] );
                                        });
                                    }
                                  }
                                , bind: bind
                                , checkbinding: checkbinding
                                };
                      }
                    );
                  }
              ));
            });
        }
        if (isQualifiedName( component.props.rol ))
        {
          getRol( [component.props.rol] );
        }
        else
        {
          component.addUnsubscriber(
            pproxy.getUnqualifiedRolType(
              component.context.contexttype,
              component.props.rol,
              getRol
          ));
        }
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
        </PSRoleInstances.Provider>);
    }
    else return null;
  }
}

RoleInstances.contextType = PSContext;

RoleInstances.propTypes =
  { rol: PropTypes.string.isRequired
  , contexttocreate: PropTypes.string };
