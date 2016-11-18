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
var _ = require('underscore');
var Snap = require('snapsvg');
var Node = require('./personas.core.node.js');
var Avatar = require('./personas.persona.avatar.js');
var Gauge = require('./personas.persona.gauge.js');
var Label = require('./personas.persona.label.js');
var Events = require('./personas.defaults').Persona.events;
var EventTracker = require('./personas.core.eventTracker');
var Point2D = require('./personas.core.point2d.js');
var Vector2D = require('./personas.core.vector2d.js');
var Promise = require('bluebird');

/**
 * This class represents a persona graphically.
 *
 * @class Persona
 * @param {Number} size - The size, in pixels, of this persona.
 * @param {Object} data - An object containing the data that this persona should present.
 * @param {Object} iconMap - The processed icon map to look for colors in.
 * @param {Object} globalConfig - Global configuration object.
 * @param {Object=} entityRefs - An object containing the entity references table.
 * @constructor
 */
function Persona(size, data, iconMap, globalConfig, entityRefs) {
    /* inheritance */
    Node.call(this);

    /* member variables */
    this.mConfig = globalConfig;
    this.mPersonaOptions = this.mConfig.Persona;
    this.mParent = null;
    this.mEventCenter = globalConfig.eventCenter;
    this.mEventTracker = new EventTracker(this.mEventCenter);
    this.mSize = size;
    this.mRadius = size * 0.5;
    this.mBorder = this.mPersonaOptions.layout.selectedBorder;
    this.mRadiusNoBorder = this.mRadius - this.mBorder;
    this.mData = data;
    this.mIsSelected = false;
    this.mDrag = new Point2D();
    this.mDragging = false;
    this.mCanDrag = false;
    this.mMergeEnabled = this.mPersonaOptions.config.mergeEnabled;
    this.mMoveEnabled = this.mPersonaOptions.config.moveEnabled;
    this.mMergeCandidates = [];
    this.mAnimationDurationBase = this.mPersonaOptions.config.animationsDurationBase;
    this.mMergeOverlapRatio = this.mPersonaOptions.config.mergeOverlapRatio;
    this.mMergeScaleRatio = this.mPersonaOptions.config.mergeScaleRatio;
    this.mShouldPopIn = false;
    this.mAppendedGauges = [];
    this.mInVisualFocus = true;
    this.mVisualFocusFilter = null;
    this.mVisualFocusAnimation = null;
    this.mMutationObserver = null;
    this.mEntityRefs = entityRefs;

    /* sub selection visual effects */
    this.mVisualFocusEffectEnabled = this.mPersonaOptions.config.subSelectEffectEnabled;
    /* backwards compatibility */
    if ('subSelect' in this.mPersonaOptions.config) {
        this.mVisualFocusEffectEnabled = Boolean(this.mPersonaOptions.config.subSelect.blur) || Boolean(this.mPersonaOptions.config.subSelect.gray);
    }
    this.mVisualFocusGrayScaleAmount = 0.85;
    this.mVisualFocusOpacityAmount = 0.3;

    /* horrible Edge hack */
    /* eslint-disable */
    /* TODO: remove once Edge fixes its `innerHTML` implementation */
    /* eslint-enable */
    this.mIsEdge = ('msTouchSelect' in document.body.style) && !('msTouchAction' in document.body.style);

    /* initialization */
    this.mContainer = new Node();
    this.append(this.mContainer);

    this.mBackground = new Node('circle', {x: 0, y: 0, r: this.mRadiusNoBorder});
    this.mContainer.append(this.mBackground);
    this.isSelected = this.mIsSelected;

    /* extra gauges should be added behind existing gauges */
    this.mAppendedGaugesContainer = new Node();
    this.mContainer.append(this.mAppendedGaugesContainer);

    /* create the gauge */
    this.mGauge = new Gauge(this.mRadiusNoBorder, this.mPersonaOptions.layout.progressHeight, this.mPersonaOptions.pie.baseColor, this.mPersonaOptions);
    this.initializeGauge(this.mGauge, data.properties, data.totalCount, iconMap, entityRefs);
    this.mContainer.append(this.mGauge);

    /* create the avatar */
    var backgroundColor;
    if (this.mPersonaOptions.config.autoGenerateFallbackColors && data.primaryProperty && data.primaryProperty.color) {
        backgroundColor = data.primaryProperty.color;
    } else {
        backgroundColor = this.mPersonaOptions.config.fallbackBackgroundColor;
    }
    this.mAvatar = new Avatar(data.imageUrl, Math.ceil(this.mRadiusNoBorder - this.mPersonaOptions.layout.progressHeight), backgroundColor);
    this.mContainer.append(this.mAvatar);

    /* create the label */
    this.mLabel = new Label(data.relevantName, data.formattedRelevantCount || data.relevantCount, data.formattedTotalCount || data.totalCount, this.mPersonaOptions, size * 1.1);
    this.mContainer.append(this.mLabel);

    /* create an invisible circle on top of everything wich will receive all the mouse events */
    this.mEventReceiver = new Node('circle', {x: 0, y: 0, r: this.mRadius});
    this.mEventReceiver.attr({
        'fill': 'transparent',
    });
    this.append(this.mEventReceiver);

    /* finally, register the events */
    this.registerEvents();
}

