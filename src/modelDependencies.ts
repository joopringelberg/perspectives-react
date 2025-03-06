import { ContextType, PropertyType, RoleType } from "perspectives-proxy";

export default 
{ cardClipBoard: "model://perspectives.domains#System$PerspectivesSystem$External$CardClipBoard" as PropertyType
, currentLanguage: "model://perspectives.domains#System$PerspectivesSystem$External$CurrentLanguage" as PropertyType
, sysUser: "model://perspectives.domains#System$PerspectivesSystem$User" as RoleType
, system: "model://perspectives.domains#System$PerspectivesSystem" as ContextType
, systemExternal: "model://perspectives.domains#System$PerspectivesSystem$External" as RoleType
, notifications: "model://perspectives.domains#System$ContextWithNotification$Notifications" as RoleType
, allNotifications: "model://perspectives.domains#System$PerspectivesSystem$AllNotifications" as RoleType
, notificationMessage: "model://perspectives.domains#System$ContextWithNotification$Notifications$Message" as PropertyType
, isOnScreen: "model://perspectives.domains#System$ContextWithScreenState$External$IsOnScreen" as PropertyType
, nrOfUploadedFiles: "model://perspectives.domains#SharedFileServices$SharedFileServices$DefaultFileServer$NrOfUploadedFiles" as PropertyType
, disabled: "model://perspectives.domains#SharedFileServices$SharedFileServices$DefaultFileServer$Disabled" as PropertyType
}