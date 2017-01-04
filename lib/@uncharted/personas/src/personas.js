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
var $ = require('jquery');
var Snap = require('snapsvg');
var Defaults = require('./personas.defaults');
var Viewport = require('./personas.layout.viewport.js');
var ZoomControls = require('./personas.layout.zoomControls.js');
var OrbitSystem = require('./personas.layout.orbitSystem.js');
var ColaSystem = require('./personas.layout.colaSystem.js');
var Persona = require('./personas.persona.js');
var Seed = require('./personas.persona.seed.js');
var Events = Defaults.Persona.events;
var EventTracker = require('./personas.core.eventTracker');
var EventCenter = require('./personas.core.eventCenter.js');
var Point2D = require('./personas.core.point2d.js');
var Node = require('./personas.core.node');

/**
 * Personas class used to create a personas view.
 *
 * @class Personas
 * @param { HTMLElement } element - SVG element where the personas will be drawn.
 * @param { Object | null } options - Optional configuration parameters contained in an object.
 * @constructor
 */
function Personas(element, options) {
    /* member variables */
    this.mConfig = $.extend(true, {}, Defaults, options, {eventCenter: new EventCenter()});
    this.mEventCenter = this.mConfig.eventCenter;
    this.mEventTracker = new EventTracker(this.mEventCenter);
    this.mElement = null;
    this.mPaper = null;
    this.mViewport = null;
    this.mLayoutSystemFactory = null;
    this.mLayoutSystemType = null;
    this.mLayoutSystem = null;
    this.mSortedData = null;
    this.mIconMap = this.processIconMap(this.mConfig);
    this.mOwnsSVG = false;
    this.mJQElement = $(element);
    this.mOtherPersona = null;
    this.mOtherPersonaFill = null;

    /* initialization */
    if (element instanceof SVGElement) {
        this.mElement = element;
        var elementClasses = element.getAttribute('class');
        // If personas class is not specified
        if (elementClasses && elementClasses.split(' ').indexOf('personas') < 0) {
            this.mElement.setAttribute('class', elementClasses + ' personas');
        } else if (!elementClasses) {
            this.mElement.setAttribute('class', 'personas');
        }
    } else {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns', 'http://www.w3.org/2000/svg');
        svg.setAttributeNS(null, 'version', '1.1');
        svg.setAttribute('width', element.getAttribute('width'));
        svg.setAttribute('height', element.getAttribute('height'));
        svg.setAttribute('class', 'personas');
        element.appendChild(svg);

        this.mElement = svg;
        this.mOwnsSVG = true;
    }

    /* eslint-disable */
    this.mPaper = Node.mixinTouch(Snap(this.mElement));
    /* eslint-enable */

    this.mViewport = new Viewport(this.mPaper, this.mConfig);
    this.mPaper.append(this.mViewport);

    this.mZoomControls = new ZoomControls(
        this.mConfig,
        function() {
            this.mViewport.zoom((this.mViewport.zoomAmount * 0.3), this.mViewport.center, true);
        }.bind(this),
        function() {
            this.mViewport.zoom(-(this.mViewport.zoomAmount * 0.3), this.mViewport.center, true);
        }.bind(this),
        function() {
            this.autoZoom();
            /* publish that there was a zoom update from user interaction for any handlers hooked in */
            this.mEventCenter.publish(Events.zoomUpdateFromUser, this.zoom);
        }.bind(this)
    );
    this.mZoomControls.position.set(this.mJQElement.width() - this.mZoomControls.width - 20, 20);
    this.mPaper.append(this.mZoomControls);

    this.registerEvents();

    /* after all has been created, hook up the resizing event */
    this.mElementWidth = this.mJQElement.width();
    this.mElementHeight = this.mJQElement.height();

    /* initialize the layout system factory based on the configuration */
    this.layoutSystemType = this.mConfig.Persona.layout.systemtype;

    if (this.mConfig.Persona.config.registerWindowResize) {
        /* the resize event could occur too often, so throttle it */
        var resizeFunction = (function() {
            var timeout = null;
            return function() {
                if (!timeout) {
                    timeout = setTimeout(function() {
                        this.resize();
                        timeout = null;
                    }.bind(this), 100); // 10 times per second
                }
            }.bind(this);
        }.bind(this))();

        window.addEventListener('resize', resizeFunction, false);
    }
}

/**
 * The current zoom amount of the component.
 *
 * @property zoom
 * @type {Number}
 */
Object.defineProperty(Personas.prototype, 'zoom', {
    get: function() {
        return this.mViewport.zoomAmount;
    },
    set: function(amount) {
        var animated = true;
        var useActualAmount = true;
        this.mViewport.zoom(amount, this.mViewport.center, animated, useActualAmount);
    },
});

/**
 * Returns the internal layout system used in this personas instance.
 *
 * @property layoutSystem
 * @type {LayoutSystem}
 * @readonly
 */
Object.defineProperty(Personas.prototype, 'layoutSystem', {
    get: function() {
        return this.mLayoutSystem;
    },
});

/**
 * Property to define the layout system type that Personas will use.
 *
 * @property layoutSystemType
 * @type {String}
 */