/* inheritance */
Persona.prototype = Object.create(Node.prototype);
Persona.prototype.constructor = Persona;

/**
 * If this object was added to an 'Orbit' this property will return such object.
 *
 * @property parent
 * @type {Orbit}
 * @readonly
 */
Object.defineProperty(Persona.prototype, 'parentNode', {
    get: function() {
        return this.mParent;
    },
});

/**
 * The radius of this persona.
 *
 * @property radius
 * @type {Number}
 */
Object.defineProperty(Persona.prototype, 'radius', {
    get: function() {
        return this.mRadius;
    },

    set: function(val) {
        this.setRadius(val, false);
    },
});

/**
 * The size (or diameter) of this persona.
 *
 * @property size
 * @type {Number}
 */
Object.defineProperty(Persona.prototype, 'size', {
    get: function() {
        return this.mSize;
    },

    set: function(val) {
        this.setRadius(val * 0.5, false);
    },
});

/**
 * Describes if this persona has been selected.
 *
 * @property isSelected
 * @type {Boolean}
 */
Object.defineProperty(Persona.prototype, 'isSelected', {
    get: function() {
        return this.mIsSelected;
    },

    set: function(value) {
        this.mIsSelected = value;
        this.mBackground.toggleClass('selected', value);
        this.mBackground.toggleClass('unselected', !value);
    },
});

/**
 * Returns this persona's data if it was set.
 *
 * @property data
 * @type {Object}
 * @readonly
 */
Object.defineProperty(Persona.prototype, 'data', {
    get: function() {
        return this.mData;
    },
});

/**
 * Returns this persona's id if it has been set.
 *
 * @property personaId
 * @type {String}
 * @readonly
 */
Object.defineProperty(Persona.prototype, 'personaId', {
    get: function() {
        if (this.mData) {
            return this.mData.id;
        }
        return null;
    },
});

/**
 * Returns if this persona has appended gauges.
 *
 * @property hasAppendedGauges
 * @type {Boolean}
 * @readonly
 */
Object.defineProperty(Persona.prototype, 'hasAppendedGauges', {
    get: function() {
        return Boolean(this.mAppendedGauges.length);
    },
});

Object.defineProperty(Persona.prototype, 'gauge', {
    get: function() {
        return this.mGauge;
    },
});

/**
 * Sets the visual focus of this persona.
 *
 * @property inVisualFocus
 * @type {Boolean}
 */
Object.defineProperty(Persona.prototype, 'inVisualFocus', {
    get: function() {
        return this.mInVisualFocus;
    },

    set: function(value) {
        if (value !== this.mInVisualFocus) {
            this.mInVisualFocus = value;

            if (this.mVisualFocusAnimation) {
                this.mVisualFocusAnimation.stop();
                this.mVisualFocusAnimation = null;
            }

            if (value) {
                this._applyVisualFilter(1);
                this.mVisualFocusAnimation = Snap.animate(1, 0, function(currentValue) {
                    this._applyVisualFilter(currentValue);
                }.bind(this), this.mPersonaOptions.config.transitionsDuration, mina.easeinout, function() {
                    this._applyVisualFilter(0);
                    this.mVisualFocusAnimation = null;
                }.bind(this));
            } else {
                this._applyVisualFilter(0);
                this.mVisualFocusAnimation = Snap.animate(0, 1, function(currentValue) {
                    this._applyVisualFilter(currentValue);
                }.bind(this), this.mPersonaOptions.config.transitionsDuration, mina.easeinout, function() {
                    this.mVisualFocusAnimation = null;
                }.bind(this));
            }
        }
    },
});

