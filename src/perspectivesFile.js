import React from 'react';

import Form from 'react-bootstrap/Form';

import {PDRproxy} from "perspectives-proxy";
// const PDRproxy = new Promise( function(resolve)
//   {
//     resolve(
//       { setProperty: function(i1, i2, value){ alert("Stub: saving property value: " + value); return new Promise(resolver => resolver(true));}
//       , saveFile: function(){ alert("Stub: saving file."); return new Promise(resolver => resolver(true));}
//       }
//     )
//   })
import PropTypes from "prop-types";
import PerspectivesComponent from "./perspectivescomponent.js";
import {serialisedProperty, propertyValues} from "./perspectiveshape.js";
import i18next from "i18next";
import { Col } from 'react-bootstrap';
import { UploadIcon, DownloadIcon} from '@primer/octicons-react';
import {UserMessagingPromise} from "./userMessaging.js";
import {AsyncImage} from "./asyncImage.js";

// As the real action happens in handleFile as it is presented on the props of FileDropZone,
// an error boundary is of no good here.

// States
const EMPTY = "empty";
const FILLED = "filled";
const READONLY = "readonly";
const UPLOAD = "upload";
const DOWNLOAD = "download";
const EDITABLE = "editable";
const FILENAME = "fileName";
const MIMETYPE = "mimeType";

const filePropShape = 
  PropTypes.shape(
    { fileName: PropTypes.string.isRequired
    , mimeType: PropTypes.string.isRequired
    , database: PropTypes.string
    , roleFileName: PropTypes.string
    }
  )

export default class PerspectivesFile extends PerspectivesComponent
{
  constructor(props)
  {
    super(props);
    const fileProp = this.parsePropertyValue(this.props.propertyValues.values[0]);
    this.readOnly = this.propertyOnlyConsultable();
    this.state = 
      { fileName: fileProp.fileName || "" // cannot be undefined as we pass it to the value prop of the input element.
      , mimeType: fileProp.mimeType || ""
      , database: fileProp.database
      , roleFileName: fileProp.roleFileName
      , state: (this.readOnly || !props.roleId) ? READONLY : (fileProp.fileName ? FILLED : EMPTY)
      , previousState: EMPTY
      , selectedField: undefined
      , uploadedFile: undefined
      }
  }

  componentDidUpdate(prevProps)
  {
    let fileProp, prevFileProp = {}, updater = {};
    if ( prevProps.propertyValues.values[0] )
    {
      prevFileProp = JSON.parse( prevProps.propertyValues.values[0] );
    }
    if (this.props.propertyValues.values[0])
    {
      fileProp = JSON.parse( this.props.propertyValues.values[0] );
    }
    if ( fileProp && prevFileProp.fileName != fileProp.fileName )
    {
      updater = 
        { fileName: fileProp.fileName || ""
        , mimeType: fileProp.mimeType || ""
        , database: fileProp.database
        , roleFileName: fileProp.roleFileName
        , state: FILLED
        };
    }
    if (!prevProps.roleId && this.props.roleId)
    {
      updater.state = EMPTY;
    }
    if (Object.keys(updater).length > 0)
    {
      this.setState(updater);
    }
  }

  parsePropertyValue(pval)
  {
    if (pval)
    {
      return JSON.parse( pval );
    }
    else
    {
      return {};
    }
  }

    // The property is only consultable when it just has the verb Consult,
  // or when it is calculated. It will be shown disabled as a consequence.
  propertyOnlyConsultable()
  {
    if (this.props.propertyValues)
    {
      const propertyVerbs = this.props.propertyValues.propertyVerbs;
      const property = this.props.serialisedProperty;
      return (propertyVerbs.indexOf("Consult") > -1 
        && propertyVerbs.length == 1)
        || property.isCalculated;
    }
    else
    {
      return false;
    }
  }