Object.defineProperty(Personas.prototype, 'layoutSystemType', {
    get: function() {
        return this.mLayoutSystemType;
    },

    set: function(value) {
        var type;
        switch (value) {
            case Personas.COLA_LAYOUT_SYSTEM:
                type = value;
                break;

            case Personas.ORBITAL_LAYOUT_SYSTEM:
            default:
                type = Personas.ORBITAL_LAYOUT_SYSTEM;
        }
        this._setLayoutSystemType(type);
    },
});

/**
 * Sets the layout system that Personas will use to position its objects.
 *
 * @method _setLayoutSystemType
 * @param {String} type - The name of the layout system type to use.
 * @private
 */
Personas.prototype._setLayoutSystemType = function(type) {
    if (type !== this.mLayoutSystemType) {
        this.mLayoutSystemType = type;

        switch (type) {
            case Personas.COLA_LAYOUT_SYSTEM:
                this.mLayoutSystemFactory = function() {
                    return new ColaSystem(this.mJQElement);
                }.bind(this);
                break;

            case Personas.ORBITAL_LAYOUT_SYSTEM:
            default:
                this.mLayoutSystemFactory = function() {
                    return new OrbitSystem(20);
                };
        }

        if (this.mLayoutSystem) {
            if (this.mOtherPersona) {
                this.mLayoutSystem.removeObject(this.mOtherPersona);
            }
            var oldLayoutSystem = this.mLayoutSystem;
            oldLayoutSystem.removeAllObjects();
            oldLayoutSystem.remove();
            this.mLayoutSystem = this.mLayoutSystemFactory();
            this.mLayoutSystem.position.set(oldLayoutSystem.position.x, oldLayoutSystem.position.y);
            this.mViewport.append(this.mLayoutSystem);

            /* add all the objects in order to the layout system, but not adjusting their position */
            this.mSortedData.array.forEach(function(info) {
                if (info.graphicalPersona) {
                    this._addPersonaAndSeeds(this.mLayoutSystem, info);
                }
            }.bind(this));

            /* animate the objects' positions */
            this.mLayoutSystem.positionObjects(true);

            /* try to fit all the contents in the view */
            setTimeout(function() {
                /* create the other persona if needed */
                this._appendAndPositionOtherPersona(false);
                this.autoZoom();
            }.bind(this), 500);
        }
    }
};

/**
 * Extracts the relevant colors from the passed configuration and saves them to the returned object.
 *
 * @method processIconMap
 * @param {Object} config - The configuration object passed to this instance during initialization.
 * @returns {{icons: {}, defaults: {}, fallbackColor: string}}
 */
Personas.prototype.processIconMap = function(config) {
    var iconMap = {
        icons: {},
        defaults: {},
        fallbackColor: config.Persona.pie.defaultColor,
    };

    if (!config.autoGenerateIconMap && config.entityIcons) {
        var icons = config.entityIcons;
        for (var i = 0, n = icons.length; i < n; ++i) {
            var icon = icons[i];
            if (icon.color) {
                if (icon.entityRefId) {
                    iconMap.icons[icon.entityRefId] = icon.color;
                } else if (icon.isDefault) {
                    iconMap.defaults[icon.type] = icon.color;
                }
            }
        }
    }

    return iconMap;
};

/**
 * Loads the passed data into the widget and creates the personas needed to represent such data.
 *
 * @method loadData
 * @param {Object} data - The data to load.
 * @param {Boolean=} append = Flag used to describe if the new data should replace or update and append itself to the old data.
 * @param {Object=} options - an object to store any options needed to modify function workflow
 */
Personas.prototype.loadData = function(data, append, options) {
    if (this.mOtherPersona) {
        this.mLayoutSystem.removeObject(this.mOtherPersona);
    }

    if (!this.mSortedData || !append) {
        if (this.mLayoutSystem) {
            this.mLayoutSystem.invalidate();
            this.mLayoutSystem.removeAllObjects();
            this.mLayoutSystem.remove();
            this.mLayoutSystem = null;
        }

        /* sort the data before creating the personas */
        this.mSortedData = this.sortData(data);

        /* create a layout system to use */
        this.mLayoutSystem = this.mLayoutSystemFactory();

        /* create the personas */
        this.createPersonas(this.mSortedData, this.mLayoutSystem);

        /* position the objects */
        this.mLayoutSystem.positionObjects(false);

        /* create the other persona if needed */
        this._createOtherPersona(this.mSortedData.original.aggregates.other);

        /* try to fit all the contents in the view */
        if (!options || !options.deferZoom) { this.autoZoom(); }
    } else {
        this.updateData(data);
        /* try to fit all the contents in the view */
        setTimeout(function() {
            /* create the other persona if needed */
            this._updateOtherPersona(this.mSortedData.original.aggregates.other, false);
            if (!options || !options.deferZoom) { this.autoZoom(); }
        }.bind(this), 500);
    }
};

/**
 * Updates the existing data set to be merged with the data passed to this function.
 * NOTE: The new data set overwrites the old data with the new data if both sets contain the same objects but this
 * function does not delete entries from the old data set.
 *
 * @method updateData
 * @param {Object} data - The new data to load.
 */
