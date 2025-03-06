// import {PDRproxy} from "perspectives-proxy";

import {PDRproxy, FIREANDFORGET, RoleInstanceT, PropertyType, RoleType, ValueT} from "perspectives-proxy";
import {isQualifiedName} from "./urifunctions";
import { default as ModelDependencies } from "./modelDependencies";
import {UserMessagingPromise} from "./userMessaging.js";
import i18next from "i18next";
import { RoleOnClipboard } from "./perspectivesshape";
import { PSRolType } from "./reactcontexts";
import { t } from "i18next";
import React from 'react';
// import { useLongPress } from 'use-long-press';

/*
This module gives functions that add behaviour to a component that represents a role.
The functions build on the assumption that this role component has a PSRol context.
We will call that component a `Card` here, though there is no reason to use a Reactbootstrap.Card component.
However, it must be class based (implemented by extending React Component and it must implement the
CardProperties interface.

Add behaviours to the Card by using the AdorningComponentWrapper Component.

IMPLEMENTATION NOTES.
1. The behaviours stack handlers. However, for the dragstart event that is not possible. Hence
we check whether a handler exists before installing one and will call the old one if appropriate.

2. As soon as one behaviour allows dragging, this would unlock all behaviours accessible by dropping the target, e.g.
on a tool in the bar or on a dropzone. To prevent this, we annotate the React element with the behaviours added to it.
On dropping, we check those annotations to prevent behaviour that was not added (e.g. when dropping on the Trash we make sure
that the removerolefromcontext behaviour was added to the origin component).
The behaviour annotations are kept in an array of strings in the member "addedBehaviour". Possible values are:
  - openContextOrRoleForm
  - fillWithARole
  - fillARole
  - removeFiller
  - removeRoleFromContext
*/

export interface ComponentProps {
  viewname?: string;
  cardprop?: PropertyType;
  setEventDispatcher: (dispatcher: EventDispatcher) => void;
  myroletype: RoleType;
  systemExternalRole: RoleInstanceT;
  labelProperty: PropertyType;
}

export interface CardProperties {
  title: string;
  labelProperty: PropertyType;
  tabIndex?: number;
  className?: string;
  onClick?: (event: React.MouseEvent) => void;
}

export interface BehaviourComponent extends React.Component<ComponentProps> {
  context: PSRolType;
  addedBehaviour: string[];
}

type EventDispatcher = (data: RoleOnClipboard) => void;

// All the functions that add a behaviour have type BehaviourAdder.
export type BehaviourAdder = (domEl: HTMLElement, component: BehaviourComponent) => void;

////////////////////////////////////////
// OPEN CONTEXT OR ROLE FORM
////////////////////////////////////////
// adds a doubleclick handler and a keydown handler.
//  - doubleclick opens in the same screen;
//  - shift-doubleclick opens in another screen (tab or window).
//  - shift-space opens the contextrole or external rol in the same screen;
//  - alt-shift-space opens it in another screen (tab or window).
// If the role has rolekind RoleInContext or UserRole, the RoleForm is opened.
// If the role has rolekind ContextRole or ExternalRole, the corresponding context is opened, unless FormMode is active.
// In that case, the RoleForm is opened.
// The component that adds this behaviour may receive three additional props:
//  * viewname, giving the view that is used for the RoleForm (default is "allProperties");
//  * cardprop, that makes a card appear on the form, representing the role itself, when specified.
//  * setEventDispatcher, a function to set a function in the App context that will
//    dispatch the OpenRoleForm event on the component. This function will be called
//    from the OpenRoleForm tool in App.

