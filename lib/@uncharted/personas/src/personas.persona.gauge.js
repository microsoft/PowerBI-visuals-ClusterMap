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
    this.mBaseColor = baseColor;

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
 * The current progress of this gauge (how much of it is filled)
 *
 * @property progress
 * @type {number}
 * @readonly
 */
Object.defineProperty(DataGauge.prototype, 'progress', {
    get: function() {
        return this.progressToBar(-1); // all bars
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
        var separatorWidth = this.mOptions.config.gaugeSeparatorWidth;

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
            if (barInfo.separator) {
                barInfo.separator.animate({ r: this.mGaugeRadius }, animationDuration, animationEasing);
            }
        };

        var gaugeBarAnimationFunction = function(barInfo, resolve, value) {
            this.mCircumference = value;
            barInfo.bar.attr({'stroke-dashoffset': (value * 0.25), 'stroke-dasharray': value * barInfo.currentValue + ' ' + value * (1.0 - barInfo.currentValue)});
            if (barInfo.separator) {
                var offset = barInfo.currentValue + (barInfo.currentValue > 0 ? separatorWidth : 0);
                barInfo.separator.attr({'stroke-dashoffset': (value * 0.25), 'stroke-dasharray': value * (barInfo.currentValue + offset) + ' ' + value * (1.0 - (barInfo.currentValue + offset))});
            }
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
                    if (barInfo.separator) {
                        var offset = barInfo.currentValue + (barInfo.currentValue > 0 ? separatorWidth : 0);
                        barInfo.separator.attr({
                            r: this.mGaugeRadius,
                            'stroke-dashoffset': (circumference * 0.25),
                            'stroke-dasharray': circumference * (barInfo.currentValue + offset) + ' ' + circumference * (1.0 - (barInfo.currentValue + offset)),
                        });
                    }
                }
            }
        }

        return Promise.all(promises);
    }

    return Promise.resolve(true);
};

/**
 * Computes the progress of this gauge up to the bar specified by its id or index in the bars array.
 *
 * @method progressToBar
 * @param {String|Number} idOrIndex - The id or index of the bar to compute the progress.
 * @returns {Number}
 */
DataGauge.prototype.progressToBar = function (idOrIndex) {
    var barIndex = parseInt(idOrIndex, 10);
    if (isNaN(barIndex)) {
        if (!this.hasBarWithId(idOrIndex)) {
            return 0;
        }
        barIndex = this.mBars[idOrIndex].index;
    }

    var barsArray = this.mBarsArray;
    var progress = 0;
    for (var i = barsArray.length - 1; i > barIndex; --i) {
        var otherBarInfo = barsArray[i];
        if (otherBarInfo) {
            progress += otherBarInfo.progress;
        }
    }

    return progress;
};

/**
 * Creates and adds a bar to this gauge using the specified parameters.
 *
 * @method addBar
 * @param {String} id - A unique string to identify this bar.
 * @param {Number} progress - A number between 0 and 1 describing the percentage this bar should fill the gauge.
 * @param {String} color - The color of this bar.
 * @param {Number=} animationStart - If defined, the new bar starts animating from the given point in the gauge.
 */
