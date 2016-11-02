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
var LayoutSystem = require('./personas.layout.layoutSystem.js');
var Cola = require('webcola');
var Point2D = require('./personas.core.point2d.js');

/**
 * Layout system based on WebCola:
 * http://marvl.infotech.monash.edu/webcola/
 *
 * @class ColaSystem
 * @param {jQuery} container - The element to which system will be added. Used to calculate the size of the layout.
 * @constructor
 */
function ColaSystem(container) {
    /* inheritance */
    LayoutSystem.call(this);

    /* member variables */
    this.mObjects = [];
    this.mContainer = container;

    /* initialization */
}

/**
 * @inheritance
 * @type {LayoutSystem}
 */
ColaSystem.prototype = Object.create(LayoutSystem.prototype);
ColaSystem.prototype.constructor = ColaSystem;

/**
 * Returns the total count of objects in this system.
 *
 * @property objectCount
 * @type {Number}
 * @readonly
 */
Object.defineProperty(ColaSystem.prototype, 'objectCount', {
    get: function () {
        return this.mObjects.length;
    },
});

/* eslint-disable */
/**
 * Adds an object to this system. If the object wouldn't fit in the outmost orbit a new orbit is created and added to the system.
 *
 * @method addObject
 * @param {Object} object - The object to be added to the system
 * @param {Boolean=} skipPositionCalculation - If set to true the added objects do not re-calculate their positions. Ignored in this system.
 */
ColaSystem.prototype.addObject = function (object, skipPositionCalculation) {
    this.mObjects.push(object);
    this.append(object);
};
/* eslint-enable */

/**
 * If the object exists in this orbit system, it is removed. Return true if the object was removed successfully, false otherwise.
 *
 * @method removeObject
 * @param {Persona|Orbit|OrbitSystem} object - The object to remove.
 * @returns {boolean}
 */
ColaSystem.prototype.removeObject = function (object) {
    var objects = this.mObjects;
    var index = objects.indexOf(object);
    if (index >= 0) {
        objects[index].mParent = null;
        objects[index].remove();
        objects.splice(index, 1);
        return true;
    }

    return false;
};

/**
 * Removes all objects from the orbit system.
 *
 * @method removeAllObjects
 */
ColaSystem.prototype.removeAllObjects = function () {
    var objects = this.mObjects;
    while (objects.length) {
        var object = objects.pop();
        object.remove();
        object.mParent = null;
    }
};

/**
 * Checks if this system contains the specified `object`.
 *
 * @method containsObject
 * @param {Persona|Orbit|OrbitSystem} object - The object to look for.
 * @returns {boolean}
 */
ColaSystem.prototype.containsObject = function (object) {
    return (this.mObjects.indexOf(object) >= 0);
};

/**
 * Iterates through all the objects in this orbit system recursively and calls the callback with each object as
 * its sole argument.
 *
 * @method forEach
 * @param {Function} callback - The function to call for every object.
 */
ColaSystem.prototype.forEach = function (callback) {
    this.mObjects.forEach(callback);
};

/**
 * Goes through all the objects in this system and moves them to their most updated position.
 *
 * @method positionObjects
 * @param {Boolean=} animated - Should the objects be animated to their new position.
 * @param {Boolean=} skipFit - Specific to this layout system, should the fit function be skipped.
 */
ColaSystem.prototype.positionObjects = function(animated, skipFit) {
    var nodes = [];
    var links = [];
    var width = this.mContainer.width();
    var height = this.mContainer.height();

    this.mObjects.forEach(function(object) {
        var node = this._createNodeData(object);
        if (node) {
            if (!node.id) {
                node.id = 'unknown_' + nodes.length;
            }
            nodes.push(node);
            links.push.apply(links, this._processLinksData(object, node));
        }
    }.bind(this));

    for (var i = 0; i < links.length; ++i) {
        var link = links[i];
        link.source = this._findNode(nodes, link.seed || link.source);
        if (!link.target || !link.source) {
            links.splice(i--, 1);
        }
    }

    var layout = new Cola.Layout();
    layout.nodes(nodes);
    layout.links(links);
    layout.size([width, height]);
    layout.avoidOverlaps(true);
    layout.linkDistance(function(l) { return (l.source.width * 0.4 + l.target.width * 0.4); });
    layout.start(25, 0, 10, 0, false);
    if (!skipFit) {
        this._fit(nodes, width, height);
    }

    var xOffset = width * 0.5;
    var yOffset = height * 0.5;
    nodes.forEach(function(node) {
        node.x -= xOffset;
        node.y -= yOffset;
        if (animated && node.object.animatePosition) {
            var position = node.object.position;
            if (node.x !== position.x || node.y !== position.y) {
                var newPosition = new Point2D(node.x, node.y);
                node.object.animatePosition(position, newPosition, 500, mina.backout);
            }
        } else {
            node.object.position.set(node.x, node.y);
        }
    });
};

/**
 * Invalidates this object, once invalidated the object will no longer respond to interactions.
 *
 * @method invalidate
 */
