/**
 * Created by dsegura on 2016-01-15.
 */

/* global mina */

/* enable strict mode */
'use strict';

/* import modules */
var Snap = require('snapsvg');
var Node = require('./personas.core.node.js');
var Promise = require('bluebird');

/**
 * Creates and maintains the circular gauges that represent the different properties in personas.
 *
 * @class Gauge
 * @param {Number} radius - The radius of the gauge.
 * @param {Number} thickness - How thick should the bar be.
 * @param {string} baseColor - The color used for the gauge background (or the empty parts).
 * @param {Object} options - An object containing the configuration options for the persona tat owns this instance.
 * @constructor
 */
function DataGauge(radius, thickness, baseColor, options) {
    /* inheritance */
    Node.call(this);

    /* member variables */
    this.mOptions = options;
    this.mRadius = radius;
    this.mThickness = thickness;
    this.mGaugeRadius = radius - Math.ceil(thickness * 0.5);
    this.mBackground = null;
    this.mCircumference = Math.PI * this.mGaugeRadius * 2;
    this.mBars = {};
    this.mBarsArray = [];
    this.mBarsContainer = new Node();

    /* initialization */
    var background = new Node('circle', {cx: 0, cy: 0, r: this.mGaugeRadius - 1});
    background.attr({
        'pointer-events': 'none',
        'fill': 'transparent',
        'stroke': baseColor,
        'stroke-width': thickness + 2,
    });
    this.append(background);
    this.mBackground = background;

    /* append the bars container */
    this.append(this.mBarsContainer);

    /* draw the start line */
    var attr = {
        'x1': 0,
        'y1': -radius - thickness,
        'x2': 0,
        'y2': -radius + thickness,
        'stroke': '#283100',
        'stroke-width': 2,
        'pointer-events': 'none',
    };
    this.mStartLine = new Node('line', attr);
    this.append(this.mStartLine);
}

/* inheritance */
DataGauge.prototype = Object.create(Node.prototype);
DataGauge.prototype.constructor = DataGauge;

/**
 * The radius of this gauge.
 *
 * @property radius
 * @type {Number}
 */
Object.defineProperty(DataGauge.prototype, 'radius', {
    get: function () {
        return this.mRadius;
    },

    set: function (value) {
        this.setRadius(value, false);
    },
});

/**
 * Utility function to change the radius. Can be animated.
 *
 * @method setRadius
 * @param {Number} newRadius - The new radius for this persona.
 * @param {Boolean} animated - Should the radius change be animated.
 * @param {Object=} options - [OPTIONAL] If animated, and object can be passed to configure the animation.
 * @returns {Promise}
 */
DataGauge.prototype.setRadius = function (newRadius, animated, options) {
    if (newRadius !== this.mRadius) {
        var promises = [];
        var oldCircumference = this.mCircumference;
        this.mRadius = newRadius;
        this.mGaugeRadius = newRadius - Math.ceil(this.mThickness * 0.5);
        var newCircumference = Math.PI * this.mGaugeRadius * 2;

        /* update the bars to the new circumference */
        var circumference = this.mCircumference;
        var bars = this.mBars;

        /* animation options, if any */
        var animationDuration = this.mOptions.config.transitionsDuration;
        var animationEasing = mina.easeinout;
        if (animated && options) {
            animationDuration = (options.duration || animationDuration);
            animationEasing = (options.easing || animationEasing);
        }

        if (animated) {
            // this.animate({ transform: matrix }, time, ease
            promises.push(new Promise(function(resolve) {
                this.mBackground.animate({r: this.mGaugeRadius - 1}, animationDuration, animationEasing, resolve);
            }.bind(this)));

            promises.push(new Promise(function(resolve) {
                this.mStartLine.animate({
                    'y1': -newRadius - this.mThickness,
                    'y2': -newRadius + this.mThickness,
                }, animationDuration, animationEasing, resolve);
            }.bind(this)));
        } else {
            this.mBackground.attr({ r: this.mGaugeRadius - 1 });
            this.mStartLine.attr({
                'y1': -newRadius - this.mThickness,
                'y2': -newRadius + this.mThickness,
            });
            promises.push(Promise.resolve(true));
        }

        var gaugeRadiusFunction = function(barInfo, resolve) {
            barInfo.bar.animate({ r: this.mGaugeRadius }, animationDuration, animationEasing, resolve);
        };

        var gaugeBarAnimationFunction = function(barInfo, resolve, value) {
            this.mCircumference = value;
            barInfo.bar.attr({'stroke-dashoffset': (value * 0.25), 'stroke-dasharray': value * barInfo.currentValue + ' ' + value * (1.0 - barInfo.currentValue)});
            resolve();
        };

        var gaugeBarsFunction = function(barInfo, resolve) {
            Snap.animate(oldCircumference, newCircumference, gaugeBarAnimationFunction.bind(this, barInfo, resolve), animationDuration, animationEasing);
        };

        for (var key in bars) {
            if (bars.hasOwnProperty(key)) {
                var barInfo = bars[key];
                if (animated) {
                    promises.push(new Promise(gaugeRadiusFunction.bind(this, barInfo)));

                    promises.push(new Promise(gaugeBarsFunction.bind(this, barInfo)));
                } else {
                    this.mCircumference = newCircumference;
                    barInfo.bar.attr({
                        r: this.mGaugeRadius,
                        'stroke-dashoffset': (circumference * 0.25),
                        'stroke-dasharray': circumference * barInfo.currentValue + ' ' + circumference * (1.0 - barInfo.currentValue),
                    });
                }
            }
        }

        return Promise.all(promises);
    }

    return Promise.resolve(true);
};