Personas.prototype.updateData = function(data) {
    var mergedData = this.mergeData(this.mSortedData.original, data);
    var sortedData = this.sortData(mergedData);
    var minSize = this.mConfig.Persona.layout.minSize;
    var maxSize = this.mConfig.Persona.layout.maxSize;
    var minCount = sortedData.minCount;
    var sizeRange = ((sortedData.maxCount - minCount) || 1);
    var entityRefs = mergedData.entityRefs;
    var iconMap = this.mIconMap;

    /* create a fake layout system to put the newly created objects in, if any */
    var fakeSystem = this.mLayoutSystemFactory();

    /* got through the personas that already have a graphical persona and ask them to update */
    sortedData.array.forEach(function(info) {
        if (info.graphicalPersona) {
            info.size = (((info.relevantCount - minCount) / sizeRange) * (maxSize - minSize)) + minSize;
            info.graphicalPersona.updateData(info.size, info, iconMap, entityRefs);
        } else {
            this._createPersonaAndSeeds(fakeSystem, mergedData, info, minCount, minSize, maxSize, sizeRange);
        }
    }.bind(this));

    /* iterate through the newly created objects and set them up for 'popping' into place */
    fakeSystem.forEach(function(object) {
        /* reset the object's position */
        var oldCallback = object.position.changedCallback;
        object.position.changedCallback = null;
        object.position.set(0, 0);
        object.position.changedCallback = oldCallback;
        object.transform('t0,0');
        /* if the object supports it, call the popIn method */
        if (object.popIn) {
            object.popIn();
        }
    });

    /* remove all objects from the systems */
    fakeSystem.removeAllObjects();
    this.mLayoutSystem.removeAllObjects();

    /* add all the objects in order to the layout system, but not adjusting their position */
    sortedData.array.forEach(function(info) {
        this._addPersonaAndSeeds(this.mLayoutSystem, info);
    }.bind(this));

    /* animate the objects' positions */
    this.mLayoutSystem.positionObjects(true, true); // second parameter is specific to the cola layout system.

    /* save the sorted data */
    this.mSortedData = sortedData;
};

/**
 * Utility function to merge two sets of data.
 *
 * @method mergeData
 * @param {Object} data - The base data into which the new data will be merged.
 * @param {Object} newData - The new data to merge into the base data.
 * @returns {Object}
 */
Personas.prototype.mergeData = function(data, newData) {
    return $.extend(true, {}, data, newData);
};

/**
 * Function to create the other persona if needed.
 *
 * @method _createOtherPersona
 * @param {Object} otherPersonaData - The data to process, can be null  or undefined.
 * @private
 */
Personas.prototype._createOtherPersona = function(otherPersonaData) {
    if (this.mOtherPersona) {
        this.mLayoutSystem.removeObject(this.mOtherPersona);
        this.mOtherPersona = null;
    }

    if (otherPersonaData && otherPersonaData.count) {
        var data = {
            id: Personas.OTHER_PERSONA_DEFAULT_ID,
            totalCount: otherPersonaData.count,
            relevantName: 'Other',
            relevantCount: otherPersonaData.count,
            properties: [{
                'count': 0,
                'isPrimary': false,
                'color': '#000000',
            }],
        };

        if (otherPersonaData.metadata) {
            data.metadata = otherPersonaData.metadata;
        }

        this.mOtherPersona = new Persona(this.mConfig.Persona.layout.minSize, data, this.mIconMap, this.mConfig);
        if (this.mOtherPersona.mLabel.mTotalCountText) {
            this.mOtherPersona.mLabel.mTotalCountText.remove();
        }

        /* add a single gauge for selection purposes */
        this.mOtherPersona.mGauge.addBar('__selection_bar_id__', 0, this.mConfig.Persona.pie.defaultColor);

        if (!this.mOtherPersonaFill) {
            var patternGroup = this.mPaper.g();

            var rect = patternGroup.rect(0, 0, 10, 10);
            rect.attr({'fill': '#eee'});

            var line = patternGroup.line(-2, 2, 1, -1);
            line.attr({'stroke': '#ddd', 'stroke-width': '4px'});

            line = patternGroup.line(0, 10, 10, 0);
            line.attr({'stroke': '#ddd', 'stroke-width': '4px'});

            line = patternGroup.line(8, 12, 11, 9);
            line.attr({'stroke': '#ddd', 'stroke-width': '4px'});

            this.mOtherPersonaFill = patternGroup.toPattern(0, 0, 10, 10);
        }

        this.mOtherPersona.mAvatar.mBackground.attr({'fill': this.mOtherPersonaFill});

        this._appendAndPositionOtherPersona(false);
    }
};

/**
 * Checks if the specified id pertains to the other persona.
 *
 * @method isOtherPersona
 * @param {string} id - The id of te persona to check.
 * @returns {boolean}
 */
Personas.prototype.isOtherPersona = function(id) {
    return (this.mOtherPersona && id === Personas.OTHER_PERSONA_DEFAULT_ID);
};

/**
 * Function to update the other persona data if needed.
 *
 * @method _updateOtherPersona
 * @param {Object} otherPersonaData - The data to process, can be null  or undefined.
 * @param {boolean} animated - Should the position of the other persona be animated.
 * @private
 */
