import React, {PureComponent as Component, createRef, cloneElement} from "react";

import { func } from "prop-types";

import PerspectivesComponent from "./perspectivescomponent.js";

import {AppContext, PSContext} from "./reactcontexts.js";

/*
This module provides functions and components to compose behaviour and add
it to an existing component. Individual Behaviours must be given in the form of
 a function of two arguments: a DOM element and a React component.
The function may add event listeners to the DOM element, or set its tabIndex,
make it draggable, etc.
The component to which behaviour is added, is wrapped in a div and it is this
div that is provided as the first argument to the behaviour function. The
component itself is provided as the second argument. We give a type in terms
of the Purescript type system, loosely describing the function type:

  behaviourFunction :: DomElement -> Component -> Unit

Because the behaviourFunction has access to the wrapped component, it can access
its properties, its state and its context.

The component that is wrapped gets three (extra) props:
  - setSelf
  - systemExternalRole
  - formMode
The first is a function that should be applied to the component instance (by extending
BehaviourReceivingComponent this happens automatically).
The second is necessary to access the Card clipboard.
The third argument gives a mode value of the entire App, allowing us to override default doubleclick
behaviour on external roles and context roles in order to open a role form (instead of the context).

BEHAVIOURS
* addOpenContextOrRoleForm        - Open context or role form, in the same screen or another (tab or window).
* addFillWithRole                 - Fill with another role.
* addFillARole                    - Fill another role.
* addRemoveFiller                 - Remove the filler.
* addRemoveRoleFromContext        - Remove the role from its context.

*/

////////////////////////////////////////////////////////////////////////////////
//// COLLECTBEHAVIOUR
////////////////////////////////////////////////////////////////////////////////
// This function returns a React component that wraps its child element(s)
// in a div to which the behaviours are added.
// Children should be class-based React Components.
// The child of a component constructed with collectBehaviour should be a class
// and extend BehaviourReceivingComponent, or apply the function received in the
// `setSelf` prop to itself, in its componentDidMount method.
// The argument is an array of functions that add behaviour.

export function collectBehaviour( arrayOfBehaviours )
{
  const behaviourNames = arrayOfBehaviours.map( f => f.name );
  let supportAppContext, supportMyRoletype;
  // Provide systemExternalRole and formMode for these behaviours:
  if (  behaviourNames.includes( "addOpenContextOrRoleForm" ) ||
        behaviourNames.includes( "addFillWithRole" ) ||
        behaviourNames.includes( "addFillARole" )
     )
  {
    supportAppContext = true;
  }
  // Provide myroletype for these behaviours:
  if (  behaviourNames.includes( "addFillARole" ) ||
        behaviourNames.includes( "addRemoveFiller" ) ||
        behaviourNames.includes( "addRemoveRoleFromContext" )
     )
  {
    supportMyRoletype = true;
  }

  return class ComponentWithBehaviour extends Component
  {
    constructor(props)
    {
      super(props);
      this.ref = createRef();
    }
    componentDidMount()
    {
      const component = this;
      const divEl = this.ref.current;
      // Add behaviour to the div DOM element.
      arrayOfBehaviours.forEach( behaviour => behaviour( divEl, component.wrappedComponent ));
    }
    render()
    {
      const component = this;
      function setSelf (c)
      {
        component.wrappedComponent = c;
      }
      if (supportAppContext)
      {
        if ( supportMyRoletype )
        {
          return  <PSContext.Consumer>{pscontext =>
                    <AppContext.Consumer>
                    {
                      // eslint-disable-next-line react/prop-types
                      appcontext => <div ref={this.ref}>{ cloneElement( this.props.children,
                        { setSelf
                        , systemExternalRole: appcontext.systemExternalRole
                        , myroletype: pscontext.myroletype
                        , formMode: appcontext.formMode }) }</div>
                    }
                    </AppContext.Consumer>
                  }</PSContext.Consumer>;
        }
        else
        {
          return  <AppContext.Consumer>
                  {
                    // eslint-disable-next-line react/prop-types
                    appcontext => <div ref={this.ref}>{ cloneElement( this.props.children,
                      { setSelf
                      , systemExternalRole: appcontext.systemExternalRole} ) }</div>
                  }
                  </AppContext.Consumer>;
        }
      }
      else
      {
        if ( supportMyRoletype )
        {
          // eslint-disable-next-line react/prop-types
          return  <PSContext.Consumer>{pscontext => <div ref={this.ref}>{ cloneElement( this.props.children,
                    { setSelf
                    , myroletype: pscontext.myroletype }) }</div>
                  }</PSContext.Consumer>;
        }
        else
        {
          // eslint-disable-next-line react/prop-types
          return <div ref={this.ref}>{ cloneElement( this.props.children, {setSelf} ) }</div>;
        }
      }
    }
  };
}

