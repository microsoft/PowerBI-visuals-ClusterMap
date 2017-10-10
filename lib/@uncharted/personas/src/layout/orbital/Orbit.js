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

import Node from '../../revi/graphics/Node.js';

/**
 * Class to position objects along a circle in an orbital fashion.
 * Used in Orbital layout systems.
 *
 * @class Orbit
 */
export class Orbit extends Node {
    /**
     * @param {Number} radius - The radius of this orbit.
     */
    constructor(radius = 0) {
        super('50%', '50%');

        this.mInnerRadius = radius;
        this.mOuterRadiusOffset = 0;
        this.mFilledAngle = 0;
        this.mDistributeEvenly = true;

        this.anchor.set(0, 0);
    }

    /**
     * Destroys this object. Called automatically when the reference count of this object reaches zero.
     *
     * @method destroy
     */
    destroy() {
        delete this.mInnerRadius;
        delete this.mOuterRadiusOffset;
        delete this.mFilledAngle;
        delete this.mDistributeEvenly;

        super.destroy();
    }

    /**
     * Gets the inner radius, or minimum radius, of this orbit.
     *
     * @type {Number}
     */
    get innerRadius() {
        return this.mInnerRadius;
    }

    /**
     * Gets the inner radius, or minimum radius, of this orbit.
     *
     * @param {Number} value - The new value.
     */
    set innerRadius(value) {
        if (value !== this.mInnerRadius) {
            this.mInnerRadius = value;
            this._positionObjects();
        }
    }

    /**
     * Gets the radius, or maximum radius, of this orbit.
     *
     * @type {Number}
     */
    get radius() {
        return this.mInnerRadius + this.mOuterRadiusOffset;
    }

    /**
     * Gets the center radius that goes through the center of all the objects in this orbit.
     *
     * @type {Number}
     */
    get centerRadius() {
        return this.mInnerRadius + (this.mOuterRadiusOffset * 0.5);
    }

    /**
     * Should the objects added to this orbit be distributed evenly across the orbit or stacked as they are added.
     *
     * @type {Boolean}
     */
    get distributeEvenly() {
        return this.mDistributeEvenly;
    }

    /**
     * Sets if the objects added to this orbit should be distributed evenly across the orbit or stacked as they are added.
     *
     * @param {Boolean} value - The new value.
     */
    set distributeEvenly(value) {
        if (value !== this.mDistributeEvenly) {
            this.mDistributeEvenly = value;
            this._positionObjects();
        }
    }

    /**
     * Adds a new object to this orbit if possible and returns a boolean representing if the object was added or not.
     *
     * @method addObject
     * @param {Node} object - The object to add, must contain a `safeRadius` or `radius` property.
     * @param {Boolean} calculatePositions - Should object positions be re-calculated as they are added.
     * @returns {Boolean}
     */
    addObject(object, calculatePositions = false) {
        const objectRadius = object.safeRadius || object.radius;
        if (objectRadius === undefined) {
            throw new Error('Only objects with a radius can be added to an Orbit.');
        }

        const objectSize = objectRadius * 2;
        let radiusOffset;
        let filledAngle;

        if (this.mInnerRadius === 0) {
            radiusOffset = objectRadius;
            filledAngle = this.mFilledAngle;
        } else if (objectSize > this.mOuterRadiusOffset) {
            radiusOffset = objectSize;
            filledAngle = this._calculateFilledAngle(objectSize);
        } else {
            radiusOffset = this.mOuterRadiusOffset;
            filledAngle = this.mFilledAngle;
        }

        const objectAngle = this.calculateObjectAngle(objectRadius, this.mInnerRadius + radiusOffset * 0.5);
        if (filledAngle + objectAngle <= Math.PI * 2) {
            this.mOuterRadiusOffset = radiusOffset;
            this.mFilledAngle = filledAngle + objectAngle;
            this.addChild(object);

            if (calculatePositions) {
                this._positionObjects();
            }
            return true;
        }
        return false;
    }

