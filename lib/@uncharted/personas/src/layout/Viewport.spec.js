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
import Viewport from './Viewport.js';
import Layout from './Layout.js';
import Config from '../config/Layout.js';
import Canvas from '../revi/graphics/Canvas.js';
import GraphicsEvents from '../revi/graphics/Events.js';
import InputManager from '../revi/plugins/input/InputManager.js';
import Easing from '../revi/plugins/easing/Easing.js';

describe ('/layout/Viewport', () => {
    const dummyLayout = new Layout(1000, 1000);
    let canvas = null;
    let instance = null;

    before(() => {
        const element = document.createElement('div');
        document.body.appendChild(element);
        element.setAttribute('style', 'width:500px; height:500px;');

        canvas = new Canvas(element);
        canvas.off(GraphicsEvents.GRAPHICS_NODE_NEEDS_REDRAW, canvas.needsRedraw, this);

        InputManager.registerContext(canvas.reviContext);
        Easing.registerContext(canvas.reviContext);

        instance = new Viewport(500, 500, Config);
        instance.addChild(dummyLayout);

        canvas.addChild(instance);
    });

    it ('gets its content zoom', () => {
        expect(instance.contentZoom).to.equal(1);
    });

    it ('gets its content position', () => {
        expect(instance.contentPosition.x).to.equal(0);
        expect(instance.contentPosition.y).to.equal(0);
    });

    it ('performs relative zoom', () => {
        instance.zoom(0.5, 100, 100, false, false);
        expect(instance.contentZoom).to.equal(1.5);
        expect(instance.contentPosition.x).to.equal(-50);
        expect(instance.contentPosition.y).to.equal(-50);

        instance.zoom(-0.5, 100, 100, false, false);
        expect(instance.contentZoom).to.equal(1);
        expect(instance.contentPosition.x).to.be.within(-0.00001, 0.00001);
        expect(instance.contentPosition.y).to.be.within(-0.00001, 0.00001);

        instance.contentPosition.set(0, 0);
        expect(instance.contentPosition.x).to.equal(0);
        expect(instance.contentPosition.y).to.equal(0);
    });

    it ('performs absolute zoom', () => {
        instance.zoom(0.5, 100, 100, false, true);
        expect(instance.contentZoom).to.equal(0.5);
        expect(instance.contentPosition.x).to.equal(50);
        expect(instance.contentPosition.y).to.equal(50);

        instance.zoom(1, 100, 100, false, true);
        expect(instance.contentZoom).to.equal(1);
        expect(instance.contentPosition.x).to.be.within(-0.00001, 0.00001);
        expect(instance.contentPosition.y).to.be.within(-0.00001, 0.00001);

        instance.contentPosition.set(0, 0);
        expect(instance.contentPosition.x).to.equal(0);
        expect(instance.contentPosition.y).to.equal(0);
    });

    it ('performs animated zoom', () => {
        let easing = instance.zoom(0.5, 100, 100, true, false);
        expect(instance.contentZoom).to.equal(1);
        expect(instance.contentPosition.x).to.equal(0);
        expect(instance.contentPosition.y).to.equal(0);

        easing.update(Config.viewportAnimatedZoomDuration);

        expect(instance.contentZoom).to.equal(1.5);
        expect(instance.contentPosition.x).to.equal(-50);
        expect(instance.contentPosition.y).to.equal(-50);

        easing = instance.zoom(-0.5, 100, 100, true, false);

        expect(instance.contentZoom).to.equal(1.5);
        expect(instance.contentPosition.x).to.equal(-50);
        expect(instance.contentPosition.y).to.equal(-50);

        easing.update(Config.viewportAnimatedZoomDuration);

        expect(instance.contentZoom).to.equal(1);
        expect(instance.contentPosition.x).to.be.within(-0.00001, 0.00001);
        expect(instance.contentPosition.y).to.be.within(-0.00001, 0.00001);

        instance.contentPosition.set(0, 0);
        expect(instance.contentPosition.x).to.equal(0);
        expect(instance.contentPosition.y).to.equal(0);
    });

    it ('auto zooms', () => {
        instance.autoZoom(false);
        expect(instance.contentZoom).to.equal(0.5);
        expect(instance.contentPosition.x).to.equal(0);
        expect(instance.contentPosition.y).to.equal(0);

        instance.zoom(1, 250, 250, false, true);
        expect(instance.contentZoom).to.equal(1);
        expect(instance.contentPosition.x).to.equal(-250);
        expect(instance.contentPosition.y).to.equal(-250);

        instance.contentPosition.set(0, 0);
        expect(instance.contentPosition.x).to.equal(0);
        expect(instance.contentPosition.y).to.equal(0);
    });

    it ('zooms in', () => {
        const endPosition = -250 * Config.viewportZoomInOutMultiplier;
        instance.zoomIn(false);
        expect(instance.contentZoom).to.equal(1 + Config.viewportZoomInOutMultiplier);
        expect(instance.contentPosition.x).to.be.within(endPosition - 0.00001, endPosition + 0.00001);
        expect(instance.contentPosition.y).to.be.within(endPosition - 0.00001, endPosition + 0.00001);

        instance.zoom(1, 250, 250, false, true);
        expect(instance.contentZoom).to.equal(1);
        expect(instance.contentPosition.x).to.be.within(-0.00001, 0.00001);
        expect(instance.contentPosition.y).to.be.within(-0.00001, 0.00001);

        instance.contentPosition.set(0, 0);
        expect(instance.contentPosition.x).to.equal(0);
        expect(instance.contentPosition.y).to.equal(0);
    });

    it ('zooms out', () => {
        const endPosition = 250 * Config.viewportZoomInOutMultiplier;
        instance.zoomOut(false);
        expect(instance.contentZoom).to.equal(1 - Config.viewportZoomInOutMultiplier);
        expect(instance.contentPosition.x).to.be.within(endPosition - 0.00001, endPosition + 0.00001);
        expect(instance.contentPosition.y).to.be.within(endPosition - 0.00001, endPosition + 0.00001);

        instance.zoom(1, 250, 250, false, true);
        expect(instance.contentZoom).to.equal(1);
        expect(instance.contentPosition.x).to.be.within(-0.00001, 0.00001);
        expect(instance.contentPosition.y).to.be.within(-0.00001, 0.00001);

        instance.contentPosition.set(0, 0);
        expect(instance.contentPosition.x).to.equal(0);
        expect(instance.contentPosition.y).to.equal(0);
    });
});
