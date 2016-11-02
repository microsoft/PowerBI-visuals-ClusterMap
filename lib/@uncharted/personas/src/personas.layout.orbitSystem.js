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
var Node = require('./personas.core.node.js');
var LayoutSystem = require('./personas.layout.layoutSystem.js');
var Orbit = require('./personas.layout.orbit.js');

/**
 * An orbit system can create and hold many orbits stacking them around the smaller orbit.
 *
 * @class OrbitSystem
 * @param {Number=} orbitPadding - The number of pixels to add as padding between orbits.
 * @constructor
 */
function OrbitSystem(orbitPadding) {
    /* inheritance */
    LayoutSystem.call(this);

    /* member variables */
    this.mPadding = (orbitPadding || 0);
    this.mOrbits = [];

    /* DEBIGGING */
    this.mDrawInnerOrbits = false;
    this.mDrawCenterOrbits = false;
    this.mDrawOuterOrbits = false;
    this.mInnerOrbits = [];
    this.mCenterOrbits = [];
    this.mOuterOrbits = [];
    this.mInnerOrbitsGroup = new Node();
    this.mCenterOrbitsGroup = new Node();
    this.mOuterOrbitsGroup = new Node();
    this.append(this.mInnerOrbitsGroup);
    this.append(this.mCenterOrbitsGroup);
    this.append(this.mOuterOrbitsGroup);

    /* initialization */
    var orbit = new Orbit();
    this.mOrbits.push(orbit);
    this.append(orbit);
    orbit.mParent = this;
}

/* inheritance */
OrbitSystem.prototype = Object.create(LayoutSystem.prototype);
OrbitSystem.prototype.constructor = OrbitSystem;

/**
 * Return the current radius of this system.
 *
 * @property radius
 * @type { Number }
 * @readonly
 */
Object.defineProperty(OrbitSystem.prototype, 'radius', {
    get: function () {
        return this.mOrbits[this.mOrbits.length - 1].radius;
    },
});

/**
 * The padding that should be added between orbits.
 *
 * @property orbitPadding
 * @type {Number}
 */
Object.defineProperty(OrbitSystem.prototype, 'orbitPadding', {
    get: function () {
        return this.mPadding;
    },

    set: function (val) {
        if (val !== this.mPadding) {
            this.mPadding = val;
            for (var i = 1, n = this.mOrbits.length; i < n; ++i) {
                this.mOrbits[i].innerRadius = this.mOrbits[i - 1].radius + val;
            }
        }
    },
});

/**
 * Returns the total count of objects in this system.
 *
 * @property objectCount
 * @type {Number}
 * @readonly
 */
Object.defineProperty(OrbitSystem.prototype, 'objectCount', {
    get: function () {
        var orbits = this.mOrbits;
        var count = 0;
        for (var i = 0, n = orbits.length; i < n; ++i) {
            var orbit = orbits[i];
            count += orbit.objectCount;
        }
        return count;
    },
});

/**
 * DEBUG: Property to define if inner orbits should be drawn.
 *
 * @property drawInnerOrbits
 * @type {Boolean}
 * @debug
 */
Object.defineProperty(OrbitSystem.prototype, 'drawInnerOrbits', {
    get: function () {
        return this.mDrawInnerOrbits;
    },

    set: function (val) {
        if (val !== this.mDrawInnerOrbits) {
            this.mDrawInnerOrbits = val;
            if (!val) {
                this._removeDrawnOrbits(this.mInnerOrbits);
            } else {
                this._drawOrbits('innerRadius', this.mInnerOrbitsGroup, this.mInnerOrbits, '#FF0000');
            }
        }
    },
});

/**
 * DEBUG: Property to define if center orbits should be drawn.
 *
 * @property drawCenterOrbits
 * @type {Boolean}
 * @debug
 */
Object.defineProperty(OrbitSystem.prototype, 'drawCenterOrbits', {
    get: function () {
        return this.mDrawCenterOrbits;
    },

    set: function (val) {
        if (val !== this.mDrawCenterOrbits) {
            this.mDrawCenterOrbits = val;
            if (!val) {
                this._removeDrawnOrbits(this.mCenterOrbits);
            } else {
                this._drawOrbits('centerRadius', this.mCenterOrbitsGroup, this.mCenterOrbits, '#00FF00');
            }
        }
    },
});

/**
 * DEBUG: Property to define if outer orbits should be drawn.
 *
 * @property drawOuterOrbits
 * @type {Boolean}
 * @debug
 */
Object.defineProperty(OrbitSystem.prototype, 'drawOuterOrbits', {
    get: function () {
        return this.mDrawOuterOrbits;
    },

    set: function (val) {
        if (val !== this.mDrawOuterOrbits) {
            this.mDrawOuterOrbits = val;
            if (!val) {
                this._removeDrawnOrbits(this.mOuterOrbits);
            } else {
                this._drawOrbits('radius', this.mOuterOrbitsGroup, this.mOuterOrbits, '#0000FF');
            }
        }
    },
});

/**
 * Adds an object to this system. If the object wouldn't fit in the outmost orbit a new orbit is created and added to the system.
 *
 * @method addObject
 * @param {Object} object - The object to be added to the system
 * @param {Boolean=} skipPositionCalculation - If set to true the added objects do not re-calculate their positions.
 */