////////////////////////////////////////////////////////////////////////////////
//// ADDBEHAVIOUR
////////////////////////////////////////////////////////////////////////////////
// This function takes a class-based React component that it wraps
// in a div to which the behaviours are added.
// The first argument should be a class-based Component
// and extend BehaviourReceivingComponent, or apply the function received in the
// `setSelf` prop to itself, in its componentDidMount method.
// The second argument is an array of functions that add behaviour.
// The resulting component passes all props it receives on to the Receiver (and adds up to four props).
export function addBehaviour( Receiver, arrayOfBehaviours )
{
  const behaviourNames = arrayOfBehaviours.map( f => f.name );
  let supportAppContext, supportMyRoletype;
  // Provide systemExternalRole and formMode for these behaviours:
  if (  behaviourNames.includes( "addOpenContextOrRoleForm" ) ||
        behaviourNames.includes( "addFillWithRole" ) ||
        behaviourNames.includes( "addFillARole" )
     )
  {
    supportAppContext = true;
  }
  // Provide myroletype for these behaviours:
  if (  behaviourNames.includes( "addFillARole" ) ||
        behaviourNames.includes( "addRemoveFiller" ) ||
        behaviourNames.includes( "addRemoveRoleFromContext" ||
        behaviourNames.includes( "addOpenContextOrRoleForm" ) )
     )
  {
    supportMyRoletype = true;
  }

  return class ComponentWithBehaviour extends Component
  {
    constructor(props)
    {
      super(props);
      this.ref = createRef();
      this.prevRef = undefined;
    }
    componentDidMount()
    {
      const component = this;
      const divEl = this.ref.current;
      // Save for componentDidUpdate, so we can see if we need to re-establish behaviour.
      component.prevRef = divEl;
      // Add behaviour to the div DOM element.
      arrayOfBehaviours.forEach( behaviour => behaviour( divEl, component.wrappedComponent ));
    }
    // OBSOLETE?? deze component update niet, behalve als de pscontext of appcontext veranderen of de props die
    // aan deze component worden meegegeven.
    componentDidUpdate()
    {
      const component = this;
      const divEl = this.ref.current;
      if (component.prevRef != divEl)
      {
        // Do behaviour again.
        arrayOfBehaviours.forEach( behaviour => behaviour( divEl, component.wrappedComponent ));
      }
    }
    render()
    {
      const component = this;
      function setSelf (c)
      {
        component.wrappedComponent = c;
      }
      if (supportAppContext)
      {
        if ( supportMyRoletype )
        {
          return  <PSContext.Consumer>{pscontext =>
                    <AppContext.Consumer>
                    {
                      appcontext =>
                        <div ref={this.ref}>
                          <Receiver
                            setSelf={setSelf}
                            systemExternalRole={appcontext.systemExternalRole}
                            myroletype={pscontext.myroletype}
                            formMode={appcontext.formMode}
                            setEventDispatcher={appcontext.setEventDispatcher}
                            {...component.props}/>
                        </div>
                    }</AppContext.Consumer>
                  }</PSContext.Consumer>;
        }
        else
        {
          return  <AppContext.Consumer>
                  {
                    appcontext =>
                      <div ref={this.ref}>
                        <Receiver
                          setSelf={setSelf}
                          systemExternalRole={appcontext.systemExternalRole}
                          setEventDispatcher={appcontext.setEventDispatcher}
                          {...component.props}/>
                      </div>
                  }
                  </AppContext.Consumer>;
        }
      }
      else
      {
        if ( supportMyRoletype )
        {
          return  <PSContext.Consumer>{pscontext =>
                    <div ref={this.ref}>
                      <Receiver setSelf={setSelf} myroletype={pscontext.myroletype} {...component.props}/>
                    </div>
                  }</PSContext.Consumer>;
        }
        else
        {
          return  <div ref={this.ref}>
                    <Receiver setSelf={setSelf} {...component.props}/>
                  </div>;
        }
      }
    }
  };
}

////////////////////////////////////////////////////////////////////////////////
//// BEHAVIOURRECEIVINGCOMPONENT
////////////////////////////////////////////////////////////////////////////////
// This class can be extended to obtain a class that 'registers' itself
// with ComponentWithBehaviour.
// Alternatively, the (class based!) component that is wrapped by ComponentWithBehaviour
// can call the function it receives on its setSelf prop itself, in its componentDidMount
// method.
// Classes that extend BehaviourReceivingComponent and that implement a componentDidMount
// method, need to call super.componentDidMount() in that method;
export class BehaviourReceivingComponent extends PerspectivesComponent
{
  constructor(props)
  {
    super(props);
  }
  componentDidMount()
  {
    // Apply this statement in your own component instead of extending BehaviourReceivingComponent.
    this.props.setSelf(this);
  }
}

BehaviourReceivingComponent.propTypes =
  { setSelf: func
  };

////////////////////////////////////////////////////////////////////////////////
//// EXAMPLES
////////////////////////////////////////////////////////////////////////////////
/*
import {AppContext} from "./reactcontexts.js";

//// BEHAVIOURS
function addClickMe( domEl )
{
  domEl.addEventListener( "click", () => alert("You clicked me!") );
}

function addPressMe ( domEl )
{
  domEl.addEventListener( "keydown", () => alert( "You pressed me") );
}

function makeDraggableRole(domEl, component)
{
  domEl.draggable = true;
  domEl.ondragstart = ev => ev.dataTransfer.setData("PSRol", JSON.stringify(component.context));
}

// A base class to which we will add behaviour.
class MyTest extends BehaviourReceivingComponent
{
  render()
  {
    return <p>You can tab, click and press me</p>;
  }
}
MyTest.contextType = AppContext;

// A class composed of the base class and four behaviours.
function ClickableParagraph()
{
  const ExtendWithBehaviour = collectBehaviour(
    [addClickMe, addPressMe, makeDraggableRole]);
  return  <ExtendWithBehaviour>
            <MyTest/>
          </ExtendWithBehaviour>;
}
*/
