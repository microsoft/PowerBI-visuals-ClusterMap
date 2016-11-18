/**
 * Copyright (c) 2016 Uncharted Software Inc.
 * http://www.uncharted.software/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/* enable strict mode */
'use strict';

/* import modules */
var Snap = require('snapsvg');
var Point2D = require('./personas.core.point2d');
var Observable = require('./personas.core.observable.js');

/* get the Snap private primitives */
var __snapPrimitives = {};
Snap.plugin(function (SnapLib, Element, Paper, global, Fragment) {
    __snapPrimitives.snap = SnapLib;
    __snapPrimitives.element = Element;
    __snapPrimitives.paper = Paper;
    __snapPrimitives.global = global;
    __snapPrimitives.Fragment = Fragment;
});


/**
 * Base class for all persona and SVG elements.
 *
 * @class Node
 * @param {String} [type='g'] - The type of element to be created, defaults to `g` (group).
 * @param {Object=} attr - Attributes to be added when creating the object.
 * @constructor
 */
function Node(type, attr) {
    /* inheritance */
    var t = type || 'g';
    var element = __snapPrimitives.snap._.$(t, attr);
    __snapPrimitives.element.call(this, element);

    /* member variables */
    this.mPosition = new Point2D();
    this.mScale = 1.0;
    this.mClickHandlers = [];
    this.mDragHandlers = [];
    this.mPinchHandlers = [];
    this.mClickTouchHandlers = null;
    this.mDragTouchHandlers = null;
    this.mPinchTouchHandlers = null;
    this.__mPaper = new Observable(null);

    /* initialize */
    this.mPosition.changedCallback = this._setPosition.bind(this);

    /* setup the `onEnter` call */
    var observerId = this.__mPaper.observe(function(sender, value) {
        if (value) {
            this.onEnter(value);
            /* unregister this observer as it's not needed anymore */
            this.__mPaper.unobserve(observerId);
            observerId = -1;
        }
    }.bind(this));
}

/* inheritance */
Node.prototype = Object.create(__snapPrimitives.element.prototype);
Node.prototype.constructor = Node;

/**
 * Returns the position of this object, encapsulated in a Point2D.
 *
 * @property position
 * @type {Point2D}
 * @readonly
 */
Object.defineProperty(Node.prototype, 'position', {
    get: function () {
        return this.mPosition;
    },
});

/**
 * The current scale of this object.
 *
 * @property scale
 * @type {Number}
 */
Object.defineProperty(Node.prototype, 'scale', {
    get: function() {
        return this.mScale;
    },

    set: function (val) {
        this._setScale(val);
    },
});

/**
 * The original implementation does not account for objects being created without being added immediately to the document,
 * this results in the `paper` property of such objects never being set and tracked properly. This solves the issue by
 * keeping track of it internally.
 *
 * @property paper
 * @type {Snap.paper|Observable}
 */
Object.defineProperty(Node.prototype, 'paper', {
    get: function () {
        return this.__mPaper.getValue();
    },

    set: function (val) {
        this.__mPaper.setValue(val);
    },
});

/**
 * Appends the given element to current one
 *
 * @method append
 * @param {Node|Element} el - Element to append
 * @return {Node}
 */
Node.prototype.append = function (el) {
    /* perform the append operation */
    if (el instanceof Node) {
        el.__mPaper.ignoreChanges(1);
        __snapPrimitives.element.prototype.append.call(this, el);
        el.paper = this.__mPaper;
    } else {
        __snapPrimitives.element.prototype.append.call(this, el);
    }
    return this;
};

/**
 * Removes element from the DOM
 *
 * @method remove
 * @returns {Node}
 */
Node.prototype.remove = function () {
    __snapPrimitives.element.prototype.remove.call(this);
    this.__mPaper.reset(false);
    return this;
};


/**
 * Adds tap (touch) functionality to the default `click` method in Snap.svg
 * NOTE: Maybe the following should be implemented to define thresholds for touches in mm instead of pixels.
 *
 * <div id="my_mm" style="height:1mm;display:none"></div>
 * var pxTomm = function(px){
 *  return Math.floor(px/$('#my_mm').height()); //JQuery returns sizes in PX
 * };
 *
 * @method click
 * @param {Function} handler - The callback function to be called when a click (or tap) is detected.
 */