Personas.prototype._updateOtherPersona = function(otherPersonaData, animated) {
    if (this.mOtherPersona && otherPersonaData && otherPersonaData.count) {
        // make sure the other persona is added to the layout system before updating
        if (this.mOtherPersona.mParent !== this.mLayoutSystem) {
            this.mLayoutSystem.addObject(this.mOtherPersona, true);
        }
        this.mOtherPersona.mLabel.count = otherPersonaData.count;
        this._appendAndPositionOtherPersona(animated);
    } else if (this.mOtherPersona) {
        this.mLayoutSystem.removeObject(this.mOtherPersona);
        this.mOtherPersona = null;
    }
};

/**
 * Function to add and position the other persona if needed.
 *
 * @method _appendAndPositionOtherPersona
 * @param {boolean} animated - Should the position of the other persona be animated.
 * @private
 */
Personas.prototype._appendAndPositionOtherPersona = function(animated) {
    if (this.mOtherPersona) {
        this.mLayoutSystem.removeObject(this.mOtherPersona);
        var systemBox = this.mLayoutSystem.getBBox();
        this.mLayoutSystem.addObject(this.mOtherPersona, true);

        var right = systemBox.x2 - this.mLayoutSystem.position.x;
        var bottom = systemBox.y2 - this.mLayoutSystem.position.y;

        var position = new Point2D(right + this.mOtherPersona.radius, bottom + this.mOtherPersona.radius);
        if (animated) {
            this.mOtherPersona.animatePosition(this.mOtherPersona.position, position, 100, mina.backout);
        } else {
            this.mOtherPersona.position.set(position.x, position.y);
        }
    }
};

/**
 * Utility function to compare the information data of two personas.
 *
 * @method _personaComparison
 * @param {Object} a - The first persona info to compare.
 * @param {Object} b - The second persona info to compare
 * @returns {number} Represents which persona is larger or if they are equal.
 * @private
 */
Personas.prototype._personaComparison = function(a, b) {
    return b.relevantCount - a.relevantCount; // reverse sorting, from high to low
};

/**
 * Sorts the persona information instances passed in the `data` structure. Sorting is based on the size of the
 * persona, where the biggest persona appears at the beginning of the array and the smallest at the end.
 * NOTE: This function also adds the `relevantCount`, `relevantName`, `seeds`, `links` and `graphicalPersona` fields to
 * the persona information object.
 *
 * @method sortData
 * @param {Object} data - An object containing the persona information objects to sort.
 * @returns {{original: Object, array: Array, minCount: Number, maxCount: Number}}
 */
Personas.prototype.sortData = function(data) {
    var maxCount = Number.MIN_VALUE;
    var minCount = Number.MAX_VALUE;

    var sortedPersonaInfo = [];

    var entityRefs = data.entityRefs;
    var personas = data.aggregates.personas;
    for (var key in personas) {
        if (personas.hasOwnProperty(key)) {
            var personaInfo = personas[key];
            var name = '';
            var count = 0;
            var relevantCount = personaInfo.properties.map(function(property) {
                return property.count;
            }).reduce(function (previous, current) {
                return previous + current;
            }, 0);

            var primaryProperty = this.findPrimaryProperty(personaInfo.properties);
            if (primaryProperty) {
                count = primaryProperty.count;
                if (primaryProperty.entityRefId) {
                    name = entityRefs[primaryProperty.entityRefId].name;
                    personaInfo.imageUrl = entityRefs[primaryProperty.entityRefId].imageUrl;
                } else {
                    name = primaryProperty.value;
                }
            }

            maxCount = (count > maxCount) ? count : maxCount;
            minCount = (count < minCount) ? count : minCount;
            personaInfo.primaryProperty = primaryProperty;
            personaInfo.relevantCount = relevantCount;
            personaInfo.formattedRelevantCount = (primaryProperty && primaryProperty.formattedCount) ? primaryProperty.formattedCount : null;
            /* data doesn't have this property */
            personaInfo.relevantName = name;

            /* find the seeds for this persona */
            personaInfo.seeds = this.getSeedsForPersona(data.aggregates.seeds, personaInfo.id);

            /* find the links for this persona */
            personaInfo.links = this.getLinksForPersona(data.aggregates.links, personaInfo.id);

            /* add the seeds to the links, so they get rendered close to their owner */
            personaInfo.links.push.apply(personaInfo.links, personaInfo.seeds);

            /* when the personas are placed, they will have their graphical representations linked here */
            if (!personaInfo.graphicalPersona) {
                personaInfo.graphicalPersona = null;
            }

            /* finally add the persona to the array */
            sortedPersonaInfo.push(personaInfo);
        }
    }

    /* sort the persona array */
    sortedPersonaInfo.sort(this._personaComparison);

    return {
        original: data,
        array: sortedPersonaInfo,
        minCount: minCount,
        maxCount: maxCount,
    };
};

/**
 * Creates graphical representations of the persona information objects contained in the `sortedData` object.
 *
 * @method createPersonas
 * @param {Object} sortedData - An object containing information about the personas to create. Must contain an `array` property.
 * @param {LayoutSystem=} system - The layout system to which the personas should be added.
 */
