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

import * as sinon from 'sinon';
import { expect } from 'chai';
import Label from './Label.js';
import Config from '../config/Persona.js';

describe ('/persona/Label', () => {
    let instance = null;

    before(() => {
        instance = new Label('persona', 10, 100, 300, 300, Config);
    });

    it ('gets max size', () => {
        expect(instance.maxSize.width).to.equal(300);
        expect(instance.maxSize.height).to.equal(300);
    });

    it ('updates text', () => {
        expect(instance.mName).to.equal('persona');
        expect(instance.mCount).to.equal(10);
        expect(instance.mTotalCount).to.equal(100);

        instance.updateText('changed', 20, 200);

        expect(instance.mName).to.equal('changed');
        expect(instance.mCount).to.equal(20);
        expect(instance.mTotalCount).to.equal(200);
    });
});
