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
import ObjectPool from '../core/ObjectPool.js';
import Matrix from './Matrix.js';

export class MatrixStack extends IBindable {
    constructor() {
        super();

        this.mStack = [new Matrix()];
        this.mPool = new ObjectPool(
            matrix => (new Matrix()).setFromMatrix(matrix),
            (instance, matrix) => instance.setFromMatrix(matrix),
            instance => instance.release()
        );
    }

    destroy() {
        while (this.mStack.length) {
            this.mStack.pop().release();
        }

        this.mPool.release();

        delete this.mStack;
        delete this.mPool;

        super.destroy();
    }

    get matrix() {
        return this.mStack[this.mStack.length - 1];
    }

    push(matrix) {
        this.mStack.push(this.mPool.getInstance(this.matrix).multiply(matrix));
    }

    pop() {
        if (this.mStack.length === 1) {
            this.mStack[0].reset();
        } else {
            this.mPool.poolInstance(this.mStack.pop());
        }
    }

    apply(context) {
        this.matrix.setToContext(context);
    }

    reset() {
        while (this.mStack.length > 1) {
            this.pop();
        }
        this.pop();
    }
}

export default MatrixStack;
