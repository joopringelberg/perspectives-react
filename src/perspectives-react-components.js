const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;

const Component = React.Component;

class PerspectivesComponent extends Component
{
  constructor(props)
  {
    super(props);
    this.state = {};
    this.unsubscribers = [];
  }

  componentWillUnmount ()
  {
    this.unsubscribers.forEach( unsubscriber => unsubscriber() );
  }

  addUnsubscriber(unsubscriber)
  {
    this.unsubscribers.push(unsubscriber);
  }

  stateIsComplete ()
  {
    const component = this;
    let isComplete = true;
    Object.keys(component.state).forEach(
      function (prop)
      {
        if (!component.state[prop])
        {isComplete = false;}
      });

    return isComplete;
  }

  stateIsEmpty ()
  {
    return Object.keys(this.state).length === 0;
  }

}

class Context extends Component
{
  constructor (props)
  {
    super(props);
  }
  render ()
  {
    const component = this;
    let children;

    if (Array.isArray(component.props.children))
    {
      children = component.props.children;
    }
    else
    {
      children = [component.props.children];
    }

    return React.Children.map(
      children,
      function (child)
      {
        return React.cloneElement(
          child,
          {
            instance: component.props.instance,
            namespace: component.props.type
          });
      });
  }
}
Context.propTypes = {
  instance: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired
};

class Rollen extends PerspectivesComponent
{
  constructor (props)
  {
    let component;
    super(props);
    component = this;
    component.props.rollen.forEach(rn => component.state[rn] = undefined);
  }

  componentDidMount ()
  {
    const component = this;
    const context = component.props.instance;
    component.props.rollen.forEach(
      function (rolName)
      {
        Perspectives.then(
          function (pproxy)
          {
            component.addUnsubscriber(
              pproxy.getRol(
                context,
                component.props.namespace + "$" + rolName,
                function (rolIds)
                {
                  const updater = {};
                  updater[rolName] = rolIds;
                  component.setState(updater);
                }));
          });
      }
    );
  }

  render ()
  {
    const component = this;
    let children;

    if (component.stateIsComplete())
    {
      if (Array.isArray(component.props.children))
      {
        children = component.props.children;
      }
      else
      {
        children = [component.props.children];
      }
      return React.Children.map(
        children,
        function (child)
        {
          const childRol = child.props.rol;
          let instances;
          if (!childRol)
          {
            console.error("Rollen (" + component.props.namespace + ") finds child of type '" + child.type.name + "' that has no 'rol' on its props.");
            return <p className="error">Rollen ({component.props.namespace}) finds child of type '{child.type.name}' that has no 'rol' on its props.</p>;
          }
          instances = component.state[childRol];
          if (childRol === "buitenRol")
          {
            instances = [buitenRol( component.props.instance )];
          }
          if (!instances)
          {
            console.error( "Rollen (" + component.props.namespace + ") has no rol '" + childRol + "' while the child of type '" + child.type.name + "' asks for it." );
            return <p className="error">Rollen ({component.props.namespace}) has no rol '{childRol}' while the child of type '{child.type.name}' asks for it.</p>;
          }
          return instances.map(
            function(instance)
            {
              return React.cloneElement(
                child,
                {
                  key: instance,
                  instance: instance,
                  namespace: component.props.namespace
                });
            }
          );
        });
    }
    else
    {
      return <div />;
    }
  }
}

Rollen.propTypes = {
  rollen: PropTypes.array.isRequired
};

class RolBinding extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
    this.state.binding = undefined;
    this.state.bindingType = undefined;
  }

  componentDidMount ()
  {
    const component = this;
    Perspectives.then(
      function (pproxy)
      {
        component.addUnsubscriber(
          pproxy.getBinding(
            component.props.instance,
            function (binding)
            {
              component.setState({binding: binding[0]});
            }));
        // Retrieve the type of the binding.
        // This will be the namespace that its properties are defined in.
        component.addUnsubscriber(
          pproxy.getBindingType(
            component.props.instance,
            function (bindingType)
            {
              component.setState({bindingType: bindingType[0]});
            }));
      }
    );
  }

  // Render! props.children contains the nested elements.
  // These should be provided the retrieved binding value.
  // However, this can only be done after state is available.
  render ()
  {
    const component = this;

    if (component.stateIsComplete())
    {
      if (Array.isArray(component.props.children))
      {
        return React.Children.map(
          component.props.children,
          function (child)
          {
            return React.cloneElement(
              child,
              {
                instance: component.state.binding,
                namespace: component.state.bindingType
              });
          });
      }
      else
      {
        return React.cloneElement(
          component.props.children,
          {
            instance: component.state.binding,
            namespace: component.state.bindingType
          });
      }
    }
    else
    {
      return <div />;
    }
  }

}

RolBinding.propTypes = {
  instance: PropTypes.string,
  namespace: PropTypes.string,
  rol: PropTypes.string.isRequired
};