export function addOpenContextOrRoleForm(domEl: HTMLElement, component: BehaviourComponent)  {
  function handle(onNewTab: boolean) {
    const roleKind = component.context.roleKind;
    const viewname = component.props.viewname ? component.props.viewname : "allProperties";
    const cardprop = component.props.cardprop;
    const appLocation = location.origin + location.pathname;
    if (roleKind == "ContextRole" || roleKind == "ExternalRole") {
      if (onNewTab) {
        window.open(appLocation + "?opencontext=" + encodeURIComponent(component.context.rolinstance!), "mycontexts", "left=100,top=100,width=800,height=600");
      } else {
        domEl.dispatchEvent(new CustomEvent('OpenContext', { detail: component.context.rolinstance, bubbles: true }));
      }
    } else {
      if (onNewTab) {
        window.open(appLocation + "?openroleform=" + encodeURIComponent(component.context.rolinstance!) + "&viewname=" + viewname + "&cardprop=" + cardprop, "mycontexts", "left=100,top=100,width=800,height=600");
      } else {
        domEl.dispatchEvent(new CustomEvent('OpenContext', { detail: component.context.rolinstance, bubbles: true }));
      }
    }
  }

  function handleClick(e: MouseEvent) {
    handle((e.shiftKey || e.altKey));
    e.stopPropagation();
  }

  function handleKeyDown(e: KeyboardEvent) {
    switch (e.code) {
      case "Enter": // Return
      case "Space": // Space
        if (component.context.isselected) {
          if (e.shiftKey) {
            handle(e.altKey);
            component.props.setEventDispatcher(eventDispatcher);
            e.stopPropagation();
          }
        }
    }
  }

  const previousOnDragStart = domEl.ondragstart;

  function eventDispatcher({ roleData, addedBehaviour }: RoleOnClipboard) {
    if (roleData.rolinstance == component.context.rolinstance && addedBehaviour.includes("openContextOrRoleForm")) {
      domEl.dispatchEvent(new CustomEvent('OpenRoleForm', {
        detail: {
          rolinstance: component.context.rolinstance,
          viewname: component.props.viewname ? component.props.viewname : "allProperties",
          cardprop: component.props.cardprop
        },
        bubbles: true
      }));
    }
  }

  addBehaviour(component, "openContextOrRoleForm", function (component : BehaviourComponent) {
    domEl.addEventListener("keydown", handleKeyDown);
    domEl.addEventListener("dblclick", handleClick);

    if (previousOnDragStart) {
      domEl.ondragstart = function (ev) {
        previousOnDragStart.call(domEl, ev);
        component.props.setEventDispatcher(eventDispatcher);
      };
    } else {
      domEl.ondragstart = function (ev) {
        const payload = JSON.stringify({
          roleData: component.context,
          addedBehaviour: component.addedBehaviour,
          myroletype: component.props.myroletype
        });
        if (ev.dataTransfer) {
          ev.dataTransfer.setData("PSRol", payload);
        }
        component.props.setEventDispatcher(eventDispatcher);
      };
    }
  });
}

////////////////////////////////////////
// FILL WITH A ROLE
////////////////////////////////////////
export function addFillWithRole(domEl: HTMLElement, component: BehaviourComponent) {
  function readClipBoard(receiveResults: (data: RoleOnClipboard | null) => void) {
    PDRproxy.then(function (pproxy) {
      pproxy.getProperty(
        component.props.systemExternalRole,
        ModelDependencies.cardClipBoard,
        ModelDependencies.systemExternal,
        function (valArr: string[]) {
          if (valArr[0]) {
            receiveResults(JSON.parse(valArr[0]));
          } else {
            receiveResults(null);
          }
        },
        FIREANDFORGET
      );
    });
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey) {
      switch (event.key) {
        case 'v':
          event.preventDefault();
          event.stopPropagation();
          readClipBoard(function (roleDataAndBehaviour) {
            if (roleDataAndBehaviour) {
              tryToBind(event, roleDataAndBehaviour);
            }
          });
      }
    }
  }

  function tryToBind(event: Event, { roleData, addedBehaviour }: RoleOnClipboard) {
    if (addedBehaviour.includes("fillARole")) {
      component.context.checkbinding(roleData).then( function (bindingAllowed: boolean) {
        if (bindingAllowed) {
          component.context.bind_(roleData);
          PDRproxy.then((pproxy) =>
            pproxy.deleteProperty(
              component.props.systemExternalRole,
              ModelDependencies.cardClipBoard,
              ModelDependencies.sysUser
            )
          ).catch((e) =>
            UserMessagingPromise.then((um) =>
              um.addMessageForEndUser({
                title: i18next.t("clipboardEmpty_title", { ns: "preact" }),
                message: i18next.t("clipboardEmpty_message", { ns: "preact" }),
                error: e.toString(),
              })
            )
          );
        } else {
          domEl.classList.add("border-danger", "border");
          UserMessagingPromise.then((um) =>
            um.addMessageForEndUser({
              title: i18next.t("fillerNotAllowed_title", { ns: "preact" }),
              message: i18next.t("fillerNotAllowed_message", { ns: "preact" }),
              error: "",
            })
          );
        }
      });
    }
  }

  addBehaviour(component, "fillWithARole", function (component: BehaviourComponent) {
    domEl.addEventListener("dragenter", (event) => {
      event.preventDefault();
      event.stopPropagation();
      domEl.setAttribute("tabIndex", "0");
      domEl.focus();
    });

    domEl.addEventListener("dragover", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });

    domEl.addEventListener("dragleave", (ev) => {
      if (ev.target) {
        (ev.target as HTMLElement).classList.remove("border-danger", "border", "border-success");
      }
    });
    domEl.addEventListener("blur", (ev) => {
      if (ev.target) {
        (ev.target as HTMLElement).classList.remove("border-danger", "border", "border-success");
      }
    });

    domEl.addEventListener("drop", (ev) => {
      tryToBind(ev, JSON.parse(ev.dataTransfer?.getData("PSRol") || "{}"));
    });

    domEl.addEventListener("keydown", handleKeyDown);
  });
}

