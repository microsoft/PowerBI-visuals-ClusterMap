/**
 * Copyright (c) 2018 Uncharted Software Inc.
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

import Circle from '../revi/graphics/primitives/Circle';

export class Aura extends Circle {
    /**
     * @param {Number} radius - The radius of this circle.
     * @param {Object=} options - The rendering options for this object.
     * @constructor
     */
    constructor(radius, options) {
        super(radius, options);
        this.mAlpha = 1;
    }

    /**
     * Gets the alpha value that this persona will be rendered at.
     *
     * @type {Number}
     */
    get alpha() {
        return this.mAlpha;
    }

    /**
     * Sets the alpha value that this persona will be rendered at.
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

export default Aura;
