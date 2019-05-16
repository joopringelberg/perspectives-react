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
            contextinstance: component.props.contextinstance,
            namespace: component.props.type
          });
      });
  }
}
Context.propTypes = {
  contextinstance: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired
};
// Context passes on:
// contextinstance
// namespace


// NOTE. Any Role that is taken from an Aspect, will not be found by Rollen, because this implementation
// assumes that each Role is in the namespace of the context.
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
    const context = component.props.contextinstance;
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
          const childRol = child.props.rolname;
          let roleInstances;
          if (!childRol)
          {
            console.error("Rollen (" + component.props.namespace + ") finds child of type '" + child.type.name + "' that has no 'rol' on its props.");
            return <p className="error">Rollen ({component.props.namespace}) finds child of type '{child.type.name}' that has no 'rol' on its props.</p>;
          }
          roleInstances = component.state[childRol];
          if (childRol === "buitenRol")
          {
            roleInstances = [buitenRol( component.props.contextinstance )];
          }
          if (childRol === "binnenRol")
          {
            roleInstances = [binnenRol( component.props.contextinstance )];
          }
          if (!roleInstances)
          {
            console.error( "Rollen (" + component.props.namespace + ") has no rol '" + childRol + "' while the child of type '" + child.type.name + "' asks for it." );
            return <p className="error">Rollen ({component.props.namespace}) has no rol '{childRol}' while the child of type '{child.type.name}' asks for it.</p>;
          }
          return roleInstances.map(
            function(roleInstance)
            {
              return React.cloneElement(
                child,
                {
                  key: roleInstance,
                  rolinstance: roleInstance,
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
  rollen: PropTypes.array.isRequired,
  namespace: PropTypes.string,
  contextinstance: PropTypes.string
};
// Rollen passes on:
// key
// namespace
// rolinstance

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
            component.props.rolinstance,
            function (binding)
            {
              component.setState({binding: binding[0]});
            }));
        // Retrieve the type of the binding.
        // This will be the namespace that its properties are defined in.
        component.addUnsubscriber(
          pproxy.getBindingType(
            component.props.rolinstance,
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
                rolinstance: component.state.binding,
                namespace: component.state.bindingType
              });
          });
      }
      else
      {
        return React.cloneElement(
          component.props.children,
          {
            rolinstance: component.state.binding,
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
  namespace: PropTypes.string,
  rolinstance: PropTypes.string,
  rolname: PropTypes.string
};
// RolBinding passes on:
// rolinstance
// namespace (= the type of the binding).

function BoundContext(props)
{
  return (<RolBinding rolname={props.rolname}>
      <ContextOfRole></ContextOfRole>
    </RolBinding>);
}

BoundContext.propTypes = {
  rolinstance: PropTypes.string,
  rolname: PropTypes.string
}

// BoundContext passes on:
// contextinstance
// namespace

// NOTE. If a view contains two properties whose local names are equal (even while their qualified names are unique),
// the state of the View component will have the value of the property that was last fetched for that local name.
// To solve this problem, use the localName rolProperty of the View (however, this has not yet been implemented).
class View extends PerspectivesComponent
{
  componentDidMount ()
  {
    const component = this;
    Perspectives.then(
      function(pproxy)
      {
        let qualifiedView;
        component.state.namespace = component.props.namespace;
        component.state.rolinstance = component.props.rolinstance;
        // This ugly hack needs to go! The royal way is to make the type of buitenRol no longer have "Beschrijving" as part of its name.
        if (component.props.rolname === "buitenRol")
        {
          component.state.rolname = "buitenRolBeschrijving"
        }
        else if (component.props.rolname === "binnenRol")
        {
          component.state.rolname = "binnenRolBeschrijving"
        }
        else
        {
          component.state.rolname = component.props.rolname;
        }
        if (component.state.rolname)
        {
          qualifiedView = component.state.namespace + "$" + component.state.rolname + "$" + component.props.viewname;
        }
        else
        {
          qualifiedView = component.state.namespace + "$" + component.props.viewname;
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
                    component.props.rolinstance,
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


  // render! props.children contains the nested elements.
  // These should be provided all property name-value pairs,
  // except when it has a prop 'propertyName'.
  // However, this can only be done after state is available.
  render ()
  {
    const component = this;

    function cloneChild (child)
    {
      // If the child has a prop 'propertyName', just provide the property value.
      if (child.props.propertyname)
      {
        return React.cloneElement(
          child,
          {
            value: component.state[child.props.propertyname],
            namespace: component.state.namespace,
            rolinstance: component.state.rolinstance,
            rolname: component.state.rolname
          });
      }
      else
      {
        // State has a member for each property, holding its value.
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
// View passes on:
// namespace
// rolinstance
// rolname
// and a prop for each Property on the View.
// If a child has a value for 'propertyname' on its props,
// it will receive prop 'value' and the above.

View.propTypes = {
  namespace: PropTypes.string,
  rolinstance: PropTypes.string,
  rolname: PropTypes.string,
  viewname: PropTypes.string.isRequired
};

class ContextOfRole extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
    this.state.contextInstance = undefined;
    this.state.contextType = undefined;
  }

  componentDidMount ()
  {
    const component = this;
    Perspectives.then(
      function (pproxy)
      {
        // The context of the rol will be bound to the state prop 'contextInstance'.
        component.addUnsubscriber(
          pproxy.getRolContext(
            component.props.rolinstance,
            function (contextId)
            {
              component.setState({contextInstance: contextId[0]});
              // The type of the contextInstance.
              component.addUnsubscriber(
                pproxy.getContextType(
                  contextId[0],
                  function (contextType)
                  {
                    component.setState({contextType: contextType[0]});
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
      return (<Context contextinstance={component.state.contextInstance} type={component.state.contextType}>
        {component.props.children}
      </Context>);
    }
    else
    {
      return <div />;
    }
  }

}
ContextOfRole.propTypes = {
  rolinstance: PropTypes.string
};
// ContextOfRole passes on:
// contextinstance

// Access a View on the BuitenRol bound to a Rol of the surrounding context.
function ExternalViewOfBoundContext(props)
{
  return (<RolBinding rolname={props.rolname} rolinstance={props.rolinstance}>
    <View viewname={props.viewname}>{props.children}</View>
  </RolBinding>);
}

ExternalViewOfBoundContext.propTypes = {
  rolname: PropTypes.string.isRequired,
  viewname: PropTypes.string.isRequired,
  rolinstance: PropTypes.string
};

// Access a View on the BinnenRol bound to a Rol of the surrounding context.
function InternalViewOfBoundContext(props)
{
  return (<RolBinding rolname={props.rolname} rolinstance={props.rolinstance}>
    <ContextOfRole>
      <ViewOnInternalRole viewname={props.viewname}>{props.children}</ViewOnInternalRole>
    </ContextOfRole>
  </RolBinding>);
}

InternalViewOfBoundContext.propTypes = {
  rolname: PropTypes.string.isRequired,
  rolinstance: PropTypes.string,
  viewname: PropTypes.string.isRequired
};

// Access a View on the BuitenRol of a Context.
function ViewOnExternalRole(props)
{
  return (<ExternalRole contextinstance={props.contextinstance} namespace={props.namespace}>
      <View viewname={props.viewname}>{props.children}</View>
    </ExternalRole>)
}

ViewOnExternalRole.propTypes = {
  contextinstance: PropTypes.string,
  namespace: PropTypes.string,
  viewname: PropTypes.string.isRequired
};

// Access a View on the BinnenRol of a Context.
function ViewOnInternalRole(props)
{
  return (<InternalRole contextinstance={props.contextinstance} namespace={props.namespace}>
      <View viewname={props.viewname}>{props.children}</View>
    </InternalRole>)
}

ViewOnInternalRole.propTypes = {
  contextinstance: PropTypes.string,
  namespace: PropTypes.string,
  viewname: PropTypes.string.isRequired
};

class ExternalRole extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
    this.state.rolinstance = buitenRol( props.contextinstance );
    this.state.roltype = undefined;
  }
  componentDidMount()
  {
    const component = this;
    Perspectives.then(
      function (pproxy)
      {
        component.addUnsubscriber(
          pproxy.getRolType(
            component.state.rolinstance,
            function(rolType)
            {
              const updater = { rolinstance: component.state.rolinstance, roltype: rolType[0]};
              component.setState( updater );
            }
          )
        )
      }
    );
  }

  render ()
  {
    const component = this;
    if (component.stateIsComplete())
    {
      return React.Children.map(
        component.props.children,
        function(child)
        {
          // Set contextinstance and namespace of the children.
          return React.cloneElement(
            child,
            {
              rolinstance: component.state.rolinstance,
              namespace: deconstructNamespace( component.state.roltype ),
              rolname: "buitenRolBeschrijving"
            });
        }
      );
    }
    else
    {
      return <div/>;
    }
  }
}

ExternalRole.propTypes = {
  contextinstance: PropTypes.string,
  namespace: PropTypes.string
};
// ExternalRole passes on:
// namespace
// rolinstance
// rolname

class InternalRole extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
    this.state.rolinstance = binnenRol( props.contextinstance );
    this.state.roltype = undefined;
  }
  componentDidMount()
  {
    const component = this;
    Perspectives.then(
      function (pproxy)
      {
        component.addUnsubscriber(
          pproxy.getRolType(
            component.state.rolinstance,
            function(rolType)
            {
              const updater = { rolinstance: component.state.rolinstance, roltype: rolType[0]};
              component.setState( updater );
            }
          )
        )
      }
    );
  }

  render ()
  {
    const component = this;
    if (component.stateIsComplete())
    {
      return React.Children.map(
        component.props.children,
        function(child)
        {
          // Set contextinstance and namespace of the children.
          return React.cloneElement(
            child,
            {
              rolinstance: component.state.rolinstance,
              namespace: deconstructNamespace( component.state.roltype ),
              rolname: "binnenRolBeschrijving"
            });
        }
      );
    }
    else
    {
      return <div/>;
    }
  }
}

InternalRole.propTypes = {
  contextinstance: PropTypes.string,
  namespace: PropTypes.string
};

// InternalRole passes on:
// namespace
// rolinstance
// rolname

class SetProperty extends PerspectivesComponent
{
  changeValue (val)
  {
    const component = this,
      roleInstance = component.props.rolinstance,
      propertyname = component.props.namespace + "$" + component.props.rolname + "$" + component.props.propertyname;
    Perspectives.then(
      function(pproxy)
      {
        pproxy.setProperty(roleInstance, propertyname, val);
      });
  }

  // Render! props.children contains the nested elements that provide input controls.
  // These should be provided these props:
  //  - value
  //  - setvalue
  render ()
  {
    const component = this;
    // component.props.propertyname
    // component.props.value

    function cloneChild (child)
    {
      return React.cloneElement(
        child,
        {
          defaultvalue: component.props.value,
          setvalue: function(val)
          {
            component.changeValue(val);
          }
        });
    }

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
}

SetProperty.propTypes = {
  namespace: PropTypes.string,
  propertyname: PropTypes.string.isRequired,
  rolinstance: PropTypes.string,
  rolname: PropTypes.string,
  value: PropTypes.array
};

// SetProperty passes on:
// defaultvalue
// setvalue

class CreateContext extends PerspectivesComponent
{
  create (contextDescription)
  {
    const component = this;
    const defaultContextDescription = {
      id: "", // will be set in the core.
      prototype : undefined,
      ctype: component.props.contextname,
      rollen: {},
      interneProperties: {},
      externeProperties: {}
    };
    // Move all properties to the default context description to ensure we send a complete description.
    Object.assign(contextDescription, defaultContextDescription);

    Perspectives.then(
      function(pproxy)
      {
        if ( component.props.rolinstance )
        {
          // Create a new Context and bind it in the existing rolinstance.
          pproxy.createContext(
            defaultContextDescription,
            function( buitenRolId )
            {
              pproxy.setBinding( component.props.rolinstance, buitenRolId[0] );
            });
        }
        else if ( component.props.contextinstance && component.props.rolname )
        {
          // Create a new Context and bind it in a new rolinstance.
          pproxy.createContext(
            defaultContextDescription,
            function( buitenRolId )
            {
              pproxy.createRol(
                component.props.contextinstance,
                // dit moet namespace zijn.
                component.props.namespace + "$" + component.props.rolname,
                {properties: {}},
                function( rolId )
                {
                  pproxy.setBinding( rolId[0], buitenRolId[0] );
                });
            });
        }
        else
        {
          // Create a new Context.
          pproxy.createContext(
            defaultContextDescription,
            function( buitenRolId ) {});
        }
      });
  }

  // Render! props.children contains the nested elements that provide input controls.
  // These should be provided these props:
  //  - create
  render ()
  {
    const component = this;

    function cloneChild (child)
    {
      return React.cloneElement(
        child,
        {
          create: function(contextDescription)
          {
            component.create(contextDescription);
          }
        });
    }

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
}

CreateContext.propTypes = {
  contextinstance: PropTypes.string,
  contextname: PropTypes.string.isRequired,
  namespace: PropTypes.string,
  rolinstance: PropTypes.string,
  rolname: PropTypes.string
};

// CreateContext passes on:
// create


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

////////////////////////////////////////////////////////////////////////////////
// NOTE DEPENDENCIES. Code in this section is adapted from module Perspectives.Identifiers.
// A Namespace has the form "model:Name"
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

function binnenRol( s )
{
  const modelRegEx = new RegExp("^model:(\\w*)$");
  if (s.match(modelRegEx))
  {
    return s + "$_binnenRol";
  }
  else
  {
    return s + "_binnenRol";
  }
}

function deconstructNamespace( s )
{
  const domeinURIRegex = new RegExp("^(model:\\w*.*)\\$(\\w*)");
  const m = s.match(domeinURIRegex);
  if ( m )
  {
    return m[1];
  }
  else {
    throw "deconstructNamespace: the string '" + s + "' is not a well-formed domeinURI";
  }
}
////////////////////////////////////////////////////////////////////////////////

// TODO
// InverseRoleBinding

module.exports = {
  Context: Context,
  Rollen: Rollen,
  RolBinding: RolBinding,
  View: View,
  ContextOfRole: ContextOfRole,
  ExternalViewOfBoundContext: ExternalViewOfBoundContext,
  InternalViewOfBoundContext: InternalViewOfBoundContext,
  ViewOnExternalRole: ViewOnExternalRole,
  SetProperty: SetProperty,
  BoundContext: BoundContext,
  CreateContext: CreateContext
};