////////////////////////////////////////
// FILL A ROLE
////////////////////////////////////////
// Makes the Card draggable.
// Adds keydown behaviour: ctrl-c will put the Card on the Card clipboard.

export function addFillARole(domEl: HTMLElement, component: BehaviourComponent) {
  function handleKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'c':
        if (event.ctrlKey) {
          copy(event);
        }
    }
  }

  function withLabelProperty(f: (valArr: string[]) => void) {
    if (component.context.rolinstance != "" && component.context.roltype != "") {
      if (isQualifiedName(component.props.labelProperty)) {
        PDRproxy.then((pproxy) =>
          pproxy.getProperty(
            component.context.rolinstance!,
            component.props.labelProperty,
            component.context.roltype,
            f,
            FIREANDFORGET
          )
        );
      } else {
        PDRproxy.then((pproxy) =>
          pproxy.getPropertyFromLocalName(
            component.context.rolinstance!,
            component.props.labelProperty,
            component.context.roltype,
            f,
            FIREANDFORGET
          )
        );
      }
    }
  }

  function copy(event: Event) {
    withLabelProperty(function (valArr) {
      navigator.clipboard.writeText(component.context.rolinstance!);
      PDRproxy.then((pproxy) =>
        pproxy
          .setProperty(
            component.props.systemExternalRole,
            ModelDependencies.cardClipBoard,
            JSON.stringify({
              roleData: {
                rolinstance: component.context.rolinstance,
                cardTitle: valArr[0] || "No title",
                roleType: component.context.roltype,
                contextType: component.context.contexttype,
              },
              addedBehaviour: component.addedBehaviour,
              myroletype: component.props.myroletype,
            }) as ValueT,
            component.props.myroletype
          )
          .catch((e) =>
            UserMessagingPromise.then((um) =>
              um.addMessageForEndUser({
                title: i18next.t("clipboardSet_title", { ns: "preact" }),
                message: i18next.t("clipboardSet_message", { ns: "preact" }),
                error: e.toString(),
              })
            )
          )
      );
    });
    event.preventDefault();
    event.stopPropagation();
  }

  addBehaviour(component, "fillARole", function (component: BehaviourComponent) {
    if (!domEl.ondragstart) {
      withLabelProperty((valArr) =>
        (domEl.ondragstart = (ev: DragEvent) => {
          const payload = JSON.stringify({
            roleData: component.context,
            cardTitle: valArr[0] || "No title",
            addedBehaviour: component.addedBehaviour,
            myroletype: component.props.myroletype,
          });
          if (ev.dataTransfer) {
            ev.dataTransfer.setData("PSRol", payload);
          }
        })
      );
    }
    domEl.draggable = true;
    domEl.addEventListener("keydown", handleKeyDown);
  });
}

////////////////////////////////////////
// REMOVE A FILLER
////////////////////////////////////////
// Makes the Card draggable, so it can be dropped in the Unbind tool.
// Adds keydown behaviour for delete.

export function addRemoveFiller(domEl: HTMLElement, component: BehaviourComponent) {
  function handleKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case "Backspace": // Backspace
        if (event.shiftKey) {
          PDRproxy.then(pproxy =>
            pproxy.getBinding(component.context.rolinstance!, function (rolIdArr : RoleInstanceT[]) {
              if (rolIdArr[0]) {
                pproxy
                  .removeBinding(component.context.rolinstance!, component.props.myroletype )
                  .catch(e => UserMessagingPromise.then(um =>
                    um.addMessageForEndUser({
                      title: i18next.t("unfill_title", { ns: 'preact' }),
                      message: i18next.t("unfill_message", { ns: 'preact' }),
                      error: e.toString()
                    })));
              }
            },
              FIREANDFORGET));
          event.preventDefault();
          event.stopPropagation();
        }
    }
  }

  addBehaviour(component, "removeFiller", function (component: BehaviourComponent) {
    domEl.addEventListener("keydown", handleKeyDown);
    domEl.draggable = true;
    // Notice that this code is highly contextual.
    // It may have to change if the other behaviours that add dragstart methods
    // change.
    if (!domEl.ondragstart) {
      domEl.ondragstart = ev => {
        const payload = JSON.stringify(
          {
            roleData: component.context,
            addedBehaviour: component.addedBehaviour,
            myroletype: component.props.myroletype
          }
        );
        if (ev.dataTransfer) {
          ev.dataTransfer.setData("PSRol", payload);
        }
      };
    }
  });
}