/**
 * Utility function to change the radius of this persona. Can be animated.
 *
 * @method setRadius
 * @param {Number} newRadius - The new radius for this persona.
 * @param {Boolean} animated - Should the radius change be animated.
 */
Persona.prototype.setRadius = function(newRadius, animated) {
    if (newRadius !== this.mRadius) {
        this.mRadius = newRadius;
        this.mSize = (newRadius * 2);
        this.mRadiusNoBorder = this.mRadius - this.mBorder;
        this.mEventReceiver.attr({r: newRadius});
        if (animated) {
            this.mBackground.animate({r: this.mRadiusNoBorder}, this.mPersonaOptions.config.transitionsDuration, mina.easeinout);
        } else {
            this.mBackground.attr({r: this.mRadiusNoBorder});
        }

        this.mGauge.setRadius(this.mRadiusNoBorder, animated);
        this.mAvatar.setRadius(Math.ceil(this.mRadiusNoBorder - this.mPersonaOptions.layout.progressHeight), animated);

        var appendedGauges = this.mAppendedGauges;
        for (var i = 0, n = appendedGauges.length; i < n; ++i) {
            appendedGauges[i].setRadius(this.mRadiusNoBorder + (this.mPersonaOptions.layout.progressHeight * (i + 1)), animated);
        }
    }
};

/**
 * Computes a number hash from any string.
 *
 * @param {String} string - The string to compute the hash from.
 * @returns {number}
 */
Persona.prototype.simpleStringHash = function(string) {
    var hash = 0;
    for (var i = 0; i < string.length; i++) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
};

/**
 * Generates a color from the passed string. Can clamp the resulting numbers for more control.
 *
 * @param {String} string - The string to generate the color from.
 * @param {Number=} min - (0 - 255 or 0x00 to 0xff) If passed, the red, green and blue values will be at least this number.
 * @param {Number=} max - (0 - 255 or 0x00 to 0xff) If passed, the red, green and blue values will be at most this number.
 * @returns {string}
 */
Persona.prototype.colorFromName = function(string, min, max) {
    var hash = this.simpleStringHash(string);
    var color32bit = (hash & 0xFFFFFF);
    var r = (color32bit >> 16) & 255;
    var g = (color32bit >> 8) & 255;
    var b = color32bit & 255;

    /* clamp the colors */
    if (min !== undefined) {
        r = Math.max(r, min);
        g = Math.max(g, min);
        b = Math.max(b, min);
    }

    if (max !== undefined) {
        r = Math.min(r, max);
        g = Math.min(g, max);
        b = Math.min(b, max);
    }

    return '#' + r.toString(16) + g.toString(16) + b.toString(16);
};

/**
 * Utility function to initialize the given `gauge` with the given `properties` in respect to the `totalCount`
 *
 * @method initializeGauge
 * @param {Gauge} gauge - The gauge to initialize.
 * @param {Object} properties - An object containing the properties to add to the gauge.
 * @param {Number} totalCount - The total count of documents of the persona that owns the gauge.
 * @param {Object} iconMap - The processed icon map to look for colors in.
 * @param {Object} entityRefs - An object containing all the entities that could be referenced in the iconMap.
 */
Persona.prototype.initializeGauge = function(gauge, properties, totalCount, iconMap, entityRefs) {
    // add a bar to the gauge for each property
    for (var i = 0, n = properties.length; i < n; ++i) {
        var property = properties[i];
        if (property.isPrimary || (property.count / totalCount) >= this.mPersonaOptions.pie.minimumDisplayRatio) {
            var propertyId = (property.entityRefId || property.value).toString();
            var color = null;
            if (property.entityRefId) {
                if (iconMap.icons[property.entityRefId]) {
                    color = iconMap.icons[property.entityRefId];
                } else if (iconMap.defaults[entityRefs[property.entityRefId].type]) {
                    color = iconMap.defaults[entityRefs[property.entityRefId].type];
                }
            }

            if (!color) {
                if (property.color) {
                    color = property.color;
                } else {
                    if (this.mPersonaOptions.config.autoGenerateFallbackColors) {
                        var colorString = entityRefs[property.entityRefId].type + entityRefs[property.entityRefId].name + propertyId;
                        color = this.colorFromName(colorString, this.mPersonaOptions.config.autoColorClampMin, this.mPersonaOptions.config.autoColorClampMax);
                    } else {
                        color = iconMap.fallbackColor;
                    }
                    property.color = color;
                }
            }

            gauge.addBar(propertyId, property.count / totalCount, color);
        }
    }
};

