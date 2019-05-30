const Context = require("./context.js");
const Rol = require("./rol.js");
const RolBinding = require("./rolbinding.js");
const View = require("./view.js");
const ContextOfRole = require("./contextofrole.js");
const ExternalViewOfBoundContext = require("./views.js").ExternalViewOfBoundContext;
const InternalViewOfBoundContext = require("./views.js").InternalViewOfBoundContext;
const ViewOnExternalRole = require("./views.js").ViewOnExternalRole;
const ViewOnInternalRole = require("./views.js").ViewOnInternalRole;
const SetProperty = require("./setproperty.js");
const BoundContext = require("./boundcontext.js");
const CreateContext = require("./createcontext.js");
const DeleteContext = require("./deletecontext.js");
const PSView = require("./reactcontexts.js").PSView
const ExternalRole = require("./externalrole.js");


// TODO
// InverseRoleBinding

module.exports = {
  Context: Context,
  Rol: Rol,
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
  DeleteContext: DeleteContext,
  PSView: PSView,
  ExternalRole: ExternalRole
};
