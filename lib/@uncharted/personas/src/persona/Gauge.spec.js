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
import Gauge from './Gauge.js';

describe ('/persona/Gauge', () => {
    let instance = null;

    before (() => {
        instance = new Gauge(10, {
            gaugeMarkerSpill: 10,
            gaugePadding: 10,
            gaugeThickness: 10,
            radiusOverlap: 10,
            gaugeBackgroundColor: '#ff0000',
            gaugeMarkerThickness: 10,
            gaugeMarkerColor: '#ff0000',

            gaugeBarPadding: 10,
            gaugeBarCaps: 'butt',
        });
    });

    it ('sets/gets radius', () => {
        expect(instance.radius).to.equal(10);
        instance.radius = 30;
        expect(instance.radius).to.equal(30);
    });

    it ('Adds bars', () => {
        expect(instance.bars.length).to.equal(0);
        instance.addBar(0.1, '#ff0000');
        expect(instance.bars.length).to.equal(1);
        instance.addBar(0.1, '#ff0000');
        expect(instance.bars.length).to.equal(2);
        instance.addBar(0.1, '#ff0000');
        expect(instance.bars.length).to.equal(3);
    });

    it ('Removes bar at index', () => {
        let bar;
        expect(instance.bars.length).to.equal(3);
        bar = instance.bars[1];
        instance.removeBar(1);
        expect(instance.bars.length).to.equal(2);
        for (let i = 0; i < instance.bars.length; ++i) {
            expect(instance.bars[i]).to.not.equal(bar);
        }

        instance.removeBar(0);
        expect(instance.bars.length).to.equal(1);
        instance.removeBar(0);
        expect(instance.bars.length).to.equal(0);
    });

    it ('Removes all bars', () => {
        for (let i = 0; i < 3; ++i) {
            instance.addBar(0.1, '#ff0000');
        }
        expect(instance.bars.length).to.equal(3);

        instance.removeAllBars();
        expect(instance.bars.length).to.equal(0);
    });

    it ('Updates offsets', () => {
        for (let i = 0; i < 3; ++i) {
            instance.addBar(0.1, '#ff0000');
        }
        expect(instance.bars[1].offset).to.be.within(0.1 - 0.00001, 0.1 + 0.00001);
        expect(instance.bars[2].offset).to.be.within(0.2 - 0.00001, 0.2 + 0.00001);

        instance.bars[0].progress = 0.2;
        instance.update(0);

        expect(instance.bars[1].offset).to.be.within(0.2 - 0.00001, 0.2 + 0.00001);
        expect(instance.bars[2].offset).to.be.within(0.3 - 0.00001, 0.3 + 0.00001);

        instance.bars[1].progress = 0.2;
        instance.update(0);

        expect(instance.bars[1].offset).to.be.within(0.2 - 0.00001, 0.2 + 0.00001);
        expect(instance.bars[2].offset).to.be.within(0.4 - 0.00001, 0.4 + 0.00001);
    });
});
