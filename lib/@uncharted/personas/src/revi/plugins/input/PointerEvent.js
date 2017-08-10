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

import IObject from '../../core/IObject.js';
import Point from '../../geometry/Point.js';

/**
 * Utility class used to describe a mouse or touch event.
 */
export class PointerEvent extends IObject {
    /**
     * @param {String} type - The event type this pointer represents.
     * @param {Number} x - The X coordinate of the event.
     * @param {Number} y - The Y coordinate of the event.
     * @param {Number} identifier - A number identifying the mouse or touch which triggered this event.
     * @param {Number} timestamp - the timestamp of this event.
     */
    constructor(type, x, y, identifier, timestamp) {
        super();
        this.mType = type;
        this.mPoint = new Point(x, y);
        this.mIdentifier = identifier;
        this.mTimestamp = timestamp;

        this.mPoint.freezeValues();
    }

    /**
     * Destroys this object. Called automatically when the reference count of this object reaches zero.
     *
     * @method destroy
     */
    destroy() {
        this.mPoint.unfreezeValues();
        this.mPoint.release();

        delete this.mType;
        delete this.mPoint;
        delete this.mIdentifier;
        delete this.mTimestamp;

        super.destroy();
    }

    /**
     * The event type this pointer event represents.
     *
     * @type {String}
     */
    get type() {
        return this.mType;
    }

    /**
     * The point where this event originated.
     *
     * @type {Point}
     */
    get point() {
        return this.mPoint;
    }

    /**
     * The X coordinate of this event.
     *
     * @type {Number}
     */
    get x() {
        return this.mPoint.x;
    }

    /**
     * The Y coordinate of this event.
     *
     * @type {Number}
     */
    get y() {
        return this.mPoint.y;
    }

    /**
     * A number taht identifies the mouse or touch that triggered this event.
     *
     * @type {Number}
     */
    get identifier() {
        return this.mIdentifier;
    }

    /**
     * The timestamp of this event.
     *
     * @type {Number}
     */
    get timestamp() {
        return this.mTimestamp;
    }
}

export default PointerEvent;
