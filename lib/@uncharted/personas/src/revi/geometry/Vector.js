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

export class Vector extends Point {
    /**
     * Creates the vector described between the two passed points and returns it as a new Vector instance.
     *
     * @static
     * @method newFromPoints
     * @param {Point} from - The point representing the origin of the new Point.
     * @param {Point} to - The point representing the destination of the new Point.
     * @returns {Vector}
     */
    static newFromPoints(from, to) {
        return new Vector(to.x - from.x, to.y - from.y);
    }

    /**
     * Returns the length squared (to the power of 2) of this vector.
     *
     * @type {Number}
     * @readonly
     */
    get lengthSQ() {
        return ((this.x * this.x) + (this.y * this.y));
    }

    /**
     * Returns the length of this vector.
     *
     * @type {Number}
     * @readonly
     */
    get length() {
        return Math.sqrt(this.lengthSQ);
    }

    /**
     * Returns a new vector with length of 1 unit pointing in the same direction as this vector.
     * NOTE: The resulting instance returned is auto released.
     *
     * @type {Point}
     * @readonly
     */
    get unit() {
        var length = this.length;
        return Vector.instance(this.x / length, this.y / length);
    }

    /**
     * Returns the dot product between this vector and the passed vector.
     *
     * @param {Vector} vector - The vector to use to compute the dot product.
     * @returns {number}
     */
    dot(vector) {
        return (this.x * vector.x) + (this.y * vector.y);
    }

    /**
     * Returns the cross product between this vector and the passed vector.
     *
     * @param {Vector} vector - The vector to use to compute the dot product.
     * @returns {number}
     */
    cross(vector) {
        return (this.x * vector.y) - (this.y * vector.x);
    }
}

export default Vector;
