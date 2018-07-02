"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = require("react");
var PropTypes = require("prop-types");
var Perspectives = require("perspectives-proxy").Perspectives;

var Component = React.Component;

var PerspectivesComponent = function (_Component) {
  _inherits(PerspectivesComponent, _Component);

  function PerspectivesComponent(props) {
    _classCallCheck(this, PerspectivesComponent);

    var _this = _possibleConstructorReturn(this, (PerspectivesComponent.__proto__ || Object.getPrototypeOf(PerspectivesComponent)).call(this, props));

    _this.state = {};
    _this.unsubscribers = [];
    return _this;
  }

  _createClass(PerspectivesComponent, [{
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      this.unsubscribers.forEach(function (unsubscriber) {
        return unsubscriber();
      });
    }
  }, {
    key: "addUnsubscriber",
    value: function addUnsubscriber(unsubscriber) {
      this.unsubscribers.push(unsubscriber);
    }
  }, {
    key: "stateIsComplete",
    value: function stateIsComplete() {
      var component = this;
      var isComplete = true;
      Object.keys(component.state).forEach(function (prop) {
        if (!component.state[prop]) {
          isComplete = false;
        }
      });

      return isComplete;
    }
  }, {
    key: "stateIsEmpty",
    value: function stateIsEmpty() {
      return Object.keys(this.state).length === 0;
    }
  }]);

  return PerspectivesComponent;
}(Component);

var Context = function (_PerspectivesComponen) {
  _inherits(Context, _PerspectivesComponen);

  function Context(props) {
    _classCallCheck(this, Context);

    var component = void 0;

    var _this2 = _possibleConstructorReturn(this, (Context.__proto__ || Object.getPrototypeOf(Context)).call(this, props));

    component = _this2;
    component.props.rollen.forEach(function (rn) {
      return component.state[rn] = undefined;
    });
    return _this2;
  }

  _createClass(Context, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      var component = this;
      component.props.rollen.forEach(function (rolName) {
        Perspectives.then(function (pproxy) {
          component.addUnsubscriber(pproxy.getRol(component.props.instance, component.props.type + "$" + rolName, function (rolIds) {
            var updater = {};
            updater[rolName] = rolIds;
            component.setState(updater);
          }));
        });
      });
    }
  }, {
    key: "render",
    value: function render() {
      var component = this;
      var children = void 0;

      if (component.stateIsComplete()) {
        if (Array.isArray(component.props.children)) {
          children = component.props.children;
        } else {
          children = [component.props.children];
        }
        return React.Children.map(children, function (child) {
          var childRol = child.props.rol;
          var instances = void 0;
          if (!childRol) {
            console.error("Context (" + component.props.type + ") finds child of type '" + child.type.name + "' that has no 'rol' on its props.");
            return React.createElement(
              "p",
              { className: "error" },
              "Context (",
              component.props.type,
              ") finds child of type '",
              child.type.name,
              "' that has no 'rol' on its props."
            );
          }
          instances = component.state[childRol];
          if (!instances) {
            console.error("Context (" + component.props.type + ") has no rol '" + childRol + "' while the child of type '" + child.type.name + "' asks for it.");
            return React.createElement(
              "p",
              { className: "error" },
              "Context (",
              component.props.type,
              ") has no rol '",
              childRol,
              "' while the child of type '",
              child.type.name,
              "' asks for it."
            );
          }
          return instances.map(function (instance) {
            return React.cloneElement(child, {
              key: instance,
              instance: instance,
              namespace: component.props.type
            });
          });
        });
      } else {
        return React.createElement("div", null);
      }
    }
  }]);

  return Context;
}(PerspectivesComponent);

Context.propTypes = {
  instance: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  rollen: PropTypes.array.isRequired
};

var Binding = function (_PerspectivesComponen2) {
  _inherits(Binding, _PerspectivesComponen2);

  function Binding(props) {
    _classCallCheck(this, Binding);

    var _this3 = _possibleConstructorReturn(this, (Binding.__proto__ || Object.getPrototypeOf(Binding)).call(this, props));

    _this3.state.binding = undefined;
    _this3.state.bindingType = undefined;
    return _this3;
  }

  _createClass(Binding, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      var component = this;
      Perspectives.then(function (pproxy) {
        component.addUnsubscriber(pproxy.getBinding(component.props.instance, function (binding) {
          component.setState({ binding: binding[0] });
        }));
        // Retrieve the type of the binding.
        // This will be the namespace that its properties are defined in.
        component.addUnsubscriber(pproxy.getBindingType(component.props.instance, function (bindingType) {
          component.setState({ bindingType: bindingType[0] });
        }));
      });
    }

    // Render! props.children contains the nested elements.
    // These should be provided the retrieved binding value.
    // However, this can only be done after state is available.

  }, {
    key: "render",
    value: function render() {
      var component = this;

      if (component.stateIsComplete()) {
        if (Array.isArray(component.props.children)) {
          return React.Children.map(component.props.children, function (child) {
            return React.cloneElement(child, {
              instance: component.state.binding,
              namespace: component.state.bindingType
            });
          });
        } else {
          return React.cloneElement(component.props.children, {
            instance: component.state.binding,
            namespace: component.state.bindingType
          });
        }
      } else {
        return React.createElement("div", null);
      }
    }
  }]);

  return Binding;
}(PerspectivesComponent);

