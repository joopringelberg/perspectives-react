// BEGIN LICENSE
// Perspectives Distributed Runtime
// Copyright (C) 2019 Joop Ringelberg (joopringelberg@perspect.it), Cor Baars
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
//
// Full text of this license can be found in the LICENSE file in the projects root.
// END LICENSE

// This Component is built upon the data sent from the PDR for a single property.

import React, { PureComponent } from "react";
const Component = PureComponent;
import {PDRproxy} from "perspectives-proxy";
import
  { Form
  } from "react-bootstrap";
import {string, bool, any} from "prop-types";

import {serialisedProperty, propertyValues} from "./perspectiveshape.js";
import {UserMessagingPromise} from "./userMessaging.js";
import i18next from "i18next";
import PerspectivesFile from "./perspectivesFile.js";
import {MarkDownWidget} from "./markdownWidget.js";

////////////////////////////////////////////////////////////////////////////////
// TABINDEX VALUES
////////////////////////////////////////////////////////////////////////////////
// A negative value means that the element should be focusable,
// but should not be reachable via sequential keyboard navigation;
// Presumably this means clicking on it or setting it from Javascript.
const focusable = -1;

// 0 means that the element should be focusable and reachable via sequential keyboard navigation,
// but its relative order is defined by the platform convention;
const receiveFocusByKeyboard = 0;

export default class SmartFieldControl extends Component
{
  constructor(props)
  {
    super(props);
    this.inputType = this.mapRange( this.props.serialisedProperty.range );
    // If the range is PDateTime, `value` is a string that represents an Epoch. We convert it to a DateTime format that the input control accepts.
    // before storing it, we convert it back to an Epoch.
    this.state = { value: this.valueOnProps() };
    this.leaveControl = this.leaveControl.bind(this);
    this.controlType = this.htmlControlType();
  }

  componentDidUpdate(prevProps)
  {
    if (prevProps.propertyValues
        && this.props.propertyValues
        && prevProps.propertyValues.values[0] != this.props.propertyValues.values[0])
    {
      this.setState({ value: this.valueOnProps()});
    }
  }

  htmlControlType ()
  {
    const controlType = this.mapRange(this.props.serialisedProperty.range );
    if (controlType == "checkbox")
    {
      return "checkbox";
    }
    if (controlType == "text")
    {
      if (this.maxLength(controlType) > 80 || this.minLength(controlType) > 80 || this.state.value.length > 80)
      {
        return "textarea";
      }
      else if (this.enumeration().length > 0)
      {
        return "select";
      }
      else
      {
        return "input";
      }
    }
    if (controlType == "file")
    {
      return "PerspectivesFile";
    }
    if (controlType == "markdown")
      {
        return "MarkDownWidget";
      }
  }

  // Returns the first value in the `propertyValues` prop, or the empty string.
  valueOnProps()
  {
    function epoch_to_datetime_local (epoch)
    {
      const dt = new Date( parseInt( epoch ) );
      dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
      return dt.toISOString().slice(0,16);
    }

    // returns either "hh:mm" or "hh:mm.ss"
    function milliseconds_to_time (millis)
    {
      // If I don't subtract 
      const tm = new Date( parseInt( millis ) );
      return pad(tm.getUTCHours()) + ":" + pad(tm.getUTCMinutes()) + (tm.getUTCSeconds() ? ":" + pad(tm.getUTCMilliseconds()) : "");
    }

    // returns "yyyy-mm-dd"
    function epoch_to_date( epoch )
    {
      const dt = new Date( parseInt( epoch ) );
      return dt.getFullYear() + "-" + pad( (dt.getMonth() + 1) ) + "-" + pad( dt.getDate() );
    }
    function pad(n)
    {
      if (n < 10)
      {
        return "0" + n;
      }
      else
      {
        return n + "";
      }
    }
  
    if (this.props.propertyValues)
    {
      if (this.props.propertyValues.values[0])
      {
        switch (this.inputType) {
          case "datetime-local":
            // a datetime is represented as a timestamp (milliseconds sinds epoch).
            return epoch_to_datetime_local( this.props.propertyValues.values[0] );  
          case "date":
            // A date is represented as a timestamp, but without a time component.
            return epoch_to_date ( this.props.propertyValues.values[0] );
          case "time":
            // a time is represented in terms of milliseconds.
            // We have to provide a string in the form "hh:mm"
            return milliseconds_to_time ( this.props.propertyValues.values[0] );
            return
          default:
            return this.props.propertyValues.values[0];
        }
      }
      else 
      {
        return "";
      }
    }
    else
    {
      return "";
    }
  }

  // See: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input
  // We add "markdown"
  mapRange( range )
  {
    switch (range) {
      case "PString":
        return "text";
      case "PBool":
        return "checkbox";
      case "PDateTime":
        return "datetime-local";
      case "PDate":
        return "date";
      case "PTime":
        return "time";
        case "PNumber":
        return "number";
      case "PEmail":
        return "email";
      case "PFile":
        return "file";
      case "PMarkDown":
        return "markdown"
    }
  }

