import React from "react";

import PropTypes from "prop-types";

import PerspectivesComponent from "./perspectivescomponent.js";

import {PSRol, PSContext} from "./reactcontexts";

import {PDRproxy, FIREANDFORGET} from "perspectives-proxy";


import {isQualifiedName} from "./urifunctions.js";
import BinaryModal from "./binarymodal.js";
import {UserMessagingPromise} from "./userMessaging.js";
import i18next from "i18next";

////////////////////////////////////////////////////////////////////////////////
// ROLEINSTANCE
////////////////////////////////////////////////////////////////////////////////
/*
This component provides a PSRol context.
It supports six props, none of which are required:
  - roleinstance: the identifier of a role instance;
  - roletype, its type
  - rolekind, its kind
  - contextinstance: the identifier of a context instance;
  - role: the name of the Role, possibly unqualified;
  - contexttocreate: either a fully qualified context type name, or a local name with a default namespace prefix:
    "cdb" : "model://perspectives.system#Couchdb"
    "sys" : "model:://perspectives.system#System"
    "usr" : "model:://perspectives.system#User"
    "ser" : "model:://perspectives.system#Serialise
    "p"   : "model:://perspectives.system#Parsing"
If `roleinstance` is given, it is used to create the PSRol instance. If roletype or rolekind
are missing, they are fetched from the core.
Otherwise, role must be given and then it is used to create the PSRol instance.
If contextinstance is given, it overrides the contextinstance of the PSContext react context of RoleInstance.
If the Role identified by the `role` prop is a ContextRole, `contexttocreate` identifies the type of context
that will be created if an instance of the Role is created.
The core loads the model that defines this type, if it is not locally available.
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
      , showRemoveContextModal: false
      };
    this.removeWithContext = this.removeWithContext.bind(this);
    this.removeWithoutContext = this.removeWithoutContext.bind(this);
  }

  contextInstance()
  {
    if (this.props.contextinstance)
    {
      return this.props.contextinstance;
    }
    else
    {
      return this.context.contextinstance;
    }
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
                component.contextInstance(),
                component.context.contexttype,
                component.context.myroletype)
              .then( function(contextAndExternalRole)
                {
                  component.setState({roleinstance: contextAndExternalRole[0]});
                  // Return the new context role identifier!
                  receiveResponse( contextAndExternalRole[1] );
                })
              .catch(e => UserMessagingPromise.then( um => 
                um.addMessageForEndUser(
                  { title: i18next.t("createContext_title", { ns: 'preact' }) 
                  , message: i18next.t("createContext_message", {ns: 'preact', type: component.context.contexttype})
                  , error: e.toString()
                  })));
          }
          else
          {
            pproxy
              .createRole (
                component.contextInstance(),
                component.state.roltype,
                component.context.myroletype)
              .then( newRoleId_ =>
                {
                  component.setState({roleinstance: newRoleId_[0]});
                  receiveResponse( newRoleId_[0] );
                })
              .catch(e => UserMessagingPromise.then( um => 
                um.addMessageForEndUser(
                  { title: i18next.t("createRole_title", { ns: 'preact' }) 
                  , message: i18next.t("createRole_message", {ns: 'preact', roletype: component.state.roltype})
                  , error: e.toString()
                  })));
                }
        });
    }

  componentDidMount ()
  {
    const component = this;
    PDRproxy.then(
      function (pproxy)
      {
        function bind_(filledRole)
        {
          return function ({rolinstance})
          {
            if (rolinstance)
            {
              return pproxy
                .bind_(
                  filledRole,
                  rolinstance,
                  component.context.myroletype)
                .catch(e => UserMessagingPromise.then( um => 
                  {
                    um.addMessageForEndUser(
                      { title: i18next.t("fillRole_title", { ns: 'preact' }) 
                      , message: i18next.t("fillRole_message", {ns: 'preact' })
                      , error: e.toString()
                    });
                    component.setState({showRemoveContextModal: false})
                  }));
            }
            else return new Promise((resolve, reject) => { reject(false) });
          }
        }

        // returns a promise for a boolean value.
        function bind ({rolinstance})
        {
          if (rolinstance)
          {
            return pproxy
              .bind(
                component.contextInstance(),
                component.props.role, // may be a local name.
                component.context.contexttype,
                {properties: {}, binding: rolinstance},
                component.context.myroletype)
              .catch(e => UserMessagingPromise.then( um => 
                {
                  um.addMessageForEndUser(
                    { title: i18next.t("fillRole_title", { ns: 'preact' }) 
                    , message: i18next.t("fillRole_message", {ns: 'preact' })
                    , error: e.toString()
                  });
                  component.setState({showRemoveContextModal: false})
                }));
          }
          else return new Promise((resolve, reject) => { reject(false) });
        }

        // returns a promise for a boolean value.
        function checkbinding({rolinstance})
        {
          // checkBinding( <(QUALIFIED)RolName>, <binding>, [() -> undefined] )
          // Where RolName identifies the role whose binding specification we want to compare with <binding>.
          return pproxy
            .checkBindingP(
              component.state.roltype,
              rolinstance)
            .then( psbool => psbool[0] === "true");
        }

        function removerol()
        {
          if (component.state.roleKind == "ContextRole")
          {
            pproxy.getBinding (
              component.props.roleinstance, 
              function( values )
              {
                if (values.length == 0)
                {
                  component.removeWithoutContext();
                }
                else 
                {
                  // Ask the user whether she wants to remove the context as well.
                  component.setState({showRemoveContextModal: true});
                }      
              }, 
              FIREANDFORGET)
          }
          else
          {
            component.removeWithoutContext();
          }
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
              component.contextInstance(),
              rolType,
              function(rolIdArr)
              {
                buildPSRol(rolIdArr[0], rolType);
              }
          ));
        }

        function getPSRolFromInstance(rolinstance)
        {
          if (component.props.roletype)
          {
            buildPSRol(rolinstance, component.props.roletype);
          }
          else
          {
            pproxy.getRolType(rolinstance)
              .then( rolTypeArr => buildPSRol(rolinstance, rolTypeArr[0]) )
              .catch(e => UserMessagingPromise.then( um => 
                um.addMessageForEndUser(
                  { title: i18next.t("role_title", { ns: 'preact' }) 
                  , message: i18next.t("role_message", {ns: 'preact', role: rolinstance})
                  , error: e.toString()
                  })));
          }
        }

        function buildPSRol(rolinstance, roltype)
        {
          if (component.props.rolekind)
          {
            component.setState( { contextinstance: component.contextInstance()
                        , contexttype: component.context.contexttype
                        , roltype
                        , roleKind: component.props.rolekind
                        , bind_: bind_( rolinstance )
                        , bind
                        , checkbinding
                        , removerol
                        , rolinstance
                        , isselected: true // To accommodate the PSRol definition.
                      });
          }
          else
          {
            // Get the role kind. No need to unsubscribe: the result won't change.
            pproxy.getRoleKind( roltype )
              .then (function(roleKindArr)
                {
                  const roleKind = roleKindArr[0];
                  component.setState( { contextinstance: component.contextInstance()
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
                })
              .catch(e => UserMessagingPromise.then( um => 
                um.addMessageForEndUser(
                  { title: i18next.t("rolekind_title", { ns: 'preact' }) 
                  , message: i18next.t("rolekind_message", {ns: 'preact', role: roltype })
                  , error: e.toString()
                  })));
          }
        }

        if (component.props.roleinstance)
        {
          getPSRolFromInstance( component.props.roleinstance );
        }
        else if (component.props.role)
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
        else
        {
          console.warn("RoleInstance needs a value for either the `role` or the `roleinstance` prop!");
        }
      });
  }

  removeWithContext()
  {
    const component = this;
    PDRproxy.then(
      function (pproxy)
      {
        pproxy
          .removeContext(
            component.state.rolinstance,
            component.state.roltype, // is always qualified.
            component.context.myroletype)
          .then( () => component.setState({showRemoveContextModal: false}))
          .catch(e => UserMessagingPromise.then( um => 
            {
              um.addMessageForEndUser(
                { title: i18next.t("removeContext_title", { ns: 'preact' }) 
                , message: i18next.t("removeContext_message", {ns: 'preact' })
                , error: e.toString()
              });
              component.setState({showRemoveContextModal: false});
            }));
      });
  }

  removeWithoutContext()
  {
    const component = this;
      PDRproxy.then(
        function (pproxy)
        {
          pproxy
            .removeRol(
              component.state.roltype,
              component.state.rolinstance,
              component.context.myroletype)
            .then( () => component.setState({showRemoveContextModal: false}) )
            .catch(e => UserMessagingPromise.then( um => 
              {
                um.addMessageForEndUser(
                  { title: i18next.t("removeRole_title", { ns: 'preact' }) 
                  , message: i18next.t("removeRole_message", {ns: 'preact' })
                  , error: e.toString()
                });
                component.setState({showRemoveContextModal: false})
              }))
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
        return  <>
                  <PSRol.Provider value={component.state}>
                    {children}
                  </PSRol.Provider>
                  <BinaryModal
                    title={i18next.t("roleinstance_removecontext_title", { ns: 'preact' })}
                    message={i18next.t("roleinstance_removecontextmessage", { ns: 'preact' })}
                    show={component.state.showRemoveContextModal}
                    yes={component.removeWithContext}
                    no={component.removeWithoutContext}
                    close={() => component.setState({showRemoveContextModal: false})}
                    />
                </>;
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

RoleInstance.propTypes =
  { role: PropTypes.string
  , roleinstance: PropTypes.string
  , roletype: PropTypes.string
  , rolekind: PropTypes.string
  , contextinstance: PropTypes.string
  // fully qualified name: the type of Context to create.
  // The core loads the model that defines this type, if it is not locally available.
  , contexttocreate: PropTypes.string };