/**
 * Appends an extra gauge at the outside of the persona with the specified bars.
 * NOTE: Gauges can be stacked.
 *
 * @method appendGauge
 * @param {Array} bars - An array containing objects in the format { color:String, percent:Number }.
 */
Persona.prototype.appendGauge = function(bars) {
    var i;
    var n;
    var gauge = new Gauge(this.mRadiusNoBorder + (this.mPersonaOptions.layout.progressHeight * this.mAppendedGauges.length), this.mPersonaOptions.layout.progressHeight, this.mPersonaOptions.pie.baseColor, this.mPersonaOptions);

    for (i = 0, n = bars.length; i < n; ++i) {
        var bar = bars[i];
        var barId = gauge.mBarsArray.length.toString();
        gauge.addBar(barId, 0, bar.color);
        gauge.updateBar(barId, bar.percent, bar.color, true);
    }

    this.mAppendedGaugesContainer.append(gauge);
    var appendedGauges = this.mAppendedGauges;
    for (i = appendedGauges.length - 1; i >= 0; --i) {
        this.mAppendedGaugesContainer.append(appendedGauges[i]);
    }

    this.mAppendedGauges.push(gauge);

    gauge.setRadius(this.mRadiusNoBorder + (this.mPersonaOptions.layout.progressHeight * this.mAppendedGauges.length), true, {
        duration: this.mPersonaOptions.config.transitionsDuration * 0.8,
        easing: mina.backout,
    });
};

/**
 * Removes all the currently appended gauges.
 *
 * @method removeAllAppendedGauges
 */
Persona.prototype.removeAllAppendedGauges = function() {
    var promises = [];
    var removedGauges = [];
    var appendedGauges = this.mAppendedGauges;
    while (appendedGauges.length) {
        var gauge = appendedGauges.pop();
        promises.push(gauge.setRadius(this.mRadiusNoBorder, true, {
            duration: this.mPersonaOptions.config.transitionsDuration * 0.6,
            easing: mina.backin,
        }));
        removedGauges.push(gauge);
    }

    Promise.all(promises).then(function() {
        while (removedGauges.length) {
            removedGauges.pop().remove();
        }
    });
};

/**
 * Updates the data of this persona, each of its graphical elements gets updated to reflect the new data passed.
 *
 * @method updateData
 * @param {Number} size - The new size of this persona.
 * @param {Object} data - The new data to update this persona with.
 * @param {Object} iconMap - The processed icon map to look for colors in.
 * @param {Object} entityRefs - An object containing the entity references table.
 */
Persona.prototype.updateData = function(size, data, iconMap, entityRefs) {
    this.updateGauge(data, iconMap, entityRefs);
    this.updateLabel(data, size);

    if (size !== this.mSize) {
        this.setRadius(size * 0.5, true);
    }

    this.updateAvatar(data.imageUrl);
};

/**
 * Updates the gauge of this persona.
 *
 * @method updateGauge
 * @param {Object} data - The new data.
 * @param {Object} iconMap - The processed icon map to look for colors in.
 * @param {Object} entityRefs - An object containing the entity references table.
 */
Persona.prototype.updateGauge = function(data, iconMap, entityRefs) {
    var gauge = this.mGauge;
    if (gauge) {
        var properties = data.properties;
        var totalCount = data.totalCount;
        var currentProgress = gauge.progress;

        // add a bar to the gauge for each property
        for (var i = 0, n = properties.length; i < n; ++i) {
            var property = properties[i];
            var propertyId = (property.entityRefId || property.value);

            var color = null;
            if (property.entityRefId) {
                if (iconMap.icons[property.entityRefId]) {
                    color = iconMap.icons[property.entityRefId];
                } else if (iconMap.defaults[entityRefs[property.entityRefId].type]) {
                    color = iconMap.defaults[entityRefs[property.entityRefId].type];
                }
            }

            if (!color) {
                if (property.color) {
                    color = property.color;
                } else {
                    if (this.mPersonaOptions.config.autoGenerateFallbackColors) {
                        var colorString = entityRefs[property.entityRefId].type + entityRefs[property.entityRefId].name + propertyId;
                        color = this.colorFromName(colorString, this.mPersonaOptions.config.autoColorClampMin, this.mPersonaOptions.config.autoColorClampMax);
                    } else {
                        color = iconMap.fallbackColor;
                    }
                    property.color = color;
                }
            }

            if (gauge.hasBarWithId(propertyId)) {
                gauge.updateBar(propertyId, property.count / totalCount, color, true);
            } else {
                gauge.addBar(propertyId, property.count / totalCount, color, currentProgress);
            }
        }
    }
};