Personas.prototype.createPersonas = function(sortedData, system) {
    var data = sortedData.original;
    var sortedPersonaInfo = sortedData.array;

    var pageCenterX = $(this.mElement).width() * 0.5;
    var pageCenterY = $(this.mElement).height() * 0.5;
    var personaMinSize = this.mConfig.Persona.layout.minSize;
    var personaMaxSize = this.mConfig.Persona.layout.maxSize;
    var minCount = sortedData.minCount;
    var sizeRange = ((sortedData.maxCount - minCount) || 1);
    sortedPersonaInfo.forEach(function(info) {
        /* if the persona hasn't been added yet */
        this._createPersonaAndSeeds(system, data, info, minCount, personaMinSize, personaMaxSize, sizeRange);
    }.bind(this));

    if (system) {
        this.mViewport.append(system);
        system.position.set(pageCenterX, pageCenterY);
    }
};

/**
 * Adds the passed persona, their seed personas and related personas in order based to the specified `system`
 *
 * @param {LayoutSystem} system - The layout system to which the created personas and seeds should be added to.
 * @param {Object} info - The information of the persona that should be created with its seeds.
 * @private
 */
Personas.prototype._addPersonaAndSeeds = function(system, info) {
    var persona = info.graphicalPersona;
    if (!system.containsObject(persona)) {
        system.addObject(persona, true);

        /* add the seed personas */
        var seeds = info.seeds;
        seeds.forEach(function(seed) {
            system.addObject(seed.info.graphicalSeed, true);
        });
    }
};

/**
 * Creates the persona for the passed 'info' and checks if it has seeds to create, if it does, it creates the seeds,
 * their personas and nested seeds recursively.
 *
 * @method _createPersonaAndSeeds
 * @param {LayoutSystem} system - The layout system to which the created personas and seeds should be added to.
 * @param {Object} data - A sorted array containing the information of all the personas to process.
 * @param {Object} info - The information of the persona that should be created with its seeds.
 * @param {Number} minCount - The minimum count of hits for all the available personas.
 * @param {Number} minSize - Minimum size that a persona should be spawned with.
 * @param {Number} maxSize - Maximum size that a persona should be spawned with.
 * @param {Number} sizeRange - The size range scalar to compute the final size of a persona.
 * @private
 */
Personas.prototype._createPersonaAndSeeds = function(system, data, info, minCount, minSize, maxSize, sizeRange) {
    if (!info.graphicalPersona) {
        var entityRefs = data.entityRefs;
        info.size = (((info.relevantCount - minCount) / sizeRange) * (maxSize - minSize)) + minSize;
        var persona = new Persona(info.size, info, this.mIconMap, this.mConfig, entityRefs);
        info.graphicalPersona = persona;
        if (system) {
            system.addObject(persona, true);
        }

        /* create the seed personas */
        var seeds = info.seeds;
        var globalConfig = this.mConfig;
        seeds.forEach(function(seedInfo) {
            if (!seedInfo.info.graphicalSeed) {
                /* create and add the seed to the system */
                var seed = new Seed(minSize, seedInfo.property, globalConfig);
                seedInfo.info.graphicalSeed = seed;
                if (system) {
                    system.addObject(seed, true);
                }
            }
        });
    }
};

/**
 * Utility function to sort seeds based on their strength.
 *
 * @method _seedComparison
 * @param {Object} a - The first seed to compare.
 * @param {Object} b - The second seed to compare
 * @returns {number} Represents which seed is stronger or if they are equal.
 * @private
 */
Personas.prototype._seedComparison = function(a, b) {
    return a.strength - b.strength;
};

/**
 * Traverses the provided `seeds` array searching for the seeds related to the persona with the specified `id` and returns
 * the found seeds, if any, in an `Array` structure.
 *
 * @method getSeedsForPersona
 * @param {Object} seeds - An array of the seeds to traverse looking for the specified persona id.
 * @param {String} id - The persona id to find the seeds for.
 * @returns {Array}
 */
Personas.prototype.getSeedsForPersona = function(seeds, id) {
    var ret = [];

    if (seeds) {
        for (var key in seeds) {
            if (seeds.hasOwnProperty(key)) {
                var seed = seeds[key];
                if (seed.relatedTo === id) {
                    var linkStrength = 0;
                    var primaryProperty = this.findPrimaryProperty(seed.properties);
                    if (primaryProperty) {
                        linkStrength = primaryProperty.count;
                    }

                    if (linkStrength) {
                        ret.push({
                            strength: linkStrength,
                            seedId: key,
                            info: seed,
                            property: primaryProperty,
                        });
                    }
                }
            }
        }
    }

    /* sort the array */
    ret.sort(this._seedComparison);

    return ret;
};

/**
 * Utility function to sort links based on their weight.
 *
 * @method _linkComparison
 * @param {Object} a - The first link to compare.
 * @param {Object} b - The second link to compare
 * @returns {number} Represents which link is stronger or if they are equal.
 * @private
 */
Personas.prototype._linkComparison = function(a, b) {
    return (a.weight || 0) - (b.weight || 0);
};

/**
 * Traverses the provided `links` array searching for the links related to the persona with the specified `id` and returns
 * the found links, if any, in an `Array` structure.
 *
 * @method getSeedsForPersona
 * @param {Array} links - An array of the links to traverse looking for the specified persona id.
 * @param {String} id - The persona id to find the links for.
 * @returns {Array}
 */
Personas.prototype.getLinksForPersona = function(links, id) {
    var ret = [];

    if (links) {
        links.forEach(function(link) {
            if (link.target === id && link.source) {
                ret.push(link);
            }
        });
    }

    /* sort the array */
    ret.sort(this._linkComparison);

    return ret;
};

