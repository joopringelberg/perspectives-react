// PSharedFile is a Perspectives property Range type.
// It is a serialised JSON structure:

import PropTypes from "prop-types";

export const PSharedFile =
  { // The file name as it was uploaded.
    name: PropTypes.string.isRequired
  , size: PropTypes.number.isRequired
  // The mime type
  , type: PropTypes.string
  // Identification of the Storage service. Will be a role identifier.
  , sharedStorageId: PropTypes.string.isRequired
  // Type of storage, e.g. "mega"
  , storageType: PropTypes.string.isRequired
  // Whatever is needed to retrieve the file from the Storage identified by sharedStorageId, e.g. a Mega url.
  , url: PropTypes.string.isRequired
  }

export function file2PsharedFile (theFile, sharedStorageId, storageType, url)
{
  return  { name: theFile.name
          , size: theFile.size
          , type: theFile.type
          , sharedStorageId
          , storageType
          , url
  }
}