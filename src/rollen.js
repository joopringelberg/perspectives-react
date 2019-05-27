const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;
const PerspectivesComponent = require("perspectivescomponent").PerspectivesComponent;

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

module.exports = {Rollen: Rollen};
