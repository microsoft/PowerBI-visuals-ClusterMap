/**
 * Created by dsegura on 2016-01-14.
 */

/* enable strict mode */
'use strict';

/**
 * Utility class that represents a point in a 2D space.
 *
 * @class Point2D
 * @param {Number=} x - The X coordinate of this point.
 * @param {Number=} y - The Y coordinate of this point.
 * @constructor
 */
function Point2D (x, y) {
    /* member variables */
    this.mX = (x || 0);
    this.mY = (y || 0);
    this.mChangedCallback = null;
}

/**
 * The X coordinate of this point.
 *
 * @property x
 * @type {Number}
 */
Object.defineProperty(Point2D.prototype, 'x', {
    get: function () {
        return this.mX;
    },
    set: function (val) {
        this.mX = val;
        if (this.mChangedCallback) {
            this.mChangedCallback(val, this.mY);
        }
    },
});

/**
 * The Y coordinate of this point.
 *
 * @property y
 * @type {Number}
 */
Object.defineProperty(Point2D.prototype, 'y', {
    get: function () {
        return this.mY;
    },
    set: function (val) {
        this.mY = val;
        if (this.mChangedCallback) {
            this.mChangedCallback(this.mX, val);
        }
    },
});

/**
 * A callback function that gets called every time this point is modified through its external interface.
 *
 * @property changedCallback
 * @type {Function}
 */
Object.defineProperty(Point2D.prototype, 'changedCallback', {
    get: function () {
        return this.mChangedCallback;
    },
    set: function (val) {
        if (typeof val === 'function') {
            this.mChangedCallback = val;
        } else {
            this.mChangedCallback = null;
        }
    },
});

/**
 * Sets the X and Y coordinates of this point.
 *
 * @method set
 * @param {Number} x - The new X coordinate for this point.
 * @param {Number} y - The new Y coordinate for this point.
 */
Point2D.prototype.set = function (x, y) {
    this.mX = x;
    this.mY = y;
    if (this.mChangedCallback) {
        this.mChangedCallback(x, y);
    }
};

/**
 * Adds the passed point to this point. The result is saved in this point.
 *
 * @method add
 * @param {Point2D} point - The point to add.
 */
Point2D.prototype.add = function (point) {
    this.mX += point.mX;
    this.mY += point.mY;
    if (this.mChangedCallback) {
        this.mChangedCallback(this.mX, this.mY);
    }
};

/**
 * Subtracts the passed point from this point. The result is saved in this point.
 *
 * @method subtract
 * @param {Point2D} point - The point to subtract.
 */
Point2D.prototype.subtract = function (point) {
    this.mX -= point.mX;
    this.mY -= point.mY;
    if (this.mChangedCallback) {
        this.mChangedCallback(this.mX, this.mY);
    }
};

/**
 * Clones this point and returns the copied point.
 *
 * @method clone
 * @returns {Point2D}
 */
Point2D.prototype.clone = function() {
    var ret = new this.constructor(this.mX, this.mY);
    ret.mChangedCallback = this.mChangedCallback;
    return ret;
};

/**
 * @export
 * @type {Point2D}
 */
module.exports = Point2D;