/**
 * Traverses the provided `properties` array and finds the property marked as primary. Returns the primary property
 * if found, the first property in the array if no primary property is specified or null in any other case.
 *
 * @method findPrimaryProperty
 * @param {Array} properties - The array of properties to traverse.
 * @returns {Object}
 */
Personas.prototype.findPrimaryProperty = function(properties) {
    if (properties && properties.length) {
        for (var i = 0, n = properties.length; i < n; ++i) {
            if (properties[i].isPrimary) {
                return properties[i];
            }
        }
        return properties[0];
    }
    return null;
};

/**
 * Finds the persona with the specified `id`
 * @param {String} id - The id of the persona to find.
 * @returns {Persona}
 */
Personas.prototype.findPersona = function(id) {
    var sortedArray = this.mSortedData.array;
    for (var i = 0, n = sortedArray.length; i < n; ++i) {
        var info = sortedArray[i];
        if (info.graphicalPersona && info.graphicalPersona.personaId === id) {
            return info.graphicalPersona;
        }
    }

    return null;
};

/**
 * Automatically zooms and repositions the viewport so all its contents fit in the view while respecting the configured
 * min and max scale values of the viewport.
 *
 * @method autoZoom
 */
Personas.prototype.autoZoom = function() {
    var pageWidth = this.mJQElement.width();
    var pageHeight = this.mJQElement.height();
    var systemBox = this.mLayoutSystem.getBBox();

    var newScale = Math.min(pageWidth / systemBox.width, pageHeight / systemBox.height);
    if (newScale < this.mViewport.minZoomScale) {
        newScale = this.mViewport.minZoomScale;
    } else if (newScale > this.mViewport.maxZoomScale) {
        newScale = this.mViewport.maxZoomScale;
    }

    /* persist the current zoom level */
    this.mViewport.zoomAmount = newScale;

    var matrix = Snap.matrix();
    matrix.translate(pageWidth * 0.5, pageHeight * 0.5);
    matrix.scale(newScale);
    matrix.translate(-systemBox.cx, -systemBox.cy);
    this.mViewport.animate({transform: matrix}, 250, mina.easeinout);
};

/**
 * Resizes the component to fit within its container.
 *
 * @method resize
 */
Personas.prototype.resize = function() {
    var newWidth = this.mJQElement.width();
    var newHeight = this.mJQElement.height();
    var matrix = this.mViewport.transform().localMatrix;

    if (newWidth !== this.mElementWidth) {
        var widthOffset = newWidth - this.mElementWidth;
        this.mElementWidth = newWidth;
        matrix.e += (widthOffset * 0.5);
        if (this.mOwnsSVG) {
            this.mElement.setAttribute('width', newWidth);
        }
    }

    if (newHeight !== this.mElementHeight) {
        var heightOffset = newHeight - this.mElementHeight;
        this.mElementHeight = newHeight;
        matrix.f += (heightOffset * 0.5);
        if (this.mOwnsSVG) {
            this.mElement.setAttribute('height', newHeight);
        }
    }
    this.mViewport.transform(matrix);
    this.mZoomControls.position.set(this.mJQElement.width() - this.mZoomControls.width - 20, 20);
};

/**
 * Removes the specified persona completely from the system.
 *
 * @param {Persona | string} toRemove - The persona or persona id to remove
 */
Personas.prototype.removePersona = function(toRemove) {
    var persona = toRemove;
    if (!persona.personaId) {
        persona = this.findPersona(toRemove);
    }

    /* remove the persona from the payout system */
    this.mLayoutSystem.removeObject(persona);

    /* delete the merged persona from the data */
    var id = persona.personaId;
    var personas = this.mSortedData.original.aggregates.personas;
    if (personas.hasOwnProperty(id)) {
        var info = personas[id];
        delete personas[id];
        var index = this.mSortedData.array.indexOf(info);
        if (index >= 0) {
            this.mSortedData.array.splice(index, 1);
        }
    }
};

/**
 * Registers this instance to listen for events.
 *
 * @method registerEvents
 */
Personas.prototype.registerEvents = function() {
    var eventTracker = this.mEventTracker;
    eventTracker.registerEvent(Events.select, this.handlePersonaSelect.bind(this));
    eventTracker.registerEvent(Events.hover, this.handlePersonaHover.bind(this));
    eventTracker.registerEvent(Events.merged, this.handlePersonaMerged.bind(this));
    eventTracker.registerEvent(Events.deselectAll, this.handlePersonaDeselectAll.bind(this));
    eventTracker.registerEvent(Events.zoomUpdateFromUser, this.handlePersonaZoomUpdate.bind(this));
};

/**
 * Unregisters all the events registered in the `registerEvents` function.
 *
 * @method unregisterEvents
 */
Personas.prototype.unregisterEvents = function() {
    this.mEventTracker.unregisterAllEvents();
};

/**
 * Handles the event triggered when a persona is selected.
 *
 * @method handlePersonaSelect
 * @param {Object} data - The data generated by the event.
 */
