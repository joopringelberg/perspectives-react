const React = require("react");
const Component = React.PureComponent;
import {PSRol} from "./reactcontexts.js";
const PDRproxy = require("perspectives-proxy").PDRproxy;
import RoleDropZone from "./roleDropzone.js";
import {addBehaviour} from "./behaviourcomponent.js";
import PerspectivesComponent from "./perspectivescomponent.js";
import RoleInstance from "./roleinstance.js";
import
  { Row
  , Col
  , Form
  , Card
  , Button
  } from "react-bootstrap";
const PropTypes = require("prop-types");

////////////////////////////////////////////////////////////////////////////////
// ROLEFORM
////////////////////////////////////////////////////////////////////////////////

export default class PerspectiveForm extends PerspectivesComponent
{
  constructor(props)
  {
    super(props);
    this.state = {roleInstanceWithProps: Object.values( this.props.perspective.roleInstances )[0]};
    this.checkBinding = this.checkBinding.bind(this);
    this.bind_ = this.bind_.bind(this);
    this.createRoleInstance = this.createRoleInstance.bind(this);
    this.DraggableCard = addBehaviour( RoleCard, this.props.behaviours );
  }

  changeValue (qualifiedPropertyName, val)
  {
    const component = this;
    const oldValue = component.findValue( qualifiedPropertyName );
    if ( Array.isArray( val ) )
    {
      throw "Perspectives-react, View: supply a single string value to the function 'setvalue'.";
    }
    if (oldValue.length != 1 || oldValue[0] != val)
    {
      PDRproxy.then(
        function(pproxy)
        {
          pproxy.setProperty(
            component.state.roleInstanceWithProps.roleId,
            qualifiedPropertyName,
            val,
            component.props.myroletype );
        });
    }
  }

  findValue( propId )
  {
    const component = this;
    if (component.state.roleInstanceWithProps)
    {
      return component.state.roleInstanceWithProps.propertyValues[propId].values;
    }
  }

  componentDidMount()
  {
    const component = this;
    if (!component.state.roleInstanceWithProps && !component.props.perspective.isCalculated && component.props.perspective.isMandatory)
    {
      component.createRoleInstance();
    }
  }

  createRoleInstance()
  {
    const component = this;
    PDRproxy.then(
      function (pproxy)
      {
        pproxy.createRole(
          component.props.contextinstance,
          component.props.perspective.roleType,
          component.props.myroletype);
      }
    );
  }

  checkBinding({rolinstance}, callback)
  {
    const component = this;
    PDRproxy.then( pproxy =>
    // checkBinding( <contexttype>, <localRolName>, <binding>, [() -> undefined] )
    pproxy.checkBinding(
      component.props.contexttype,
      component.props.perspective.roleType,
      rolinstance,
      function(psbool)
      {
        callback( psbool[0] === "true" );
      }));
  }

  bind_(rolInstance)
  {
    const component = this;
    return function({rolinstance})
      {
        if (rolinstance)
        {
          // checkBinding( <contexttype>, <localRolName>, <binding>, [() -> undefined] )
          PDRproxy.then(
            function (pproxy)
            {
              pproxy.checkBinding(
                component.props.perspective.contexttype,
                component.props.perspective.roleType,
                rolinstance,
                function(psbool)
                {
                  if ( psbool[0] === "true" )
                  {
                    pproxy.bind_(
                      rolInstance, // binder: component.state.rolinstance?
                      rolinstance, // binding
                      component.props.myroletype,
                      function( /*rolId*/ ){});
                  }
                  else
                  {
                    alert("Cannot bind_!");
                  }
                });
          });
        }
      };
  }

  render ()
  {
    const component = this;
    // const component = this;
    const perspective = this.props.perspective;
    const DraggableCard = this.DraggableCard;

    if (component.state.roleInstanceWithProps)
    {
      return <RoleDropZone
          bind={component.bind_}
          checkbinding={component.checkBinding}
          ariaLabel="To fill the role whose properties are displayed here, drag another role onto it."
          >
          {
            Object.values(perspective.properties).map(serialisedProperty =>
              <Form.Group as={Row} key={serialisedProperty.id}>
                <Form.Label column sm="3">{ serialisedProperty.displayName }</Form.Label>
                <Col sm="9">
                  <Form.Control
                    aria-label={ serialisedProperty.displayName }
                    defaultValue={component.findValue( serialisedProperty.id )} onBlur={e => component.changeValue(serialisedProperty.id, e.target.value)}/>
                </Col>
              </Form.Group>
            )
          }
          <Row>
            <RoleInstance roleinstance={component.state.roleInstanceWithProps.roleId}>
              <DraggableCard/>
            </RoleInstance>
          </Row>
        </RoleDropZone>;
    }
    else
    {
      // If there is no role instance, it is not mandatory. We'll show all fields disabled and a create button.
      return <>
        {
          Object.values(perspective.properties).map(serialisedProperty =>
            <Form.Group as={Row} key={serialisedProperty.id}>
                      <Form.Label column sm="3">{ serialisedProperty.displayName }</Form.Label>
                      <Col sm="9">
                        <Form.Control
                          disabled={true}
                          aria-label={ serialisedProperty.displayName }
                          onBlur={e => component.changeValue(serialisedProperty.id, e.target.value)}/>
                      </Col>
                    </Form.Group>
        )}
        <Row>
          <Button variant="secondary" onClick={component.createRoleInstance}/>
        </Row>
        </>;
    }
  }
}

PerspectiveForm.propTypes =
  { perspective: PropTypes.object.isRequired
  , myroletype: PropTypes.string.isRequired
  , contextinstance: PropTypes.string.isRequired
  , contexttype: PropTypes.string.isRequired
  , behaviours: PropTypes.arrayOf(PropTypes.func)
  };

class RoleCard extends Component
{
  componentDidMount()
  {
    this.props.setSelf(this);
  }
  render()
  {
      return  <Card tabIndex="0" aria-label="Drag this card to manipulate this role.">
                <Card.Body>
                  <Card.Text>
                    Drag this role
                  </Card.Text>
                </Card.Body>
              </Card>;
  }
}
RoleCard.contextType = PSRol;

RoleCard.propTypes = { setSelf: PropTypes.func };
