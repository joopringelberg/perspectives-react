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
We use the name **prop** to indicate React properties (keys on the props object) and **Property** to indicate Perspectives Properties.

Components require some props to be provided as attributes on the element. Such mandatory attributes are listed below in the tables of Attributes.

Other props are passed on by a component's enclosing component. They are used internally by Perspectives React Components and should never be provided as an attribute. These are listed in the tables of Received Props of the receiving Component. For each Component, the two tables together describe all available props. In general, these props cannot be used by the programmer (with the exception of props passed on by `View` components). They are documented here to enhance understanding of the flow of data through Perspectives React Components.

Finally, for each Component, the table with PassedOn props lists those props (if any) that are passed on to its children.

### How to build a GUI
Construct a tree of Perspectives React Components. These must be understood as *container components* that provide data to other container components and ultimately to *display components*. Write display components that make use of the props passed on by the container components. In other words, only the programmers' display components will actually create visible elements.  Display components can only be nested inside `View` components!

The Perspectives React Component `Context` can be used to select a Perspectives Context and navigate from that starting point to a View on a Rol (using `View`), to the binding of that Rol (using `RolBinding`), whether that is a RolInContext or the BuitenRol of another Context. From such a BuitenRol navigate to the context using `ContextVanRol`, etc. From within a `Context`, use `ExterneView` to access Properties on the BuitenRol of the Context and `InterneView` to access its internal Properties.

### Context
A Context element makes selected roles available (including its Binnen- and BuitenRol). Use the Context element to access its Roles, Internal Properties and External Properties.

Attribute | Description
--- | ---
instance | The identification of the Context. This must be a qualified name.
type | The qualified `psp:type` of the Context
rollen | An array of **local** Rol names.

Possible content elements: `View`, `ExterneView`, `InterneView`, `RolBinding`, `GebondenContext`, `BuitenRol` of `BinnenRol`.

All these elements accept an attribute `rol`. The programmer **must** provide a value for this attribute, thereby selecting one of the available roles. Failing to do so will raise an error.

Prop passed on | Value | Description
--- | --- | ---
instance | Qualified ID | Identification of the Rol instance.
key | Qualified ID | Used by React to distinguish between elements in a sequence.
namespace | Qualified ID | Type of the Context.

Roles may be functional or relational, the latter meaning that there can be more than one instance of the Rol. A child element that selects a particular Rol will be mapped over the instances of that Rol. Each duplicated element has a prop `instance` on its props (its value is a qualified Rol identifier). It will also have a prop `key` with the same value; this prop is used by React to identify the various elements of the resulting sequence.

```
<Context type="model:Systeem$Systeem" rollen={[
          "gebruiker",
          "modellen",
          "trustedCluster"
        ]} instance="model:User$MijnSysteem">
```

### View
Selects a View of a Rol and makes the properties of that View available. A `View` element can be used inside a `Context` element or a `RolBinding` element.

Possible content elements: any user-defined Component that can make good use of the props that are passed on.

Attribute | Description
--- | ---
rol | The **local name** of a Rol.
viewnaam | The **local name** of a View.

Received prop | Description
-- | --
instance | The qualified identification of the Rol instance.
key | Idem.
namespace | The namespace passed on by the `View`'s containing element (a `Context` or `RolBinding`).

Prop passed on | Value | Description
--- | --- | ---
property1..n | Array String | For each Property in the View, a React prop with its **local name** will be passed on to the `View`'s children. It's value is the Property value. Note: Numbers, Booleans and Dates will **not** be parsed!

If A child has a prop `propertyname` (provided with an attribute), just that property will be passed on.


```
<View rol="gebruiker" viewnaam="VolledigeNaam">
            <GebruikerNaam />
          </View>

function GebruikerNaam (props)
{
  return <p><label>Gebruiker:</label>{props.voornaam + " " + props.achternaam}</p>;
}
```

### RolBinding
The `RolBinding` element gives access to the binding of the Rol that is selected by its `rol` attribute. This will be a BuitenRol, or a RolInContext. Consequently, all elements that need one of these as context can be nested inside a `RolBinding` element. It is the programmers responsibility to ensure they use appropriate elements for the two kinds of Rol!

Possible content elements: `View`, `Binding`, `ContextVanRol` of `GebondenContext`.

Attribute | Description
--- | ---
rol | The qualified name of a Rol.

Received prop | Description
-- | --
instance | The qualified identification of the Rol.
namespace | Note: this is received from the enclosing element!

Prop passed on | Description
-- | --
instance | The qualified identification of the Rol.
namespace | The qualified type of the Rol.

### ContextVanRol
The `ContextVanRol` element navigates from a Rol to its Context, so it gives access to a Context, just as the `Context` element does (but the latter requires an `instance` prop to identify the Context instance). Within a `ContextVanRol` component, `instance` and `type` are available on its state; not on its props. However, just like with `Context`, the programmer should provide an attribute `rollen` in order to make them available for further navigation.

Possible content elements: `View`, `ExterneView`, `InterneView`, `RolBinding`, `GebondenContext`, `BuitenRol` of `BinnenRol`.

Attribute | Description
--- | ---
rollen | An array of **local** Rol names.

Prop passed on | Value | Description
--- | --- | ---
instance | Qualified ID | Identification of the Rol instance.
key | Qualified ID | Used by React to distinguish between elements in a sequence.
namespace | Qualified ID | Type of the Context.

### ExterneViewOfBoundContext
Selects the View `viewnaam` of a BuitenRol; expects that BuitenRol to be the Binding of its `rol` attribute. This Component is actually composed from the `RolBinding` and `View` Components.

Possible content elements: any user-defined Component that can make good use of the props that are passed on.

Attribute | Description
--- | ---
rol | The **local name** of a Rol.
viewnaam | The **local name** of a View.

The received props and the props passed on are exactly as with a `View` Component.

### InterneViewOfBoundContext
Selects the View `viewnaam` of a BinnenRol; expects the Binding of its `rol` attribute to be a BuitenRol. This Component is actually composed from the `RolBinding`, `ContextVanRol` and `InterneView` Components.

Possible content elements: any user-defined Component that can make good use of the props that are passed on.

Attribute | Description
--- | ---
rol | The **local name** of a Rol.
viewnaam | The **local name** of a View.

The received props and the props passed on are exactly as with a `View` Component.
