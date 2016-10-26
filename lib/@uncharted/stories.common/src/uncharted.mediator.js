'use strict';

var mediator = require('mediator-js');
var _mediatorInstance = null;

var UnchartedMediator = /* istanbul ignore next:Wrapper function */ function UnchartedMediator(m) {
    var t = this;
    var _mediator;
    var init = function (Mediator) {
        // make library available globally
        _mediator = new Mediator();
    };
    t.publish = function () {
        return _mediator.publish.apply(_mediator, arguments);
    };
    // options include: predicate: function(args), priority: [0|1|..], calls: [1,2..]
    t.subscribe = function (channel, callback, options, context) {
        return _mediator.subscribe(channel, callback, options, context);
    };
    t.remove = function (channel, cb) {
        return _mediator.remove(channel, cb);
    };
    init(m);
    return t;
};

module.exports = /* istanbul ignore next */ (function () {
    if (!_mediatorInstance) {
        // NOTE: In Webpack (AMD), the Mediator constructor is on the top-level of the require
        _mediatorInstance = new UnchartedMediator(mediator.Mediator || mediator);
    }
    return _mediatorInstance;
}());

module.exports.registerGlobal = /* istanbul ignore next */ function () {
    if (!global._uncharted) global._uncharted = {};
    global._uncharted.Mediator = module.exports;
};