  // `val` is a string.
  changeValue (val)
  {
    function inputVal_to_value()
    {
      switch (component.inputType) {
        case "datetime-local":
          // return the timestamp (milliseconds since the epoch).
          return new Date(val).valueOf() + "";
        case "date":
          // return the timestamp (milliseconds since the epoch).
          return new Date(val).valueOf() + "";
        case "time":
          // val is a string in the format "hh:mm" or " hh:mm:ss"
          // We return the corresponding milliseconds.
          return (new Date("1970-01-01T" + val).valueOf() - new Date('1970-01-01T00:00').valueOf() ) + "";
        default:
          return val
      }
    }
    const component = this;
    const oldValue = component.valueOnProps();
    if (val == "")
    {
      PDRproxy.then(
        function(pproxy)
        {
          pproxy.deleteProperty(
            component.props.roleId,
            component.props.serialisedProperty.id,
            component.props.myroletype )
            .catch(e => UserMessagingPromise.then( um => 
              um.addMessageForEndUser(
                { title: i18next.t("setProperty_title", { ns: 'preact' }) 
                , message: i18next.t("deleteProperty_message", {ns: 'preact', property: component.props.serialisedProperty.id})
                , error: e.toString()
                })));
          });
    }
    else if ( oldValue != val )
    {
      PDRproxy.then(
        function(pproxy)
        {
          pproxy.setProperty(
            component.props.roleId,
            component.props.serialisedProperty.id,
            inputVal_to_value(),
            component.props.myroletype )
            .catch(e => UserMessagingPromise.then( um => 
              um.addMessageForEndUser(
                { title: i18next.t("setProperty_title", { ns: 'preact' }) 
                , message: i18next.t("setProperty_message", {ns: 'preact', property: component.props.serialisedProperty.id})
                , error: e.toString()
                })));
          });
    }
  }

  // newvalue should be a string.
  handleKeyDown (event, newvalue)
  {
    const component = this;
    if (!component.props.disabled)
    {
      switch( event.keyCode )
      {
        // Assuming this code only runs when the field control is active,
        // let it handle the navigation keys locally but do not bubble.
        case 37: // left arrow.
        case 39: // right arrow.
        case 38: // Up arrow
        case 40: // Down arrow
        case 9:  // Horizontal Tab.
        case 11: // Vertical Tab.
        case 32: // Space
          event.stopPropagation();
          break;
        case 13: // Return
          if ( !event.shiftKey )
            {
              // Safe changes, allow event to bubble.
              if (component.reportValidity(event))
                {
                  component.changeValue(newvalue);
                }
                else
                {
                  event.stopPropagation();
                }  
            }
          else
            {
              event.stopPropagation();
            }
          break;
        case 27: // Escape
          // Discard changes, allow event to bubble.
          component.setState( {value: component.valueOnProps()});
          event.preventDefault();
          break;
      }
    }
  }

  // This method is called onBlur, i.e. when the user navigates away
  // from the SmartFieldControl.
  // Event target is the input control.
  leaveControl(e)
  {
    this.changeValue(e.target.value);
    return this.reportValidity(e);
  }

  // The event should have the input element as target. Returns true iff no constraints are violated.
  reportValidity(event)
  {
    // A ValidityState object. See: https://developer.mozilla.org/en-US/docs/Web/API/ValidityState
    const validity = event.target.validity;
    // We have no validity check for MarkDown.
    if (validity && validity.patternMismatch)
    {
      // We now expect a pattern in the perspective.
      const label = this.pattern(this.inputType).label;
      event.target.setCustomValidity( label );
    }
    else
    {
      event.target.setCustomValidity( "" );
    }
    return event.target.reportValidity();
  }

  // Returns an integer or undefined.
  minLength()
  {
    const component = this;
    if (["text", "search", "url", "tel", "email", "password", "markdown"].indexOf(this.inputType) >= 0)
    {
      return component.props.serialisedProperty.constrainingFacets.minLength;
    }
  }

  // Returns an integer or undefined.
  maxLength()
  {
    const component = this;
    if (["text", "search", "url", "tel", "email", "password", "markdown"].indexOf(this.inputType) >= 0)
    {
      return component.props.serialisedProperty.constrainingFacets.maxLength;
    }
  }

  // Returns an integer or undefined.
  minInclusive()
  {
    const component = this;
    if (["range", "number", "date", "month", "week", "datetime", "datetime-local", "time"].indexOf(this.inputType) >= 0)
    {
      return component.props.serialisedProperty.constrainingFacets.minInclusive;
    }
  }

  // Returns an integer or undefined.
  maxInclusive()
  {
    const component = this;
    if (["range", "number", "date", "month", "week", "datetime", "datetime-local", "time"].indexOf(this.inputType) >= 0)
    {
      return component.props.serialisedProperty.constrainingFacets.maxInclusive;
    }
  }