Personas.prototype.handlePersonaSelect = function(data) {
    if (this.mLayoutSystem) {
        var selectionStates = [];
        var iconMap = this.mIconMap;

        this.mLayoutSystem.forEach(function(object) {
            if (object instanceof Persona) {
                object.removeAllAppendedGauges();
                object.replaceGaugeBars(object.data, iconMap);
                object.inVisualFocus = true;
                selectionStates.push({id: object.personaId, selected: object.isSelected});
            }
        });

        if (typeof this.mConfig.hooks.onSelectPersona === 'function') {
            data.personaSelectionStates = selectionStates;
            this.mConfig.hooks.onSelectPersona(data);
        }
    }
};

/**
 * Handles the event triggered when a all personas should be deselected.
 *
 * @method handlePersonaDeselectAll
 */
Personas.prototype.handlePersonaDeselectAll = function() {
    if (this.mLayoutSystem) {
        var iconMap = this.mIconMap;

        /* deselect all the personas */
        this.mLayoutSystem.forEach(function(object) {
            if (object instanceof Persona) {
                object.isSelected = false;
                object.removeAllAppendedGauges();
                object.replaceGaugeBars(object.data, iconMap);
                object.inVisualFocus = true;
            }
        });

        if (typeof this.mConfig.hooks.onSelectPersona === 'function') {
            var selectionStates = [];
            var data = {};
            this.mLayoutSystem.forEach(function(object) {
                if (object instanceof Persona) {
                    selectionStates.push({id: object.personaId, selected: object.isSelected});
                }
            });

            /* simulate a persona select event */
            if (selectionStates.length) {
                data.id = selectionStates[0].id;
                data.selected = selectionStates[0].selected;
                data.personaSelectionStates = selectionStates;
                this.mConfig.hooks.onSelectPersona(data);
            }
        }

        if (typeof this.mConfig.hooks.onSelectionCleared === 'function') {
            this.mConfig.hooks.onSelectionCleared();
        }
    }
};

/**
 * Handles the event triggered when the zoom for the personas has been changed.
 *
 * @method handlePersonaZoomUpdate
 * @param {Object} newZoom - the new zoom level after update.
 */
Personas.prototype.handlePersonaZoomUpdate = function(newZoom) {
    if (typeof this.mConfig.hooks.onZoomUpdateFromUser === 'function') {
        this.mConfig.hooks.onZoomUpdateFromUser(newZoom);
    }
};

/**
 * Handles the event triggered when the mouse hovers a persona.
 *
 * @method handlePersonaHover
 * @param {Object} data - The data generated by the event.
 */
Personas.prototype.handlePersonaHover = function(data) {
    if (typeof this.mConfig.hooks.onHoverPersona === 'function') {
        this.mConfig.hooks.onHoverPersona(data);
    }
};

/**
 * Handles the event triggered when a persona is merged into another persona.
 *
 * @method handlePersonaMerged
 * @param {Persona} merged - The persona that was merged.
 * @param {Persona} mergedTo - The persona receiving the merged persona.
 */
Personas.prototype.handlePersonaMerged = function(merged, mergedTo) {
    if (typeof this.mConfig.hooks.onMergePersona === 'function') {
        this.mConfig.hooks.onMergePersona({
            merged: merged,
            mergedTo: mergedTo,
        });
    }

    /* delete the merged persona from the data */
    var id = merged.personaId;
    var personas = this.mSortedData.original.aggregates.personas;
    if (personas.hasOwnProperty(id)) {
        var info = personas[id];
        delete personas[id];
        var index = this.mSortedData.array.indexOf(info);
        if (index >= 0) {
            this.mSortedData.array.splice(index, 1);
        }
    }
};

/**
 * Utility function to enable of disable the blur effect of personas.
 *
 * @method enableBlur
 * @param {boolean} enabled - Flag describing if the blur effect should be enabled or disabled.
 */
Personas.prototype.enableBlur = function(enabled) {
    this.mEventCenter.publish(Events.enableBlur, enabled);
};

/**
 * Select a subset of personas while the rest of the personas are set visually out of focus, and
 * display subselection data and outer query data in a single gauge.
 *
 * @method subSelectPersonas
 * @param {Object} subSelectContext - An object containing the ids of the personas to be selected and their counts.
 * @param {Boolean=} keepSubSelection - If set to `true` and there was a previous sub selection, the sub-selection is merged with the new one.
 */
Personas.prototype.subSelectPersonas = function (subSelectContext, keepSubSelection) {
    var iconMap = this.mIconMap;

    if (subSelectContext) {
        this.layoutSystem.forEach(function (persona) {
            if (persona instanceof Persona) {
                /* deselect any selected personas */
                persona.isSelected = false;

                var personaData = persona.data;

                /* data for the new gauge bars */
                var gaugeData = {
                    properties: [],
                    totalCount: personaData.totalCount,
                };
                var appendGaugeProp = function(name, count, color) {
                    gaugeData.properties.push({
                        value: name,
                        count: count,
                        color: color,
                    });
                };

                var personaName = persona.personaId;
                var queryPortion = personaData.relevantCount;
                var subSelectData = subSelectContext[persona.personaId];
                var subSelectNameBase = personaName + '-subselect';
                var subSelectCount = 0;
                var gaugeBars = persona.gauge.mBars;
                var hasSubSelection = Boolean(gaugeBars[subSelectNameBase + '-0']);

                if (subSelectData && subSelectData.bars.length) {
                    var newBars = subSelectData.bars;
                    for (var i = 0, n = newBars.length; i < n; ++i) {
                        var newBar = newBars[i];
                        var subSelectName = subSelectNameBase + '-' + i;
                        subSelectCount += newBar.count;
                        appendGaugeProp(subSelectName, newBar.count, newBar.color);
                    }
                    persona.inVisualFocus = true;
                    hasSubSelection = false;
                }

                if (!keepSubSelection || !hasSubSelection) {
                    persona.inVisualFocus = Boolean(gaugeData.properties.length);
                    if (!this.isOtherPersona(personaName) && this.mConfig.Persona.config.renderSubSelectionBackground) {
                        queryPortion = queryPortion - subSelectCount;
                        appendGaugeProp(subSelectNameBase + '-back', queryPortion, '#c5c1be');
                    }
                    persona.replaceGaugeBars(gaugeData, iconMap);
                }
            }
        }.bind(this));
    } else {
        this.mEventCenter.publish(Events.deselectAll);
    }
};

