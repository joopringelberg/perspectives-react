import React from "react";
import {PDRproxy} from "perspectives-proxy";
const Component = React.PureComponent;

export default class PerspectivesComponent extends Component
{
  constructor(props)
  {
    super(props);
    this.state = {};
    this.unsubscribers = [];
    this.__mounted__ = true;
  }

  // componentDidMount ()
  // {
  //   this.__mounted__ = true;
  //   super.componentDidMount();
  // }

  componentWillUnmount ()
  {
    this.unsubscribeAll();
    this.__mounted__ = false;
  }

  // Returns a promise for when all subscribers have been unsubscribed.
  unsubscribeAll()
  {
    const component = this;
    return PDRproxy.then(
      function(pproxy)
      {
        component.unsubscribers.forEach(
          function(unsubscriber)
          {
            // unsubscriber = {subject: req.subject, corrId: req.corrId}
            unsubscriber.request = "Unsubscribe";
            pproxy.send(unsubscriber, function(){});
          });
        component.unsubscibers = [];
      });
  }

  setState (updater, optionalCallback)
  {
    if (this.__mounted__)
    {
      super.setState(updater, optionalCallback);
    }
  }

  // A single component may perform multiple calls through the API. All of these may connect a callback
  // to the dependency network in the core. When the component unmounts, it should inform the core that
  // these callbacks can be unsubscribed. This is what we use the unsubscriber for.
  addUnsubscriber(unsubscriberPromise)
  {
    if (unsubscriberPromise)
    {
      // unsubscriber = {subject: req.subject, corrId: req.corrId}
      return unsubscriberPromise.then(unsubscriber => this.unsubscribers.push(unsubscriber));
    }
  }

  stateIsComplete (excludedProps = [])
  {
    const component = this;
    let isComplete = true;
    Object.keys(component.state).forEach(
      function (prop)
      {
        if (!component.state[prop]
            && (typeof component.state[prop]) != "boolean"
            && (!Array.isArray( component.state[prop])
            && (excludedProps.indexOf(prop) < 0))
          )
        // if ( !component.state.hasOwnProperty(prop) )
        {isComplete = false;}
      });

    return isComplete;
  }

  stateIsEmpty ()
  {
    return Object.keys(this.state).length === 0;
  }

}
