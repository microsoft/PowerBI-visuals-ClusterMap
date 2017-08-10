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

import IBindable from './IBindable.js';

/**
 * Utility class used to save an arbitrary number of values in an object.
 *
 * @class tuple
 */
export class Tuple extends IBindable {
    /**
     * Constructs an instance of a Tuple with its values as the passed arguments. Each value is added to the object with
     * the notation `value1` ... `value[n]`.
     *
     * @param {...*} varArgs - The values to add this object as properties.
     */
    constructor(/* varArgs */) {
        super();
        this.mFrozen = 0;
        this.mValues = [];

        this.mValues.push(...arguments);
        this.mValues.forEach((ignored, i) => {
            Object.defineProperty(this, 'value' + (i + 1), {
                get: () => this._getValueAtIndex(i),
                set: value => {
                    if (this.mFrozen > 0) {
                        throw new Error('This instance cannot be modified as its values are frozen. Try unfreezing them first.');
                    }
                    this._setValueAtIndex(i, value);
                },
            });
        });
    }

    /**
     * Destroys this object. Called automatically when the reference count of this object reaches zero.
     *
     * @method destroy
     */
    destroy() {
        this.mValues.length = 0;
        delete this.mValues;
        super.destroy();
    }

    /**
     * Freezes the values of this tuple. If a value is modified while froze, the setter throws an error.
     * NOTE: The freezing mechanism is implemented as a stack, meaning that to unfreeze the values `unfreezeValues` has
     * to be called the same number of times as `freezeValues`.
     *
     * @method freezeValues
     */
    freezeValues() {
        ++this.mFrozen;
    }

    /**
     * Unfreezes the values of this tuple.
     * NOTE: The freezing mechanism is implemented as a stack, meaning that to unfreeze the values `unfreezeValues` has
     * to be called the same number of times as `freezeValues`.
     *
     * @methos unfreezeValues
     */
    unfreezeValues() {
        if (!this.mFrozen) {
            throw new Error('Values are not frozen. Are you missing a freeze?');
        }
        --this.mFrozen;
    }

    /**
     * Gets the value at the given index of this tuple.
     *
     * @method _getValueAtIndex
     * @param {Number} index - The index of the value to retieve.
     * @returns {*}
     * @private
     */
    _getValueAtIndex(index) {
        return this.mValues[index];
    }

    /**
     * Sets the value at the given index of this tuple.
     * NOTE: This method bypasses the value freezing mechanism of this tuple.
     *
     * @method _setValueAtIndex
     * @param {Number} index - The index of the value to set.
     * @param {*} value - The new value.
     * @private
     */
    _setValueAtIndex(index, value) {
        this.mValues[index] = value;
    }
}

export default Tuple;