  // Returns an array of strings.
  enumeration()
  {
    return this.props.serialisedProperty.constrainingFacets.enumeration || [];
  }

  // Returns object of this shape:
  // { regex: string.isRequired
  // , label: string.isRequired}
  pattern()
  {
    const component = this;
    if (["text", "search", "url", "tel", "email", "password"].indexOf(this.inputType) >= 0)
    {
      return component.props.serialisedProperty.constrainingFacets.pattern;
    }
  }

  render()
  {
    function toggleValue()
    {
      const newvalue = (component.state.value != "true").toString();
      if ( !component.props.disabled )
      {
        component.changeValue(newvalue);
      }
    }
    // Expects object of this shape:
    // { regex: string.isRequired
    // , label: string.isRequired}
    // Returns the string that represents just the regex, no flags.
    // label has the shape /regex/flags.
    // flags will be ignored.
    function patternToSource(p)
    {
      const r = /\/(.*)\//;
      return p.regex.match(r)[1];
    }

    const component = this;
    const mandatory = component.props.serialisedProperty.isMandatory;
    const pattern = component.pattern();
    switch ( this.controlType ){
      case "checkbox":
        return (
          <div onKeyDown={e => component.handleKeyDown(e, component.state.value)}>
            <Form.Check
              ref= { component.props.inputRef}
              tabIndex={component.props.isselected ? receiveFocusByKeyboard : focusable}
              aria-label={ component.props.serialisedProperty.displayName }
              readOnly={ component.props.disabled }
              checked={ component.state.value == "true" }
              onChange={ toggleValue }
              required={mandatory}
            />
          </div>);
      case "select":
        return (
          <div onKeyDown={e => component.handleKeyDown(e, e.target.value)}>
            <Form.Control
              as="select"
              ref= { component.props.inputRef}
              tabIndex={component.props.isselected ? receiveFocusByKeyboard : focusable}
              aria-label={ component.props.serialisedProperty.displayName }
              readOnly={ component.props.disabled }
              disabled={ component.props.disabled }
              value={ component.state.value }
              onChange={e => component.setState({value: e.target.value}) }
              onBlur={component.leaveControl}
              required={mandatory}
            >
            {
              component.enumeration().map( value => <option key={value}>{value}</option>)
            }
            </Form.Control>
          </div>);
      case "PerspectivesFile":
        return (
          <PerspectivesFile
            serialisedProperty={component.props.serialisedProperty}
            propertyValues={component.props.propertyValues}
            roleId={component.props.roleId}
            myRoletype={component.props.myroletype}>
          </PerspectivesFile>
        );
      case "MarkDownWidget":
          if (component.props.disabled)
            {
              // Just render the html for a read-only perspective on this property.
              return <MarkDownWidget markdown={component.state.value} contextid={component.props.contextinstance} myroletype={component.props.myroletype}/>;
            }
          else
          {
            // Create an editor. Currently, this is just an html input or a textarea, depdending on minInclusive.
            return (
              <div onKeyDown={e => component.handleKeyDown(e, e.target.value)}>
                <Form.Control
                  as={component.minLength("markdown") > 80 ? "textarea" : "input"}
                  ref= { component.props.inputRef}
                  tabIndex={component.props.isselected ? receiveFocusByKeyboard : focusable}
                  aria-label={ pattern? pattern.label : component.props.serialisedProperty.displayName }
                  readOnly={ component.props.disabled }
                  value={ component.state.value }
                  onChange={e => component.setState({value: e.target.value}) }
                  onBlur={component.leaveControl}
                  type="text"
                  required={mandatory}
                  minLength={component.minLength()}
                  maxLength={component.maxLength()}
                  min={component.minInclusive()}
                  max={component.maxInclusive()}
                  pattern={ pattern ? patternToSource(pattern) : null }
                />
              </div>);
              }
      default:
        return (
          <div onKeyDown={e => component.handleKeyDown(e, e.target.value)}>
            <Form.Control
              as={ component.controlType }
              ref= { component.props.inputRef}
              tabIndex={component.props.isselected ? receiveFocusByKeyboard : focusable}
              aria-label={ pattern? pattern.label : component.props.serialisedProperty.displayName }
              readOnly={ component.props.disabled }
              value={ component.state.value }
              onChange={e => component.setState({value: e.target.value}) }
              onBlur={component.leaveControl}
              type={component.inputType}
              required={mandatory}
              minLength={component.minLength()}
              maxLength={component.maxLength()}
              min={component.minInclusive()}
              max={component.maxInclusive()}
              pattern={ pattern ? patternToSource(pattern) : null }
            />
          </div>);
    }
  }
}

SmartFieldControl.propTypes =
  { serialisedProperty: serialisedProperty.isRequired

  // This member is not required, because the state of the role instance
  // may not allow this property.
  , propertyValues: propertyValues

  , roleId: string

  , myroletype: string.isRequired

  , inputRef: any

  , disabled: bool.isRequired

  , isselected: bool.isRequired

  , contextinstance: string.isRequired
  };
