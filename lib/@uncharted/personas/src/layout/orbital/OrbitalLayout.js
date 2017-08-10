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
import Orbit from './Orbit.js';
import Easing from '../../revi/plugins/easing/Easing.js';
import EasingEvents from '../../revi/plugins/easing/Events.js';
import EasingTypes from '../../revi/plugins/easing/EasingTypes.js';

export class OrbitalLayout extends Layout {
    /**
     * @param {Number} width - The desired with of the layout.
     * @param {Number} height - The desired height of the layout.
     * @param {Number=} orbitPadding - The padding that should be left between orbits.
     * @constructor
     */
    constructor(width, height, orbitPadding = 0) {
        super(width, height);
        this.mPadding = (orbitPadding);

        const orbit = Orbit.instance();
        this.addChild(orbit);
    }

    /**
     * Destroys this object. Called automatically when the reference count of this object reaches zero.
     *
     * @method destroy
     */
    destroy() {
        delete this.mPadding;

        super.destroy();
    }

    /**
     * Gets the total radius of this layout.
     *
     * @type {Number}
     */
    get radius() {
        return this.mChildren[this.mChildren.length - 1].radius;
    }

    /**
     * Gets the padding to be left between orbits.
     *
     * @type {Number}
     */
    get orbitPadding() {
        return this.mPadding;
    }

    /**
     * Sets the padding to be left between orbits.
     *
     * @param {Number} value - The new padding.
     */
    set orbitPadding(value) {
        if (value !== this.mPadding) {
            this.mPadding = value;
            for (let i = 1, n = this.mChildren.length; i < n; ++i) {
                this.mChildren[i].innerRadius = this.mChildren[i - 1].radius + value;
            }
        }
    }

    /**
     * Remove the specified persona from this layout.
     *
     * @method removePersona
     * @param {Persona} persona - The persona to remove.
     */
    removePersona(persona) {
        for (let i = 0, n = this.mChildren.length; i < n; ++i) {
            if (this.mChildren[i].removeObject(persona)) {
                super.removePersona(persona);
            }
        }
    }

    /**
     * Removes all personas from this layout.
     *
     * @method removeAllPersonas
     */
    removeAllPersonas() {
        this._removeAllObjects();
        super.removeAllPersonas();
    }

    /**
     * Positions the objects in this layout.
     *
     * @method positionObjects
     * @param {Boolean} animated - Should the objects be animated after being positioned.
     */
    positionObjects(animated = false) {
        this._removeAllObjects();

        this.personas.sort((a, b) => b.object.radius - a.object.radius);

        let orbit = this.mChildren[this.mChildren.length - 1];
        this.personas.forEach(wrapper => {
            while (!orbit.addObject(wrapper.object, false)) {
                orbit = Orbit.instance(orbit.radius + this.mPadding);
                this.addChild(orbit);
            }
        });

        for (let i = 0, n = this.mChildren.length; i < n; ++i) {
            this.mChildren[i]._positionObjects();
        }

        const easingType = EasingTypes.Back.EaseOut;
        const easing = Easing.instance(this.reviContext, {
            type: easingType,
            duration: 300,
        });
        let hasAnimations = false;

        this.personas.forEach(wrapper => {
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
     * Removes all objects from this layout.
     *
     * @method _removeAllObjects
     * @private
     */
    _removeAllObjects() {
        this.mChildren.forEach(child => child.removeAllObjects && child.removeAllObjects());
        this.removeChildren();

        /* create a new orbit that will be the center orbit */
        const orbit = Orbit.instance();
        this.addChild(orbit);
    }
}

export default OrbitalLayout;