/**
 * Replaces this persona's gauge bars with new bars.
 *
 * @method replaceGaugeBars
 * @param {Object} data - The new data.
 * @param {Object} iconMap - The processed icon map to look for colors in.
 */
Persona.prototype.replaceGaugeBars = function(data, iconMap) {
    var gauge = this.gauge;
    var properties = data.properties;
    var barsArray = gauge.mBarsArray;

    while (barsArray.length > properties.length) {
        gauge.removeBar(barsArray[barsArray.length - 1].id, true);
    }

    var barsIndices = barsArray.length - 1;
    for (var i = barsIndices; i >= 0; --i) {
        var property = properties[barsIndices - i];
        var propertyId = (property.entityRefId || property.value);
        gauge.changeBarId(barsArray[i].id, propertyId);
    }

    this.updateGauge(data, iconMap, this.mEntityRefs);
};

/**
 * Updates this persona's avatar.
 *
 * @method updateAvatar
 * @param {String|Array} imageUrl - The URL or an array of URLs to load the avatar images from.
 */
Persona.prototype.updateAvatar = function(imageUrl) {
    var avatar = this.mAvatar;
    var loadedURLs = avatar.imageURLs;
    var urls = [];
    var i;
    var n;

    /* populate the URLs array */
    if (imageUrl instanceof Array) {
        Array.prototype.push.apply(urls, imageUrl);
    } else {
        urls.push(imageUrl);
    }

    var needsReload = (urls.length !== loadedURLs.length);
    if (!needsReload) {
        for (i = 0, n = urls.length; i < n; ++i) {
            if (!_.contains(loadedURLs, urls[i])) {
                needsReload = true;
                break;
            }
        }
    }

    if (needsReload) {
        /* do the reload */
        var loadedImages = avatar.images;
        if (loadedImages) {
            for (i = 0, n = loadedImages.length; i < n; ++i) {
                loadedImages[i].remove();
            }
            loadedImages.length = 0;
        }

        loadedURLs.length = 0;

        Array.prototype.push.apply(loadedURLs, urls);

        avatar.loadImages(avatar.imageContainer, avatar.imageRadius, urls);
    }
};

/**
 * Updates this persona's label with the specified `data`.
 *
 * @method updateLabel
 * @param {Object} data - The new data.
 * @param {Number} size - The nwe size of this persona.
 */