    /**
     * Removes the given object from this orbit. Returns a boolean that represents whether or not the object was removed.
     *
     * @method removeObject
     * @param {Node} object - The object to remove.
     * @returns {Boolean}
     */
    removeObject(object) {
        const children = this.mChildren;
        for (let i = 0, n = children.length; i < n; ++i) {
            const child = children[i];
            if (child === object) {
                this.removeChildAt(i);
                return true;
            } else if (child.removeObject && child.removeObject(object)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Removes all objects from this orbit.
     *
     * @method removeAllObjects
     */
    removeAllObjects() {
        this.removeChildren();
    }

    /**
     * Checks if this orbit contains the specified object.
     *
     * @method containsObject
     * @param {Node} object - the object to look for.
     * @returns {Boolean}
     */
    containsObject(object) {
        const children = this.mChildren;
        for (let i = 0, n = children.length; i < n; ++i) {
            var child = children[i];
            if (child === object || (child.containsObject && child.containsObject(object))) {
                return true;
            }
        }
        return false;
    }

    /**
     * Calculates the angle an object with the given radius would fill if it was added to this an orbit with the given center radius.
     *
     * @method calculateObjectAngle
     * @param {Number} objectRadius - The radius of the object to compute the angle for.
     * @param {Number} centerRadius - The center radius of the orbit the object would be added to.
     * @returns {Number}
     */
    calculateObjectAngle(objectRadius, centerRadius) {
        if (objectRadius > centerRadius) {
            return Math.PI * 2;
        }
        return Math.asin(objectRadius / centerRadius) * 2;
    }

    /**
     * Called every tick, drawing operations should be performed here.
     *
     * @method draw
     * @param {CanvasRenderingContext2D} context - The canvas context in which the drawing operations will be performed.
     * @param {MatrixStack} matrixStack - The matrix stack used for drawing.
     * @param {Boolean} startDrawTime - The time at which personas started to be drawn.
     */
    draw(context, matrixStack, startDrawTime) {
        for (this._mID = 0, this._mND = this.mChildren.length; this._mID < this._mND; ++this._mID) {
            this.mChildren[this._mID]._pushTransform(context, matrixStack);
            this.mChildren[this._mID].draw(context, matrixStack, startDrawTime);
            this.mChildren[this._mID]._popTransform(context, matrixStack);
        }
    }

    /**
     * Calculates how much of this orbit's 360 degrees would be filled by its objects if its outer radius was positioned
     * at its center radius plus the provided radius offset.
     *
     * @method _calculateFilledAngle
     * @param {Number} radiusOffset - The radius offset to use for the calculation.
     * @returns {Number}
     * @private
     */
    _calculateFilledAngle(radiusOffset) {
        const centerRadius = this.mInnerRadius + radiusOffset * 0.5;
        let totalRadius = 0;
        for (let i = 0, n = this.mChildren.length; i < n; ++i) {
            const child = this.mChildren[i];
            const radius = child.safeRadius || child.radius || 0;
            totalRadius += this.calculateObjectAngle(radius, centerRadius);
        }
        return totalRadius;
    }

    /**
     * Positions the objects in this orbit.
     *
     * @method _positionObjects
     * @private
     */
    _positionObjects() {
        const centerX = this.pixelSize.width;
        const centerY = this.pixelSize.height;
        if (this.mInnerRadius === 0 && this.mChildren.length) {
            const child = this.mChildren[0];
            child.position.set(centerX, centerY);
        } else {
            const centerRadius = this.centerRadius;
            const step = this.mDistributeEvenly ? ((Math.PI * 2) - this.mFilledAngle) / this.mChildren.length : 0;
            let currentAngle = 0;

            this.mChildren.forEach(child => {
                const radius = child.safeRadius || child.radius || 0;
                const angle = this.calculateObjectAngle(radius, centerRadius);
                currentAngle += angle * 0.5;

                const x = centerX + Math.cos(currentAngle) * centerRadius;
                const y = centerY + Math.sin(currentAngle) * centerRadius;
                child.position.set(x, y);
                currentAngle += step + angle * 0.5;
            });
        }
    }
}

export default Orbit;