DataGauge.prototype.addBar = function (id, progress, color, animationStart) {
    var circumference = this.mCircumference;

    var separator = null;

    if (this.mOptions.config.renderGaugeSeparators) {
        separator = new Node('circle', {cx: 0, cy: 0, r: this.mGaugeRadius});
        separator.attr({
            'pointer-events': 'none',
            'fill': 'transparent',
            'stroke': this.mBaseColor,
            'stroke-width': this.mThickness - 2,
            'stroke-dasharray': '0 ' + circumference,
            'stroke-dashoffset': (circumference * 0.25),
        });
    }

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
    if (separator) {
        barsContainer.append(separator);
    }
    barsContainer.append(bar);

    var barsArray = this.mBarsArray;
    var progressOffset = 0;
    for (var i = 0, n = barsArray.length; i < n; ++i) {
        var otherBarInfo = barsArray[i];
        if (otherBarInfo) {
            otherBarInfo.index = i + 1;
            progressOffset += otherBarInfo.progress;
            if (otherBarInfo.separator) {
                barsContainer.append(otherBarInfo.separator);
            }
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
        separator: separator,
        animation: null,
    };

    this.mBars[id] = barInfo;
    this.mBarsArray.unshift(barInfo);

    var separatorWidth = this.mOptions.config.gaugeSeparatorWidth;
    var startProgress = parseFloat(animationStart);
    startProgress = isNaN(startProgress) ? 0 : startProgress;
    barInfo.animation = Snap.animate(startProgress, progress + progressOffset,
        function(value) {
            barInfo.currentValue = value;
            bar.attr({'stroke-dasharray': circumference * value + ' ' + circumference * (1.0 - value)});
            if (separator) {
                var offset = value + (value > 0 ? separatorWidth : 0);
                separator.attr({'stroke-dasharray': (circumference * offset) + ' ' + circumference * (1.0 - offset)});
            }
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
 * @param {String} color - The color of this bar.
 * @param {Boolean=} animated - Describes if the value change should be animated or not.
 * @param {Function=} callback - A function to be called when the update has completed.
 */
DataGauge.prototype.updateBar = function (id, progress, color, animated, callback) {
    var barInfo = this.mBars[id];
    if (barInfo) {
        var i;
        var barsArray = this.mBarsArray;
        var progressOffset = this.progressToBar(barInfo.index);

        /* get the current color and new color's components */
        var currentColor = this._parseColor(getComputedStyle(barInfo.bar.node).stroke);
        var newColor = this._parseColor(color);

        if (progress !== barInfo.progress ||
            progressOffset !== barInfo.progressOffset ||
            currentColor.r !== newColor.r ||
            currentColor.g !== newColor.g ||
            currentColor.b !== newColor.b ||
            currentColor.a !== newColor.a) {
            var bar = barInfo.bar;
            if (barInfo.animation) {
                barInfo.animation.stop();
            }

            var separator = barInfo.separator;
            var separatorWidth = this.mOptions.config.gaugeSeparatorWidth;

            if (animated) {
                /* compute the color difference */
                var colorDifference = {
                    r: newColor.r - currentColor.r,
                    g: newColor.g - currentColor.g,
                    b: newColor.b - currentColor.b,
                    a: newColor.a - currentColor.a,
                };

                /* save the current value and compute the value change */
                var currentValue = barInfo.currentValue;
                var valueChange = (progress + progressOffset) - currentValue;

                barInfo.animation = Snap.animate(0, 1,
                    function (delta) {
                        var animatedColor = 'rgba(' +
                                            (currentColor.r + (colorDifference.r * delta)) + ',' +
                                            (currentColor.g + (colorDifference.g * delta)) + ',' +
                                            (currentColor.b + (colorDifference.b * delta)) + ',' +
                                            (currentColor.a + (colorDifference.a * delta)) + ')';
                        var value = currentValue + (valueChange * delta);
                        barInfo.currentValue = value;
                        bar.attr({'stroke-dasharray': this.mCircumference * value + ' ' + this.mCircumference * (1.0 - value), 'stroke': animatedColor});
                        if (separator) {
                            value += value > 0 ? separatorWidth : 0;
                            separator.attr({'stroke-dasharray': (this.mCircumference * value) + ' ' + this.mCircumference * (1.0 - value)});
                        }
                    }.bind(this),
                    this.mOptions.config.transitionsDuration, mina.linear, function () {
                        barInfo.animation = null;
                        if (callback) {
                            /* eslint-disable */
                            callback();
                            /* eslint-enable */
                        }
                    });
            } else {
                barInfo.progress = progress;
                barInfo.progressOffset = progressOffset;
                barInfo.currentValue = progress + progressOffset;
                bar.attr({'stroke-dasharray': this.mCircumference * barInfo.currentValue + ' ' + this.mCircumference * (1.0 - barInfo.currentValue), 'stroke': color});
                if (separator) {
                    var offset = barInfo.currentValue + (barInfo.currentValue > 0 ? separatorWidth : 0);
                    separator.attr({'stroke-dasharray': this.mCircumference * (barInfo.currentValue + offset) + ' ' + this.mCircumference * (1.0 - (barInfo.currentValue + offset))});
                }
                if (callback) {
                    /* eslint-disable */
                    callback();
                    /* eslint-enable */
                }
            }

            barInfo.progress = progress;
            barInfo.progressOffset = progressOffset;
            barInfo.color = color;
        }

        if (barInfo.index > 0) {
            for (i = barInfo.index - 1; i >= 0; --i) {
                if (barsArray[i]) {
                    this.updateBar(barsArray[i].id, barsArray[i].progress, barsArray[i].color, animated);
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
 * @param {boolean=} animated - Should the bar be animated while it is being removed.
 */
DataGauge.prototype.removeBar = function (id, animated) {
    var barInfo = this.mBars[id];
    if (barInfo) {
        var i;
        var n;
        var barsArray = this.mBarsArray;

        if (animated) {
            var progressOffset = this.progressToBar(barInfo.index);
            this.updateBar(id, -progressOffset, barInfo.color, true, function() {
                barInfo.bar.remove();
                if (barInfo.separator) {
                    barInfo.separator.remove();
                }
            });
        } else {
            barInfo.bar.remove();
            if (barInfo.separator) {
                barInfo.separator.remove();
            }
        }

        for (i = barInfo.index + 1, n = barsArray.length; i < n; ++i) {
            barsArray[i].index = i - 1;
        }
        barsArray.splice(barInfo.index, 1);
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
 * Changes the ID of the specified bar. Returns true if the ID was successfully changed, false otherwise.
 *
 * @param {String} oldId - The current ID of the bar.
 * @param {String} newId - The new ID of the bar.
 * @param {boolean} force - If there's a bar holding the new ID, such bar's ID get's changed to a random ID to accomodate the change.
 * @returns {boolean}
 */
DataGauge.prototype.changeBarId = function (oldId, newId, force) {
    if (this.hasBarWithId(oldId)) {
        if (this.hasBarWithId(newId)) {
            if (force) {
                var forcedId = newId + '_old';
                while (!this.changeBarId(newId, forcedId, false)) {
                    forcedId += '_old';
                }
            } else {
                return false;
            }
        }

        this.mBars[newId] = this.mBars[oldId];
        this.mBars[newId].id = newId;
        delete this.mBars[oldId];
        return true;
    }
    return false;
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
 * Parses a color string into an object containing the rgba color components as number properties.
 * NOTE: Requires a modern browser that can convert a color style to rgb format.
 *
 * @method _parseColor
 * @param {String} color - The color string to parse.
 * @returns {{r: Number, g: Number, b: Number, a: Number}}
 * @private
 */
DataGauge.prototype._parseColor = function (color) {
    /* first try the `rgb` or `rgba` variants */
    if (color.indexOf('rgb(') === 0) {
        return this._parseRGBAComponents(color.substr(4, color.indexOf(')')));
    } else if (color.indexOf('rgba(') === 0) {
        return this._parseRGBAComponents(color.substr(5, color.indexOf(')')));
    }
    /* if not an rgb formatted string, convert it to one using the browser */
    var div = document.createElement('div');
    div.style.color = color;
    if (div.style.color.indexOf('rgb') === 0) {
        return this._parseColor(div.style.color);
    }

    var computedColor = getComputedStyle(div).color;
    if (computedColor.indexOf('rgb') === 0) {
        return this._parseColor(computedColor);
    }

    /* modern browsers should never get here */
    /* console.log('WARNING (personas.persona.gauge): Cannot parse color ' + color); */
    return {
        r: 255,
        g: 255,
        b: 0,
        a: 1,
    };
};

/**
 * Parses the color components of a comma separated string assuming the order 'R, G, B, A'
 *
 * @method _parseRGBAComponents
 * @param {String} color - The color component string to parse in format 'R, G, B, A' (the alpha channel is optional)
 * @returns {{r: Number, g: Number, b: Number, a: Number}}
 * @private
 */
DataGauge.prototype._parseRGBAComponents = function (color) {
    var components = color.split(',');
    return {
        r: parseInt(components[0], 10),
        g: parseInt(components[1], 10),
        b: parseInt(components[2], 10),
        a: (components.length >= 4) ? parseFloat(components[3]) : 1.0,
    };
};

/**
 * @export
 * @type {Gauge}
 */
module.exports = DataGauge;
