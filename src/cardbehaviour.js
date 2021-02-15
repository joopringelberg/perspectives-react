const PDRproxy = require("perspectives-proxy").PDRproxy;

/*
This module gives functions that add behaviour to a component that represents a role.
The functions built on the assumption that the role component has a PSRol context.
We we will call that component a `Card` here, though there is no reason to use a Reactbootstrap.Card component.
However, it must be class based (implemented by extending React.Component).
Add these behaviours to the Card using the collectBehaviour function; prepare the Card by extending BehaviourReceivingComponent
or by adding to the method componentDidMount the following line:

  this.props.setSelf(this);

*/

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
export function addOpenContextOrRoleForm(domEl, component)
{
  function handle(onNewTab)
  {
    const roleKind = component.context.roleKind;
    if ( onNewTab )
    {
      if (roleKind == "ContextRole" || roleKind == "ExternalRole")
      {
        window.open("/?" + component.context.rolinstance);
      }
      // We do not yet support opening a RoleForm in a new screen.
    }
    else
    {
      if (roleKind == "ContextRole" || roleKind == "ExternalRole")
      {
        if ( component.props.formMode )
        {
          domEl.dispatchEvent( new CustomEvent('OpenRoleForm',
            { detail:
              { rolinstance: component.context.rolinstance
              , viewname: component.props.viewname ? component.props.viewname : "allProperties"
              , cardprop: component.props.cardprop
              }
            , bubbles: true
            }) );
        }
        else
        {
          domEl.dispatchEvent( new CustomEvent('OpenContext', { detail: component.context.rolinstance, bubbles: true }) );
        }
      }
      else
      {
        domEl.dispatchEvent( new CustomEvent('OpenRoleForm',
          { detail:
            { rolinstance: component.context.rolinstance
            , viewname: component.props.viewname ? component.props.viewname : "allProperties"
            , cardprop: component.props.cardprop
            }
          , bubbles: true }) );
      }
    }
  }
  function handleClick(e)
  {
    handle( (e.shiftKey || e.ctrlKey || e.metaKey) );
  }

  function handleKeyDown(e)
  {
    switch(e.keyCode){
      case 13: // Return
      case 32: // Space
        if (component.context.isselected)
        {
          if (event.shiftKey)
          {
            handle( e.altKey );
          }
        }
      }
    }

  const previousOnDragStart = domEl.ondragstart;

  // This function is provided as the value of the App member
  function eventDispatcher ( roleinstance )
  {
    if (roleinstance == component.context.rolinstance)
    {
      domEl.dispatchEvent( new CustomEvent('OpenRoleForm',
        { detail:
          { rolinstance: component.context.rolinstance
          , viewname: component.props.viewname ? component.props.viewname : "allProperties"
          , cardprop: component.props.cardprop
          }
        , bubbles: true }) );
    }
  }

  domEl.addEventListener( "keydown", handleKeyDown);
  domEl.addEventListener( "dblclick", handleClick);

  // Notice that this code is highly contextual.
  // It may have to change if the other behaviours that add dragstart methods
  // change.
  if (previousOnDragStart)
  {
    domEl.ondragstart = function(ev)
    {
      previousOnDragStart(ev);
      component.props.setEventDispatcher(eventDispatcher);
    };
  }
  else
  {
    domEl.ondragstart = function(ev)
    {
      ev.dataTransfer.setData("PSRol", JSON.stringify(component.context));
      component.props.setEventDispatcher(eventDispatcher);
    };
  }
}

