import React from 'react';

import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

// import {PDRproxy} from "perspectives-proxy";
const PDRproxy = new Promise( function(resolve)
  {
    resolve(
      { setProperty: function(i1, i2, value){ alert("Stub: saving property value: " + value); return new Promise(resolver => resolver(true));}
      , saveFile: function(){ alert("Stub: saving file."); return new Promise(resolver => resolver(true));}
      }
    )
  })
import PropTypes from "prop-types";
import PerspectivesComponent from "./perspectivescomponent.js";
import {serialisedProperty, propertyValues} from "./perspectiveshape.js";
import i18next from "i18next";
import { Col } from 'react-bootstrap';
import { UploadIcon, DownloadIcon} from '@primer/octicons-react';

// As the real action happens in handleFile as it is presented on the props of FileDropZone,
// an error boundary is of no good here.

// States
const EMPTY = "empty";
const FILLED = "filled";
const UPLOAD = "upload";
const DOWNLOAD = "download";
const EDITABLE = "editable";
const FILENAME = "fileName";
const MIMETYPE = "mimeType";

const filePropShape = 
  PropTypes.shape(
    { fileName: PropTypes.string.isRequired
    , mimeType: PropTypes.string.isRequired
    , url: PropTypes.url
    }
  )

export default class PerspectivesFile extends PerspectivesComponent
{
  constructor(props)
  {
    super(props);
    let fileProp = {};
    if (props.propertyValues.values[0])
    {
      fileProp = JSON.parse( props.propertyValues.values[0] );
    }
    this.state = 
      { fileName: fileProp.fileName || "" // cannot be undefined as we pass it to the value prop of the input element.
      , mimeType: fileProp.mimeType || ""
      , state: EMPTY
      , previousState: EMPTY
      , selectedField: undefined
      , uploadedFile: undefined
      , url: fileProp.url
      }
  }

  componentDidUpdate()
  {
    let fileProp;
    if (this.props.propertyValues.values[0])
    {
      fileProp = JSON.parse( this.props.propertyValues.values[0] );
      this.setState({fileName: fileProp.fileName, mimeType: fileProp.mimeType, url: fileProp.url});
    }
  }

  handleKeyDown(event)
  {
    const component = this;
    switch (component.state.state) {
      case FILLED:
        
        break;
    
      case EDITABLE:
        
        break;

      // EMPTY is the default.
      case EMPTY:
      default:
        handleKeyDownInEmpty(event);
        break;
    }
  }

  handleKeyDownInEmpty(event)
  {
    const component = this;
    let fileName, mimeType, newFile;
    switch(event.keyCode){
      // case 9: // horizontal tab; vertical tab is 11
      // case 37: // left arrow
      case 39: // right arrow
        if (component.state.selectedField == FILENAME)
        {
          event.preventDefault();
          event.stopPropagation();      
          // the fileName field saves its value on losing focus; move focus to the other field
          component.focusMimeType();
        }
        else if (component.state.selectedField == MIMETYPE)
        {
          event.preventDefault();
          event.stopPropagation();      
          // the mimeType field saves its value on losing focus; move focus to the other field
          component.focusUpload();
        }
        else if (component.state.selectedField == UPLOAD)
        {
          event.preventDefault();
          event.stopPropagation();      
          component.focusFileName();
        }
        break;

      case 13: // Enter
        // Use values to create a file.
        // Both fields must be filled.
        event.preventDefault();
        event.stopPropagation();

        fileName = document.getElementById(this.props.serialisedProperty.id + '_fileName');
        mimeType = document.getElementById(this.props.serialisedProperty.id + '_mimeType');
        if ( this.reportValidity(fileName, "Provide a valid filename.") && this.reportValidity(mimeType, "Provide a valid mimeType."))
        {
          // Create the file and save it and the property value itself.
          component.saveFileAndProperty( new File([""], component.state.fileName, {type: component.state.mimeType}) ).then( () => 
            // Change state (previousState is still EMPTY).
            component.setState({uploadedFile: theFile, state: FILLED}) );
        }
      
        break;

      case 27: // Escape
        // Discard changes.
        event.preventDefault();
        event.stopPropagation();   
        // previousState is still EMPTY.
        component.setState({state: EMPTY, fileName: "", mimeType: "", uploadedFile: undefined});

        break;
      }
  }

