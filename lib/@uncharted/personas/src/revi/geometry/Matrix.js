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

/**
 * 2D transformation matrix object initialized with identity matrix.
 *
 * The matrix can synchronize a canvas context by supplying the context
 * as an argument, or later apply current absolute transform to an
 * existing context.
 *
 * All values are handled as floating point values.
 *
 * @class Matrix
 */
export class Matrix extends IBindable {
    /**
     * @constructor Matrix
     */
    constructor() {
        super();
        this.mA = 1;
        this.mB = 0;
        this.mC = 0;
        this.mD = 1;
        this.mE = 0;
        this.mF = 0;

        this.mAT = 0;
        this.mBT = 0;
        this.mCT = 0;
        this.mDT = 0;
        this.mET = 0;
        this.mFT = 0;

        this.mSinT = 0;
        this.mCosT = 0;
        this.mDetT = 0;
    }

    /**
     * Destroys this object. Called automatically when the reference count of this object reaches zero.
     *
     * @method destroy
     */
    destroy() {
        delete this.mA;
        delete this.mB;
        delete this.mC;
        delete this.mD;
        delete this.mE;
        delete this.mF;

        delete this.mAT;
        delete this.mBT;
        delete this.mCT;
        delete this.mDT;
        delete this.mET;
        delete this.mFT;

        delete this.mSinT;
        delete this.mCosT;
        delete this.mDetT;

        super.destroy();
    }

    /**
     * Get an inverse matrix of current matrix. The method returns a new
     * matrix with values you need to use to get to an identity matrix.
     * Context from parent matrix is not applied to the returned matrix.
     *
     * @type {Matrix}
     * @returns {Matrix}
     */
    get inverse() {
        this.mDetT = (this.mA * this.mD - this.mB * this.mC);
        const m = new Matrix().autorelease();

        m.mA = this.mD / this.mDetT;
        m.mB = -this.mB / this.mDetT;
        m.mC = -this.mC / this.mDetT;
        m.mD = this.mA / this.mDetT;
        m.mE = (this.mC * this.mF - this.mD * this.mE) / this.mDetT;
        m.mF = -(this.mA * this.mF - this.mB * this.mE) / this.mDetT;

        return m;
    }

    /**
     * Short-hand to reset current matrix to an identity matrix.
     *
     * @method reset
     * @returns {Matrix}
     */
    reset() {
        this.mA = this.mD = 1;
        this.mB = this.mC = this.mE = this.mF = 0;
        return this;
    }

    /**
     * Translate current matrix accumulative.
     *
     * @method translate
     * @param {number} tx - translation for x
     * @param {number} ty - translation for y
     * @returns {Matrix}
     */
    translate(tx, ty) {
        this.transform(1, 0, 0, 1, tx, ty);
        return this;
    }

    /**
     * Rotates current matrix accumulative by angle.
     *
     * @methos rotate
     * @param {number} angle - angle in radians
     * @returns {Matrix}
     */
    rotate(angle) {
        this.mCosT = Math.cos(angle);
        this.mSinT = Math.sin(angle);
        this.transform(this.mCosT, this.mSinT, -this.mSinT, this.mCosT, 0, 0);
        return this;
    }

    /**
     * Scales current matrix accumulative.
     * @param {number} sx - scale factor x (1 does nothing)
     * @param {number} sy - scale factor y (1 does nothing)
     * @returns {Matrix}
     */
    scale(sx, sy) {
        this.transform(sx, 0, 0, sy, 0, 0);
        return this;
    }

    /**
     * Flips the horizontal values.
     *
     * @method flipX
     * @returns {Matrix}
     */
    flipX() {
        this.transform(-1, 0, 0, 1, 0, 0);
        return this;
    }

    /**
     * Flips the vertical values.
     *
     * @method flipY
     * @returns {Matrix}
     */
    flipY() {
        this.transform(1, 0, 0, -1, 0, 0);
        return this;
    }