  handleKeyDownInReadOnly(event)
  {
    const component = this;
    switch(event.keyCode){

      case 39: // right arrow
        // If we have a file (as can be seen from the url property), we may move to the download button.
        if (component.state.database)
        {
          event.preventDefault();
          event.stopPropagation();      
          component.focusDownload();
          break;
        }
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
        if  ( this.reportValidity(fileName, i18next.t("fileName_invalid", { ns: 'preact' })) && 
              this.reportValidity(mimeType, 
                component.props.serialisedProperty.constrainingFacets.pattern.label || i18next.t("mimeType_invalid", { ns: 'preact' }))
            )
        {
          // Create the file and save it and the property value itself.
          newFile = new File([""], component.state.fileName, {type: component.state.mimeType});
          component.saveFileAndProperty( newFile ).then( () => 
            // Change state (previousState is still EMPTY).
            component.setState({uploadedFile: newFile, state: FILLED}) );
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
        event.preventDefault();
        event.stopPropagation();      

        // previousState is still EMPTY.
        component.setState({state: EDITABLE, selectedField: FILENAME})
        break;

      case 39: // right arrow
        // If we have a file (as can be seen from the url property), we may move to the download button.
        if (component.state.database)
        {
          event.preventDefault();
          event.stopPropagation();      
          component.focusDownload();
          break;
        }
    }
  }

  handleKeyDownInEditable(event)
  {
    const component = this;
    let parsedPropertyValue;
    switch(event.keyCode){
      // case 9: // horizontal tab; vertical tab is 11
      case 39: // right arrow
        if (component.state.selectedField == FILENAME)
        {
          event.preventDefault();
          event.stopPropagation();      
          // the fileName field saves its value on losing focus; move focus to the other field
          if (component.state.database)
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
        event.preventDefault();
        event.stopPropagation();      

        parsedPropertyValue = component.parsePropertyValue(component.props.propertyValues.values[0]);
        if (component.state.fileName !== parsedPropertyValue.fileName && 
            this.reportValidity(event.target, i18next.t("fileName_invalid", {ns: 'preact'})) )
        {
          // If state.fileName is not equal to the value stored in the property value, just set the property value.
          // We know the file has not been uploaded AFTER changing the fileName, because we save the file and property
          // immediately on uploading.
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
                    , database: component.state.database
                    , roleFileName: component.state.roleFileName
                    }),
                  component.props.myRoletype )
                .then( () => 
                  // Change state (previousState is still EMPTY). 
                  // If a new file had been uploaded, it is registered in state already.
                  component.setState({state: FILLED}) )
                .catch(e => UserMessagingPromise.then( um => 
                  um.addMessageForEndUser(
                    { title: i18next.t("saveFile_title", { ns: 'preact' }) 
                    , message: i18next.t("saveFile_message", {ns: 'preact'})
                    , error: e.toString()
                    })))
            } );
        }
        break;

      case 27: // Escape
        // Discard changes (revert to saved values, if any)
        event.preventDefault();
        event.stopPropagation();   
        // previousState is still EMPTY.
        parsedPropertyValue = component.parsePropertyValue(component.props.propertyValues.values[0]);
        component.setState(
          { state: FILLED
          , fileName: parsedPropertyValue.fileName || ""
          , mimeType: parsedPropertyValue.mimeType || ""
          , uploadedFile: undefined
          , database: parsedPropertyValue.database
          , roleFileName: parsedPropertyValue.roleFileName
        });

        break;
      }
  }

  // Sends the file to the PDR.
  // Stores the property value.
  // Sets state.database
  // Returns a promise.
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
              { fileName: theFile.name
              , mimeType: theFile.type
              // database and roleFileName will be decided by the PDR, see below.
              }),
            component.props.myRoletype )
          .then( () => 
            // Save the file.
            pproxy.saveFile(
              component.props.roleId,
              component.props.serialisedProperty.id,
              component.state.mimeType,
              theFile,
              component.props.myRoletype 
            ) )
          .then( pval => 
            {
              const {database, roleFileName} = component.parsePropertyValue(pval);
              component.setState({ database, roleFileName });
            })
          .catch(e => UserMessagingPromise.then( um => 
            um.addMessageForEndUser(
              { title: i18next.t("saveFile_title", { ns: 'preact' }) 
              , message: i18next.t("saveFile_message", {ns: 'preact'})
              , error: e.toString()
              })))
      } );
  }

  // Returns a promise for the file.
  // Only call when we have a value in propertyValues that includes a value for database!
  retrieveFile()
  {
    const component = this; 
    return PDRproxy
      .then( pproxy => pproxy.getFile( component.props.roleId, component.props.serialisedProperty.id ) )
      .then( fileArray => 
        {
          if (fileArray[0])
          { 
            return fileArray[0];
          }
          else
          {
            throw "";
          }
        })
      .catch(e => UserMessagingPromise.then( um => 
        um.addMessageForEndUser(
          { title: i18next.t("retrieveFile_title", { ns: 'preact' }) 
          , message: i18next.t("retrieveFile_message", {ns: 'preact'})
          , error: e.toString()
          })));
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
    const component = this;
    function doit()
    {
      event.preventDefault();
      event.stopPropagation();   
      document.getElementById(component.props.serialisedProperty.id + '_selectedFile').click();
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

  // After uploading, we discard the file in state.
  // This enables us to detect that a new file has been uploaded.
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
          , uploadedFile: undefined}));
    }
  }

  download(event)
  {
    const component = this;
    function doit()
    {
      event.stopPropagation();
      event.preventDefault();
      component.retrieveFile()
        .then( file => 
          {
            const element = document.createElement('a');
            const url = window.URL.createObjectURL(file);
            element.style.display = 'none';
            element.href = url;
            element.setAttribute('download', component.state.fileName);
            document.body.appendChild(element);  
            element.click();
            document.body.removeChild(element);
            window.URL.revokeObjectURL(url);
          } );
    }
    if ( this.state.database && event.type == "click")
    {
      doit();
    }
    else if (this.state.database && event.keyCode == 32 )
    {
      doit();
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

  handleDroppedFile(theFile)
  {
    this.saveFileAndProperty(theFile)
      .then( () => 
        this.setState(
          { fileName: theFile.name
          , mimeType: theFile.type
          , state: FILLED
          }
        ));
  }

  fileIsImage()
  {
    return this.state.mimeType.match(/image/);
  }

  render()
  {
    const component = this;
    // KEEP THIS CODE ALIGNED WITH smartfieldcontrol.js.
    // `patternFacet` will be an object of this shape (or undefined):
    // { regex: PropTypes.string.isRequired
    // , label: PropTypes.string.isRequired}
    // `pattern` is the string that represents just the regex, no flags.
    // label has the shape /regex/flags.
    // flags will be ignored.
    const patternFacet = component.props.serialisedProperty.constrainingFacets.pattern;
    let pattern;
    if ( patternFacet )
    {
      pattern = patternFacet.regex.match( /\/(.*)\// )[1];
    }

    switch (component.state.state) {
      case READONLY:
        return (
          <div onKeyDown={e => component.handleKeyDownInReadOnly(e)} tabIndex={component.state.database ? -1 : 0}>
            <Form.Row>
              {
                  component.fileIsImage() && component.state.database ?
                    <AsyncImage roleId={ component.props.roleId } propId={ component.props.serialisedProperty.id } fileName={component.state.fileName}/>
                    :
                    <>
                      <Col lg="3">
                        <Form.Control readOnly value={ component.state.fileName } tabIndex="-1" size="sm"/>
                      </Col>
                      <Col lg="2">
                        <Form.Control readOnly value={ component.state.mimeType } tabIndex="-1" size="sm"/>
                      </Col>
                    </>
                }
              <Col lg="1">
              <div style={{display: "flex"}}>
                <div 
                  style={{flexShrink: 1, opacity: component.state.database ? 1 : 0.5}}
                  id={component.props.serialisedProperty.id + '_download'}
                  onClick={ e => component.download(e) }
                  onKeyDown={ e => component.download(e) }
                  tabIndex={component.state.database ? 0 : -1}
                  >
                  <DownloadIcon 
                    aria-label={ i18next.t("perspectivesFile_download", { ns: 'preact' }) }
                    size='medium'
                  />
                </div>
              </div>
            </Col>
            </Form.Row>
          </div>);

      case FILLED:
        return (
          <div onKeyDown={e => component.handleKeyDownInFilled(e)} tabIndex={component.state.database ? -1 : 0}>
            <Form.Row>
              {
                component.fileIsImage() ?
                  <AsyncImage roleId={ component.props.roleId } propId={ component.props.serialisedProperty.id } fileName={component.state.fileName}/>
                  :
                  <>
                    <Col lg="3">
                      <Form.Control readOnly value={ component.state.fileName } tabIndex="-1" size="sm"/>
                    </Col>
                    <Col lg="2">
                      <Form.Control readOnly value={ component.state.mimeType } tabIndex="-1" size="sm"/>
                    </Col>
                  </>
              }
              {/* If the file is an image, display that instead of the next two columns. */}
              <Col lg="1">
              <div style={{display: "flex"}}>
                <div 
                  style={{flexShrink: 1, opacity: component.state.database ? 1 : 0.5}}
                  id={component.props.serialisedProperty.id + '_download'}
                  onClick={ e => component.download(e) }
                  onKeyDown={ e => component.download(e) }
                  tabIndex={component.state.database ? 0 : -1}
                  >
                  <DownloadIcon 
                    aria-label={ i18next.t("perspectivesFile_download", { ns: 'preact' }) }
                    size='medium'
                  />
                </div>
              </div>
            </Col>
            </Form.Row>
          </div>);
    
      case EDITABLE:
        return (
          <div 
          >
            <Form.Row
                onKeyDown={e => component.handleKeyDownInEditable(e)}
                onDragOver={ev => ev.preventDefault()}
                onDragEnter={ev => ev.target.classList.add("border-primary", "border") }
                onDragLeave={ev => ev.target.classList.remove("border-primary", "border")}
                onDrop={ ev => 
                  {
                    component.handleDroppedFile( ev.dataTransfer.files[0] ) 
                    ev.target.classList.remove("border-primary", "border");
                    ev.preventDefault();
                    ev.stopPropagation();
                  }}
            >
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
                pattern="[^\./]+\.[^\./]+"
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
                  style={{flexShrink: 1, opacity: component.state.database ? 1 : 0.5}}
                  id={component.props.serialisedProperty.id + '_download'}
                  onClick={ e => component.download(e) }
                  onKeyDown={ e => component.download(e) }
                  tabIndex="-1"
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
                  tabIndex="-1"
                  >
                  <UploadIcon 
                      aria-label={ i18next.t("perspectivesFile_upload", { ns: 'preact' }) }
                      size='medium'/>
                </div>
              </div>
            </Col>
            </Form.Row>
            <input 
              type="file" 
              id={component.props.serialisedProperty.id + '_selectedFile'} 
              style={{display: "none"}} 
              onChange={ev => component.handleFileSelect(ev.target.files)}
            />
          </div>);

      // EMPTY is the default.
      case EMPTY:
      default:
        return (
          <div>
            <Form.Row
              onKeyDown={e => component.handleKeyDownInEmpty(e)}
              onDragOver={ev => ev.preventDefault()}
              onDragEnter={ev => ev.target.classList.add("border-primary", "border") }
              onDragLeave={ev => ev.target.classList.remove("border-primary", "border")}
              onDrop={ ev => 
                {
                  component.handleDroppedFile( ev.dataTransfer.files[0] ) 
                  ev.target.classList.remove("border-primary", "border");
                  ev.preventDefault();
                  ev.stopPropagation();
                }}
            >
              <Col lg="3">
                <Form.Control
                id={component.props.serialisedProperty.id + '_fileName'}
                aria-label={ i18next.t("perspectivesFile_fileName", {ns: 'preact'}) }
                value={ component.state.fileName }
                onFocus={ () => component.setState({selectedField: FILENAME})}
                onChange={e => component.setState({fileName: e.target.value}) }
                type="text"
                required={true}
                pattern="[^\./]+\.[^\./]+"
                size="sm"
                placeholder={ i18next.t("perspectivesFile_fileName_label", { ns: 'preact' }) }
                tabIndex="0"
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
                  pattern={ pattern ? pattern : "[^\./]+\/[^\./]+" }
                  size="sm"
                  placeholder={ i18next.t("perspectivesFile_mimeType_label", { ns: 'preact' }) }
                  tabIndex="-1"
                  />
              </Col>
              <Col lg="1">
                <div style={{display: "flex"}}>
                  <div 
                    style={{flexShrink: 1}}
                    id={component.props.serialisedProperty.id + '_upload'}
                    onClick={ e => component.upload(e) }
                    onKeyDown={ e => component.upload(e) }
                    tabIndex="-1"
                    >
                    <UploadIcon 
                        aria-label={ i18next.t("perspectivesFile_upload", { ns: 'preact' }) }
                        size='medium'/>
                  </div>
                </div>
              </Col>
            </Form.Row>
            <input 
              type="file" 
              id={component.props.serialisedProperty.id + '_selectedFile'} 
              style={{display: "none"}} 
              onChange={ ev => 
              {
                component.handleFileSelect(ev.target.files)
              }}
            />
          </div>);
    }
  }
}

PerspectivesFile.propTypes =
  { serialisedProperty: serialisedProperty.isRequired 
  , propertyValues: propertyValues
  , roleId: PropTypes.string
  , myRoletype: PropTypes.string.isRequired
}