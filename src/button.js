import React, { Children } from "react";
import { bool, node, oneOf, string } from "prop-types";
import classNames from "classnames";

export const Button = ({
  children = undefined,
  className = "",
  icon = undefined,
  border = false,
  labelPosition = undefined,
  ...rest
}) => {
  const cName = `cs-button`;

  const lPos = typeof labelPosition !== "undefined" ? labelPosition : "right";
  const labelPositionClassName =
    Children.count(children) > 0 ? `${cName}--${lPos}` : "";
  const borderClassName = border === true ? `${cName}--border` : "";
  return (
    <button
      {...rest}
      className={classNames(
        cName,
        labelPositionClassName,
        borderClassName,
        className
      )}
    >
      {lPos === "left" && children}
      {icon}
      {lPos === "right" && children}
    </button>
  );
};

Button.propTypes = {
  /** Primary content */
  children: node,
  /** Additional classes. */
  className: string,
  icon: node,
  labelPosition: oneOf(["left", "right"]),
  border: bool,
};

export default Button;