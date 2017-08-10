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
import GaugeBar from './GaugeBar.js';

describe ('/persona/GaugeBar', () => {
    let instance = null;

    before (() => {
        instance = new GaugeBar(10, 10, 0.1, '#ff0000', {
            gaugeBarPadding: 10,
            gaugeThickness: 10,
            gaugeBarCaps: 'butt',
        });
    });

    it ('sets/gets radius', () => {
        expect(instance.radius).to.equal(10);
        instance.radius = 30;
        expect(instance.radius).to.equal(30);
    });

    it ('sets/gets offset', () => {
        expect(instance.offset).to.equal(10);
        instance.offset = 30;
        expect(instance.offset).to.equal(30);
    });

    it ('sets/gets progress', () => {
        expect(instance.progress).to.equal(0.1);
        instance.progress = 0.3;
        expect(instance.progress).to.equal(0.3);
    });

    it ('sets/gets color', () => {
        expect(instance.color).to.equal('#ff0000');
        instance.color = '#0000ff';
        expect(instance.color).to.equal('#0000ff');
    });
});