/**
 * Creates and adds a bar to this gauge using the specified parameters.
 *
 * @method addBar
 * @param {String} id - A unique string to identify this bar.
 * @param {Number} progress - A number between 0 and 1 describing the percentage this bar should fill the gauge.
 * @param {String} color - The color of this bar.
 */
DataGauge.prototype.addBar = function (id, progress, color) {
    var circumference = this.mCircumference;
    var bar = new Node('circle', {cx: 0, cy: 0, r: this.mGaugeRadius});
    bar.attr({
        'pointer-events': 'none',
        'fill': 'transparent',
        'stroke': color,
        'stroke-width': this.mThickness - 2,
        'stroke-dasharray': '0 ' + circumference,
        'stroke-dashoffset': (circumference * 0.25),
    });

    var barsContainer = this.mBarsContainer;
    barsContainer.append(bar);

    var barsArray = this.mBarsArray;
    var progressOffset = 0;
    for (var i = 0, n = barsArray.length; i < n; ++i) {
        var otherBarInfo = barsArray[i];
        if (otherBarInfo) {
            otherBarInfo.index = i + 1;
            progressOffset += otherBarInfo.progress;
            barsContainer.append(otherBarInfo.bar);
        }
    }

    var barInfo = {
        id: id,
        index: 0,
        color: color,
        progress: progress,
        progressOffset: progressOffset,
        currentValue: 0,
        bar: bar,
        animation: null,
    };

    this.mBars[id] = barInfo;
    this.mBarsArray.unshift(barInfo);

    barInfo.animation = Snap.animate(0, progress + progressOffset,
        function(value) {
            barInfo.currentValue = value;
            bar.attr({'stroke-dasharray': circumference * value + ' ' + circumference * (1.0 - value)});
        },
        this.mOptions.config.transitionsDuration, mina.linear, function () {
            barInfo.animation = null;
        });
};

/**
 * Modifies the progress of the bar at the specified `id`
 *
 * @method updateBar
 * @param {String} id - The id of the bar to update
 * @param {Number} progress - A number between 0 and 1 describing the new progress of this bar.
 * @param {Boolean} animated - Describes if the value change should be animated or not.
 */
DataGauge.prototype.updateBar = function (id, progress, animated) {
    var barInfo = this.mBars[id];
    if (barInfo) {
        var i;
        var barsArray = this.mBarsArray;
        var progressOffset = 0;
        for (i = barsArray.length - 1; i > barInfo.index; --i) {
            var otherBarInfo = barsArray[i];
            if (otherBarInfo) {
                progressOffset += otherBarInfo.progress;
            }
        }
        if (progress !== barInfo.progress || progressOffset !== barInfo.progressOffset) {
            var bar = barInfo.bar;
            if (barInfo.animation) {
                barInfo.animation.stop();
            }

            if (animated) {
                barInfo.animation = Snap.animate(barInfo.currentValue, progress + progressOffset,
                    function (value) {
                        barInfo.currentValue = value;
                        bar.attr({'stroke-dasharray': this.mCircumference * value + ' ' + this.mCircumference * (1.0 - value)});
                    }.bind(this),
                    this.mOptions.config.transitionsDuration, mina.linear, function () {
                        barInfo.animation = null;
                    });
                barInfo.progress = progress;
                barInfo.progressOffset = progressOffset;
            } else {
                barInfo.progress = progress;
                barInfo.progressOffset = progressOffset;
                barInfo.currentValue = progress + progressOffset;
                bar.attr({'stroke-dasharray': this.mCircumference * barInfo.currentValue + ' ' + this.mCircumference * (1.0 - barInfo.currentValue)});
            }
        }

        if (barInfo.index > 0) {
            for (i = barInfo.index - 1; i >= 0; --i) {
                if (barsArray[i]) {
                    this.updateBar(barsArray[i].id, barsArray[i].progress, animated);
                    break;
                }
            }
        }
    }
};

/**
 * Removes the bar with the given id from the gauge.
 *
 * @method removeBar
 * @param {String} id - The id of the bar to remove.
 */
DataGauge.prototype.removeBar = function (id) {
    var barInfo = this.mBars[id];
    if (barInfo) {
        barInfo.bar.remove();
        this.mBarsArray[barInfo.index] = null;
        this.mBars[id] = null;
        delete this.mBars[id];
    }
};

/**
 * Removes all bars from the gauge.
 *
 * @method removeAllBars
 */
DataGauge.prototype.removeAllBars = function () {
    var bars = this.mBars;
    for (var key in bars) {
        if (bars.hasOwnProperty(key)) {
            bars[key].bar.remove();
            bars[key] = null;
            delete bars[key];
        }
    }
    this.mBarsArray.length = 0;
};

/**
 * Checks if the gauge currently contains a bar with the given Id.
 *
 * @method hasBarWithId
 * @param {String} id - The id of the bar to look for.
 * @returns {boolean}
 */
DataGauge.prototype.hasBarWithId = function (id) {
    return Boolean(this.mBars.hasOwnProperty(id) && this.mBars[id].bar);
};

/**
 * @export
 * @type {Gauge}
 */
module.exports = DataGauge;
