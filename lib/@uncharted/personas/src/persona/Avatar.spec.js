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
import Avatar from './Avatar.js';
import Config from '../config/Persona.js';

describe ('/persona/Avatar', () => {
    let instance = null;
    let oldNeedsRedraw = null;

    before(() => {
        instance = new Avatar(10, [], Config);
        oldNeedsRedraw = instance.needsRedraw;
    });

    it ('sets/gets radius', () => {
        expect(instance.radius).to.equal(10);
        instance.radius = 30;
        expect(instance.radius).to.equal(30);
    });

    it ('Updates images', (done) => {
        let expectedImages = 0;
        let imagesLoaded = null;
        instance.needsRedraw = () => {
            if (instance.mImages.length === expectedImages) {
                imagesLoaded();
            }
        };

        new Promise(resolve => {
            expectedImages = 1;
            imagesLoaded = resolve;
            instance.updateImages([
                'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
            ]);
        }).then(() => new Promise(resolve => {
            expectedImages = 3;
            imagesLoaded = resolve;
            instance.updateImages([
                'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
                'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
                'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
            ]);
        })).then(() => {
            instance.updateImages([]);
            expect(instance.mImages.length).to.equal(0);
            done();
        });
    });
});
