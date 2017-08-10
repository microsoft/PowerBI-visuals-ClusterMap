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

import Polyline from './Polyline.js';
import Point from '../../geometry/Point.js';

export class SmoothPolyline extends Polyline {
    /**
     * @param {Object} options - The rendering options for this object.
     * @param {...Point} vertices - The vertices of this line.
     * @constructor
     */
    constructor(options, ...vertices) {
        super(options, ...vertices);

        this.mTempPoint02 = new Point();
    }

    /**
     * Destroys this object. Called automatically when the reference count of this object reaches zero.
     *
     * @method destroy
     */
    destroy() {
        this.mTempPoint02.release();
        delete this.mTempPoint02;
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
            const vertex01 = this.mTempPoint01;
            const vertex02 = this.mTempPoint02;
            this._getVertexInPixels(this.mVertices[0], vertex01);
            context.moveTo(vertex01.x, vertex01.y);
            if (this.mVertices.length > 2) {
                let n = this.mVertices.length - 2;
                for (let i = 1; i < n; ++i) {
                    this._getVertexInPixels(this.mVertices[i], vertex01);
                    this._getVertexInPixels(this.mVertices[i + 1], vertex02);
                    const c = (vertex01.x + vertex02.x) / 2;
                    const d = (vertex01.y + vertex02.y) / 2;
                    context.quadraticCurveTo(vertex01.x, vertex01.y, c, d)
                }
                this._getVertexInPixels(this.mVertices[n], vertex01);
                this._getVertexInPixels(this.mVertices[n + 1], vertex02);
                context.quadraticCurveTo(vertex01.x, vertex01.y, vertex02.x, vertex02.y);
            } else {
                for (let i = 1, n = this.mVertices.length; i < n; ++i) {
                    this._getVertexInPixels(this.mVertices[i], vertex01);
                    context.lineTo(vertex01.x, vertex01.y);
                }
            }

            if (options.closePath) {
                context.closePath();
            }
        }
    }
}

export default SmoothPolyline;
