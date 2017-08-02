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

import Node from '../revi/graphics/Node.js';
import LayoutObject from './LayoutObject.js';
import PersonaEvents from '../persona/Persona.js';

/**
 * Base class for all persona layouts.
 *
 * @class Layout
 */
export class Layout extends Node {
    /**
     * @param {Number} width - The desired with of the layout.
     * @param {Number} height - The desired height of the layout.
     * @constructor
     */
    constructor(width, height) {
        super(width, height);
        this.anchor.set(0, 0);

        this.mAlpha = 1;
        this.mAnimations = [];
        this.mPersonas = [];
        this.mNewObjects = [];
    }

    /**
     * Destroys this object. Called automatically when the reference count of this object reaches zero.
     *
     * @method destroy
     */
    destroy() {
        this.cancelAnimations();
        this.removeAllPersonas();

        delete this.mAlpha;
        delete this.mAnimations;
        delete this.mPersonas;
        delete this.mNewObjects;

        super.destroy();
    }

    /**
     * An array containing the personas in this layout.
     *
     * @type {Array}
     */
    get personas() {
        return this.mPersonas;
    }

    /**
     * An array containing all the objects recently added to this layout.
     *
     * @type {Array}
     */
    get newObjects() {
        return this.mNewObjects;
    }

    /**
     * An array containing the easings that drive the animations of this layout.
     *
     * @type {Array}
     */
    get animations() {
        return this.mAnimations;
    }

    /**
     * This node's boundingBox in non-scaled space.
     *
     * @readonly
     * @type {BoundingBox}
     */
    get boundingBox() {
        if (this.mPersonas && this.mPersonas.length) {
            let minX = Number.MAX_VALUE;
            let minY = Number.MAX_VALUE;
            let maxX = Number.MIN_VALUE;
            let maxY = Number.MIN_VALUE;

            this.mPersonas.forEach(wrapper => {
                const persona = wrapper.object;
                const halfWidth = persona.size.width * 0.5;
                const halfHeight = persona.size.height * 0.5;

                minX = Math.min(persona.position.x - halfWidth, minX);
                minY = Math.min(persona.position.y - halfHeight, minY);

                maxX = Math.max(persona.position.x + halfWidth, maxX);
                maxY = Math.max(persona.position.y + halfHeight, maxY);
            });

            super.boundingBox.set(minX, minY, maxX - minX, maxY - minY);
        }

        return super.boundingBox;
    }

    /**
     * Gets the alpha value that this layout will be rendered at.
     *
     * @type {Number}
     */
    get alpha() {
        return this.mAlpha;
    }

    /**
     * Sets the alpha value that this layout will be rendered at.
     *
     * @param {Number} value - The new value.
     */
    set alpha(value) {
        if (value !== this.mAlpha) {
            this.mAlpha = value;
            this.needsRedraw();
        }
    }

    /**
     * Adds a persona to this layout.
     *
     * @method addPersona
     * @param {Persona} persona - The persona to add to the layout.
     * @returns {LayoutObject}
     */
    addPersona(persona) {
        const wrapper = new LayoutObject(persona);
        this.mPersonas.push(wrapper);
        this.mNewObjects.push(wrapper);
        this.forward(persona, PersonaEvents.PERSONA_CLICKED);
        return wrapper;
    }

    /**
     * Remove the specified persona from this layout.
     *
     * @method removePersona
     * @param {Persona} persona - The persona to remove.
     */
    removePersona(persona) {
        const objectIndex = this.mNewObjects.findIndex(wrapper => wrapper.object === persona);
        if (objectIndex !== -1) {
            this.mNewObjects.splice(objectIndex, 1);
        }
        const personaIndex = this.mPersonas.findIndex(wrapper => wrapper.object === persona);
        if (personaIndex !== -1) {
            this.mPersonas[personaIndex].release();
            this.mPersonas.splice(personaIndex, 1);
        }
        this.unforward(persona, PersonaEvents.PERSONA_CLICKED);
    }

    /**
     * Removes all personas from this layout.
     *
     * @method removeAllPersonas
     */
    removeAllPersonas() {
        this.clearNewObjects();
        while (this.mPersonas.length) {
            const wrapper = this.mPersonas.pop();
            this.unforward(wrapper.object, PersonaEvents.PERSONA_CLICKED);
            wrapper.release();
        }
    }

    /**
     * Clears the new objects array.
     *
     * @method clearNewObjects
     */
    clearNewObjects() {
        this.mNewObjects.length = 0;
    }

    /**
     * Cancels all running animations in this layout.
     *
     * @method cancelAnimations
     */
    cancelAnimations() {
        while (this.mAnimations.length) {
            const easing = this.mAnimations.pop();
            if (easing.retainCount) {
                easing.stop();
            }
        }
    }

    /**
     * Returns the persona scale, modified if this layout type requires it.
     *
     * @method personaScale
     * @param {Number} dataScale - The initial scale of the persona.
     * @returns {Number}
     */
    personaScale(dataScale) {
        return dataScale;
    }

    /**
     * Positions the objects in this layout.
     *
     * @method positionObjects
     * @param {Boolean} animated - Should the objects be animated after being positioned.
     */
    positionObjects(/* animated */) {
        throw new Error('not implemented');
    }

    /**
     * Called every tick, drawing operations should be performed here.
     *
     * @method draw
     * @param {CanvasRenderingContext2D} context - The canvas context in which the drawing operations will be performed.
     * @param {MatrixStack} matrixStack - The matrix stack used for drawing.
     */
    draw(context, matrixStack) {
        const oldAlpha = context.globalAlpha;
        context.globalAlpha = oldAlpha * this.mAlpha;
        super.draw(context, matrixStack);
        context.globalAlpha = oldAlpha;
    }
}

export default Layout;
