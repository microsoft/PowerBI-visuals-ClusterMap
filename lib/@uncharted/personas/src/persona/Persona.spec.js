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
import Persona from './Persona.js';
import Config from '../config/Persona.js';

describe ('/persona/Persona', () => {
    const data = {
        id: 'test',
        scalingFactor: 1,
        totalCount: 111,
        label: 'test',
        properties: [
            {
                count: 37,
                color: '#d26502'
            },
            {
                count: 20,
                color: '#f0ab21'
            },
            {
                count: 15,
                color: '#35364e'
            }
        ],
        images: [
            'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
        ],
        links: [
            {
                target: 'other_test',
                strength: 0.9,
            },
        ],
    };

    const data_updated = {
        id: 'test',
        scalingFactor: 0.5,
        totalCount: 100,
        label: 'test_updated',
        properties: [
            {
                count: 35,
                color: '#d26550'
            },
            {
                count: 15,
                color: '#f0ab50'
            },
            {
                count: 10,
                color: '#353650'
            }
        ],
        images: [
            'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
        ],
        links: [
            {
                target: 'other_test_updated_0',
                strength: 0.1,
            },
            {
                target: 'other_test_updated_1',
                strength: 0.2,
            },
        ],
    };

    let instance = null;

    before(() => {
        instance = new Persona(10, data, Config);
    });

    it ('gets id', () => {
        expect(instance.id).to.equal('test');
    });

    it ('gets links', () => {
        expect(instance.links.length).to.equal(1);
        expect(instance.links[0].target).to.equal('other_test');
        expect(instance.links[0].strength).to.equal(0.9);
    });

    it ('calculates safe radius properly', () => {
        expect(instance.safeRadius).to.not.be.below(instance.radius);
    });

    it ('sets/gets radius', () => {
        expect(instance.radius).to.equal(10);
        instance.radius = 30;
        expect(instance.radius).to.equal(30);
    });

    it ('sets/gets selected', () => {
        expect(instance.selected).to.equal(false);
        instance.selected = true;
        expect(instance.selected).to.equal(true);
    });

    it ('sets/gets globalScale', () => {
        instance.globalScale = 30;
        expect(instance.globalScale).to.equal(30);
        instance.globalScale = 1;
        expect(instance.globalScale).to.equal(1);
    });

    it ('updates its data', () => {
        /* name, count, total count, images and gauges are updated through their own classes and should be tested there */
        instance.updateData(data_updated);

        expect(instance.links.length).to.equal(2);
        expect(instance.links[0].target).to.equal('other_test_updated_0');
        expect(instance.links[0].strength).to.equal(0.1);
        expect(instance.links[1].target).to.equal('other_test_updated_1');
        expect(instance.links[1].strength).to.equal(0.2);
    });
});
