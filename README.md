# perspectives-react

React components to build a GUI based on the perspectives-protocol (hides connection to perspectives-core).

## Installation
Install with npm:

```
$ npm install perspectives-react
```
## Dependencies
This package depends on React. JSX is used in the source. It also depends on `perpectives-proxy`. However, this module is declared external in order to be able to share it with `perspectives-core` (the core also depends on the proxy, but react and core need to share the same instance of proxy).

## Build
Create `dist/perspectives-react.js` by evaluating on the command line:

```
$ npm run build
```
This is equivalent to:
```
$ npx webpack
```
## Watch
Have Webpack watch the sources and update `dist/perspectives-react.js` by evaluating on the command line:

```
$ npm run watch
```
This is equivalent to:
```
$ npx webpack --watch
```

## Components
We use the name **prop** to indicate React properties (keys on the props object) and **Property** to indicate Perspectives Properties. Components require some props to be provided as attributes on the Component. Such mandatory attributes are listed below in the tables of Attributes.

### How to build a GUI
Construct a tree of Perspectives React Components. These must be understood as *container components* that provide data to other container components and ultimately to *display components*. Write display components that make use of the props passed on by the container components. These React props correspond to Perspectives Properties. In other words, only the programmers' display components will actually create visible elements.  Display components can only be nested inside components that provide Properties (explained below)!

### Allowed Nesting
All Components (with the exception of the Context Component) must be nested inside another Component, that should provide either a Context or a Role. All Components can be categorized as to what they provide to their children: a Context, Role(s) or Properties. The matrix below gives a complete overview.


 | Embed in Role | Embed in Context | No embedding
 --- | --- | --- | ---
 **Provides Role(s)** | | Roles, ExternalRole, RoleBinding, InverseRoleBinding |
 **Provides Context** |ContextOfRole |BoundContext |Context
 **Provides Properties** | View | ViewOnExternalRole, ViewOnInternalRole, ExternalViewOfBoundContext, InternalViewOfBoundContext |

*Example*. `Context` is in the middle row and so provides a Context (it is in the column **No Embedding**, so can be put anywhere in your html). What can be inside a `Context` Component? Everything in the column **Embed in Context**, so: `Roles`, `ExternalRole`, `InverseRoleBinding`, `ViewOnExternalRole` and `ViewOnInternalRole`.

*Another example*. Where can we use `BoundContext`? It is in the column **Embed in Role**, so we can put it inside anything that provides a Role. In other words, everything in the row **Provides Role(s)**: `RoleBinding`, `InverseRoleBinding`, `Roles` and `ExternalRole`.

*A word on compositions*. The Components `BoundContext`, `ExternalViewOfBoundContext` and `InternalViewOfBoundContext` are *compositions* of other (more elementary) Components. They are there for convenience. However, use them with care as they expect specific conditions. Take `BoundContext` as an example. It is a composition of `RoleBinding` followed by `ContextOfRole`. The name suggests that you'll end up with a Context and indeed, it is put in the row **Provides Context** above. However, this will only be correct if, indeed, the Role is bound to the ExternalRole of a Context! You, as programmer, are responsible for guaranteeing that semantics.

Name | Composition (f <<< g is f after g)
--- | ---
BoundContext | ContextOfRole <<< RoleBinding
ExternalViewOfBoundContext | View <<< RoleBinding
InternalViewOfBoundContext | ViewOnInternalRole <<< ContextOfRole <<< RoleBinding


### Context
The `Context` Component provides a root for a container component hierarchy. This Component need not be nested in any other container.

Attribute | Description
--- | ---
instance | The identification of the Context. This must be a qualified name.
type | The qualified `psp:type` of the Context


### Roles
A `Roles` Component makes selected roles available (including its Internal- and ExternalRole). Use the `Roles` Component to access Roles of the surrounding Context.

Attribute | Description
--- | ---
roles | An array of **local** Role names.

Roles may be functional or relational, the latter meaning that there can be more than one instance of the Role. A child Component that selects a particular Role will be mapped over the instances of that Role. Each duplicated Component has a prop `instance` on its props (its value is a qualified Role identifier). It will also have a prop `key` with the same value; this prop is used by React to identify the various elements of the resulting sequence.

```
<Roles roles={[
          "user",
          "models",
          "trustedCluster"
        ]}>
```

### RoleBinding
The `RoleBinding` Component navigates to the binding of the Role that is selected by its `role` attribute. This will be a ExternalRole, or a RoleInContext. Consequently, all elements that need one of these as context can be nested inside a `RoleBinding` Component. It is the programmers responsibility to ensure they use appropriate elements for the two kinds of Role!

Attribute | Description
--- | ---
role | The qualified name of a Role.


### BoundContext
The `BoundContext` Component navigates to the Context bound to the Role indicated by its `role` attribute. This Component is the composition `ContextOfRole <<< RoleBinding`.

Attribute | Description
--- | ---
role | The qualified name of a Role.


### InverseRoleBinding
The `InverseRoleBinding` Component navigates to the Roles that bind the Role that is selected by its `role` attribute.


Attribute | Description
--- | ---
role | The qualified name of a Role.


### ContextOfRole
The `ContextOfRole` Component navigates from a Role to its Context, so it gives access to a Context, just as the `Context` Component does. This Component has no attributes.


### View
Selects a View of a Role and makes the properties of that View available. A `View` Component can be used inside a `Roles` Component or a `RoleBinding` Component.

Possible content elements: any user-defined Component that can make good use of the props that are passed on.

Attribute | Description
--- | ---
role | The **local name** of a Role.
viewname | The **local name** of a View.

If A child has a prop `propertyname` (provided with an attribute), just that property will be passed on.


```
<View role="user" viewname="FullName">
            <UserName />
          </View>

function UserName (props)
{
  return <p><label>User:</label>{props.firstname + " " + props.lastname}</p>;
}
```

### ExternalViewOfBoundContext
Selects the View `viewname` of a ExternalRole; expects that ExternalRole to be the Binding of its `role` attribute. This Component is the composition `View <<< RoleBinding`.

Attribute | Description
--- | ---
role | The **local name** of a Role.
viewname | The **local name** of a View.


### InternalViewOfBoundContext
Selects the View `viewname` of a InternalRole; expects the Binding of its `role` attribute to be a ExternalRole. This Component is the Composition `ViewOnInternalRole <<< ContextOfRole <<< RoleBinding`.

Attribute | Description
--- | ---
role | The **local name** of a Role.
viewname | The **local name** of a View.

### ViewOnExternalRole
Selects the View `viewname` of the ExternalRole of the Context. Use this Component directly inside a Component that provides a Context, such as `Context` of `BoundContext`.

Attribute | Description
--- | ---
viewname | The **local name** of a View.

### ViewOnInternalRole
Selects the View `viewname` of the InternalRole of the Context. Use this Component directly inside a Component that provides a Context, such as `Context` of `BoundContext`.

Attribute | Description
--- | ---
viewname | The **local name** of a View.