    /**
     * Set current matrix to new absolute matrix.
     *
     * @method set
     * @param {number} a - scale x
     * @param {number} b - skew y
     * @param {number} c - skew x
     * @param {number} d - scale y
     * @param {number} e - translate x
     * @param {number} f - translate y
     * @returns {Matrix}
     */
    set(a, b, c, d, e, f) {
        this.mA = a;
        this.mB = b;
        this.mC = c;
        this.mD = d;
        this.mE = e;
        this.mF = f;
        return this;
    }

    /**
     * Sets the current matrix to a new absolute matrix using the provided matrix as reference.
     *
     * @method setFromMatrix
     * @param {Matrix} matrix - the matrix to use as reference.
     * @returns {Matrix}
     */
    setFromMatrix(matrix) {
        this.mA = matrix.mA;
        this.mB = matrix.mB;
        this.mC = matrix.mC;
        this.mD = matrix.mD;
        this.mE = matrix.mE;
        this.mF = matrix.mF;
        return this;
    }

    /**
     * Multiplies current matrix with new matrix values.
     *
     * @method transform
     * @param {number} a2 - scale x
     * @param {number} b2 - skew y
     * @param {number} c2 - skew x
     * @param {number} d2 - scale y
     * @param {number} e2 - translate x
     * @param {number} f2 - translate y
     * @returns {Matrix}
     */
    transform(a2, b2, c2, d2, e2, f2) {
        this.mAT = this.mA;
        this.mBT = this.mB;
        this.mCT = this.mC;
        this.mDT = this.mD;
        this.mET = this.mE;
        this.mFT = this.mF;

        /* matrix order (canvas compatible):
         * ace
         * bdf
         * 001
         */
        this.mA = this.mAT * a2 + this.mCT * b2;
        this.mB = this.mBT * a2 + this.mDT * b2;
        this.mC = this.mAT * c2 + this.mCT * d2;
        this.mD = this.mBT * c2 + this.mDT * d2;
        this.mE = this.mAT * e2 + this.mCT * f2 + this.mET;
        this.mF = this.mBT * e2 + this.mDT * f2 + this.mFT;

        return this;
    }

    /**
     * Multiplies the current matrix by the matrix provided.
     *
     * @method multiply
     * @param {Matrix} matrix - The matrix to multiply by.
     * @returns {Matrix}
     */
    multiply(matrix) {
        return this.transform(matrix.mA, matrix.mB, matrix.mC, matrix.mD, matrix.mE, matrix.mF);
    }

    /**
     * Interpolate this matrix with another and produce a new matrix.
     * t is a value in the range [0.0, 1.0] where 0 is this instance and
     * 1 is equal to the second matrix. The t value is not constrained.
     *
     * Context from parent matrix is not applied to the returned matrix.
     *
     * @method interpolate
     * @param {Matrix} matrix - the matrix to interpolate with.
     * @param {number} t - interpolation [0.0, 1.0]
     * @returns {Matrix} - new instance with the interpolated result
     */
    interpolate(matrix, t) {
        const m = new Matrix().autorelease();

        m.mA = this.mA + (matrix.mA - this.mA) * t;
        m.mB = this.mB + (matrix.mB - this.mB) * t;
        m.mC = this.mC + (matrix.mC - this.mC) * t;
        m.mD = this.mD + (matrix.mD - this.mD) * t;
        m.mE = this.mE + (matrix.mE - this.mE) * t;
        m.mF = this.mF + (matrix.mF - this.mF) * t;

        return m;
    }

    /**
     * Apply current matrix to x and y point.
     * Returns the point object.
     *
     * @method applyToPoint
     * @param {Point} point - The point to which the transformation will be applied.
     * @returns {Point} The transformed point object.
     */
    applyToPoint(point) {
        point.set(
            point.x * this.mA + point.y * this.mC + this.mE,
            point.x * this.mB + point.y * this.mD + this.mF
        );
        return point;
    }

