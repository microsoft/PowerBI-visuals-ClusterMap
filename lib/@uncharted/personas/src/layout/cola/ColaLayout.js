/**
 * Copyright (c) 2017 Uncharted Software Inc.
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

import Layout from '../Layout.js';
import Cola from 'webcola';
import Easing from '../../revi/plugins/easing/Easing.js';
import EasingEvents from '../../revi/plugins/easing/Events.js';
import EasingTypes from '../../revi/plugins/easing/EasingTypes.js';

export class ColaLayout extends Layout {
    /**
     * @param {Number} width - The desired with of the layout.
     * @param {Number} height - The desired height of the layout.
     * @constructor
     */
    constructor(width, height) {
        super(width, height);
    }

    /**
     * Destroys this object. Called automatically when the reference count of this object reaches zero.
     *
     * @method destroy
     */
    destroy() {
        super.destroy();
    }

    /**
     * Adds a persona to this layout.
     *
     * @method addPersona
     * @param {Persona} persona - The persona to add to the layout.
     * @returns {LayoutObject}
     */
    addPersona(persona) {
        this.addChild(persona);
        return super.addPersona(persona);
    }

    /**
     * Remove the specified persona from this layout.
     *
     * @method removePersona
     * @param {Persona} persona - The persona to remove.
     */
    removePersona(persona) {
        this.removeChild(persona);
        super.removePersona(persona);
    }

    /**
     * Removes all personas from this layout.
     *
     * @method removeAllPersonas
     */
    removeAllPersonas() {
        this.removeChildren();
        super.removeAllPersonas();
    }

    /**
     * Positions the objects in this layout.
     *
     * @method positionObjects
     * @param {Boolean} animated - Should the objects be animated after being positioned.
     * @param {Boolean=} skipFit - Specific to this layout system, should the fit function be skipped.
     */
    positionObjects(animated, skipFit = false) {
        const nodes = [];
        const links = [];
        const width = this.size.width;
        const height = this.size.height;

        this.personas.forEach(wrapper => {
            const node = this._createNodeData(wrapper);
            if (node) {
                if (node.id === undefined) {
                    node.id = 'unknown_' + nodes.length;
                }
                nodes.push(node);
                links.push.apply(links, this._processLinksData(wrapper));
            }
        });


        for (let i = 0; i < links.length; ++i) {
            const link = links[i];
            link.source = this._findNode(nodes, link.source);
            link.target = this._findNode(nodes, link.target);
            if (!link.target || !link.source) {
                links.splice(i--, 1);
            }
        }

        const layout = new Cola.Layout();
        layout.nodes(nodes);
        layout.links(links);
        layout.size([width, height]);
        layout.avoidOverlaps(true);
        layout.linkDistance(l => (l.source.width * 0.4 + l.target.width * 0.4));
        layout.start(25, 0, 10, 0, false);
        if (!skipFit) {
            // this._fit(nodes, width, height);
        }

        const easingType = EasingTypes.Back.EaseOut;
        const easing = Easing.instance(this.reviContext, {
            type: easingType,
            duration: 300,
        });
        let hasAnimations = false;

        nodes.forEach(node => {
            const wrapper = node.wrapper;
            wrapper.updatePosition();
            wrapper.objectPosition.set(node.x, node.y);

            if (animated) {
                if (this.newObjects.indexOf(wrapper) !== -1) {
                    wrapper.updatePosition();
                }
                hasAnimations = wrapper.animate(easing) || hasAnimations;
            } else {
                wrapper.updateValues();
            }
        });

        if (hasAnimations) {
            easing.on([EasingEvents.EASING_END, EasingEvents.EASING_STOP], () => {
                const index = this.mAnimations.indexOf(easing);
                if (index !== -1) {
                    this.mAnimations.splice(index, 1);
                }
            });
            this.mAnimations.push(easing);
            easing.start();
        }

        this.clearNewObjects();
    }

    /**
     * Creates graph node data from a persona in the layout.
     *
     * @method _createNodeData
     * @param {LayoutObject} wrapper - The persona wrapper from which the data will be extracted.
     * @returns {{wrapper: *, id: String, x: number, y: number, width: number, height: number}}
     * @private
     */
    _createNodeData(wrapper) {
        return {
            wrapper: wrapper,
            id: wrapper.id,
            x: wrapper.position.x,
            y: wrapper.position.y,
            width: wrapper.object.size.width,
            height: wrapper.object.size.height,
        };
    }

    /**
     * Extracts the links data from a persona in the layout.
     *
     * @method _processLinksData
     * @param {LayoutObject} wrapper - The persona from which the data will be extracted.
     * @returns {Array}
     * @private
     */
    _processLinksData(wrapper) {
        const links = [];
        wrapper.object.links.forEach(link => {
            links.push({
                source: wrapper.object.id,
                target: link.target,
                weight: link.weight ? link.weight : null,
                length: link.length ? link.length : null,
            });
        });
        return links;
    }

    /**
     * Given a `nodes` array it finds the needle by comparing it to the id or the object in each node.
     *
     * @method _findNode
     * @param {Array} nodes - An array of graph nodes.
     * @param {String|Object} needle - An object id as a string or the actual object to look for.
     * @returns {Object|null}
     * @private
     */
    _findNode(nodes, needle) {
        for (var i = 0, n = nodes.length; i < n; ++i) {
            if (nodes[i].id === needle || nodes[i].wrapper === needle) {
                return nodes[i];
            }
        }
        return null;
    }

    /**
     * Rotates the given nodes to better fit in the given space.
     * NOTE: Updates nodes in place.
     *
     * @param {Array<{x: number, y: number, width: number, height: number}>} nodes - The nodes to fit in the given space.
     * @param {number} width - The width to fit into.
     * @param {number} height - The height to fit into.
     * @private
     */
    _fit(nodes, width, height) {
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
        nodes.forEach( n => {
            e.x0 = Math.min(e.x0, n.x);
            e.x1 = Math.max(e.x1, n.x);
            e.y0 = Math.min(e.y0, n.y);
            e.y1 = Math.max(e.y1, n.y);
        });

        var center = {
            x: (e.x1 - e.x0) * 0.5,
            y: (e.y1 - e.y0) * 0.5,
        };

        var farthest = {
            distance: 0,
            node: null,
        };

        // find farthest node
        nodes.forEach( n => {
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
        nodes.forEach( n => {
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
        nodes.forEach( n => {
            e.x0 = Math.min(e.x0, n.x - 0.5 * n.width);
            e.x1 = Math.max(e.x1, n.x + 0.5 * n.width);
            e.y0 = Math.min(e.y0, n.y - 0.5 * n.height);
            e.y1 = Math.max(e.y1, n.y + 0.5 * n.height);
        });

        // translate
        nodes.forEach( n => {
            n.x = (n.x - e.x0);
            n.y = (n.y - e.y0);
        });

        // DEBUG
        // farthest.node.group = 'far';
    }
}

export default ColaLayout;
