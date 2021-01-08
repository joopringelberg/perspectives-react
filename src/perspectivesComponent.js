const React = require("react"); //1
const Perspectives = require("perspectives-proxy").Perspectives;
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
    const component = this;
    this.__mounted__ = false;
    Perspectives.then(
      function(pproxy)
      {
        component.unsubscribers.forEach(
          function(unsubscriber)
          {
            unsubscriber.request = "Unsubscribe";
            pproxy.send(unsubscriber, function(){});
          });
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
  addUnsubscriber(unsubscriber)
  {
    if (unsubscriber)
    {
      this.unsubscribers.push(unsubscriber);
    }
  }

  stateIsComplete ()
  {
    const component = this;
    let isComplete = true;
    Object.keys(component.state).forEach(
      function (prop)
      {
        if (!component.state[prop] && (typeof component.state[prop]) != "boolean")
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
