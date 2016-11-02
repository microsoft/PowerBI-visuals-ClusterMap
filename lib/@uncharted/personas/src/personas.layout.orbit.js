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

/* global mina */

/* enable strict mode */
'use strict';

/* import modules */
var Node = require('./personas.core.node.js');
var Point2D = require('./personas.core.point2d.js');

/**
 * This class represents an "orbit" in the personas space.
 * When positioning personas a radial system is used, think of orbits as radial layers of personas.
 *
 * @class Orbit
 * @param { Number= } radius - the radius at which to create the orbit.
 * @constructor
 */
function Orbit(radius) {
    /* inheritance */
    Node.call(this);

    /* member variables */
    this.mInnerRadius = (radius || 0);
    this.mOuterRadiusOffset = 0;
    this.mFilledAngle = 0;
    this.mObjects = [];
    this.mParent = null;

    this.mDistributeEvenly = true;
    this.mAngleOffset = 0;

    /* initialization */
}

/* inheritance */
Orbit.prototype = Object.create(Node.prototype);
Orbit.prototype.constructor = Orbit;

/**
 * Returns the inner radius of this orbit.
 *
 * @property innerRadius
 * @type { Number }
 * @readonly
 */
Object.defineProperty(Orbit.prototype, 'innerRadius', {
    get: function () {
        return this.mInnerRadius;
    },

    set: function (val) {
        if (val !== this.mInnerRadius) {
            this.mInnerRadius = val;
            this._positionObjects();
        }
    },
});

/**
 * Returns the radius of this orbit. The radius represents the outermost part of the orbit.
 *
 * @property radius
 * @type { Number }
 * @readonly
 */
Object.defineProperty(Orbit.prototype, 'radius', {
    get: function () {
        return this.mInnerRadius + this.mOuterRadiusOffset;
    },
});

/**
 * Defines if the objects in this orbit should be distributed evenly or if they should be stacked as closely as possible.
 *
 * @property distributeEvenly
 * @type {Boolean}
 */
Object.defineProperty(Orbit.prototype, 'distributeEvenly', {
    get: function () {
        return this.mDistributeEvenly;
    },

    set: function (val) {
        if (this.mDistributeEvenly !== val) {
            this.mDistributeEvenly = val;
            this._positionObjects();
        }
    },
});

/**
 * Returns the radius at which the orbit would go through the center of all the objects in it.
 *
 * @property centerRadius
 * @type { Number }
 * @readonly
 */
Object.defineProperty(Orbit.prototype, 'centerRadius', {
    get: function () {
        return this.mInnerRadius + (this.mOuterRadiusOffset * 0.5);
    },
});

/**
 * If this object was added to an `OrbitSystem` or another 'Orbit' this property will return such object.
 *
 * @property parentNode
 * @type {Orbit|OrbitSystem}
 * @readonly
 */
Object.defineProperty(Orbit.prototype, 'parentNode', {
    get: function () {
        return this.mParent;
    },
});

/**
 * Returns the total count of objects in this orbit, including the ones in any sub orbits or systems it may contain.
 *
 * @property objectCount
 * @type {Number}
 * @readonly
 */
Object.defineProperty(Orbit.prototype, 'objectCount', {
    get: function () {
        var objects = this.mObjects;
        var count = 0;
        for (var i = 0, n = objects.length; i < n; ++i) {
            var object = objects[i];
            if (object.hasOwnProperty('objectCount')) {
                count += object.objectCount;
            } else {
                ++count;
            }
        }
        return count;
    },
});

/**
 * Adds an object to this orbit. Returns true on success or false if object wouldn't fit in the orbit.
 *
 * @method addObject
 * @param {Persona|Orbit|OrbitSystem} object - The object to add to the orbit.
 * @param {Boolean=} skipPositionCalculation - If set to true the added objects do not re-calculate their positions.
 * @returns {boolean} True on success or false if the new object wouldn't fit in the orbit.
 */
