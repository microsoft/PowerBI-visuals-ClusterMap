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

import Primitive from './Primitive.js';

/**
 * Initial offset of the semi-circle so it starts drawing from the top of the circle.
 *
 * @type {Number}
 */
const INITIAL_OFFSET = Math.PI * -0.5;

/**
 * Class used to draw a section of a circle using the provided options.
 *
 * @class SemiCircle
 */
export class SemiCircle extends Primitive {
    /**
     * @param {Number} radius - The radius of the circle this class will be drawing a section of.
     * @param {Number} offset - The offset, in radians, from which the section should start drawing.
     * @param {Number} angle - The angle length, in radians, of the section to draw.
     * @param {Object} options - The rendering options for this object.
     * @constructor
     */
    constructor(radius, offset, angle, options) {
        super(options);
        this.mRadius = radius;
        this.mOffset = offset;
        this.mAngle = angle;
        this.size.set(radius * 2, radius * 2);
    }

    /**
     * Destroys this object. Called automatically when the reference count of this object reaches zero.
     *
     * @method destroy
     */
    destroy() {
        delete this.mRadius;
        delete this.mOffset;
        delete this.mAngle;

        super.destroy();
    }

    /**
     * The radius of the circle this class will be drawing a section of.
     *
     * @type {Number}
     */
    get radius() {
        return this.mRadius;
    }

    /**
     * @param {Number} value - The new radius of the circle this class will be drawing a section of.
     */
    set radius(value) {
        if (value !== this.mRadius) {
            this.mRadius = value;
            this.size.set(this.mRadius * 2, this.mRadius * 2);
            this.needsRedraw();
        }
    }

    /**
     * The offset, in radians, from which the section should start drawing.
     *
     * @type {Number}
     */
    get offset() {
        return this.mOffset;
    }

    /**
     * @param {Number} value - The new offset, in radians, from which the section should start drawing.
     */
    set offset(value) {
        if (value !== this.mOffset) {
            this.mOffset = value;
            this.needsRedraw();
        }
    }

    /**
     * The angle length, in radians, of the section to draw.
     *
     * @type {Number}
     */
    get angle() {
        return this.mAngle;
    }

    /**
     * @param {Number} value - The new angle length, in radians, of the section to draw.
     */
    set angle(value) {
        if (value !== this.mAngle) {
            this.mAngle = value;
            this.needsRedraw();
        }
    }

    /**
     * Renders the path of this shape to the context.
     *
     * @method _renderPath
     * @param {CanvasRenderingContext2D} context - The canvas context in which the drawing operations will be performed.
     * @param {Object} options - The rendering options for this shape.
     * @private
     */
    _renderPath(context, options) {
        let radius = this.mRadius;
        if (options.strokeType) {
            if (options.strokeType === SemiCircle.STROKE_INNER) {
                radius -= options.stroke * 0.5;
            } else if (options.strokeType === SemiCircle.STROKE_OUTER) {
                radius += options.stroke * 0.5;
            }
        }

        radius = Math.max(radius, 0);

        context.beginPath();
        context.arc(this.mRadius, this.mRadius, radius, INITIAL_OFFSET + this.mOffset, INITIAL_OFFSET + this.mOffset + this.mAngle, false);
        if (options.closePath) {
            context.closePath();
        }
    }
}

export default SemiCircle;