class View extends PerspectivesComponent
{
  componentDidMount ()
  {
    const component = this;
    Perspectives.then(
      function(pproxy)
      {
        let qualifiedView;
        if (component.props.rol)
        {
          // This ugly hack needs to go! The royal way is to make the type of buitenRol no longer have "Beschrijving" as part of its name.
          if (component.props.rol === "buitenRol")
          {
            qualifiedView = component.props.namespace + "$" + component.props.rol + "Beschrijving$" + component.props.viewnaam;
          }
          else
          {
            qualifiedView = component.props.namespace + "$" + component.props.rol + "$" + component.props.viewnaam;
          }
        }
        else
        {
          qualifiedView = component.props.namespace + "$" + component.props.viewnaam;
        }
        pproxy.getViewProperties(
          qualifiedView,
          function(propertyNames)
          {
            // First initialize state
            // NOTE: React will not notice this.
            propertyNames.forEach(
              function(propertyName)
              {
                const ln = deconstructLocalNameFromDomeinURI_(propertyName);
                component.state[ln] = undefined;
              }
            );
            propertyNames.forEach(
              function(propertyName)
              {
                component.addUnsubscriber(
                  pproxy.getProperty(
                    component.props.instance,
                    propertyName,
                    function (propertyValues)
                    {
                      const updater = {};
                      const ln = deconstructLocalNameFromDomeinURI_(propertyName);
                      updater[ln] = propertyValues;
                      component.setState(updater);
                    },
                    component.addUnsubscriber.bind(component)
                  ));
              }
            );
          },
          component.addUnsubscriber.bind(component)
        );
      }
    );
  }


  // Render! props.children contains the nested elements.
  // These should be provided all property name-value pairs,
  // except when it has a prop 'propertyName'.
  // However, this can only be done after state is available.
  render ()
  {
    const component = this;

    function cloneChild (child)
    {
      // If the child has a prop 'propertyName', just provide the property value.
      if (child.props.propertyName)
      {
        return React.cloneElement(
          child,
          {
            value: component.state[child.props.propertyName]
          });
      }
      else
      {
        return React.cloneElement(
          child,
          component.state);
      }
    }

    if (!component.stateIsEmpty() && component.stateIsComplete())
    {
      if (Array.isArray(component.props.children))
      {
        return React.Children.map(
          component.props.children,
          cloneChild);
      }
      else
      {
        return cloneChild(component.props.children);
      }
    }
    else
    {
      return <div />;
    }
  }

}

View.propTypes = {
  instance: PropTypes.string,
  namespace: PropTypes.string,
  rol: PropTypes.string,
  viewnaam: PropTypes.string.isRequired
};

class ContextVanRol extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
    this.state.instance = undefined;
    this.state.type = undefined;
  }

  componentDidMount ()
  {
    const component = this;
    Perspectives.then(
      function (pproxy)
      {
        // The context of the rol will be bound to the state prop 'instance'.
        component.addUnsubscriber(
          pproxy.getRolContext(
            component.props.instance,
            function (contextId)
            {
              component.setState({instance: contextId[0]});
              // The type of the context.
              component.addUnsubscriber(
                pproxy.getContextType(
                  contextId,
                  function (contextType)
                  {
                    component.setState({type: contextType[0]});
                  },
                  component.addUnsubscriber.bind(component)
                ));
            },
            component.addUnsubscriber.bind(component)
          ));
      }
    );
  }

  render ()
  {
    const component = this;

    if (component.stateIsComplete())
    {
      return (<Context instance={component.state.instance} type={component.state.type}>
        {component.props.children}
      </Context>);
    }
    else
    {
      return <div />;
    }
  }

}
ContextVanRol.propTypes = {};

// Access a View on the BuitenRol bound to a Rol of the surrounding context.
function ExterneViewOfBoundContext(props)
{
  return (<RolBinding rol={props.rol} instance={props.instance}>
    <View viewnaam={props.viewnaam}>{props.children}</View>
  </RolBinding>);
}

ExterneViewOfBoundContext.propTypes = {
  rol: PropTypes.string.isRequired,
  viewnaam: PropTypes.string.isRequired,
  instance: PropTypes.string,
  namespace: PropTypes.string
};

// Access a View on the BinnenRol bound to a Rol of the surrounding context.
function InterneViewOfBoundContext(props)
{
  return (<RolBinding rol={props.rol} instance={props.instance}>
    <ContextVanRol rollen={[]}>
      <InterneView viewnaam={props.viewnaam}>{props.children}</InterneView>
    </ContextVanRol>
  </RolBinding>);
}

ExterneViewOfBoundContext.propTypes = {
  rol: PropTypes.string.isRequired,
  viewnaam: PropTypes.string.isRequired
};

// Access a View on the BuitenRol of a Context.
function ViewOnBuitenRol(props)
{
  return (<Rollen instance={props.instance} namespace={props.namespace} rollen={[]}>
      <View rol="buitenRol" viewnaam={props.viewnaam}>{props.children}</View>
    </Rollen>)
}

ViewOnBuitenRol.propTypes = {
  viewnaam: PropTypes.string.isRequired
};

// TODO
// GebondenContext
// InterneView
// BuitenRol
// BinnenRol
// Binding

// Returns "localName" from "model:ModelName$localName" or Nothing
// deconstructLocalNameFromDomeinURI_ :: String -> String
// NOTE DEPENDENCY. This code is adapted from module Perspectives.Identifiers.
function deconstructLocalNameFromDomeinURI_(s) {
  // domeinURIRegex :: Regex
  const domeinURIRegex = new RegExp("^(model:\\w*.*)\\$(\\w*)");
  try
  {
    return s.match(domeinURIRegex)[2];
  } catch (e)
  {
    throw "deconstructLocalNameFromDomeinURI_: no local name in '" + s + "'.";
  }
}

// A Namespace has the form "model:Name"
// NOTE DEPENDENCY. This code is adapted from module Perspectives.Identifiers.
function buitenRol( s )
{
  const modelRegEx = new RegExp("^model:(\\w*)$");
  if (s.match(modelRegEx))
  {
    return s + "$_buitenRol";
  }
  else
  {
    return s + "_buitenRol";
  }
}

module.exports = {
  Context: Context,
  Rollen: Rollen,
  RolBinding: RolBinding,
  View: View,
  ContextVanRol: ContextVanRol,
  ExterneViewOfBoundContext: ExterneViewOfBoundContext,
  ViewOnBuitenRol: ViewOnBuitenRol
};
