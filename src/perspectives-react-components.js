const Context = require("context").Context;
const Rollen = require("rollen").Rollen;
const RolBinding = require("rolbinding").RolBinding;
const View = require("view").View;
const ContextOfRole = require("contextofrole").ContextOfRole;
const ExternalViewOfBoundContext = require("externalviewofboundcontext").ExternalViewOfBoundContext;
const InternalViewOfBoundContext = require("internalviewofboundcontext").InternalViewOfBoundContext;
const ViewOnExternalRole = require("viewonexternalrole").ViewOnExternalRole;
const ViewOnInternalRole = require("viewoninternalrole").ViewOnInternalRole;
const SetProperty = require("setproperty").SetProperty;
const BoundContext = require("boundcontext").BoundContext;
const CreateContext = require("createcontext").CreateContext;
const DeleteContext = require("deletecontext").DeleteContext;


// TODO
// InverseRoleBinding

module.exports = {
  Context: Context,
  Rollen: Rollen,
  RolBinding: RolBinding,
  View: View,
  ContextOfRole: ContextOfRole,
  ExternalViewOfBoundContext: ExternalViewOfBoundContext,
  InternalViewOfBoundContext: InternalViewOfBoundContext,
  ViewOnExternalRole: ViewOnExternalRole,
  ViewOnInternalRole: ViewOnInternalRole,
  SetProperty: SetProperty,
  BoundContext: BoundContext,
  CreateContext: CreateContext,
  DeleteContext: DeleteContext
};
