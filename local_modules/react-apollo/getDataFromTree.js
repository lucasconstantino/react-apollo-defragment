import * as React from 'react';
function getProps(element) {
    return element.props || element.attributes;
}
function isReactElement(element) {
    return !!element.type;
}
function isComponentClass(Comp) {
    return Comp.prototype && (Comp.prototype.render || Comp.prototype.isReactComponent);
}
function providesChildContext(instance) {
    return !!instance.getChildContext;
}
export function walkTree(element, context, visitor) {
    if (Array.isArray(element)) {
        element.forEach(function (item) { return walkTree(item, context, visitor); });
        return;
    }
    if (!element) {
        return;
    }
    if (isReactElement(element)) {
        if (typeof element.type === 'function') {
            var Comp = element.type;
            var props = Object.assign({}, Comp.defaultProps, getProps(element));
            var childContext_1 = context;
            var child = void 0;
            if (isComponentClass(Comp)) {
                var instance_1 = new Comp(props, context);
                instance_1.props = instance_1.props || props;
                instance_1.context = instance_1.context || context;
                instance_1.state = instance_1.state || null;
                instance_1.setState = function (newState) {
                    if (typeof newState === 'function') {
                        newState = newState(instance_1.state, instance_1.props, instance_1.context);
                    }
                    instance_1.state = Object.assign({}, instance_1.state, newState);
                };
                if (instance_1.componentWillMount) {
                    instance_1.componentWillMount();
                }
                if (providesChildContext(instance_1)) {
                    childContext_1 = Object.assign({}, context, instance_1.getChildContext());
                }
                if (visitor(element, instance_1, context, childContext_1) === false) {
                    return;
                }
                child = instance_1.render();
            }
            else {
                if (visitor(element, null, context) === false) {
                    return;
                }
                child = Comp(props, context);
            }
            if (child) {
                if (Array.isArray(child)) {
                    child.forEach(function (item) { return walkTree(item, childContext_1, visitor); });
                }
                else {
                    walkTree(child, childContext_1, visitor);
                }
            }
        }
        else {
            if (visitor(element, null, context) === false) {
                return;
            }
            if (element.props && element.props.children) {
                React.Children.forEach(element.props.children, function (child) {
                    if (child) {
                        walkTree(child, context, visitor);
                    }
                });
            }
        }
    }
    else if (typeof element === 'string' || typeof element === 'number') {
        visitor(element, null, context);
    }
}
function hasFetchDataFunction(instance) {
    return typeof instance.fetchData === 'function';
}
function isPromise(promise) {
    return typeof promise.then === 'function';
}
function getPromisesFromTree(_a) {
    var rootElement = _a.rootElement, _b = _a.rootContext, rootContext = _b === void 0 ? {} : _b;
    var promises = [];
    walkTree(rootElement, rootContext, function (_, instance, context, childContext) {
        if (instance && hasFetchDataFunction(instance)) {
            var promise = instance.fetchData();
            if (isPromise(promise)) {
                promises.push({ promise: promise, context: childContext || context, instance: instance });
                return false;
            }
        }
    });
    return promises;
}
export default function getDataFromTree(rootElement, rootContext) {
    if (rootContext === void 0) { rootContext = {}; }
    var promises = getPromisesFromTree({ rootElement: rootElement, rootContext: rootContext });
    if (!promises.length) {
        return Promise.resolve();
    }
    var errors = [];
    var mappedPromises = promises.map(function (_a) {
        var promise = _a.promise, context = _a.context, instance = _a.instance;
        return promise
            .then(function (_) { return getDataFromTree(instance.render(), context); })
            .catch(function (e) { return errors.push(e); });
    });
    return Promise.all(mappedPromises).then(function (_) {
        if (errors.length > 0) {
            var error = errors.length === 1
                ? errors[0]
                : new Error(errors.length + " errors were thrown when executing your fetchData functions.");
            error.queryErrors = errors;
            throw error;
        }
    });
}
//# sourceMappingURL=getDataFromTree.js.map