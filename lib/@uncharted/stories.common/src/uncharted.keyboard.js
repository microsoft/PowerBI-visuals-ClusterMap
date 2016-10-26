'use strict';

var $ = require('jquery');

var UnchartedKeyboard = function UnchartedKeyboard(elem, options) {
    var opt = options || {};
    var delay = opt.repeatDelay || 100;
    var keysdown;
    var timerId;
    this.isHolding = function (key) {
        return keysdown[key];
    };
    this.bindKeydown = function (handler) {
        if (!keysdown) {
            keysdown = {};
        }
        $(elem).keydown(function(e) {
            if (!timerId) {
                keysdown[e.which] = true;
                timerId = setTimeout(function () {
                    handler(e.which);
                    timerId = undefined;
                }, delay);
            }
        });
        $(elem).keyup(function(e) {
            delete keysdown[e.which];
        });
    };
};

module.exports = UnchartedKeyboard;
