/**
 * Created by dsegura on 2016-01-22.
 */

/* enable strict mode */
'use strict';

/* import modules */
var Node = require('./personas.core.node.js');

/**
 * Class that represents a persona seed graphically.
 *
 * @class Seed
 * @param {Number} size - The size (diameter) of the persona seed.
 * @param {Object} info - Information about the seed persona.
 * @param {Object} globalConfig - Global configuration object.
 * @constructor
 */
function Seed(size, info, globalConfig) {
    /* inheritance */
    Node.call(this);

    /* member variables */
    this.mConfig = globalConfig;
    this.mPersonaOptions = this.mConfig.Persona;
    this.mSize = size;
    this.mRadius = size * 0.5;
    this.mParent = null;

    /* initialization */

    /* create the name text */
    this.mNameText = new Node('text', {x: 0, y: 0});
    this.mNameText.attr({
        'text-anchor': 'middle',
        'pointer-events': 'none',
    });
    this.mNameText.addClass(this.mPersonaOptions.classes.unselectable);
    this.append(this.mNameText);

    var countSpan = new Node('tspan');
    countSpan.addClass(this.mPersonaOptions.classes.seedcount);
    countSpan.node.textContent = '☍' + info.count + ' • ';
    this.mNameText.append(countSpan);

    var nameSpan = new Node('tspan');
    nameSpan.addClass(this.mPersonaOptions.classes.seedname);
    nameSpan.node.textContent = info.value || 'Related';
    this.mNameText.append(nameSpan);
}

/* inheritance */
Seed.prototype = Object.create(Node.prototype);
Seed.prototype.constructor = Seed;

/**
 * If this object was added to an 'Orbit' this property will return such object.
 *
 * @property parent
 * @type {Orbit}
 * @readonly
 */
Object.defineProperty(Seed.prototype, 'parentNode', {
    get: function () {
        return this.mParent;
    },
});

/**
 * The radius of this persona.
 *
 * @property radius
 * @type {Number}
 */
Object.defineProperty(Seed.prototype, 'radius', {
    get: function () {
        return this.mRadius;
    },

    set: function (val) {
        this.setRadius(val, false);
    },
});

/**
 * The size (or diameter) of this persona.
 *
 * @property size
 * @type {Number}
 */
Object.defineProperty(Seed.prototype, 'size', {
    get: function () {
        return this.mSize;
    },

    set: function (val) {
        this.setRadius(val * 0.5, false);
    },
});

/**
 * Utility function to change the radius of this persona. Can be animated.
 *
 * @method setRadius
 * @param {Number} newRadius - The new radius for this persona.
 * @param {Boolean} animated - Should the radius change be animated.
 */
Seed.prototype.setRadius = function (newRadius, animated) {
    if (newRadius !== this.mRadius) {
        if (!animated) {
            this.mRadius = newRadius;
            this.mSize = (newRadius * 2);
        }
    }
};

/**
 * Animates this persona's position to the new position usind the time and eased specified.
 *
 * @method animatePosition
 * @param {Point2D} position - The initial position of the persona.
 * @param {Point2D} newPosition - The final position of the persona after the animation.
 * @param {Number} time - The duration of the animation.
 * @param {Function} ease - An easing function to be used during the animation.
 */
Seed.prototype.animatePosition = function (position, newPosition, time, ease) {
    var matrix = this.transform().localMatrix;
    matrix.e = newPosition.x;
    matrix.f = newPosition.y;

    this.stop();
    this.animate({ transform: matrix }, time, ease, function() {
        /* WARNING: HACK! */
        var oldCallback = position.changedCallback;
        position.changedCallback = null;
        position.x = newPosition.x;
        position.y = newPosition.y;
        position.changedCallback = oldCallback;
    });
};

/**
 * @export
 * @type {Seed}
 */
module.exports = Seed;