Orbit.prototype.addObject = function (object, skipPositionCalculation) {
    var objects = this.mObjects;
    var innerRadius = this.mInnerRadius;
    var objectRadius = object.radius;

    /* if there are no objects added to the orbit, just add the new one */
    if (!objects.length) {
        this.mOuterRadiusOffset = objectRadius * (innerRadius ? 2 : 1);
        this.mFilledAngle = this.calculateObjectAngle(objectRadius, this.centerRadius);
        this._wrapAndAddObject(object, this.mFilledAngle);
        if (!skipPositionCalculation && innerRadius > 0) {
            this._positionObjects();
        }
        return true;
    } else if (innerRadius !== 0) {
        var filledAngle = this.mFilledAngle;
        var radiusOffset = this.mOuterRadiusOffset;
        var halfRadiusOffset = radiusOffset * 0.5;
        var objectSize = objectRadius * 2;

        /* if the new object radius is higher than the orbit's radius offset, recalculate the filled angle */
        if (objectSize > radiusOffset) {
            var PI2 = Math.PI * 2;
            filledAngle *= (PI2 * (innerRadius + halfRadiusOffset)) / (PI2 * (innerRadius + (objectRadius)));
            radiusOffset = objectSize;
            halfRadiusOffset = objectRadius;
        }

        /* calculate if the new object would fit in the orbit */
        var objectAngle = this.calculateObjectAngle(objectRadius, innerRadius + halfRadiusOffset);
        if ((filledAngle + objectAngle) <= (Math.PI * 2)) {
            /* add the new object to the orbit */
            this._wrapAndAddObject(object, objectAngle);

            /* if the radiusOffset is different than the previously defined one, update the angles of all the objects */
            if (this.mOuterRadiusOffset !== radiusOffset) {
                this._recalculateFilledAngle(innerRadius + halfRadiusOffset);
                this.mOuterRadiusOffset = radiusOffset;
            } else {
                /* just add the new object angle to the filled angle count */
                this.mFilledAngle += objectAngle;
            }

            if (!skipPositionCalculation) {
                this._positionObjects();
            }

            return true;
        }
    }

    return false;
};

/**
 * If the object exists in this orbit is removed. Return true if the object was removed successfully, false otherwise.
 *
 * @method removeObject
 * @param {Persona|Orbit|OrbitSystem} object - The object to remove.
 * @returns {boolean}
 */
Orbit.prototype.removeObject = function (object) {
    var objects = this.mObjects;
    for (var i = 0, n = objects.length; i < n; ++i) {
        var unwrappedObject = objects[i].object;
        if (unwrappedObject === object) {
            unwrappedObject.remove();
            unwrappedObject.mParent = null;
            objects.splice(i, 1);
            return true;
        } else if (unwrappedObject.removeObject && unwrappedObject.removeObject(object)) {
            return true;
        }
    }

    return false;
};

/**
 * Removes all objects from the orbit and its sub orbits.
 *
 * @method removeAllObjects
 */
Orbit.prototype.removeAllObjects = function () {
    var objects = this.mObjects;
    while (objects.length) {
        var unwrappedObject = objects.pop().object;
        if (unwrappedObject.removeAllObjects) {
            unwrappedObject.removeAllObjects();
        }
        unwrappedObject.remove();
        unwrappedObject.mParent = null;
    }
};

/**
 * Checks if this orbit or any of its sub-objects contain the specified `object`.
 *
 * @method containsObject
 * @param {Persona|Orbit|OrbitSystem} object - The object to look for.
 * @returns {boolean}
 */
Orbit.prototype.containsObject = function (object) {
    var objects = this.mObjects;
    for (var i = 0, n = objects.length; i < n; ++i) {
        var unwrappedObject = objects[i].object;
        if (unwrappedObject === object || (unwrappedObject.containsObject && unwrappedObject.containsObject(object))) {
            return true;
        }
    }

    return false;
};

/**
 * Iterates through all the objects and its sub-objects in this orbit and calls the callback with each object as
 * its sole argument.
 *
 * @method forEach
 * @param {Function} callback - The function to call for every object.
 */
Orbit.prototype.forEach = function (callback) {
    var objects = this.mObjects;
    for (var i = 0, n = objects.length; i < n; ++i) {
        var object = objects[i].object;
        if (object.forEach) {
            object.forEach(callback);
        }
        /* eslint-disable */
        callback(object);
        /* eslint-enable */
    }
};