Node.prototype.click = function (handler) {
    __snapPrimitives.element.prototype.click.call(this, handler);

    var clickHandlers = this.mClickHandlers;
    clickHandlers.push(handler);

    if (!this.mClickTouchHandlers) {
        var initialPosition = null;
        var touchId = null;

        var touchStart = function(event) {
            if (event.touches.length > 1 && touchId !== null) {
                touchId = null;
            } else if (event.touches.length === 1 && touchId === null) {
                var touch = event.changedTouches[0];
                touchId = touch.identifier;
                initialPosition = {
                    x: touch.pageX,
                    y: touch.pageY,
                };
            }
        };

        var touchEnd = function(event) {
            if (touchId !== null) {
                var touches = event.changedTouches;
                for (var i = 0, n = touches.length; i < n; ++i) {
                    var touch = touches[i];
                    if (touch.identifier === touchId) {
                        touchId = null;
                        var distance = Math.sqrt(Math.pow(initialPosition.x - touch.pageX, 2) + Math.pow(initialPosition.y - touch.pageY, 2));
                        if (!touch._personasTouchConsumed && distance < 19) {
                            touch._personasTouchConsumed = true;
                            for (var ii = 0, nn = clickHandlers.length; ii < nn; ++ii) {
                                clickHandlers[ii](null, touch.pageX, touch.pageY);
                            }
                        }
                        break;
                    }
                }
            }
        };

        var touchCancel = function(event) {
            if (touchId !== null) {
                var touches = event.changedTouches;
                for (var i = 0, n = touches.length; i < n; ++i) {
                    var touch = touches[i];
                    if (touch.identifier === touchId) {
                        touchId = null;
                        break;
                    }
                }
            }
        };

        this.touchstart(touchStart);
        this.touchend(touchEnd);
        this.touchcancel(touchCancel);

        this.mClickTouchHandlers = [touchStart, touchEnd, touchCancel];
    }
};

/**
 * Removes a click/tap handler from this element.
 *
 * @method unclick
 * @param {Function=} handler - The handler to remove, if not handler is passed all handlers are removed.
 */
Node.prototype.unclick = function (handler) {
    __snapPrimitives.element.prototype.unclick.call(this, handler);

    if (this.mClickTouchHandlers) {
        if (!handler) {
            this.mClickHandlers.length = 0;
        } else {
            var handlerIndex = this.mClickHandlers.indexOf(handler);
            if (handlerIndex > -1) {
                this.mClickHandlers.splice(handlerIndex, 1);
            }
        }

        if (!this.mClickHandlers.length) {
            this.untouchstart(this.mClickTouchHandlers[0]);
            this.untouchend(this.mClickTouchHandlers[1]);
            this.untouchcancel(this.mClickTouchHandlers[2]);
            this.mClickTouchHandlers = null;
        }
    }
};

/**
 * Adds touch functionality to snap.svg's default drag function.
 * The difference between this drag function and the default drag function is that it automatically cancels when two or
 * more touches are detected.
 *
 * @method drag
 * @param {Function} onmove - handler for moving
 * @param {Function} onstart - handler for drag start
 * @param {function} onend - handler for drag end
 * @param {Object=} moveScope - context for moving handler
 * @param {Object=} startScope - context for drag start handler
 * @param {Object=} endScope - context for drag end handler
 */
