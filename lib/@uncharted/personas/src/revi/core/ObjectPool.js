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

import IObject from './IObject.js';

export class ObjectPool extends IObject {
    constructor(allocate, reuse = null, destroy = null) {
        super();
        this.mAllocate = allocate;
        this.mReuse = reuse;
        this.mDestroy = destroy;
        this.mAvailableObjects = [];
    }

    destroy() {
        while (this.mAvailableObjects.length) {
            const instance = this.mAvailableObjects.pop();
            if (this.mDestroy) {
                this.mDestroy(instance);
            }
        }

        delete this.mAllocate;
        delete this.mReuse;
        delete this.mDestroy;
        delete this.mAvailableObjects;

        super.destroy();
    }

    getInstance(...varArgs) {
        if (this.mAvailableObjects.length) {
            if (this.mReuse) {
                return this.mReuse(this.mAvailableObjects.pop(), ...varArgs);
            }

            return this.mAvailableObjects.pop();
        }
        return this.mAllocate(...varArgs);
    }

    poolInstance(instance) {
        this.mAvailableObjects.push(instance);
    }
}

export default ObjectPool;
