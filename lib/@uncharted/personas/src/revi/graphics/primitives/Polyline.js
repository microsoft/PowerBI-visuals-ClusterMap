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
import Point from '../../geometry/Point.js';

/**
 * Class to draw a line going through multiple vertices. This is the base class of all the other primitives that are
 * rendered based on vertices.
 *
 * @class Polyline
 */
export class Polyline extends Primitive {
    /**
     * @param {Object} options - The rendering options for this object.
     * @param {...Point} vertices - The vertices of this line.
     * @constructor
     */
    constructor(options, ...vertices) {
        super(options);
        this.mVertices = [];
        this.mTempPoint01 = new Point();
        const vertexArray = vertices[0] instanceof Array ? vertices[0] : vertices;
        vertexArray.forEach(point => this.mVertices.push(Point.fromPoint(point)));
    }

    /**
     * Destroys this object. Called automatically when the reference count of this object reaches zero.
     *
     * @method destroy
     */
    destroy() {
        this.mVertices.forEach(point => point.release());
        this.mVertices.length = 0;
        this.mTempPoint01.release();

        delete this.mVertices;
        delete this.mTempPoint01;

        super.destroy();
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
        if (this.mVertices.length) {
            context.beginPath();
            const vertex = this.mTempPoint01;
            this._getVertexInPixels(this.mVertices[0], vertex);
            context.moveTo(vertex.x, vertex.y);
            for (let i = 1, n = this.mVertices.length; i < n; ++i) {
                this._getVertexInPixels(this.mVertices[i], vertex);
                context.lineTo(vertex.x, vertex.y);
            }
            if (options.closePath) {
                context.closePath();
            }
        }
    }

    /**
     * Applies the fill, stroke, etc. as described in the provided `options` object.
     *
     * @method _applyRenderOptions
     * @param {CanvasRenderingContext2D} context - The canvas context in which the drawing operations will be performed.
     * @param {Object} options - The rendering options for this shape.
     * @private
     */
    _applyRenderOptions(context, options) {
        if (options.strokeType && options.stroke > 0) {
            context.lineCap = options.lineCapType;
            context.strokeStyle = options.strokeColor;
            if (options.strokeType === Polyline.STROKE_INNER) {
                if (options.fillEnabled) {
                    context.fillStyle = options.fillColor;
                    context.fill();
                }
                context.lineWidth = options.stroke * 2;
                context.save();
                context.clip();
                context.stroke();
                context.restore();
            } else if (options.strokeType === Polyline.STROKE_OUTER) {
                context.lineWidth = options.stroke * 2;
                context.stroke();
                if (options.fillEnabled) {
                    context.fillStyle = options.fillColor;
                    context.fill();
                }
            } else {
                if (options.fillEnabled) {
                    context.fillStyle = options.fillColor;
                    context.fill();
                }
                context.lineWidth = options.stroke;
                context.stroke();
            }
        } else if (options.fillEnabled) {
            context.fillStyle = options.fillColor;
            context.fill();
        }
    }

    _getVertexInPixels(vertex, point) {
        const x = this.parent && vertex.xUnits === Point.UNIT_TYPE_PERCENTAGE ? this.parent.pixelSize.width * vertex.x : vertex.x;
        const y = this.parent && vertex.yUnits === Point.UNIT_TYPE_PERCENTAGE ? this.parent.pixelSize.height * vertex.y : vertex.y;
        point.set(x, y);
    }
}

export default Polyline;