Node.prototype.drag = function(onmove, onstart, onend, moveScope, startScope, endScope) {
    __snapPrimitives.element.prototype.drag.call(this, onmove, onstart, onend, moveScope, startScope, endScope);

    if (!this.mDragTouchHandlers) {
        var dragHandlers = this.mDragHandlers;
        dragHandlers.push({
            onmove: onmove,
            onstart: onstart,
            onend: onend,
        });

        var dragging = false;
        var lastPosition = null;
        var touchId = null;

        var touchStart = function(event) {
            if (event.touches.length > 1 && touchId !== null) {
                touchId = null;
                if (dragging) {
                    dragging = false;
                    for (var ii = 0, nn = dragHandlers.length; ii < nn; ++ii) {
                        if (dragHandlers[ii].onend) {
                            dragHandlers[ii].onend(null);
                        }
                    }
                }
            } else if (event.touches.length === 1 && touchId === null) {
                var touch = event.changedTouches[0];
                touchId = touch.identifier;
                lastPosition = {
                    x: touch.pageX,
                    y: touch.pageY,
                };
            }
        };

        var touchMove = function(event) {
            if (touchId !== null) {
                var touches = event.changedTouches;
                for (var i = 0, n = touches.length; i < n; ++i) {
                    var touch = touches[i];
                    if (touch.identifier === touchId) {
                        var ii;
                        var nn;
                        if (dragging) {
                            for (ii = 0, nn = dragHandlers.length; ii < nn; ++ii) {
                                if (dragHandlers[ii].onmove) {
                                    dragHandlers[ii].onmove(touch.pageX - lastPosition.x, touch.pageY - lastPosition.y, touch.pageX, touch.pageY, null);
                                }
                            }
                            lastPosition.x = touch.pageX;
                            lastPosition.y = touch.pageY;
                        } else {
                            var distance = Math.sqrt(Math.pow(lastPosition.x - touch.pageX, 2) + Math.pow(lastPosition.y - touch.pageY, 2));
                            if (distance > 19) {
                                dragging = true;
                                for (ii = 0, nn = dragHandlers.length; ii < nn; ++ii) {
                                    if (dragHandlers[ii].onstart) {
                                        dragHandlers[ii].onstart(lastPosition.x, lastPosition.y, null);
                                    }
                                }
                                touchMove(event);
                            }
                        }
                        break;
                    }
                }
            }
        };

        var touchEnd = function(event) {
            if (touchId !== null) {
                var touches = event.changedTouches;
                for (var i = 0, n = touches.length; i < n; ++i) {
                    var touch = touches[i];
                    if (touch.identifier === touchId) {
                        touchId = null;
                        dragging = false;
                        for (var ii = 0, nn = dragHandlers.length; ii < nn; ++ii) {
                            if (dragHandlers[ii].onend) {
                                dragHandlers[ii].onend(null);
                            }
                        }
                        break;
                    }
                }
            }
        };

        this.touchstart(touchStart);
        this.touchmove(touchMove);
        this.touchend(touchEnd);
        this.touchcancel(touchEnd);

        this.mDragTouchHandlers = [touchStart, touchMove, touchEnd];
    }
};

/**
 * Removes all drag handlers from this object.
 *
 * @method undrag
 */
Node.prototype.undrag = function() {
    __snapPrimitives.element.prototype.undrag.call(this);

    if (this.mDragTouchHandlers) {
        this.mDragHandlers.length = 0;
        this.untouchstart(this.mDragTouchHandlers[0]);
        this.untouchmove(this.mDragTouchHandlers[1]);
        this.untouchend(this.mDragTouchHandlers[2]);
        this.untouchcancel(this.mDragTouchHandlers[2]);
        this.mDragTouchHandlers = null;
    }
};

/**
 * Method to recognize and react to pinch gestures on the object.
 *
 * @method pinch
 * @param {Function} handler - The callback function to be called when a pinch gesture is updated.
 */
Node.prototype.pinch = function (handler) {
    var pinchHandlers = this.mPinchHandlers;
    pinchHandlers.push(handler);

    if (!this.mPinchTouchHandlers) {
        var lastDistance = 0;
        var center = null;
        var touchId01 = null;
        var touchId02 = null;

        var touchStart = function(event) {
            if (event.touches.length > 1 && touchId01 === null && touchId02 === null) {
                var touch01 = event.touches[0];
                touchId01 = event.touches[0].identifier;

                var touch02 = event.touches[1];
                touchId02 = event.touches[1].identifier;

                lastDistance = Math.sqrt(Math.pow(touch01.pageX - touch02.pageX, 2) + Math.pow(touch01.pageY - touch02.pageY, 2));
                center = {
                    x: (touch01.pageX + touch02.pageX) * 0.5,
                    y: (touch01.pageY + touch02.pageY) * 0.5,
                };
            }
        };

        var touchMove = function(event) {
            if (touchId01 !== null && touchId02 !== null) {
                var touches = event.touches;
                var touch01 = null;
                var touch02 = null;
                for (var i = 0, n = touches.length; i < n; ++i) {
                    var touch = touches[i];
                    if (touch.identifier === touchId01) {
                        touch01 = touch;
                    } else if (touch.identifier === touchId02) {
                        touch02 = touch;
                    }
                }

                if (touch01 && touch02) {
                    var distance = Math.sqrt(Math.pow(touch01.pageX - touch02.pageX, 2) + Math.pow(touch01.pageY - touch02.pageY, 2));
                    var currentCenterOffsetX = ((touch01.pageX + touch02.pageX) * 0.5) - center.x;
                    var currentCenterOffsetY = ((touch01.pageY + touch02.pageY) * 0.5) - center.y;

                    var currentCenter = {
                        x: center.x - currentCenterOffsetX,
                        y: center.y - currentCenterOffsetY,
                    };

                    for (var ii = 0, nn = pinchHandlers.length; ii < nn; ++ii) {
                        if (pinchHandlers[ii]) {
                            pinchHandlers[ii](currentCenter, distance - lastDistance);
                        }
                    }
                    lastDistance = distance;
                }
            }
        };

        var touchEnd = function(event) {
            if (touchId01 !== null && touchId02 !== null) {
                var touches = event.changedTouches;
                for (var i = 0, n = touches.length; i < n; ++i) {
                    var touch = touches[i];
                    if (touch.identifier === touchId01 || touch.identifier === touchId02) {
                        touchId01 = null;
                        touchId02 = null;
                        break;
                    }
                }
            }
        };

        this.touchstart(touchStart);
        this.touchmove(touchMove);
        this.touchend(touchEnd);
        this.touchcancel(touchEnd);

        this.mClickTouchHandlers = [touchStart, touchMove, touchEnd];
    }
};

