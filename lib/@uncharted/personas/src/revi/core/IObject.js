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

import nextTick from './nextTick.js';

const _rcKey = Symbol('ReferenceCountKey');

/**
 * Base class for all JS objects that are part of this framework.
 *
 * @class IObject
 */
export class IObject {
    /**
     * Utility function that returns an auto released instance of the class the method is called from.
     *
     * @method instance
     * @param {...*} varArgs - The arguments to be forwarded to the class' constructor.
     * @returns {*}
     */
    static instance(...varArgs) {
        return new this(...varArgs).autorelease();
    }

    /**
     * @constructor
     */
    constructor() {
        /* every object is allocated with a retain count of 1 */
        this[_rcKey] = 1;
    }

    /**
     * @method destroy
     */
    destroy() {
        this[_rcKey] = 0;
    }

    /**
     * The current retain count of this object.
     *
     * @type {Number}
     */
    get retainCount() {
        return this[_rcKey];
    }

    /**
     * @method retain
     * @returns {*}
     */
    retain() {
        if (this[_rcKey] <= 0) {
            throw new Error('IObject: Reference count under or equal to zero, are you trying to revive a zombie?');
        }
        ++this[_rcKey];
        return this;
    }

    /**
     * @method release
     * @returns {*}
     */
    release() {
        if (--this[_rcKey] === 0) {
            this.destroy();
        } else if (this[_rcKey] < 0) {
            throw new Error('IObject: Reference count under zero, are you retaining your object?');
        }
        return this;
    }

    /**
     * @method autorelease
     * @returns {*}
     */
    autorelease() {
        nextTick(() => {
            this.release();
        });
        return this;
    }
}

export default IObject;
