import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import Button from "./button.js";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons/faMicrophone";

export const MicrophoneButton = ({ className = "", children, ...rest }) => {
  const cName = `cs-button--voicecall`;

  return (
    <Button
      {...rest}
      className={classNames(cName, className)}
      icon={<FontAwesomeIcon icon={faMicrophone} />}
    >
      {children}
    </Button>
  );
};

MicrophoneButton.propTypes = {
  /** Primary content. */
  children: PropTypes.node,

  /** Additional classes. */
  className: PropTypes.string,
};

export default MicrophoneButton;