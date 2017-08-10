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
import IObject from '../revi/core/IObject.js';
import LayoutObject from './LayoutObject.js';
import Point from '../revi/geometry/Point.js';
import Easing from '../revi/plugins/easing/Easing.js';

describe ('/layout/LayoutObject', () => {
    class DummyObject extends IObject {
        constructor() {
            super();
            this.id = 'test_id';
            this.radius = 30;
            this.safeRadius = 40;
            this.position = new Point(50, 50);
        }
    }

    const dummyObject = new DummyObject();
    let instance = null;

    before(() => {
        instance = new LayoutObject(dummyObject);
    });

    it ('gets object id', () => {
        expect(instance.id).to.equal('test_id');
    });

    it ('gets the wrapped object', () => {
        expect(instance.object).to.equal(dummyObject);
    });

    it ('gets the current object position', () => {
        expect(instance.objectPosition.x).to.equal(50);
        expect(instance.objectPosition.y).to.equal(50);
        instance.object.position.set(60, 60);
        expect(instance.objectPosition.x).to.equal(60);
        expect(instance.objectPosition.y).to.equal(60);
    });

    it ('gets the tracked position', () => {
        expect(instance.position.x).to.equal(50);
        expect(instance.position.y).to.equal(50);
        instance.object.position.set(70, 70);
        expect(instance.position.x).to.equal(50);
        expect(instance.position.y).to.equal(50);
    });

    it ('gets the current object radius', () => {
        expect(instance.objectRadius).to.equal(30);
        instance.object.radius = 40;
        expect(instance.objectRadius).to.equal(40);
    });

    it ('gets the tracked radius', () => {
        expect(instance.radius).to.equal(30);
        instance.object.radius = 50;
        expect(instance.radius).to.equal(30);
    });

    it ('gets the current object safe radius', () => {
        expect(instance.objectSafeRadius).to.equal(40);
        instance.object.safeRadius = 50;
        expect(instance.objectSafeRadius).to.equal(50);
    });

    it ('gets the tracked safe radius', () => {
        expect(instance.safeRadius).to.equal(40);
        instance.object.safeRadius = 60;
        expect(instance.safeRadius).to.equal(40);
    });

    it ('updates the tracked radius', () => {
        instance.object.radius += 10;
        expect(instance.radius).to.not.equal(instance.objectRadius);
        instance.updateRadius();
        expect(instance.radius).to.equal(instance.objectRadius);
    });

    it ('updates the tracked position', () => {
        instance.object.position.set(instance.object.position.x + 10, instance.object.position.y + 10);
        expect(instance.position.x).to.not.equal(instance.objectPosition.x);
        expect(instance.position.y).to.not.equal(instance.objectPosition.y);
        instance.updatePosition();
        expect(instance.position.x).to.equal(instance.objectPosition.x);
        expect(instance.position.y).to.equal(instance.objectPosition.y);
    });

    it ('updates the tracked position and radius at once', () => {
        instance.object.radius += 10;
        instance.object.position.set(instance.object.position.x + 10, instance.object.position.y + 10);
        expect(instance.radius).to.not.equal(instance.objectRadius);
        expect(instance.position.x).to.not.equal(instance.objectPosition.x);
        expect(instance.position.y).to.not.equal(instance.objectPosition.y);
        instance.updateValues();
        expect(instance.radius).to.equal(instance.objectRadius);
        expect(instance.position.x).to.equal(instance.objectPosition.x);
        expect(instance.position.y).to.equal(instance.objectPosition.y);
    });

    it ('animates its values', () => {
        const easing = new Easing(null, { duration: 10 });

        const startRadius = instance.objectRadius;
        const endRadius = startRadius + 10;
        const startX = instance.objectPosition.x;
        const endX = startX + 10;
        const startY = instance.objectPosition.y;
        const endY = startY + 10;

        instance.object.radius = endRadius;
        instance.object.position.set(endX, endY);
        instance.animate(easing);

        expect(instance.objectRadius).to.equal(startRadius);
        expect(instance.objectPosition.x).to.equal(startX);
        expect(instance.objectPosition.y).to.equal(startY);

        easing.update(10);

        expect(instance.objectRadius).to.equal(endRadius);
        expect(instance.objectPosition.x).to.equal(endX);
        expect(instance.objectPosition.y).to.equal(endY);
    });
});
