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

import Rect from './Rect.js';
import Point from './Point.js';

/**
 * Utility class that represents a bounding box in 2D space.
 *
 * @class BoundingBox
 */
export class BoundingBox extends Rect {
    /**
     * @constructor
     * @param {Number=} x - X coordinate of the bounding box's origin.
     * @param {Number=} y - Y coordinate of the bounding box's origin.
     * @param {Number=} width - The bounding box's width.
     * @param {Number=} height - The bounding box's height.
     */
    constructor(x = 0, y = 0, width = 0, height = 0) {
        super(x, y, width, height);

        this.mVertex01 = new Point(x, y);
        this.mVertex02 = new Point(x, y + height);
        this.mVertex03 = new Point(x + width, y);
        this.mVertex04 = new Point(x + width, y + height);
    }

    /**
     * Destroys this object. Called automatically when the reference count of this object reaches zero.
     *
     * @method destroy
     */
    destroy() {
        this.mVertex01.release();
        this.mVertex02.release();
        this.mVertex03.release();
        this.mVertex04.release();

        delete this.mVertex01;
        delete this.mVertex02;
        delete this.mVertex03;
        delete this.mVertex04;
        delete this.mForwardEvent;

        super.destroy();
    }

    /**
     * The first vertex; when untransformed, the top-left corner of the bounding box.
     *
     * @type {Point}
     * @readonly
     */
    get v1() {
        return this.mVertex01;
    }

    /**
     * The second vertex; when untransformed, the top-right corner of the bounding box.
     *
     * @type {Point}
     * @readonly
     */
    get v2() {
        return this.mVertex02;
    }

    /**
     * The third vertex; when untransformed, the bottom-left corner of the bounding box.
     *
     * @type {Point}
     * @readonly
     */
    get v3() {
        return this.mVertex03;
    }

    /**
     * The fourth vertex; when untransformed, the bottom-right corner of the bounding box.
     *
     * @type {Point}
     * @readonly
     */
    get v4() {
        return this.mVertex04;
    }

    /**
     * Sets the x and y coordinates of this bounding box's origin as well as its width and height.
     *
     * @method set
     * @param {Number} x - X coordinate of the origin.
     * @param {Number} y - Y coordinate of the origin.
     * @param {Number} width - The new width.
     * @param {Number} height - The new height.
     * @returns {BoundingBox}
     */
    set(x, y, width, height) {
        this.mOrigin.value1 = x;
        this.mOrigin.value2 = y;
        this.mSize.value1 = width;
        this.mSize.value2 = height;

        this.mVertex01.set(x, y);
        this.mVertex02.set(x, y + height);
        this.mVertex03.set(x + width, y);
        this.mVertex04.set(x + width, y + height);

        this.mForwardEvent();

        return this;
    }

    /**
     * Sets the bounding box's origin, width, and height using the provided bounding box as reference.
     *
     * @method setFromBoundingBox
     * @param {BoundingBox} boundingBox - The boundingBox to use as reference.
     * @returns {BoundingBox}
     */
    setFromBoundingBox(boundingBox) {
        this.mOrigin.value1 = boundingBox.x;
        this.mOrigin.value2 = boundingBox.y;
        this.mSize.value1 = boundingBox.width;
        this.mSize.value2 = boundingBox.height;

        this.mVertex01.setFromPoint(boundingBox.v1);
        this.mVertex02.setFromPoint(boundingBox.v2);
        this.mVertex03.setFromPoint(boundingBox.v3);
        this.mVertex04.setFromPoint(boundingBox.v4);

        this.mForwardEvent();

        return this;
    }

    /**
     * Expands this bounding box to include the given x, y point
     * @param {number} x x coordinate to include in this bounding box
     * @param {number} y y coordinate to include in this bounding box
     */
    include(x, y) {
        const minX = Math.min(this.v1.x, x);
        const minY = Math.min(this.v1.y, y);
        const maxX = Math.max(this.v4.x, x);
        const maxY = Math.max(this.v4.y, y);
        this.set(minX, minY, maxX - minX, maxY - minY);
    }

    /**
     * Expands this bounding box to include the given bounding box
     * @param {BoundingBox} boundingBox bounding box to include in this bounding box
     */
    union(boundingBox) {
        const minX = Math.min(this.v1.x, boundingBox.v1.x);
        const minY = Math.min(this.v1.y, boundingBox.v1.y);
        const maxX = Math.max(this.v4.x, boundingBox.v4.x);
        const maxY = Math.max(this.v4.y, boundingBox.v4.y);
        this.set(minX, minY, maxX - minX, maxY - minY);
    }
}

export default BoundingBox;

