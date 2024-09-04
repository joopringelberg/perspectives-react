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
      , rolinstance: undefined
      , roltype: undefined
      , roleKind: undefined
      , bind_: undefined
      , bind: undefined
      , checkbinding: undefined
      , removerol: undefined
      , isselected: true
      , showRemoveContextModal: false
      };
    this.removeWithContext = this.removeWithContext.bind(this);
    this.removeWithoutContext = this.removeWithoutContext.bind(this);
  }

  componentDidMount ()
  {
    const component = this;
    PDRproxy.then(
      function (pproxy)
      {
        // see RoleData (in perspectivesshape.js) for the structure of the roleData argument that binds to the parameter.
        function bind_(roleData)
        {
          const filler = roleData.rolinstance;
          if (filler && component.props.roleinstance)
          {
            return pproxy
              .bind_(
                component.props.roleinstance,
                filler,
                component.props.myroletype)
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
        // see RoleData (in perspectivesshape.js) for the structure of the roleData argument that binds to the parameter.
        function bind ({rolinstance})
        {
          if (rolinstance)
          {
            return pproxy
              .bind(
                component.props.contextinstance,
                component.props.roletype,
                component.props.contexttype,
                {properties: {}, binding: rolinstance},
                component.props.myroletype)
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
        // see RoleData (in perspectivesshape.js) for the structure of the roleData argument that binds to the parameter.
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
          if (component.state.roleKind == "ContextRole" && component.props.roleinstance && component.props.allowedtoremovecontext)
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
        component.setState( 
          { contextinstance: component.props.contextinstance
          , contexttype: component.props.contexttype
          , roltype: component.props.roletype
          , roleKind: component.props.rolekind
          , bind_
          , bind
          , checkbinding
          , removerol
          , rolinstance: component.props.roleinstance
          , isselected: true // To accommodate the PSRol definition.
        });
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
            component.props.myroletype)
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
              component.props.myroletype)
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
    if (component.stateIsComplete(["rolinstance"]))
    {
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
      return null;
    }
  }
}

RoleInstance.propTypes =
  { roleinstance: PropTypes.string
  , roletype: PropTypes.string.isRequired
  , rolekind: PropTypes.string.isRequired
  , contextinstance: PropTypes.string.isRequired
  , contexttype: PropTypes.string.isRequired
  , myroletype: PropTypes.string.isRequired
  , allowedtoremovecontext: PropTypes.bool.isRequired
  };