// On dropping a role and on trying to paste the role on the clipboard, we check whether
// that role is compatible with the role that the user intends to fill.
export function addFillWithRole(domEl, component)
{
  function readClipBoard( receiveResults )
  {
    PDRproxy.then(
      function(pproxy)
      {
        component.addUnsubscriber(
          pproxy.getProperty(
            component.props.systemExternalRole,
            "model:System$PerspectivesSystem$External$CardClipBoard",
            "model:System$PerspectivesSystem$External",
            function (valArr)
            {
              if (valArr[0])
              {
                const {selectedRole} = JSON.parse( valArr[0]);
                receiveResults( {rolinstance: selectedRole} );

              }
              else
              {
                receiveResults({});
              }
            }));
      });
  }

  function handleKeyDown ( event )
  {
    switch(event.keyCode){
      case 13: // Enter
      case 32: // space
      readClipBoard( function( roleData )
        {
          if (roleData.rolinstance)
          {
            tryToBind( event, roleData );
          }
        });
        event.preventDefault();
      }
  }

  function tryToBind (event, rolData )
  {
    component.context.checkbinding( rolData,
      function( bindingAllowed )
      {
        if ( bindingAllowed)
        {
          component.context.bind_( rolData );
          // Empty clipboard.
          PDRproxy.then( pproxy => pproxy.deleteProperty(
            component.props.systemExternalRole,
            "model:System$PerspectivesSystem$External$CardClipBoard",
            "model:System$PerspectivesSystem$User") );
        }
        else {
          component.eventDiv.current.classList.add("border-danger", "border");
        }
      } );
  }

  domEl.dragenter = event => {
      event.preventDefault();
      event.stopPropagation();
      component.eventDiv.current.tabIndex = 0;
      component.eventDiv.current.focus();
    };
    // No drop without this...
  domEl.dragover = event => {
      event.preventDefault();
      event.stopPropagation();
      };
  domEl.dragleave = ev => ev.target.classList.remove("border-danger", "border", "border-success");
  domEl.blur = ev => ev.target.classList.remove("border-danger", "border", "border-success");

  domEl.drop = ev => tryToBind( ev, JSON.parse( ev.dataTransfer.getData("PSRol") ) );

  domEl.addEventListener( "keydown", handleKeyDown );

}

// Makes the Card draggable.
// Adds keydown behaviour: space and enter will put the Card on the Card clipboard.
export function addFillARole(domEl, component)
{
  function handleKeyDown (event)
  {
    switch(event.keyCode){
      case 13: // Enter
      case 32: // space
        // Set information in the CardClipboard external property of model:System$PerspectivesSystem.
        PDRproxy.then( pproxy =>
          pproxy.getPropertyFromLocalName(
            component.context.rolinstance,
            component.props.labelProperty,
            component.context.roltype,
            function(valArr)
            {
              pproxy.setProperty(
                component.props.systemExternalRole,
                "model:System$PerspectivesSystem$External$CardClipBoard",
                JSON.stringify(
                  { selectedRole: component.context.rolinstance
                  , cardTitle: valArr[0]
                  , roleType: component.context.roltype
                  , contextType: component.context.contexttype
                  }),
                component.props.myroletype );
            }
          )
        );
        event.preventDefault();
        event.stopPropagation();
    }
  }

  // Notice that this code is highly contextual.
  // It may have to change if the other behaviours that add dragstart methods
  // change.
  if (!domEl.ondragstart)
  {
    domEl.ondragstart = ev => ev.dataTransfer.setData("PSRol", JSON.stringify(component.context));
  }
  domEl.draggable = true;
  domEl.addEventListener( "keydown", handleKeyDown);
}

// Makes the Card draggable, so it can be dropped in the Unbind tool.
// Adds keydown behaviour for delete.
export function addRemoveFiller(domEl, component)
{
  function handleKeyDown (event)
  {
    switch(event.keyCode){
      case 8: // Backspace
        if (event.shiftKey)
        {
           PDRproxy.then( pproxy =>
             pproxy.getBinding ( component.context.rolinstance, function( rolIdArr )
              {
                if ( rolIdArr[0] )
                 {
                   pproxy.removeBinding( component.context.rolinstance, rolIdArr[0], component.props.myroletype );
                 }
              }));
            event.preventDefault();
            event.stopPropagation();
      }
      }
    }
  domEl.addEventListener( "keydown", handleKeyDown);
  domEl.draggable = true;

  // Notice that this code is highly contextual.
  // It may have to change if the other behaviours that add dragstart methods
  // change.
  if (!domEl.ondragstart)
  {
    domEl.ondragstart = ev => ev.dataTransfer.setData("PSRol", JSON.stringify(component.context));
  }
}

// Makes the Card draggable, so it can be dropped in the Trash.
// Adds keydown behaviour for shift-delete.
export function addRemoveRoleFromContext(domEl, component)
{
  function handleKeyDown (event)
  {
    switch(event.keyCode){
      case 8: // Backspace
        component.context.removerol();
        event.preventDefault();
        event.stopPropagation();
      }
    }
  domEl.addEventListener( "keydown", handleKeyDown);
  domEl.draggable = true;
  // Notice that this code is highly contextual.
  // It may have to change if the other behaviours that add dragstart methods
  // change.
  if (!domEl.ondragstart)
  {
    domEl.ondragstart = ev => ev.dataTransfer.setData("PSRol", JSON.stringify(component.context));
  }
}