  handleKeyDownInFilled(event)
  {
    const component = this;
    switch(event.keyCode){
      case 13: // Enter
      // Use values to create a file.
      // Both fields must be filled.
      event.preventDefault();
      event.stopPropagation();      

      // previousState is still EMPTY.
      component.setState({state: EDITABLE, selectedField: FILENAME})
    
      break;
    }
  }

  handleKeyDownInEditable(event)
  {
    const component = this;
    let fileName;
    switch(event.keyCode){
      // case 9: // horizontal tab; vertical tab is 11
      case 39: // right arrow
        if (component.state.selectedField == FILENAME)
        {
          event.preventDefault();
          event.stopPropagation();      
          // the fileName field saves its value on losing focus; move focus to the other field
          if (component.state.url)
          {
            component.focusDownload();
          }
          else
          {
            component.focusUpload();
          }
        }
        else if (component.state.selectedField == DOWNLOAD)
        {
          event.preventDefault();
          event.stopPropagation();      
          component.focusUpload();
        }
        else if (component.state.selectedField == UPLOAD)
        {
          event.preventDefault();
          event.stopPropagation();      
          component.focusFileName();
        }
        break;

      case 13: // Enter
        // Use values to create a file.
        // Both fields must be filled; this is guaranteed by the validityCheck.
        // Also, either the name or the file name must have changed.
        event.preventDefault();
        event.stopPropagation();      

        fileName = document.getElementById(this.props.serialisedProperty.id + '_fileName');
        if ( this.valuesChanged() && this.reportValidity(fileName, "Provide a valid filename.") )
        {
          // Save the property value.
          // Save the file
          component.saveFileAndProperty( component.state.uploadedFile ).then( () => 
            // Change state (previousState is still EMPTY). 
            // If a new file had been uploaded, it is registered in state already.
            component.setState({state: FILLED}) );
        }
      
        break;

      case 27: // Escape
        // Discard changes.
        event.preventDefault();
        event.stopPropagation();   
        // previousState is still EMPTY.
        component.setState({state: EMPTY, fileName: "", mimeType: "", uploadedFile: undefined});

        break;
      }
  }

  saveFileAndProperty(theFile)
  {
    const component = this;
    return PDRproxy.then( pproxy => 
      {
        pproxy
          // Construct and save the property's compound value.
          .setProperty(
            component.props.roleId,
            component.props.serialisedProperty.id,
            JSON.stringify(
              { fileName: component.state.fileName
              , mimeType: component.state.mimeType
              // the url will be decided by the PDR.
              }),
            component.props.myRoletype )
          .then( () => 
            // Save the file.
            pproxy.saveFile(
              component.props.roleId,
              component.props.serialisedProperty.id,
              theFile
            ) )
          .catch(e => UserMessagingPromise.then( um => 
            um.addMessageForEndUser(
              { title: i18next.t("saveFile_title", { ns: 'preact' }) 
              , message: i18next.t("saveFile_message", {ns: 'preact'})
              , error: e.toString()
              })))
      } );
  }

  // True iff either the file name or a file has been uploaded. 
  // NOTE: if the user uploads the same file twice in a row, we'll handle the second case
  // as if it were a new file even though we cannot really know.
  valuesChanged()
  {
    return this.props.propertyValues.values[0] != this.state.fileName
      || !!this.state.uploadedFile
  }

  // Focus on the fileName field. The mimeType field will save its value automatically in state.
  focusFileName()
  {
    this.setState({selectedField: FILENAME});
    document.getElementById(this.props.serialisedProperty.id + '_fileName').focus();
  }
  