/**
 * This function selects a subset of personas while the rest of the personas are set visually out of focus.
 * Optionally, selected personas can be appended a new gauge.
 *
 * @param {Object} selectionData - An object containing the ids of the personas to be selected and a description of the gauges to be added, if any.
 * @param {Boolean=} keepSubSelection - If set to `true` and there was a previous sub selection, the sub-selection is merged with the new one.
 */
Personas.prototype.subSelectPersonasMultiGauge = function(selectionData, keepSubSelection) {
    if (selectionData) {
        this.mLayoutSystem.forEach(function(object) {
            if (object instanceof Persona) {
                /* deselect any selected personas */
                object.isSelected = false;

                /* get the data */
                var data = selectionData[object.personaId];

                /* if not keeping the selection, remove all previous selection states */
                if (!keepSubSelection) {
                    object.removeAllAppendedGauges();
                }

                /* if the data is found, process it */
                if (data) {
                    /* compute the bar percentages if needed */
                    if (data.computePercentages) {
                        var totalCount = (data.totalCount || object.mData.totalCount);
                        var bars = data.bars;
                        for (var i = 0, n = bars.length; i < n; ++i) {
                            var bar = bars[i];
                            bar.percent = bar.count / totalCount;
                        }
                    }

                    object.appendGauge(data.bars);
                    object.bringToFront();
                    object.inVisualFocus = true;
                } else if (!keepSubSelection || !object.hasAppendedGauges) { /* if not data is found visually unfocus the persona */
                    object.inVisualFocus = false;
                }
            }
        });
    } else {
        this.mEventCenter.publish(Events.deselectAll);
    }
};

/**
 * Orbital layout system name.
 *
 * @static
 * @type {string}
 */
Personas.ORBITAL_LAYOUT_SYSTEM = 'orbital';

/**
 * Cola layout system name.
 *
 * @static
 * @type {string}
 */
Personas.COLA_LAYOUT_SYSTEM = 'cola';

/**
 * Default id for the "Other" persona.
 *
 * @static
 * @type {string}
 */
Personas.OTHER_PERSONA_DEFAULT_ID = '__Personas_Other_Persona_ID__';

/**
 * @export
 * @type {Personas}
 */
module.exports = Personas;
module.exports.asJQueryPlugin = /* istanbul ignore next: Jquery Plugin Registration */ function() {
    $.fn.personas = function(command) {
        var t = this;
        var commands = {
            initialize: function(options) {
                this._personas = new Personas(this, options);
            },
            loaddata: function(data, append, options) {
                this._personas.loadData(data, append, options);
            },
            enableblur: function(enabled) {
                this._personas.enableBlur(enabled);
            },
            subselect: function(data, keepSubSelection) {
                if (data) {
                    /* convert the data to the internal format */
                    var selectionData = {};
                    for (var i = 0, n = data.length; i < n; ++i) {
                        var personaData = data[i];
                        selectionData[personaData.personaId] = {
                            computePercentages: true,
                            bars: [{
                                color: personaData.color,
                                count: personaData.count,
                            }],
                        };
                    }
                    this._personas.subSelectPersonas(selectionData, keepSubSelection);
                } else {
                    this._personas.subSelectPersonas(null, keepSubSelection);
                }
            },
            clearSubselections: function() {
                this._personas.mEventCenter.publish(Events.deselectAll);
            },
            unregisterHandlers: function() {
                this._personas.unregisterEvents();
            },
            setlayouttype: function(type) {
                this._personas.layoutSystemType = type;
            },
            findpersona: function(id, cb) {
                cb(this._personas.findPersona(id));
            },
            getZoom: function(cb) {
                cb(this._personas.zoom);
            },
            setZoom: function(amount) {
                this._personas.zoom = amount;
            },
            dispose: function() {
                t.each(function(index, element) {
                    element._personas = null;
                    element.remove();
                });
            },
        };
        // define argument variable here as arguments get overloaded in the each call below.
        var args = arguments;
        return t.each(function(index, element) {
            if (command === undefined) {
                commands.initialize.apply(element, null);
            } else if (commands[command]) {
                commands[command].apply(element, Array.prototype.slice.call(args, 1));
            } else if (typeof command === 'object' || !command) {
                commands.initialize.apply(element, args);
            } else {
                $.error('Command: ' + command + 'does not exist.');
            }
        });
    };
};
