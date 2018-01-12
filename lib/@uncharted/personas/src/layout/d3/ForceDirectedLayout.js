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
import * as d3 from 'd3';

function scale (s, fcn) {
    return elt => s * fcn(elt);
}

function defaultLinkStrength (link) {
    return link.weight;
}

function defaultNodeSize (node) {
    return node.size;
}

function extractGraph (personaWrappers) {
    const nodes = [];
    const links = [];
    var lastNodeX;
    var lastNodeY;
    let nodesColocated = true;
    // First pass for nodes and node id mappings
    personaWrappers.forEach(wrapper => {
        let persona = wrapper.object;
        if (typeof(lastNodeX) !== 'undefined' &&
            typeof(lastNodeY) !== 'undefined' &&
            (lastNodeX !== wrapper.mPosition.x || lastNodeY !== wrapper.mPosition.y)) {
            nodesColocated = false;
        }
        lastNodeX = wrapper.mPosition.x;
        lastNodeY = wrapper.mPosition.y;

        nodes.push({
            id: persona.id,
            size: persona.radius,
            name: persona.mLabel.mName,
            wrapper: wrapper,
        });
    });
    // Second pass for links
    personaWrappers.forEach(wrapper => {
        let persona = wrapper.object;
        persona.links.forEach(link => {
            links.push({
                source: persona.id,
                target: link.target,
                weight: link.strength,
            });
        });
    });

    return {
        nodes: nodes,
        links: links,
        colocated: nodesColocated,
    };
}


export class ForceDirectedLayout extends Layout {
    constructor(width, height) {
        super(width, height);
        this.linkStrengthFcn = defaultLinkStrength;
        this.nodeSizeFcn = defaultNodeSize;
        this.customForceConstructors = {};
    }

    /**
     * Adds a new force to the force layout
     *
     * @param {string} name The name of this force; the simulation uses this to
     *     so it can retrieve or replace a specific force, so this should be
     *     treated as a unique ID.
     * @param {function} forceConstructor A function that takes the list of
     *     nodes, the list of links, the width of the viewport, and the height
     *     of the viewport, and returns a force to apply to the layout.
     * @return {layout} This layout object, for chaining
     */
    addCustomForceConstructor(name, forceConstructor) {
        this.customForceConstructors[name] = (forceConstructor);

        return this;
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
     */
    positionObjects() {
        const graph = extractGraph(this.personas);
        if (!graph.colocated) {
            // graph already laid out
            return;
        }

        const nodes = graph.nodes;
        const links = graph.links;
        const ourWidth = this.size.width;
        const ourHeight = this.size.height;

        // Figure out link scale (max link should have strength 1)
        let maxLinkStrength = 0;
        links.forEach(link => {
            maxLinkStrength = Math.max(maxLinkStrength, this.linkStrengthFcn(link));
        });

        // Create our simulation
        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links)
                .id(node => node.id)
                .strength(scale(1.0 / maxLinkStrength, this.linkStrengthFcn))
                .distance(link => {
                    if (link.source.id === link.target.id) {
                        return 0;
                    }
                    return 30;
                }))
            .force('charge', d3.forceManyBody())
            .force('collide', d3.forceCollide(this.nodeSizeFcn))
            .force('center', d3.forceCenter());
        Object.getOwnPropertyNames(this.customForceConstructors).forEach(forceName => {
            let force = this.customForceConstructors[forceName](nodes, links, ourWidth, ourHeight);
            simulation.force(forceName, force);
        });
        simulation.alpha(1.0).stop();

        // Seed random initial positions
        nodes.forEach(node => {
            node.x = Math.random() * ourWidth;
            node.y = Math.random() * ourHeight;
            node.vx = 0;
            node.vy = 0;
        });

        // Run our simulation
        while (simulation.alpha() > 0.1) {
            simulation.tick();
        }
        simulation.stop();

        // Copy positions back into personas
        nodes.forEach(node => {
            const wrapper = node.wrapper;
            wrapper.updatePosition();
            wrapper.objectPosition.set(node.x, node.y);
            wrapper.updateValues();
        });
        this.clearNewObjects();
    }
}

export default ForceDirectedLayout;