  // Focus on the mimeType field. The fileName field will save its value automatically in state.
  focusMimeType()
  {
    this.setState({selectedField: MIMETYPE});
    document.getElementById(this.props.serialisedProperty.id + '_mimeType').focus();
  }

  // Focus on the upload button.
  focusUpload()
  {
    this.setState({selectedField: UPLOAD});
    document.getElementById(this.props.serialisedProperty.id + '_upload').focus();
  }

  // Focus on the download button.
  focusDownload()
  {
    this.setState({selectedField: DOWNLOAD});
    document.getElementById(this.props.serialisedProperty.id + '_download').focus();
  }

  upload(event)
  {
    function doit()
    {
      event.preventDefault();
      event.stopPropagation();   
      document.getElementById('selectedFile').click();
    }
    if (event.type == "click")
    {
      doit();
    }
    switch(event.keyCode){
      case 32: // space
        doit();
    }
  }

  handleFileSelect(fileList)
  {
    const theFile = fileList.item(0);
    if ( theFile )
    {
      this.saveFileAndProperty( theFile ).then( () => 
        this.setState(
          { fileName: theFile.name
          , mimeType: theFile.type
          , state: FILLED
          , uploadedFile: theFile}));
    }
  }

  download(event)
  {
    function doit()
    {
      const element = document.createElement('a');
      event.preventDefault();
      event.stopPropagation();   

      element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(text));
      element.setAttribute('download', filename);
  
      element.style.display = 'none';
      document.body.appendChild(element);
  
      element.click();
  
      document.body.removeChild(element);
      }
    if ( this.state.url && event.type == "click")
    {
      doit();
    }
    else if (this.state.url && event.keyCode == 32 )
    {
      doit();
    }
  }

  setFileName(event)
  {
    if (this.reportValidity(event, "Provide a valid filename."))
    {
      this.setState({fileName: event.target.value});
    }
  }

  // The event should have the input element as target. Returns true iff no constraints are violated.
  reportValidity(el, message)
  {
    // A ValidityState object. See: https://developer.mozilla.org/en-US/docs/Web/API/ValidityState
    const validity = el.validity;
    if (validity.patternMismatch)
    {
      // We now expect a pattern in the perspective.
      el.setCustomValidity( message );
    }
    else
    {
      el.setCustomValidity( "" );
    }
    return el.reportValidity();
  }
  
  render()
  {
    const component = this;
    switch (component.state.state) {
      case FILLED:
        return (
          <div onKeyDown={e => component.handleKeyDownInFilled(e)} tabIndex="-1">
            <Form.Row>
              <Col lg="3">
                <Form.Control readOnly value={ component.state.fileName } tabIndex="-1" size="sm"/>
              </Col>
              <Col lg="2">
                <Form.Control readOnly value={ component.state.mimeType } tabIndex="-1" size="sm"/>
              </Col>
              <Col lg="1">
              <div style={{display: "flex"}}>
                <div 
                  style={{flexShrink: 1, opacity: component.state.url ? 1 : 0.5}}
                  id={component.props.serialisedProperty.id + '_download'}
                  onClick={ e => component.download(e) }
                  onKeyDown={ e => component.download(e) }
                  tabIndex="0"
                  >
                  <DownloadIcon 
                    aria-label={ i18next.t("perspectivesFile_download", { ns: 'preact' }) }
                    size='medium'
                  />
                </div>
              </div>
            </Col>
            </Form.Row>
            <input type="file" id="selectedFile" style={{display: "none"}} onChange={ev => component.handleFileSelect(ev.target.files)}/>
          </div>);
    
      case EDITABLE:
        return (
          <div onKeyDown={e => component.handleKeyDownInEditable(e)}>
            <Form.Row>
              <Col lg="3">
                <Form.Control
                id={component.props.serialisedProperty.id + '_fileName'}
                tabIndex="0"
                aria-label={ i18next.t("perspectivesFile_fileName", {ns: 'preact'}) }
                value={ component.state.fileName }
                onFocus={ () => component.setState({selectedField: FILENAME})}
                onChange={e => component.setState({fileName: e.target.value}) }
                onBlur={e => component.setState({fileName: e.target.value}) }
                type="text"
                required={true}
                pattern="^[^\./]+\.[^\./]+$"
                placeholder={ i18next.t("perspectivesFile_fileName_label", { ns: 'preact' }) }
                size="sm"
              />
            </Col>
            <Col lg="2">
              <Form.Control 
                readOnly 
                value={ component.state.mimeType } 
                tabIndex="-1"
                size="sm"
                />
            </Col>
            <Col lg="1">
              <div style={{display: "flex"}}>
                <div 
                  style={{flexShrink: 1, opacity: component.state.url ? 1 : 0.5}}
                  id={component.props.serialisedProperty.id + '_download'}
                  onClick={ e => component.download(e) }
                  onKeyDown={ e => component.download(e) }
                  tabIndex="0"
                  >
                  <DownloadIcon 
                    aria-label={ i18next.t("perspectivesFile_download", { ns: 'preact' }) }
                    size='medium'
                  />
                </div>
                <div 
                  style={{flexShrink: 1}}
                  id={component.props.serialisedProperty.id + '_upload'}
                  onClick={ e => component.upload(e) }
                  onKeyDown={ e => component.upload(e) }
                  tabIndex="0"
                  >
                  <UploadIcon 
                      aria-label={ i18next.t("perspectivesFile_upload", { ns: 'preact' }) }
                      size='medium'/>
                </div>
              </div>
            </Col>
            </Form.Row>
            <input type="file" id="selectedFile" style={{display: "none"}} onChange={ev => component.handleFileSelect(ev.target.files)}/>
          </div>);

      // EMPTY is the default.
      case EMPTY:
      default:
        return (
          <div onKeyDown={e => component.handleKeyDownInEmpty(e)}>
            <Form.Row>
              <Col lg="3">
                <Form.Control
                id={component.props.serialisedProperty.id + '_fileName'}
                aria-label={ i18next.t("perspectivesFile_fileName", {ns: 'preact'}) }
                value={ component.state.fileName }
                onFocus={ () => component.setState({selectedField: FILENAME})}
                onChange={e => component.setState({fileName: e.target.value}) }
                type="text"
                required={true}
                pattern="^[^\./]+\.[^\./]+$"
                size="sm"
                placeholder={ i18next.t("perspectivesFile_fileName_label", { ns: 'preact' }) }
                />
              </Col>
              <Col lg="2">
                <Form.Control
                  id={component.props.serialisedProperty.id + '_mimeType'}
                  aria-label={ i18next.t("perspectivesFile_mimeType", {ns: 'preact'}) }
                  value={ component.state.mimeType }
                  onFocus={ () => component.setState({selectedField: MIMETYPE})}
                  onChange={e => component.setState({mimeType: e.target.value}) }
                  type="text"
                  required={true}
                  pattern="^[^\./]+\/[^\./]+$"
                  size="sm"
                  placeholder={ i18next.t("perspectivesFile_mimeType_label", { ns: 'preact' }) }
                  />
              </Col>
              <Col lg="1">
                <div style={{display: "flex"}}>
                  <div 
                    style={{flexShrink: 1}}
                    id={component.props.serialisedProperty.id + '_upload'}
                    onClick={ e => component.upload(e) }
                    onKeyDown={ e => component.upload(e) }
                    tabIndex="0"
                    >
                    <UploadIcon 
                        aria-label={ i18next.t("perspectivesFile_upload", { ns: 'preact' }) }
                        size='medium'/>
                  </div>
                </div>
              </Col>
            </Form.Row>
            <input type="file" id="selectedFile" style={{display: "none"}} onChange={ev => component.handleFileSelect(ev.target.files)}/>
          </div>);
    }
  }
}

PerspectivesFile.propTypes =
  { serialisedProperty: serialisedProperty.isRequired 
  , propertyValues: propertyValues
  , roleId: PropTypes.string.isRequired
  , myRoletype: PropTypes.string.isRequired
}