////////////////////////////////////////
// REMOVE ROLE FROM CONTEXT
////////////////////////////////////////
// Makes the Card draggable, so it can be dropped in the Trash.
// Adds keydown behaviour for shift-delete.
export function addRemoveRoleFromContext(domEl: HTMLElement, component: BehaviourComponent) {
  function handleKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case 'Backspace':
        event.preventDefault();
        event.stopPropagation();
        component.context.removerol();
    }
  }

  addBehaviour(component, "removeRoleFromContext", function (component: BehaviourComponent) {
    domEl.addEventListener("keydown", handleKeyDown);
    domEl.draggable = true;
    // Notice that this code is highly contextual.
    // It may have to change if the other behaviours that add dragstart methods
    // change.
    if (!domEl.ondragstart) {
      domEl.ondragstart = (ev: DragEvent) => {
        const payload = JSON.stringify({
          roleData: component.context,
          addedBehaviour: component.addedBehaviour,
          myroletype: component.props.myroletype,
        });
        if (ev.dataTransfer) {
          ev.dataTransfer.setData("PSRol", payload);
        }
      };
    }
  });
}

////////////////////////////////////////
// REMOVE CONTEXT
////////////////////////////////////////

// Makes the Card draggable, so it can be dropped in the Trash.
// Adds keydown behaviour for shift-delete.
export function addRemoveContext(domEl: HTMLElement, component: BehaviourComponent) {
  function handleKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case "Backspace": // Backspace
        event.preventDefault();
        event.stopPropagation();
        component.context.removecontext();
    }
  }

  // Apply the function to the component to add the behaviour, but only if it is not already added.
  // In effect this is a decorator pattern.
  // The DOM element (domEl) gets event listeners for keydown and dragstart and we make it draggable.
  addBehaviour(component, "addRemoveContext", function (component: BehaviourComponent) {
    domEl.addEventListener("keydown", handleKeyDown);
    domEl.draggable = true;
    // Notice that this code is highly contextual.
    // It may have to change if the other behaviours that add dragstart methods
    // change.
    if (!domEl.ondragstart) {
      domEl.ondragstart = (ev: DragEvent) => {
        const payload = JSON.stringify({
          roleData: component.context,
          addedBehaviour: component.addedBehaviour,
          myroletype: component.props.myroletype,
        });
        if (ev.dataTransfer) {
          ev.dataTransfer.setData("PSRol", payload);
        }
      };
    }
  });
}

////////////////////////////////////////
// CONDITIONALLY ADD BEHAVIOUR
////////////////////////////////////////

function addBehaviour(component: BehaviourComponent, behaviour: string, behaviourAdder: ((component: BehaviourComponent) => void)): void {
  // First check if the behaviour is already added. For this we keep a list of behaviour names in the addedBehaviour member.
  if (component.addedBehaviour) {
    if (!component.addedBehaviour.find(b => b === behaviour)) {
      // If not, add it.
      component.addedBehaviour.push(behaviour);
      behaviourAdder(component);
    }
  } else {
    // If the addedBehaviour member is not initialized, we initialize it with the behaviour and add the behaviour.
    component.addedBehaviour = [behaviour];
    behaviourAdder(component);
  }
}

////////////////////////////////////////
// MAP BEHAVIOUR NAMES TO ADDERS
////////////////////////////////////////

const behaviourMap: { [key: string]: BehaviourAdder } = {
  openContextOrRoleForm: addOpenContextOrRoleForm,
  fillWithARole: addFillWithRole,
  fillARole: addFillARole,
  removeFiller: addRemoveFiller,
  removeRoleFromContext: addRemoveRoleFromContext,
  addRemoveContext: addRemoveContext,
};

export function getBehaviourAdder(name: string): BehaviourAdder {
  return behaviourMap[name];
}