Binding.propTypes = {
  instance: PropTypes.string,
  namespace: PropTypes.string,
  rol: PropTypes.string.isRequired
};

var View = function (_PerspectivesComponen3) {
  _inherits(View, _PerspectivesComponen3);

  function View() {
    _classCallCheck(this, View);

    return _possibleConstructorReturn(this, (View.__proto__ || Object.getPrototypeOf(View)).apply(this, arguments));
  }

  _createClass(View, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      var component = this;
      Perspectives.then(function (pproxy) {
        var qualifiedView = void 0;
        if (component.props.rol) {
          qualifiedView = component.props.namespace + "$" + component.props.rol + "$" + component.props.viewnaam;
        } else {
          qualifiedView = component.props.namespace + "$" + component.props.viewnaam;
        }
        pproxy.getViewProperties(qualifiedView, function (propertyNames) {
          // First initialize state
          // NOTE: React will not notice this.
          propertyNames.forEach(function (propertyName) {
            var ln = deconstructLocalNameFromDomeinURI_(propertyName);
            component.state[ln] = undefined;
          });
          propertyNames.forEach(function (propertyName) {
            component.addUnsubscriber(pproxy.getProperty(component.props.instance, propertyName, function (propertyValues) {
              var updater = {};
              var ln = deconstructLocalNameFromDomeinURI_(propertyName);
              updater[ln] = propertyValues;
              component.setState(updater);
            }, component.addUnsubscriber.bind(component)));
          });
        }, component.addUnsubscriber.bind(component));
      });
    }

    // Render! props.children contains the nested elements.
    // These should be provided all property name-value pairs,
    // except when it has a prop 'propertyName'.
    // However, this can only be done after state is available.

  }, {
    key: "render",
    value: function render() {
      var component = this;

      function cloneChild(child) {
        // If the child has a prop 'propertyName', just provide the property value.
        if (child.props.propertyName) {
          return React.cloneElement(child, {
            value: component.state[child.props.propertyName]
          });
        } else {
          return React.cloneElement(child, component.state);
        }
      }

      if (!component.stateIsEmpty() && component.stateIsComplete()) {
        if (Array.isArray(component.props.children)) {
          return React.Children.map(component.props.children, cloneChild);
        } else {
          return cloneChild(component.props.children);
        }
      } else {
        return React.createElement("div", null);
      }
    }
  }]);

  return View;
}(PerspectivesComponent);

View.propTypes = {
  instance: PropTypes.string,
  namespace: PropTypes.string,
  rol: PropTypes.string,
  viewnaam: PropTypes.string.isRequired
};

var ContextVanRol = function (_PerspectivesComponen4) {
  _inherits(ContextVanRol, _PerspectivesComponen4);

  function ContextVanRol(props) {
    _classCallCheck(this, ContextVanRol);

    var _this5 = _possibleConstructorReturn(this, (ContextVanRol.__proto__ || Object.getPrototypeOf(ContextVanRol)).call(this, props));

    _this5.state.instance = undefined;
    _this5.state.type = undefined;
    return _this5;
  }

  _createClass(ContextVanRol, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      var component = this;
      Perspectives.then(function (pproxy) {
        // The context of the rol will be bound to the state prop 'instance'.
        component.addUnsubscriber(pproxy.getRolContext(component.props.instance, function (contextId) {
          component.setState({ instance: contextId[0] });
          // The type of the context.
          component.addUnsubscriber(pproxy.getContextType(contextId, function (contextType) {
            component.setState({ type: contextType[0] });
          }, component.addUnsubscriber.bind(component)));
        }, component.addUnsubscriber.bind(component)));
      });
    }
  }, {
    key: "render",
    value: function render() {
      var component = this;

      if (component.stateIsComplete()) {
        return React.createElement(
          Context,
          { instance: component.state.instance, rollen: component.props.rollen, type: component.state.type },
          component.props.children
        );
      } else {
        return React.createElement("div", null);
      }
    }
  }]);

  return ContextVanRol;
}(PerspectivesComponent);

ContextVanRol.propTypes = {
  rollen: PropTypes.array.isRequired
};

function ExterneView(props) {
  return React.createElement(
    Binding,
    { rol: props.rol, instance: props.instance },
    React.createElement(
      View,
      { viewnaam: props.viewnaam },
      props.children
    )
  );
}

ExterneView.propTypes = {
  rol: PropTypes.string.isRequired,
  viewnaam: PropTypes.string.isRequired
};

// TODO
// ExterneView
// GebondenContext
// InterneView

// Returns "localName" from "model:ModelName$localName" or Nothing
// deconstructLocalNameFromDomeinURI_ :: String -> String
// NOTE DEPENDENCY. This code is adapted from module Perspectives.Identifiers.
function deconstructLocalNameFromDomeinURI_(s) {
  // domeinURIRegex :: Regex
  var domeinURIRegex = new RegExp("^(model:\\w*.*)\\$(\\w*)");
  try {
    return s.match(domeinURIRegex)[2];
  } catch (e) {
    throw "deconstructLocalNameFromDomeinURI_: no local name in '" + s + "'.";
  }
}

// export { Context, Binding, View, ContextVanRol, ExterneView, createRequestEmitterImpl, createTcpConnectionToPerspectives };
module.exports = {
  Context: Context,
  Binding: Binding,
  View: View,
  ContextVanRol: ContextVanRol,
  ExterneView: ExterneView
};

