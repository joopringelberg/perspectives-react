import React from 'react';

import {Tooltip, OverlayTrigger} from 'react-bootstrap';
import { func, string } from "prop-types";

// As the real action happens in handleFile as it is presented on the props of FileDropZone,
// an error boundary is of no good here.

export default function FileDropZone(props)
{
  const renderTooltip = (tooltipProps) => (
    <Tooltip id="download-tooltip" {...tooltipProps} show={tooltipProps.show.toString()}>
      {props.tooltiptext}
    </Tooltip>);

  function handleKeyDown(event)
  {
    switch(event.keyCode){
      case 13: // Enter
      case 32: // space
        document.getElementById('selectedFile').click();
        event.preventDefault();
        break;
      }
  }

  function handleClick(event)
  {
    document.getElementById('selectedFile').click();
  }
  function handleFileSelect(event)
  {
    const fileList = event.target.files;
    if (fileList.length > 0)
    {
      handleFileWithExtension(fileList);
    }
  }

  function handleFileWithExtension(fileList)
  {
    const theFile = fileList.item(0);
    //eslint-disable-next-line no-useless-escape
    const r = props.extension.match( /\./ ) ? new RegExp( "\\" + props.extension) : new RegExp( "\." + props.extension);
    // const r = new RegExp( "\." + props.extension);
    if ( theFile && theFile.name.match(r) )
    {
      props.handlefile(theFile);
    }
    // HACK. For reasons I do not understand, it happens that FileDropZone is rendered without property collapsenavbar.
    if (props.collapsenavbar)
    {
      props.collapsenavbar();
    }
  }

  if (props.tooltiptext)
  {
    return  <OverlayTrigger
                    placement="left"
                    delay={{ show: 250, hide: 400 }}
                    overlay={renderTooltip}
                  >
                  <div onDragOver={ev => ev.preventDefault()}
                      aria-describedby="Select a file"
                      tabIndex="0"
                      className="dropzone text-secondary"
                      onDrop={ev => {
                        handleFileWithExtension(ev.dataTransfer.files);
                        ev.target.classList.remove("border", "p-3", "border-primary");
                        ev.preventDefault();
                        ev.stopPropagation();
                      }}
                      onClick={ev => handleClick(ev)}
                      onDragEnter={ev => ev.target.classList.add("border", "border-primary") }
                      onDragLeave={ev => ev.target.classList.remove("border", "border-primary")}
                      onKeyDown={ev => handleKeyDown(ev)}
                      >
                    <input type="file" id="selectedFile" style={{display: "none"}} onChange={ev => handleFileSelect(ev)}/>
                    { props.children }
                  </div>
            </OverlayTrigger>;
  }
  else
  {
    return  <div onDragOver={ev => ev.preventDefault()}
              aria-describedby="Select a file"
              tabIndex="0"
              className="dropzone text-secondary"
              onDrop={ev => {
                handleFileWithExtension(ev.dataTransfer.files);
                ev.target.classList.remove("border", "p-3", "border-primary");
                ev.preventDefault();
                ev.stopPropagation();
              }}
              onClick={ev => handleClick(ev)}
              onDragEnter={ev => ev.target.classList.add("border", "border-primary") }
              onDragLeave={ev => ev.target.classList.remove("border", "border-primary")}
              onKeyDown={ev => handleKeyDown(ev)}
              >
            <input type="file" id="selectedFile" style={{display: "none"}} onChange={ev => handleFileSelect(ev)}/>
            { props.children }
          </div>;
  }
}

FileDropZone.propTypes =
  { tooltiptext: string
  , handlefile: func.isRequired
  , extension: string
  , collapsenavbar: func.isRequired
};