/**
 * Calculates the angle that a given object would take to fit in an orbit of the given radius.
 *
 * @method calculateObjectAngle
 * @param { Number } objectRadius - The radius of the object for which to calculate the angle.
 * @param { Number } centerRadius - Center radius of the orbit.
 * @returns {number}
 */
Orbit.prototype.calculateObjectAngle = function (objectRadius, centerRadius) {
    if (objectRadius > centerRadius) {
        return Math.PI * 2;
    }
    return Math.asin(objectRadius / centerRadius) * 2;
};

/**
 * Invalidates this object, once invalidated the object will no longer respond to interactions.
 *
 * @method invalidate
 */
Orbit.prototype.invalidate = function () {
    var objects = this.mObjects;
    for (var i = 0, n = objects.length; i < n; ++i) {
        var object = objects[i].object;
        if (typeof object.invalidate === 'function') {
            object.invalidate();
        }
    }
};

/**
 * Wraps the passed object, adds it to the internal data and appends it to the orbit.
 *
 * @method _wrapAndAddObject
 * @param {Persona|Orbit|OrbitSystem} object - The object to be added to the orbit.
 * @param {Number} objectAngle - Number representing how bit of an angle will be taken up by the object.
 * @private
 */
Orbit.prototype._wrapAndAddObject = function (object, objectAngle) {
    this.mObjects.push({
        object: object,
        angle: objectAngle,
    });
    this.append(object);
    object.mParent = this;
};

/**
 * Recalculates the filled angle of this orbit and the angle all objects take up within it.
 *
 * @method _recalculateFilledAngle
 * @param {Number} centerRadius - The center radius of the orbit, used to calculate the new filled angle
 * @private
 */
Orbit.prototype._recalculateFilledAngle = function (centerRadius) {
    var objects = this.mObjects;
    var filledAngle = 0;
    for (var i = 0, n = objects.length; i < n; ++i) {
        var addedObject = objects[i];
        var addedObjectRadius = addedObject.object.radius;
        addedObject.angle = this.calculateObjectAngle(addedObjectRadius, centerRadius);
        filledAngle += addedObject.angle;
    }
    this.mFilledAngle = filledAngle;
};

/**
 * Internal function to position the objects contained in this orbit.
 *
 * @method _positionObjects
 * @param {Boolean=} animated - If this flag is set to true, the objects will have their change to a new position animated.
 * @private
 */
Orbit.prototype._positionObjects = function (animated) {
    if (this.mInnerRadius === 0) {
        /* there should always be one object when the radius is 0 */
        var object = this.mObjects[0].object;
        if (animated && object.animatePosition) {
            if (object.position.x !== 0 || object.position.y !== 0) {
                object.animatePosition(object.position, new Point2D(0, 0), 500, mina.backout);
            }
        }
    } else {
        var objects = this.mObjects;
        var objectsLength = objects.length;
        var currentAngle = this.mAngleOffset;
        var step = 0;
        var orbitCenterRadius = this.centerRadius;
        var lastPersonaIndex = objectsLength - 1;
        if (this.mDistributeEvenly) {
            step = ((Math.PI * 2) - this.mFilledAngle) / objectsLength;
        } else {
            currentAngle -= (this.mFilledAngle * 0.5) - (objects[0].angle * 0.5);
        }

        for (var i = 0; i < objectsLength; ++i) {
            var objectNode = objects[i];
            var x = Math.cos(currentAngle) * orbitCenterRadius;
            var y = Math.sin(currentAngle) * orbitCenterRadius;
            if (animated && objectNode.object.animatePosition) {
                var position = objectNode.object.position;
                if (x !== position.x || y !== position.y) {
                    var newPosition = new Point2D(x, y);
                    objectNode.object.animatePosition(position, newPosition, 500, mina.backout);
                }
            } else {
                objectNode.object.position.set(x, y);
            }
            if (i < lastPersonaIndex) {
                currentAngle += step + (objectNode.angle * 0.5) + (objects[i + 1].angle * 0.5);
            }
        }
    }
};

/**
 * @export
 * @type {Orbit}
 */
module.exports = Orbit;
