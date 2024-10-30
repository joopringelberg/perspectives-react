import React from "react";
import { forwardRef } from 'react';
import PropTypes from "prop-types";
import classNames from "classnames";
import Button from "./button.js";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons/faMicrophone";

// export const MicrophoneButton = forwardRef( ({ className = "", children, ...rest }) => {
export const MicrophoneButton = forwardRef( (props, ref) => {
    const cName = `cs-button--voicecall`;
    const rest = {};
    Object.keys(props).forEach( key => {
      if (!(key == "children" || key == "className"))
      {
        rest[key] = props[key];
      }
    })

  return (
    <Button
      {...rest}
      className={classNames(cName, props.className ? props.className : "")}
      icon={<FontAwesomeIcon icon={faMicrophone} />}
    >
      {props.children}
    </Button>
  );
});

MicrophoneButton.propTypes = {
  /** Primary content. */
  children: PropTypes.node,

  /** Additional classes. */
  className: PropTypes.string,
};

export default MicrophoneButton;