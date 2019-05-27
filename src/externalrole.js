const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;
const PerspectivesComponent = require("perspectivescomponent").PerspectivesComponent;
const deconstructNamespace = require("urifunctions").deconstructNamespace;
const buitenRol = require("urifucntions").buitenRol;

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

module.exports = {ExternalRole: ExternalRole};
