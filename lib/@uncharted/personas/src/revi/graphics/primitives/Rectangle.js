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
 * Utility class to draw a rectangle.
 *
 * @class Rectangle
 */
export class Rectangle extends Primitive {
    /**
     * @param {Number|String} width - The width of the rectangle.
     * @param {Number|String} height - The height of the rectangle.
     * @param {Object=} options - An object containing the options to draw this primitive.
     * @constructor
     */
    constructor(width, height, options) {
        super(options);
        this.size.set(width, height);
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
        let offset = 0;
        if (options.strokeType) {
            if (options.strokeType === Rectangle.STROKE_INNER) {
                offset -= options.stroke * 0.5;
            } else if (options.strokeType === Rectangle.STROKE_OUTER) {
                offset += options.stroke * 0.5;
            }
        }

        context.beginPath();
        context.rect(-offset, -offset, this.pixelSize.width + (offset * 2), this.pixelSize.height + (offset * 2));
        context.closePath();
    }
}

export default Rectangle;