OrbitSystem.prototype.addObject = function (object, skipPositionCalculation) {
    var orbits = this.mOrbits;
    var orbit = orbits[orbits.length - 1];
    while (!orbit.addObject(object, skipPositionCalculation)) {
        orbit = new Orbit(orbit.radius + this.mPadding);
        orbits.push(orbit);
        this.append(orbit);
        orbit.mParent = this;
    }

    if (this.drawInnerOrbits) {
        this.drawInnerOrbits = false;
        this.drawInnerOrbits = true;
    }

    if (this.drawCenterOrbits) {
        this.drawCenterOrbits = false;
        this.drawCenterOrbits = true;
    }

    if (this.drawOuterOrbits) {
        this.drawOuterOrbits = false;
        this.drawOuterOrbits = true;
    }
};

/**
 * If the object exists in this orbit system, it is removed. Return true if the object was removed successfully, false otherwise.
 *
 * @method removeObject
 * @param {Persona|Orbit|OrbitSystem} object - The object to remove.
 * @returns {boolean}
 */
OrbitSystem.prototype.removeObject = function (object) {
    var orbits = this.mOrbits;
    for (var i = 0, n = orbits.length; i < n; ++i) {
        if (orbits[i].removeObject(object)) {
            return true;
        }
    }

    return false;
};

/**
 * Removes all objects from the orbit system.
 *
 * @method removeAllObjects
 */
OrbitSystem.prototype.removeAllObjects = function () {
    var orbits = this.mOrbits;
    var orbit = null;
    while (orbits.length) {
        orbit = orbits.pop();
        orbit.removeAllObjects();
        orbit.remove();
    }

    /* create a new orbit that will be the center orbit */
    orbit = new Orbit();
    this.mOrbits.push(orbit);
    this.append(orbit);
    orbit.mParent = this;
};

/**
 * Checks if this system contains the specified `object`.
 *
 * @method containsObject
 * @param {Persona|Orbit|OrbitSystem} object - The object to look for.
 * @returns {boolean}
 */
OrbitSystem.prototype.containsObject = function (object) {
    var ret = false;
    var orbits = this.mOrbits;
    for (var i = 0, n = orbits.length; i < n; ++i) {
        ret = orbits[i].containsObject(object);
        if (ret) {
            break;
        }
    }

    return ret;
};

/**
 * Iterates through all the objects in this orbit system recursively and calls the callback with each object as
 * its sole argument.
 *
 * @method forEach
 * @param {Function} callback - The function to call for every object.
 */
OrbitSystem.prototype.forEach = function (callback) {
    var orbits = this.mOrbits;
    for (var i = 0, n = orbits.length; i < n; ++i) {
        orbits[i].forEach(callback);
    }
};

/**
 * Goes through all the objects in this system and moves them to their most updated position.
 *
 * @method positionObjects
 * @param {Boolean=} animated - Should the objects be animated to their new position.
 */
OrbitSystem.prototype.positionObjects = function(animated) {
    var orbits = this.mOrbits;
    for (var i = 0, n = orbits.length; i < n; ++i) {
        orbits[i]._positionObjects(animated || false);
    }
};

/**
 * Invalidates this object, once invalidated the object will no longer respond to interactions.
 *
 * @method invalidate
 */
OrbitSystem.prototype.invalidate = function () {
    var orbits = this.mOrbits;
    for (var i = 0, n = orbits.length; i < n; ++i) {
        orbits[i].invalidate();
    }
};

/**
 * DEBUG: Utility function to draw all the orbits using the specified property,
 *
 * @param {String} property - The property name of the orbit to use as a radius.
 * @param {Node} group - A node to draw the orbits.
 * @param {Array} array - An array where the drawn orbits will be saved.
 * @param {String} color - The color for the orbits.
 * @private
 * @debug
 */
OrbitSystem.prototype._drawOrbits = function (property, group, array, color) {
    var orbits = this.mOrbits;
    for (var i = 0, n = orbits.length; i < n; ++i) {
        this._drawOrbit(orbits[i][property], group, array, color);
    }
};

/**
 * DEBUG: Utility function to draw a single orbit with the specified radius.
 *
 * @param {Number} radius - The radius of the orbit to draw.
 * @param {Node} group - A node to draw the orbit.
 * @param {Array} array - An array where the drawn orbit will be saved.
 * @param {String} color - The color for the orbit.
 * @private
 * @debug
 */
OrbitSystem.prototype._drawOrbit = function (radius, group, array, color) {
    var circle = group.circle(0, 0, radius);

    circle.attr({
        'fill': 'transparent',
        'stroke': color,
        'stroke-width': 2,
    });

    array.push(circle);
};

/**
 * DEBUG: Utility function to removed all drawn orbits contained in the passed array.
 *
 * @param {Array} array - An array containing the orbits to remove.
 * @private
 * @debug
 */
OrbitSystem.prototype._removeDrawnOrbits = function (array) {
    for (var i = 0, n = array.length; i < n; ++i) {
        array[i].remove();
    }
    array.length = 0;
};

/**
 * @export
 * @type {OrbitSystem}
 */
module.exports = OrbitSystem;
