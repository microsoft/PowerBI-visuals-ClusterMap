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

import Point from './Point.js';

/**
 * Utility class that represents the size of 2D objects.
 *
 * @class Size
 */
export class Size extends Point {
    /**
     * @constructor Size
     * @param {Number=} width - The width of this `size` object.
     * @param {Number=} height - The height of this `size` object.
     */
    constructor(width, height) {
        super(width, height);
    }

    /**
     * Gets the width of this `size` object.
     *
     * @type {Number}
     */
    get width() {
        return this.x;
    }

    /**
     * Sets the width of this `size` object.
     *
     * @param {Number} value - The new value of the property.
     */
    set width(value) {
        this.x = value;
    }

    /**
     * Gets the height of this `size` object.
     *
     * @type {Number}
     */
    get height() {
        return this.y;
    }

    /**
     * Sets the height of this `size` object.
     *
     * @param {Number} value - The new value of the property.
     */
    set height(value) {
        this.y = value;
    }
}

export default Size;