Persona.prototype.updateLabel = function(data, size) {
    if (this.mLabel) {
        var label = this.mLabel;
        if (data.relevantName !== label.name) {
            label.name = data.relevantName;
        }

        if (data.relevantCount.toString() !== label.count) {
            label.count = data.relevantCount;
        }

        if (data.totalCount.toString() !== label.totalCount) {
            label.totalCount = data.totalCount;
        }

        if (label.maxNameWidth !== (size * 1.1)) {
            label.maxNameWidth = (size * 1.1);
        }
    } else {
        this.mLabel = new Label(data.relevantName, data.relevantCount, data.totalCount, this.mPersonaOptions, size * 1.1);
        this.mContainer.append(this.mLabel);
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
Persona.prototype.animatePosition = function(position, newPosition, time, ease) {
    var matrix = this.transform().localMatrix;
    matrix.e = newPosition.x;
    matrix.f = newPosition.y;

    this.stop();
    this.animate({transform: matrix}, time, ease, function() {
        /* WARNING: HACK! */
        var oldCallback = position.changedCallback;
        position.changedCallback = null;
        position.set(newPosition.x, newPosition.y);
        position.changedCallback = oldCallback;
    });
};

/**
 * Brings this persona to the front of the rendering graph, so it seems to be on top of all the other personas.
 *
 * @method bringToFront
 */
Persona.prototype.bringToFront = function() {
    var parent = this.parentNode;
    if (parent) {
        parent.append(this);
        var parentParent = parent.parentNode;
        while (parentParent) {
            parentParent.append(parent);
            parent = parentParent;
            parentParent = parent.parentNode;
        }
    } else {
        this.parent().append(this);
    }
};

/**
 * Utility function used to create a `pop in` animation for this persona.
 * NOTE: This function should always be called before the persona is added to the paper for the very first time.
 * Otherwise behaviour is undefined.
 *
 * @method popIn
 */
Persona.prototype.popIn = function() {
    this.mContainer.attr({display: 'none'});
    this.mShouldPopIn = true;
};

/**
 * This function is called the first time the node is added to a paper. Used to initialize the layout because actual text
 * sizes are not computed until the text has been added to the paper.
 *
 * @method onEnter
 */
Persona.prototype.onEnter = function() {
    if (this.mShouldPopIn) {
        this.mShouldPopIn = false;
        this.mContainer.attr({display: 'block'});
        this.mContainer.scale = 0.1;
        this.mContainer.animate({transform: new Snap.Matrix()}, this.mPersonaOptions.config.transitionsDuration, mina.backout);
    }

    /* if this persona was set to be out of visual focus before it was added to the paper, apply the filter */
    if (!this.mInVisualFocus) {
        this._applyVisualFilter(1);
    }
};

/**
 * Registers this persona to listen for the events that it needs to function.
 *
 * @method registerEvents
 */
Persona.prototype.registerEvents = function() {
    /* bind event handlers */
    var eventTracker = this.mEventTracker;
    eventTracker.registerEvent(Events.enableBlur, this.handleEnableBlur.bind(this));
    eventTracker.registerEvent(Events.repel, this.handleRepel.bind(this));
    if (this.mMergeEnabled) {
        eventTracker.registerEvent(Events.dragMoved, this.handleDragMovedMerge.bind(this));
    }

    /* mpuse down event */
    if (this.mMoveEnabled || this.mMergeEnabled) {
        this.mEventReceiver.mousedown(function (event) {
            event.preventDefault();
            event.stopPropagation();
        });
    }

    /* click */
    this.mEventReceiver.click(this.handleClick.bind(this));

    var publishHover = function(eventCenter, isHover, id) {
        return function() {
            eventCenter.publish(Events.hover, {
                id: id,
                hovered: isHover,
            });
        };
    };

    this.mEventReceiver.hover(
        publishHover(this.mEventCenter, true, this.mData.id),
        publishHover(this.mEventCenter, false, this.mData.id)
    );

    /* setup dragging */
    var t = this;
    if (this.mMoveEnabled || this.mMergeEnabled) {
        this.mEventReceiver.drag(this.handleDragMoved.bind(this),
            this.handleDragStarted.bind(this),
            function() {
                /* we just want to flush the event cache */
                setTimeout(function() {
                    t.handleDragEnded();
                }, 0);
            }
        );
    }

    /* eslint-disable */
    /* This is a horrible hack to fix edge SVG rendering issues */
    /* TODO: Remove once edge fixes its renderer. */
    /* eslint-enable */
    this.mMutationObserver = new MutationObserver(function() {
        this.mContainer.remove();
        this.prepend(this.mContainer);
    }.bind(this));
    this.mMutationObserver.observe(this.node, { attributes: true });
};

/**
 * Unregisters all the events registered in the `registerEvents` function.
 *
 * @method unregisterEvents
 */
Persona.prototype.unregisterEvents = function() {
    this.mEventTracker.unregisterAllEvents();
    this.mEventReceiver.unmousedown();
    this.mEventReceiver.unclick();
    this.mEventReceiver.unhover();
    this.mEventReceiver.undrag();

    /* eslint-disable */
    /* Unregister the horrible hack to fix edge SVG rendering issues */
    /* TODO: Remove once edge fixes its renderer. */
    /* eslint-enable */
    if (this.mMutationObserver) {
        this.mMutationObserver.disconnect();
        this.mMutationObserver = null;
    }
};

/**
 * Function to handle a mouse click on the persona.
 *
 * @method handleClick
 * @param {MouseEvent} event - The event that was triggered.
 */
Persona.prototype.handleClick = function(event) {
    if (event) {
        event.stopPropagation();
    }

    if (!this.mDragging && (!event || event.button === 0)) {
        var selected = !this.isSelected;
        this.isSelected = selected;
        /* bring to front */
        this.bringToFront();
        this.mEventCenter.publish(Events.select, {
            id: this.mData.id,
            selected: selected,
        });
    }
};

/**
 * Function to handle the `enableBlur` event.
 *
 * @param {Boolean} enabled - Should the blur effect be enabled.
 */
Persona.prototype.handleEnableBlur = function(enabled) {
    this.mAvatar.blurEnabled = enabled;
};

/**
 * Function to repel a persona based on a center point and a radius.
 * NOTE: It triggers the repel event to let other personas reposition themselves once this persona has moved.
 *
 * @method handleRepel
 * @param {Array} affected - an array containing the personas already processed by this method. Avoid infinite recursion.
 * @param {Point2D} repulsionCenter - The center point from which to calculate repulsion.
 * @param {Number} radius - The radius of the repulsion field.
 */
Persona.prototype.handleRepel = function(affected, repulsionCenter, radius) {
    /* eslint-disable */
    /* TODO: this solver is incredibly naive, if this functionality is needed, replace with a more robust solution */
    /* eslint-enable */
    if (affected.indexOf(this) < 0) {
        var vector = Vector2D.fromPoints(repulsionCenter, this.position);
        var minDistance = radius + this.radius;
        var minDistanceSQ = (minDistance * minDistance);
        var distanceSQ = vector.lengthSQ;
        if (distanceSQ < minDistanceSQ) {
            affected.push(this);
            var distance = vector.length;
            var offsetDistance = (minDistance - distance);
            var unitVector = new Vector2D(vector.x / distance, vector.y / distance);
            var finalOffsetX = offsetDistance * unitVector.x;
            var finalOffsetY = offsetDistance * unitVector.y;
            this.position.x += finalOffsetX;
            this.position.y += finalOffsetY;
            var thisCenter = this.position;
            var thisRadius = this.radius;
            var eventCenter = this.mEventCenter;
            setTimeout(function() {
                eventCenter.publish(Events.repel, affected, thisCenter, thisRadius);
            }, 0);
        }
    }
};

/**
 * Utility function to handle event when a drag is started.
 *
 * @method handleDragStarted
 */
Persona.prototype.handleDragStarted = function() {
    if (!arguments[2] || arguments[2].button === 0) {
        this.mCanDrag = true;
        this.mDragging = false;
        this.mDrag.set(this.position.x, this.position.y);

        /* trigger the drag started event */
        this.mEventCenter.publish(Events.dragStarted, this, {x: this.mDrag.x, y: this.mDrag.y}, this.radius);
    }
};

/**
 * Utility function to handle event when a drag is moved.
 *
 * @method handleDragMoved
 * @param {Number} dx - How far was the drag in the X axis.
 * @param {Number} dy - How far was the drag in the Y axis.
 */
Persona.prototype.handleDragMoved = function(dx, dy) {
    if (this.mCanDrag) {
        var transformation = this.transform().globalMatrix.split();
        var newX = this.mDrag.x + (dx / transformation.scalex);
        var newY = this.mDrag.y + (dy / transformation.scaley);
        if (!this.mDragging) {
            this.mDragging = true;
            this.mMergeCandidates.length = 0;
            /* bring to front */
            this.bringToFront();
        }

        var center = this.position;
        center.x = newX;
        center.y = newY;

        if (!this.mMergeEnabled && this.mMoveEnabled) {
            this.mEventCenter.publish(Events.repel, [this], center, this.radius);
        }

        /* trigger the drag moved event */
        this.mEventCenter.publish(Events.dragMoved, this, center, this.radius);
    }
};

/**
 * Utility function to handle event when a drag is ended.
 *
 * @method handleDragEnded
 */
Persona.prototype.handleDragEnded = function() {
    if (this.mDragging) {
        /* calculate the center */
        var center = this.position;

        if (this.mMergeCandidates.length) {
            this.merge(this.mMergeCandidates[0]);
        } else if (this.mMoveEnabled) {
            this.mEventCenter.publish(Events.repel, [this], center, this.radius);
        } else {
            this.animatePosition(this.position, this.mDrag, this.mAnimationDurationBase * 0.7, mina.easein);
        }

        this.mDragging = false;
        this.mMergeCandidates.length = 0;

        /* trigger the drag ended event */
        this.mEventCenter.publish(Events.dragEnded, this, center, this.radius);
    }

    this.mCanDrag = false;
};

/**
 * Utility function used to process the drag moved event triggered by other personas.
 *
 * @param {Persona} sender - The persona that triggered the event.
 * @param {Point2D} center - The center of the sender.
 * @param {Number} radius - Radius of the sender.
 */
Persona.prototype.handleDragMovedMerge = function(sender, center, radius) {
    if (this !== sender) {
        var candidates = sender.mMergeCandidates;
        var canMerge = this.canMerge(center, radius);
        var candidatesLength = candidates.length;
        if (!candidatesLength && canMerge) {
            candidates.push(this);
            this.highlightForMerge();
        } else if (candidatesLength && !canMerge && candidates[0] === this) {
            candidates.pop();
            this.unhiglightForMerge();
        }
    }
};

/**
 * Checks if a merge is available with a theoretical persona located at the specified center with the specified radius.
 *
 * @method canMerge
 * @param {Point2D} center - The x and y coordinates of the persona to be merged with.
 * @param {Number} radius - The radius of the persona to be merged with.
 * @returns {boolean}
 */
Persona.prototype.canMerge = function(center, radius) {
    /* calculate the distance between the personas */
    var position = this.position;
    var vector = Vector2D.fromPoints(center, position);
    var distanceSQ = vector.lengthSQ;
    var minDistance = radius + this.radius;
    var minDistanceSQ = Math.pow(minDistance, 2);

    if (distanceSQ < minDistanceSQ) {
        var mergeDistance = minDistance - (Math.min(radius, this.radius) * (1.0 - this.mMergeOverlapRatio));
        var distance = Math.sqrt(distanceSQ);
        return (distance < mergeDistance);
    }

    return false;
};

/**
 * Merges the current persona to the target.
 *
 * @method merge
 * @param {Persona} target - The target persona to which this persona will be merged with.
 */
Persona.prototype.merge = function(target) {
    /* unregister all events */
    this.invalidate();
    /* unhighlight the target */
    target.unhiglightForMerge();
    /* animate the merge */
    var matrix = Snap.matrix();
    matrix.e = target.position.x;
    matrix.f = target.position.y;
    matrix.scale(0);
    this.animate({transform: matrix}, this.mAnimationDurationBase * 2, mina.easein, function() {
        /* since a persona handles its own container, remove it from the DOM */
        this.remove();
        /* if the parent of this persona is set and it has an objects array, remove this persona from it */
        var parent = this.parentNode;
        if (parent && parent.removeObject) {
            parent.removeObject(this);
        }
        /* remove this graphical persona from the data */
        this.mData.graphicalPersona = null;
        /* trigger the merged event */
        this.mEventCenter.publish(Events.merged, this, target);
    }.bind(this));
};

/**
 * Highlights this persona as a possible target for a merge.
 *
 * @method highlightForMerge
 */
Persona.prototype.highlightForMerge = function() {
    if (!this.isSelected) {
        this.mBackground.toggleClass('selected', true);
        this.mBackground.toggleClass('unselected', false);
    }
    this.stop();
    var matrix = Snap.matrix();
    matrix.e = this.position.x;
    matrix.f = this.position.y;
    matrix.scale(this.mMergeScaleRatio);
    this.animate({transform: matrix}, this.mAnimationDurationBase * 1.5, mina.easein);
};

/**
 * Un-highlights this persona as a possible target for a merge.
 *
 * @method unhiglightForMerge
 */
Persona.prototype.unhiglightForMerge = function() {
    this.mBackground.toggleClass('selected', this.isSelected);
    this.mBackground.toggleClass('unselected', !this.isSelected);
    this.stop();
    var matrix = Snap.matrix();
    matrix.e = this.position.x;
    matrix.f = this.position.y;
    this.animate({transform: matrix}, this.mAnimationDurationBase, mina.easeout);
};

/**
 * Invalidates this object, once invalidated the object will no longer respond to interactions.
 *
 * @method invalidate
 */
Persona.prototype.invalidate = function() {
    this.unregisterEvents();
};

Persona.prototype._applyVisualFilter = function(amount) {
    if (this.mVisualFocusEffectEnabled) {
        if (!this.mVisualFocusFilter) {
            this.mVisualFocusFilter = this.paper.filter(Snap.filter.grayscale(this.mVisualFocusGrayScaleAmount));
            this.mVisualFocusFilter.attr({filterUnits: 'objectBoundingBox', x: '-0.1', y: '-0.1', width: '1.2', height: '1.2'});
        }

        if (!amount) {
            this.attr({opacity: 1, filter: null });
        } else {
            /* horrible Edge hack */
            /* eslint-disable */
            /* TODO: remove once Edge fixes its `innerHTML` implementation */
            /* eslint-enable */
            if (!this.mIsEdge) {
                this.mVisualFocusFilter.node.innerHTML = Snap.filter.grayscale(this.mVisualFocusGrayScaleAmount * amount);
            }
            var opacity = 1.0 - ((1.0 - this.mVisualFocusOpacityAmount) * amount);
            this.attr({opacity: opacity, filter: this.mVisualFocusFilter });
        }
    }
};

/**
 * @export
 * @type {Persona}
 */
module.exports = Persona;
