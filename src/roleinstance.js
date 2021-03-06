const React = require("react");

import PropTypes from "prop-types";

import PerspectivesComponent from "./perspectivescomponent.js";

import {PSRol, PSContext} from "./reactcontexts";

const PDRproxy = require("perspectives-proxy").PDRproxy;

import {isQualifiedName} from "./urifunctions.js";

////////////////////////////////////////////////////////////////////////////////
// ROLEINSTANCE
////////////////////////////////////////////////////////////////////////////////
/*
This component provides a PSRol context.
It supports two props:
  - role: the name of the Role, possibly unqualified;
  - contexttocreate: either a fully qualified context type name, or a local name with a default namespace prefix:
    "cdb" : "model:Couchdb"
    "sys" : "model:System"
    "usr" : "model:User"
    "ser" : "model:Serialise
    "p"   : "model:Parsing"
If the Role identified by the `role` prop is a ContextRole, `contexttocreate` identifies the type of context
that will be created if an instance of the Role is created.
If given a single child, and if there is an instance of the Role, this will be rendered in a PSRol context.
If given more children, and if there is NO instance of the Role, the first child will be rendered.
If given more children and if there is an instance of the Role, all but the first child will be rendered.
Otherwise nothing will be rendered.
*/
export default class RoleInstance extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
    this.eventDiv = React.createRef();
    // We omit the functions.
    this.state =
      { contextinstance: undefined
      , contexttype: undefined
      , roltype: undefined
      , roleKind: undefined
      , isselected: true
      };
  }

  createRole (receiveResponse)
  {
      const component = this;
      // If a ContextRole Kind, create a new context, too.
      PDRproxy.then(
        function (pproxy)
        {

          if (component.state.roleKind == "ContextRole" && component.props.contexttocreate)
          {
            pproxy.createContext (
              {
                id: "", // will be set in the core.
                prototype : undefined,
                ctype: component.props.contexttocreate,
                rollen: {},
                externeProperties: {}
              },
              component.state.roltype,
              component.context.contextinstance,
              component.context.contexttype,
              component.context.myroletype,
              function(contextAndExternalRole)
              {
                component.setState({roleinstance: contextAndExternalRole[0]});
                // Return the new context role identifier!
                receiveResponse( contextAndExternalRole[1] );
              });
          }
          else
          {
            pproxy.createRole (
              component.context.contextinstance,
              component.state.roltype,
              component.context.myroletype,
              function(newRoleId_)
              {
                component.setState({roleinstance: newRoleId_[0]});
                receiveResponse( newRoleId_[0] );
              });
          }
        });
    }

  componentDidMount ()
  {
    const component = this;
    PDRproxy.then(
      function (pproxy)
      {
        function bind_(rolInstance)
        {
          return function({rolinstance})
            {
              if (rolinstance)
              {
                // checkBinding( <contexttype>, <localRolName>, <binding>, [() -> undefined] )
                PDRproxy.then(
                  function (pproxy)
                  {
                    pproxy.checkBinding(
                      component.context.contexttype,
                      component.state.roltype,
                      rolinstance,
                      function(psbool)
                      {
                        if ( psbool[0] === "true" )
                        {
                          pproxy.bind_(
                            rolInstance, // binder: component.state.rolinstance?
                            rolinstance, // binding
                            component.context.myroletype,
                            function( /*rolId*/ ){});
                        }
                        else
                        {
                          alert("Cannot bind_!");
                        }
                      });
                });
              }
            };
        }

        function bind ({rolinstance})
        {
          if (rolinstance)
          {
            pproxy.bind(
              component.context.contextinstance,
              component.props.role, // may be a local name.
              component.context.contexttype,
              {properties: {}, binding: rolinstance},
              component.context.myroletype,
              function( /*rolId*/ ){});
          }
        }

        function checkbinding({rolinstance}, callback)
        {
          // checkBinding( <contexttype>, <localRolName>, <binding>, [() -> undefined] )
          pproxy.checkBinding(
            component.context.contexttype,
            component.state.roltype,
            rolinstance,
            function(psbool)
            {
              callback( psbool[0] === "true" );
            });
        }

        function removerol()
        {
          PDRproxy.then(
            function (pproxy)
            {
              pproxy.removeRol(
                component.context.contexttype,
                component.state.roltype,
                component.state.rolinstance,
                component.context.myroletype );
            });
        }

        // Will be called exactly once, with the qualified name of the role.
        function getPSRolFromType(rolTypeArr)
        {
          const rolType = rolTypeArr[0];
          if (!rolType)
          {
            throw("Rol: could not establish qualified name of Rol '" + component.props.role + "' for Context '" + component.context.contexttype + "'.");
          }
          // Get role instance.
          component.addUnsubscriber(
            pproxy.getRol(
              component.context.contextinstance,
              rolType,
              function(rolIdArr)
              {
                buildPSRol(rolIdArr[0], rolType);
              }
          ));
        }

        function getPSRolFromInstance(rolinstance)
        {
          pproxy.getRolType(rolinstance, function( rolTypeArr )
            {
              buildPSRol(rolinstance, rolTypeArr[0]);
            });
        }

        function buildPSRol(rolinstance, roltype)
        {
          // Get the role kind. No need to unsubscribe: the result won't change.
          pproxy.getRoleKind( roltype,
            function(roleKindArr)
            {
              const roleKind = roleKindArr[0];
              component.setState( { contextinstance: component.context.contextinstance
                          , contexttype: component.context.contexttype
                          , roltype
                          , roleKind
                          , bind_: bind_( rolinstance )
                          , bind
                          , checkbinding
                          , removerol
                          , rolinstance
                          , isselected: true // To accommodate the PSRol definition.
                        });
            });
        }

        if (component.props.role)
        {
          if (isQualifiedName( component.props.role ))
          {
            getPSRolFromType( [component.props.role] );
          }
          else
          {
            component.addUnsubscriber(
              pproxy.getUnqualifiedRolType(
                component.context.contexttype,
                component.props.role,
                getPSRolFromType
            ));
          }
        }
        else if (component.props.roleinstance)
        {
          getPSRolFromInstance( component.props.roleinstance );
        }
        else
        {
          console.warn("RoleInstance needs a value for either the `role` or the `roleinstance` prop!");
        }
      });
  }

  render ()
  {
    const component = this;
    let defaultElement, children;
    if (React.Children.count( component.props.children ) == 1)
    {
      children = component.props.children;
    }
    else
    {
      children = React.Children.toArray( component.props.children );
      defaultElement = children[0];
      children = children.slice(1);
    }
    if ( component.state.contextinstance )
    {
      if (component.state.rolinstance)
      {
        return  <PSRol.Provider value={component.state}>
                  {children}
                </PSRol.Provider>;
      }
      else if ( defaultElement )
      {
        // The provided PSRol instance misses the `roleinstance` value, but
        // has an extra prop `createrole`.
        return  <PSRol.Provider value={component.state}>
                  {
                    React.cloneElement( defaultElement, {createrole: (receiveResponse) => component.createRole(receiveResponse)})
                  }
                </PSRol.Provider>;
      }
      else
      {
        return <div/>;
      }
    }
    else
    {
      return <div/>;
    }
  }
}

RoleInstance.contextType = PSContext;

// Either role or roleinstance is required!
RoleInstance.propTypes =
  { role: PropTypes.string
  , roleinstance: PropTypes.string
  , contexttocreate: PropTypes.string };
