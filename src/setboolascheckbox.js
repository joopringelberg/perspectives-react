import PropTypes from "prop-types";

import SetProperty from "./setproperty.js";

import {PSProperty} from "./reactcontexts.js";

import {Form, Row, Col, } from "react-bootstrap";

export default function SetBoolAsCheckbox ({propertyname, label, val})
{
  return  <SetProperty propertyname={propertyname}>
            <PSProperty.Consumer>
              {sprops => <Form.Group as={Row}>
                <Col>
                  <Form.Check
                    inline
                    aria-label={label}
                    checked={val ? "checked" : null}
                    disabled={val ? "disabled" : null}
                    // We start out with false and only allow changing once, so that must be to "true"!
                    onChange={e => sprops.setvalue( "true" )} />
                </Col>
                <Form.Label>{label}</Form.Label>
              </Form.Group>}
            </PSProperty.Consumer>
          </SetProperty>
}

SetBoolAsCheckbox.propTypes =
  { propertyname: PropTypes.string
  , label: PropTypes.string
  , val: PropTypes.bool
  };