/**
 * Removes a pinch handler from this element.
 *
 * @method unpinch
 * @param {Function=} handler - The handler to remove, if not handler is passed all handlers are removed.
 */
Node.prototype.unpinch = function (handler) {
    if (this.mPinchTouchHandlers) {
        if (!handler) {
            this.mPinchHandlers.length = 0;
        } else {
            var handlerIndex = this.mPinchHandlers.indexOf(handler);
            if (handlerIndex > -1) {
                this.mPinchHandlers.splice(handlerIndex, 1);
            }
        }

        if (!this.mPinchHandlers.length) {
            this.untouchstart(this.mPinchTouchHandlers[0]);
            this.untouchmove(this.mPinchTouchHandlers[1]);
            this.untouchend(this.mPinchTouchHandlers[2]);
            this.untouchcancel(this.mPinchTouchHandlers[2]);
            this.mPinchTouchHandlers = null;
        }
    }
};

/**
 * Utility function to set the X and Y coordinates of this node.
 *
 * @method _setPosition
 * @param {Number} x - The new X coordinate for this node.
 * @param {Number} y - The new Y coordinate for this node.
 * @private
 */
Node.prototype._setPosition = function (x, y) {
    this.mPosition.mX = x;
    this.mPosition.mY = y;
    var matrix = this.transform().localMatrix;
    matrix.e = x;
    matrix.f = y;
    this.transform(matrix);
};

/**
 * Utility function to set the scale of the node.
 *
 * @method _setScale
 * @param {Number} scale - The new scale of the node.
 * @private
 */
Node.prototype._setScale = function (scale) {
    if (scale !== this.mScale) {
        this.mScale = scale;
        var matrix = new Snap.Matrix();
        matrix.e = this.mPosition.x;
        matrix.f = this.mPosition.y;
        matrix.scale(scale);
        this.transform(matrix);
    }
};

/**
 * This function is called the first time the node is added to a paper. Override it with your own implementation.
 *
 * @method onEnter
 * @param {Snap.paper} paper - The paper this node was added to.
 */
/* eslint-disable */
Node.prototype.onEnter = function(paper) {

};
/* eslint-enable */

/**
 * Mixes in the touch functionality of this class into the specified element.
 *
 * @method mixinTouch
 * @param {*} element - The element to which the touch functionality will be added.
 * @returns {*}
 * @static
 */
Node.mixinTouch = function (element) {
    element.mClickHandlers = [];
    element.mDragHandlers = [];
    element.mPinchHandlers = [];
    element.mClickTouchHandlers = null;
    element.mDragTouchHandlers = null;
    element.mPinchTouchHandlers = null;

    element.click = Node.prototype.click;
    element.unclick = Node.prototype.unclick;
    element.drag = Node.prototype.drag;
    element.undrag = Node.prototype.undrag;
    element.pinch = Node.prototype.pinch;
    element.unpinch = Node.prototype.unpinch;

    return element;
};

/**
 * @export
 * @type {Node}
 */
module.exports = Node;
