// Compents that are not in use in InPlace or in perspectives-screens are commented out.
export {default as Rol} from "./rol.js";
export {default as View} from "./view.js";
export {default as ContextOfRole} from "./contextofrole.js";
export {ViewOnExternalRole} from "./views.js";
// export {default as SetProperty} from "./setproperty.js";
export {default as CreateContext} from "./createcontext.js";
export {default as CreateContext_} from "./createcontext_.js";
export {default as importContexts} from "./importContexts.js";
export {default as importTransaction} from "./importTransaction.js";
export * from "./reactcontexts";
export {default as ExternalRole} from "./externalrole.js";
export {deconstructModelName, deconstructSegments, isExternalRole, deconstructContext, isQualifiedName, externalRole, deconstructLocalName, isSchemedResourceIdentifier} from "./urifunctions.js";
export {default as Screen} from "./screen.js";
export {default as RemoveBinding} from "./removeBinding.js";
export {default as RemoveRol} from  "./removeRol.js";
export {default as MySystem} from  "./mysystem.js";
export {default as RoleInstances} from "./roleinstances.js";
export {default as RoleInstance} from "./roleinstance.js";
export {default as RoleInstanceIterator} from "./roleinstanceiterator.js";
export {default as PerspectivesComponent} from "./perspectivescomponent.js";
export * from "./cards.js";
export {default as SetBoolAsCheckbox} from "./setboolascheckbox.js";
export {default as RoleDropZone} from "./roleDropzone.js";
export {default as RoleTable} from "./roletable.js";
export {default as FileDropZone} from "./filedropzone.js";
export {PerspectivesContainer, BackButton} from "./perspectivescontainer.js";
export * from "./roleform.js";
export * from "./invitation.js";
export {default as NoInstancesSwitcher} from "./noinstancesswitcher.js";
export {default as LocalRoleSpecialisation} from "./localrolespecialisation.js";
export {default as ContextInstance} from "./contextInstance.js";
export * from "./cardbehaviour.js";
export * from "./behaviourcomponent.js";
export {default as StandardScreen} from "./standardscreen.js";
export {default as PerspectiveBasedForm} from "./perspectivebasedform.js";
export {default as PerspectiveForm} from "./perspectiveform.js";
export {default as PerspectiveTable} from "./perspectivetable.js";
export {default as ActionDropDown} from "./actiondropdown.js";
export {default as Alert} from "./alert.js";
export {default as BinaryModal} from "./binarymodal.js";
export {default as ModelDependencies} from "./modelDependencies.js";
export * from "./userMessaging.js";
export {default as PerspectivesFile} from "./perspectivesFile";
export {ArcViewer} from "./arcViewer.js";
export {AsyncImage} from "./asyncImage.js";
export {default as OpenPublicResource} from "./openpublicresource.js";

export async function getPreact(LANG_KEY)
{
  return await import(`./lang/${LANG_KEY}/preact.json`);
}