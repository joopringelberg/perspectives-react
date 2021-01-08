import React from 'react';
import PropTypes from 'prop-types';

////// THIS COMPONENT IS PROBABLY OBSOLETE: IT IS NEVER USED.

export default function makeScreens (screenObj)
{
  function Screens(props)
  {
    if ( screenObj[ props.screenName ] )
    {
      return screenObj[ props.screenName ]();
    }
    else
    {
      return <div><p>Cannot find the screen {props.screenName} in the screen module for model:System</p></div>;
    }
  }
  Screens.propTypes = { screenName: PropTypes.string.isRequired };
  return Screens;
}
