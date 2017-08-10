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

const circleRadians = Math.PI * 2;

/**
 * Draws a circle.
 */
export class Circle extends Primitive {
    /**
     * The radians needed to draw a circle. 360deg or PI * 2
     * @type {Number}
     */
    static get circleRadians() {
        return circleRadians;
    }

    /**
     * @param {Number} radius - The radius of this circle.
     * @param {Object=} options - The rendering options for this object.
     * @constructor
     */
    constructor(radius, options) {
        super(options);
        this.mRadius = radius;
        this.size.set(radius * 2, radius * 2);
    }

    /**
     * Destroys this object. Called automatically when the reference count of this object reaches zero.
     *
     * @method destroy
     */
    destroy() {
        delete this.mRadius;
        super.destroy();
    }

    /**
     * @type {Number}
     */
    get radius() {
        return this.mRadius;
    }

    /**
     * @param {Number} value - The new radius of this circle.
     */
    set radius(value) {
        if (value !== this.mRadius) {
            this.mRadius = value;
            this.size.set(this.mRadius * 2, this.mRadius * 2);
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
            if (options.strokeType === Circle.STROKE_INNER) {
                radius -= options.stroke * 0.5;
            } else if (options.strokeType === Circle.STROKE_OUTER) {
                radius += options.stroke * 0.5;
            }
        }

        radius = Math.max(radius, 0);

        context.beginPath();
        context.arc(this.mRadius, this.mRadius, radius, 0, circleRadians, false);
        context.closePath();
    }
}

export default Circle;