    /**
     * Inversely applies the current matrix to the provided point. Useful to convert between coordinate systems.
     * Returns the point object.
     *
     * @method applyToPointInverse
     * @param {Point} point - The point to transform.
     * @returns {Point}
     */
    applyToPointInverse(point) {
        this.mDetT = 1 / (this.mA * this.mD - this.mB * this.mC);
        point.set(
            (this.mD * this.mDetT * point.x) + (-this.mC * this.mDetT * point.y) + ((this.mF * this.mC - this.mE * this.mD) * this.mDetT),
            (this.mA * this.mDetT * point.y) + (-this.mB * this.mDetT * point.x) + ((-this.mF * this.mA + this.mE * this.mB) * this.mDetT)
        );

        return point;
    }

    /**
     * Apply the current matrix to the specified boundingBox.
     * This applies the transformation to the bounding box's vertices and computes the axis aligned bounding box.
     * Returns the boundingBox object.
     *
     * @method applyToBoundingBox
     * @param {BoundingBox} boundingBox - The boundingBox to which the transformation will be applied.
     * @returns {BoundingBox} The transformed boundingBox.
     */
    applyToBoundingBox(boundingBox) {
        this.applyToPoint(boundingBox.v1);
        this.applyToPoint(boundingBox.v2);
        this.applyToPoint(boundingBox.v3);
        this.applyToPoint(boundingBox.v4);

        var xMin = Math.min(boundingBox.v1.x, boundingBox.v2.x, boundingBox.v3.x, boundingBox.v4.x);
        var xMax = Math.max(boundingBox.v1.x, boundingBox.v2.x, boundingBox.v3.x, boundingBox.v4.x);
        var yMin = Math.min(boundingBox.v1.y, boundingBox.v2.y, boundingBox.v3.y, boundingBox.v4.y);
        var yMax = Math.max(boundingBox.v1.y, boundingBox.v2.y, boundingBox.v3.y, boundingBox.v4.y);

        boundingBox.origin.set(xMin, yMin);
        boundingBox.size.set(xMax - xMin, yMax - yMin);

        return boundingBox;
    }

    /**
     * Apply to any canvas 2D context object.
     *
     * @method applyToContext
     * @param {CanvasRenderingContext2D} context - The context the transformation is applied to.
     * @returns {Matrix}
     */
    applyToContext(context) {
        context.transform(this.mA, this.mB, this.mC, this.mD, this.mE, this.mF);
        return this;
    }

    /**
     * Sets to any canvas 2D context object.
     *
     * @method setToContext
     * @param {CanvasRenderingContext2D} context - The context the transformation is applied to.
     * @returns {Matrix}
     */
    setToContext(context) {
        context.setTransform(this.mA, this.mB, this.mC, this.mD, this.mE, this.mF);
        return this;
    }

    /**
     * Returns true if matrix is an identity matrix (no transforms applied).
     *
     * @method isIdentity
     * @returns {boolean} True if identity (not transformed)
     */
    isIdentity() {
        return (this._isEqual(this.mA, 1) &&
        this._isEqual(this.mB, 0) &&
        this._isEqual(this.mC, 0) &&
        this._isEqual(this.mD, 1) &&
        this._isEqual(this.mE, 0) &&
        this._isEqual(this.mF, 0));
    }

    /**
     * Compares current matrix with another matrix. Returns true if equal
     * (within epsilon tolerance).
     *
     * @method isEqual
     * @param {Matrix} matrix - matrix to compare this matrix with
     * @returns {boolean}
     */
    isEqual(matrix) {
        return (this._isEqual(this.mA, matrix.mA) &&
        this._isEqual(this.mB, matrix.mB) &&
        this._isEqual(this.mC, matrix.mC) &&
        this._isEqual(this.mD, matrix.mD) &&
        this._isEqual(this.mE, matrix.mE) &&
        this._isEqual(this.mF, matrix.mF));
    }

    /**
     * Compares floating point values with some tolerance (epsilon)
     *
     * @method _isEqual
     * @param {number} f1 - float 1
     * @param {number} f2 - float 2
     * @returns {boolean}
     * @private
     */
    _isEqual(f1, f2) {
        return Math.abs(f1 - f2) < 1e-14;
    }
}

export default Matrix;
