declare module "perspectives-react" {
  import { ReactNode, JSX } from "react";

  export interface ViewOnExternalRoleProps {
    // Define the props for ViewOnExternalRole component
  }

  export function ViewOnExternalRole(props: ViewOnExternalRoleProps): JSX.Element;

  export function importTransaction(): Promise<void>;

  export * from "reactcontexts";

  export interface ExternalRoleProps {
    // Define the props for ExternalRole component
  }

  export function ExternalRole(props: ExternalRoleProps): JSX.Element;

  export function deconstructModelName(name: string): string;
  export function deconstructSegments(segments: string): string[];
  export function isExternalRole(role: string): boolean;
  export function deconstructContext(context: string): string;
  export function isQualifiedName(name: string): boolean;
  export function externalRole(role: string): string;
  export function deconstructLocalName(name: string): string;
  export function isSchemedResourceIdentifier(identifier: string): boolean;
  export function takeCUID(cuid: string): string;

  export function Screen(): JSX.Element;
  export function RemoveRol(): JSX.Element;
  export function MySystem(): JSX.Element;
  export function RoleInstance(): JSX.Element;
  export function PerspectivesComponent(): JSX.Element;
  export function RoleDropZone(): JSX.Element;
  export function FileDropZone(): JSX.Element;
  export function ContextInstance(): JSX.Element;

  export * from "cardbehaviour";
  export * from "behaviourcomponent"; 

  export function StandardScreen(): JSX.Element;
  export function PerspectiveBasedForm(): JSX.Element;
  export function PerspectiveForm(): JSX.Element;
  export function PerspectiveTable(): JSX.Element;
  export function ActionDropDown(): JSX.Element;
  export function Alert(): JSX.Element;
  export function BinaryModal(): JSX.Element;
  export function ModelDependencies(): JSX.Element;

  export * from "userMessaging";

  export function PerspectivesFile(): ReactNode;
  export function OpenPublicResource(): ReactNode;
  export function thisAppsLocation(): string;
  export function ArcViewer(): ReactNode;
  export function UnboundMarkDownWidget(): ReactNode;

  export function getPreact(LANG_KEY: string): Promise<any>;
}