ColaSystem.prototype.invalidate = function () {
    var objects = this.mObjects;
    for (var i = 0, n = objects.length; i < n; ++i) {
        var object = objects[i];
        if (typeof object.invalidate === 'function') {
            object.invalidate();
        }
    }
};

/**
 * Creates graph node data from a persona in the layout.
 *
 * @method _createNodeData
 * @param {Persona} object - The persona from which the data will be extracted.
 * @returns {{object: *, id: String, x: number, y: number, width: number, height: number}}
 * @private
 */
ColaSystem.prototype._createNodeData = function(object) {
    return {
        object: object,
        id: object.personaId,
        x: object.position.x,
        y: object.position.y,
        width: object.size,
        height: object.size,
    };
};

/**
 * Extracts the links data from a persona in the layout.
 *
 * @method _processLinksData
 * @param {Persona} object - The persona from which the data will be extracted.
 * @param {Object} node - The graph node associated with the persona object.
 * @returns {Array}
 * @private
 */
ColaSystem.prototype._processLinksData = function(object, node) {
    var links = [];
    if (object.data && object.data.links) {
        object.data.links.forEach(function(link) {
            var newLink = {
                source: link.source,
                target: node,
            };

            if (!newLink.source && link.info && link.info.graphicalSeed) {
                newLink.source = null;
                newLink.seed = link.info.graphicalSeed;
            }

            if (link.length) {
                newLink.length = link.length;
            }

            if (link.weight) {
                newLink.weight = link.weight;
            }

            links.push(newLink);
        });
    }

    return links;
};

/**
 * Given a `nodes` array it finds the needle by comparing it to the id or the object in each node.
 *
 * @method _findNode
 * @param {Array} nodes - An array of graph nodes.
 * @param {String|Object} needle - An object id as a string or the actual object to look for.
 * @returns {Object|null}
 * @private
 */
ColaSystem.prototype._findNode = function(nodes, needle) {
    for (var i = 0, n = nodes.length; i < n; ++i) {
        if (nodes[i].id === needle || nodes[i].object === needle) {
            return nodes[i];
        }
    }
    return null;
};

/**
 * Rotates the given nodes to better fit in the given space.
 * NOTE: Updates nodes in place.
 *
 * @param {Array<{x: number, y: number, width: number, height: number}>} nodes - The nodes to fit in the given space.
 * @param {number} width - The width to fit into.
 * @param {number} height - The height to fit into.
 * @private
 */
ColaSystem.prototype._fit = function (nodes, width, height) {
    if (!nodes || !nodes.length) return;

    // rotation function.
    function rotate(cx, cy, x, y, radians) {
        var ry = -y;
        var rcy = -cy; // switch from browser space to cartesian space
        var cos = Math.cos(radians);
        var sin = Math.sin(radians);
        var nx = (cos * (x - cx)) + (sin * (ry - rcy)) + cx;
        var ny = (cos * (ry - rcy)) - (sin * (x - cx)) + rcy;
        return {x: nx, y: -ny};
    }

    var e = {
        x0: Number.MAX_VALUE,
        x1: -Number.MAX_VALUE,
        y0: Number.MAX_VALUE,
        y1: -Number.MAX_VALUE,
    };

    // find extents of locations.
    nodes.forEach( function(n) {
        e.x0 = Math.min(e.x0, n.x);
        e.x1 = Math.max(e.x1, n.x);
        e.y0 = Math.min(e.y0, n.y);
        e.y1 = Math.max(e.y1, n.y);
    });

    var center = {
        x: e.x1 - e.x0,
        y: e.y1 - e.y0,
    };

    var farthest = {
        distance: 0,
        node: null,
    };

    // find farthest node
    nodes.forEach( function(n) {
        var xd = n.x - center.x;
        var yd = n.y - center.y;
        var len = Math.sqrt(xd * xd + yd * yd);

        if (farthest.distance < len) {
            farthest.distance = len;
            farthest.node = n;
        }
    });

    // calculate angle difference to put farthest node in bottom right
    var angle =
        Math.atan2(-farthest.node.y + center.y, farthest.node.x - center.x) -
        Math.atan2(-height, width);

    // rotate
    nodes.forEach( function(n) {
        var newxy = rotate(center.x, center.y, n.x, n.y, angle);

        n.x = newxy.x;
        n.y = newxy.y;
    });

    e = {
        x0: Number.MAX_VALUE,
        x1: -Number.MAX_VALUE,
        y0: Number.MAX_VALUE,
        y1: -Number.MAX_VALUE,
    };

    // find extents of geometry.
    nodes.forEach( function(n) {
        e.x0 = Math.min(e.x0, n.x - 0.5 * n.width);
        e.x1 = Math.max(e.x1, n.x + 0.5 * n.width);
        e.y0 = Math.min(e.y0, n.y - 0.5 * n.height);
        e.y1 = Math.max(e.y1, n.y + 0.5 * n.height);
    });

    // translate
    nodes.forEach( function(n) {
        n.x = (n.x - e.x0);
        n.y = (n.y - e.y0);
    });

    // DEBUG
    // farthest.node.group = 'far';
};

/**
 * @export
 * @type {ColaSystem}
 */
module.exports = ColaSystem;
