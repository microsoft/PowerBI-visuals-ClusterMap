'use strict';

var $ = require('jquery');

var MouseHold = function MouseHold($element) {
    var t = this;
    t.$e = $element;
    t._resolution = 5;
    t._isMouseDown = false;
    t._intervalId = null;
    t._whileMouseDown = null;
    t._duration = null;

    var bind = function (whileMouseDown) {
        if (typeof whileMouseDown !== 'function') throw new Error('whileMouseDown must a function');
        t._whileMouseDown = whileMouseDown;
        t.$e.on('mousedown', function () {
            if (!t._isMouseDown) {
                t._isMouseDown = true;
                t._duration = 0;
                t._intervalId = setInterval(function () {
                    t._duration += t._resolution;
                    if (t._isMouseDown) {
                        t._whileMouseDown(t._duration);
                    } else {
                        clearInterval(t._intervalId);
                    }
                }, t._resolution);
            }
        });
        t.$e.on('mouseup mouseoff', function () {
            t._isMouseDown = false;
            t._duration = null;
            clearInterval(t._intervalId);
        });
        return t;
    };

    var unbind = function () {
        // removes all handlers associated with these elements.

        t.$e.off('mousedown');
        t.$e.off('mouseup mouseoff');
        t._whileMouseDown = null;
    };
    t.bind = bind;
    t.unbind = unbind;
    return t;
};

module.exports = MouseHold;
module.exports.asJQueryPlugin = function () {
    $.fn.mousehold = function () {
        if (!this._mousehold) {
            this._mousehold = new MouseHold(this);
        }
        return this._mousehold;
    };
};
