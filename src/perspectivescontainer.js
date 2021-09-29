const React = require("react");
const Component = React.PureComponent;

import { PDRproxy, FIREANDFORGET } from 'perspectives-proxy';

import PropTypes from "prop-types";

import Screen from "./screen.js";

import {RoleFormInView} from "./roleform.js";

import View from "./view.js";

import RoleInstance from "./roleinstance.js";

import
  { Button
  , Container
  } from "react-bootstrap";

// Embed the React component that embodies a users' perspectives on a context type in a PerspectivesContainer
// to add functionality to open a subcontext and navigate back to it again.
// Navigating is event-based:
//  - Dispatch `OpenContext` with a payload that identifies the context instance to open.
//    It will be opened in a Screen component and Screen opens a new - and thus embedded - PerspectivesContainer.
//  - Use the history.back function to close the Screen and re-open the other content.

// TODO:
// * If a RoleForm is open, it is possible to open a context in this component; however, not the other way around.
//   This is because when a subcontext is selected, it adds a PerspectivesComponent to the tree that will catch
//   the OpenRoleForm event. Hence this component will not catch OpenRoleForm events!
export class PerspectivesContainer extends Component
{
  constructor(props)
  {
    super(props);
    this.showNotifications = Notification.permission === "granted";
    this.notifications = [];
    // State holds either selectedContext or selectedRoleInstance, not both.
    this.state =
      { selectedContext: undefined
      , selectedRoleInstance: undefined
      , viewname: undefined
      , cardprop: undefined
      , backwardsNavigation: undefined
      };
    this.containerRef = React.createRef();
  }

  componentDidMount ()
  {
    const component = this;
    window.onpopstate = function(e)
      {
        if (e.state && (e.state.selectedContext || e.state.selectedRoleInstance))
        {
          // console.log("Popping previous state, now on " + (e.state.selectedContext ? "context state " + e.state.selectedContext : "roleform state " + e.state.selectedRoleInstance));
          // Restore the selectedContext or selectedRoleInstance, if any.
          component.setState(
            { selectedContext: e.state.selectedContext
            , selectedRoleInstance: e.state.selectedRoleInstance
            , viewname: e.state.viewname
            , cardprop: e.state.cardprop
            , backwardsNavigation: true} );
          e.stopPropagation();
        }
      };
    this.containerRef.current.addEventListener( "OpenContext",
      function(e)
      {
        history.pushState({ selectedContext: e.detail }, "");
        // console.log("Pushing context state " + e.detail);
        component.setState(
          { selectedContext: e.detail
          , selectedRoleInstance: undefined
          , viewname: undefined
          , cardprop: undefined
          , backwardsNavigation: false });
        e.stopPropagation();
      });
    this.containerRef.current.addEventListener( "OpenRoleForm",
      function(e)
      {
        const {rolinstance, viewname, cardprop} = e.detail;
        // Save in the history object.
        history.pushState({ selectedRoleInstance: rolinstance, viewname, cardprop }, "");
        // console.log("Pushing roleform state " + rolinstance);
        component.setState(
            { selectedContext: undefined
            , selectedRoleInstance: rolinstance
            , viewname
            , cardprop
            , backwardsNavigation: false });
        e.stopPropagation();
      });
      PDRproxy.then( pproxy =>
        pproxy.getRol (component.props.systemcontextinstance,
          "model:System$PerspectivesSystem$AllNotifications",
          function(notifications)
          {
            const oldNotifications = component.notifications;
            let newNotifications;
            if ( oldNotifications.length === 0 && notifications.length > 1 )
            {
              newNotifications = [];
            }
            else
            {
              newNotifications = notifications.filter(x => !oldNotifications.includes(x));
            }
            component.notifications = notifications;
            if (component.showNotifications)
            {
              newNotifications.forEach( function(notification)
                {
                  pproxy.getProperty(
                    notification,
                    "model:System$ContextWithNotification$Notifications$Message",
                    "model:System$ContextWithNotification$Notifications",
                    function( messages )
                    {
                      // A minimal message.
                      const n = new Notification(
                        messages[0],
                        { data: {roleId: notification}
                        });
                      n.onclick = function(e)
                          {
                            pproxy.getRolContext(
                              notification,
                              function (contextIdArray)
                              {
                                if (history.state && history.state.selectedContext != contextIdArray[0])
                                {
                                  history.pushState({ selectedContext: contextIdArray[0] }, "");
                                  // console.log("Pushing context state " + e.detail);
                                  component.setState(
                                    { selectedContext: contextIdArray[0]
                                    , selectedRoleInstance: undefined
                                    , viewname: undefined
                                    , cardprop: undefined
                                    , backwardsNavigation: false });
                                }
                                e.stopPropagation();
                              },
                              FIREANDFORGET);
                          };

                    }
                  );
                });
              }
          }) );
  }

  render ()
  {
    const component = this;
    // Move all props given to PerspectivesContainer, except for the children, to Container.
    const props = {};
    Object.assign(props, component.props);
    props.children = undefined;

    return  <Container ref={component.containerRef} {...props}>
            {
              component.state.selectedContext
              ?
              <Screen rolinstance={component.state.selectedContext} shownotifications={component.props.shownotifications}/>
              :
              (component.state.selectedRoleInstance
                ?
                <RoleInstance roleinstance={component.state.selectedRoleInstance}>
                  <View viewname={component.state.viewname}>
                    <RoleFormInView cardprop={component.state.cardprop ? component.state.cardprop : null}/>
                  </View>
                </RoleInstance>
                :
                component.props.children
)
           }</Container>;
  }
}

PerspectivesContainer.propTypes =
  { systemcontextinstance: PropTypes.string.isRequired
  , shownotifications: PropTypes.bool.isRequired
  };

// Use like this:
//  <BackButton buttontext="Back to all chats"/>
export function BackButton(props)
{
  const ref = React.createRef();
  return <Button ref={ref} href="#" onClick={() => history.back()}>{ props.buttontext }</Button>;
}

BackButton.propTypes = {buttontext: PropTypes.string.isRequired};
