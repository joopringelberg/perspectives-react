const React = require("react");
const PropTypes = require("prop-types");

import RoleInstanceIterator from "./roleinstanceiterator.js";
import RoleInstances from "./roleinstances.js";
import CreateDropZone from "./createdropzone.js";
import NoInstancesSwitcher from "./noinstancesswitcher";

export default function Rol(props)
{
  const ariaLabel = props.ariaLabel ? props.ariaLabel : "Drop a role here";
  if (props.allowExtension)
  {
    return (<RoleInstances rol={props.rol}>
        <CreateDropZone ariaLabel={ariaLabel}>
          <NoInstancesSwitcher>
            <p>{ariaLabel}</p>
            <RoleInstanceIterator>
              {/*eslint-disable-next-line react/prop-types*/}
              {props.children}
            </RoleInstanceIterator>
          </NoInstancesSwitcher>
        </CreateDropZone>
      </RoleInstances>);
  }
  else
  {
    return (<RoleInstances rol={props.rol}>
            <RoleInstanceIterator>
              {/*eslint-disable-next-line react/prop-types*/}
              {props.children}
            </RoleInstanceIterator>
      </RoleInstances>);
  }
}

Rol.propTypes =
  { "rol": PropTypes.string.isRequired
  , ariaLabel: PropTypes.string
  };
