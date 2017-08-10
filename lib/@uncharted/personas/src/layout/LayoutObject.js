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

import IObject from '../revi/core/IObject.js';
import Point from '../revi/geometry/Point.js';
import EasingEvents from '../revi/plugins/easing/Events.js';

/**
 * Wrapper class for objects (personas) added to layouts.
 *
 * @class LayoutObject
 */
export class LayoutObject extends IObject {
    /**
     * Wraps an object and keeps track of its position, radius and safeRadius properties.
     *
     * @param {*} object - The object to be wrapped.
     */
    constructor(object) {
        super();
        this.mObject = object.retain();
        this.mPosition = new Point(object.position.x, object.position.y);
        this.mRadius = object.radius;
        this.mSafeRadius = object.safeRadius;
    }

    /**
     * Destroys this object. Called automatically when the reference count of this object reaches zero.
     *
     * @method destroy
     */
    destroy() {
        this.mObject.release();
        this.mPosition.release();

        delete this.mObject;
        delete this.mPosition;
        delete this.mRadius;
        delete this.mSafeRadius;

        super.destroy();
    }

    /**
     * Returns the id property of the wrapped object.
     *
     * @type {String}
     */
    get id() {
        return this.mObject.id;
    }

    /**
     * The wrapped object.
     *
     * @type {*}
     */
    get object() {
        return this.mObject;
    }

    /**
     * The position of the wrapped object.
     *
     * @type {Point}
     */
    get objectPosition() {
        return this.mObject.position;
    }

    /**
     * The last tracked position of the wrapped object.
     *
     * @type {Point}
     */
    get position() {
        return this.mPosition;
    }

    /**
     * The radius of te wrapped object.
     *
     * @type {Number}
     */
    get objectRadius() {
        return this.mObject.radius;
    }

    /**
     * The last tracked radius of the wrapped object.
     *
     * @type {Number}
     */
    get radius() {
        return this.mRadius;
    }

    /**
     * The safe radius of the wrapped object.
     *
     * @type {Number}
     */
    get objectSafeRadius() {
        return this.mObject.safeRadius;
    }

    /**
     * The last tracked safe radius of the wrapped object.
     *
     * @type {Number}
     */
    get safeRadius() {
        return this.mSafeRadius;
    }

    /**
     * Updates the tracked radius and tracked radius to be the same as the current values of the wrapped object.
     *
     * @method updateRadius
     */
    updateRadius() {
        this.mRadius = this.mObject.radius;
        this.mSafeRadius = this.mObject.safeRadius;
    }

    /**
     * Updates the tracked position to be the same as the current value od the wrapped object.
     *
     * @method updatePosition
     */
    updatePosition() {
        this.mPosition.set(this.mObject.position.x, this.mObject.position.y);
    }

    /**
     * Updates the tracked radius and position to be the same as the current values of the wrapped object.
     *
     * @method updateValues
     */
    updateValues() {
        this.updateRadius();
        this.updatePosition();
    }

    /**
     * If there is a difference between the tracked values and the current object values, this method animates the object's
     * values from the last tracked values to the new values assigned to the object currently. The animations are created
     * using the provided easing instance.
     * Returns a boolean representing whether or not animations were created.
     *
     * @method animate
     * @param {Easing} easing - The easing that will control the progress of the animations, if any.
     * @returns {Boolean}
     */
    animate(easing) {
        let hasAnimations = false;

        if (this.radius !== this.objectRadius) {
            const startRadius = this.radius;
            const changeRadius = this.objectRadius - startRadius;

            this.object.radius = this.radius;
            easing.on(EasingEvents.EASING_UPDATE, (sender, progress) => {
                this.object.radius = startRadius + changeRadius * progress;
            });

            easing.on([EasingEvents.EASING_END, EasingEvents.EASING_STOP], () => {
                this.updateRadius();
            });

            hasAnimations = true;
        }

        if (this.position.x !== this.objectPosition.x || this.position.y !== this.objectPosition.y) {
            const startX = this.position.x;
            const startY = this.position.y;
            const changeX = this.objectPosition.x - startX;
            const changeY = this.objectPosition.y - startY;

            this.object.position.set(this.position.x, this.position.y);
            easing.on(EasingEvents.EASING_UPDATE, (sender, progress) => {
                this.object.position.set(startX + changeX * progress, startY + changeY * progress);
            });

            easing.on([EasingEvents.EASING_END, EasingEvents.EASING_STOP], () => {
                this.updatePosition();
            });

            hasAnimations = true;
        }

        return hasAnimations;
    }
}

export default LayoutObject;
