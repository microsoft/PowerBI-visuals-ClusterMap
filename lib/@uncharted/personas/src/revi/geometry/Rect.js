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

import IBindable from '../core/IBindable.js';
import Point from './Point.js';
import Size from './Size.js';
import Events from './Events.js';

/**
 * Utility class that represents a bounding box in 2D space.
 *
 * @class BoundingBox
 */
export class Rect extends IBindable {
    /**
     * @constructor
     * @param {Number=} x - X coordinate of the bounding box's origin.
     * @param {Number=} y - Y coordinate of the bounding box's origin.
     * @param {Number=} width - The bounding box's width.
     * @param {Number=} height - The bounding box's height.
     */
    constructor(x, y, width, height) {
        super();
        this.mOrigin = new Point(x, y);
        this.mSize = new Size(width, height);

        this.mForwardEvent = () => this.emit(Events.GEOMETRY_VALUE_CHANGED, this, this.x, this.y, this.width, this.height);
        this.mOrigin.on(Events.GEOMETRY_VALUE_CHANGED, this.mForwardEvent);
        this.mSize.on(Events.GEOMETRY_VALUE_CHANGED, this.mForwardEvent);
    }

    /**
     * @method destroy
     */
    destroy() {
        this.mOrigin.off(Events.GEOMETRY_VALUE_CHANGED, this.mForwardEvent);
        this.mSize.off(Events.GEOMETRY_VALUE_CHANGED, this.mForwardEvent);

        this.mOrigin.release();
        this.mSize.release();

        delete this.mOrigin;
        delete this.mSize;
        delete this.mForwardEvent;

        super.destroy();
    }

    /**
     * The point at which the axis aligned bounding box's origin is at.
     *
     * @type {Point}
     * @readonly
     */
    get origin() {
        return this.mOrigin;
    }

    /**
     * The size of this bounding box.
     * @type {Size}
     * @readonly
     */
    get size() {
        return this.mSize;
    }

    /**
     * X coordinate of the axis aligned bounding box's origin.
     * @type {Number}
     */
    get x() {
        return this.mOrigin.x;
    }

    /**
     * X coordinate of the axis aligned bounding box's origin.
     * @param {Number} value - The new value of the property.
     */
    set x(value) {
        this.mOrigin.x = value;
    }

    /**
     * Y coordinate of the axis aligned bounding box's origin.
     * @type {Number}
     */
    get y() {
        return this.mOrigin.y;
    }

    /**
     * Y coordinate of the axis aligned bounding box's origin.
     * @param {Number} value - The new value of the property.
     */
    set y(value) {
        this.mOrigin.y = value;
    }

    /**
     * The bounding box's width.
     * @type {Number}
     */
    get width() {
        return this.mSize.width;
    }

    /**
     * Sets the bounding box's width.
     * @param {Number} value - The new value of the property.
     */
    set width(value) {
        this.mSize.width = value;
    }

    /**
     * The bounding box's height.
     * @type {Number}
     */
    get height() {
        return this.mSize.height;
    }

    /**
     * Sets the bounding box's height.
     * @param {Number} value - The new value of the property.
     */
    set height(value) {
        this.mSize.height = value;
    }

    /**
     * Sets the x and y coordinates of this bounding box's origin as well as its width and height.
     *
     * @method set
     * @param {Number} x - X coordinate of the origin.
     * @param {Number} y - Y coordinate of the origin.
     * @param {Number} width - The new width.
     * @param {Number} height - The new height.
     * @returns {Rect}
     */
    set(x, y, width, height) {
        this.mOrigin.value1 = x;
        this.mOrigin.value2 = y;
        this.mSize.value1 = width;
        this.mSize.value2 = height;

        this.mForwardEvent();

        return this;
    }

    /**
     * Sets the rects origin and size by copying the values of the supplied rect.
     *
     * @method setFromRect
     * @param {Rect} rect - the rect from which the new values will be copied from.
     * @returns {Rect}
     */
    setFromRect(rect) {
        this.mOrigin.value1 = rect.x;
        this.mOrigin.value2 = rect.y;
        this.mSize.value1 = rect.width;
        this.mSize.value2 = rect.height;

        this.mForwardEvent();

        return this;
    }
}

export default Rect;
