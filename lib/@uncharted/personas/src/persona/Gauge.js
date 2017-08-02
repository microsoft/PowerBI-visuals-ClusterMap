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

import Node from '../revi/graphics/Node.js';
import GaugeBar from './GaugeBar.js';
import Circle from '../revi/graphics/primitives/Circle.js';
import Line from '../revi/graphics/primitives/Line.js';
import Point from '../revi/geometry/Point.js';

/**
 * Class to draw the circular gauges on a Persona.
 *
 * @class Gauge
 */
export class Gauge extends Node {
    /**
     * @param {Number} radius - The radius of the gauge.
     * @param {Object} config - Configuration object.
     * @constructor
     */
    constructor(radius, config) {
        super();
        this.mRadius = Math.max(radius, 0);
        this.mConfig = config;
        this.mBars = [];
        this.mBackground = null;
        this.mMarker = null;
        this.mMarkerSpill = this.mConfig.gaugeMarkerSpill;
        this.mBarRadius = Math.max(this.mRadius - this.mConfig.gaugePadding, 0);

        this.size.set(this.mRadius * 2, this.mRadius * 2);

        this.mBackground = new Circle(this.mRadius, {
            fillEnabled: false,
            strokeType: Circle.STROKE_INNER,
            stroke: config.gaugeThickness + this.mConfig.radiusOverlap,
            strokeColor: config.gaugeBackgroundColor,
        });
        this.mBackground.position.set('50%', '50%');
        this.addChild(this.mBackground);

        if (this.mConfig.gaugeMarkerThickness > 0) {
            this.mMarker = new Line(Point.instance('50%', -this.mMarkerSpill), Point.instance('50%', config.gaugeThickness + config.radiusOverlap), {
                fillEnabled: false,
                strokeType: Line.STROKE_MIDDLE,
                strokeColor: config.gaugeMarkerColor,
                stroke: config.gaugeMarkerThickness,
            });
            this.addChild(this.mMarker);
        }
    }

    /**
     * Destroys this object. Called automatically when the reference count of this object reaches zero.
     *
     * @method destroy
     */
    destroy() {
        this.mBackground.release();
        this.mBars.forEach(bar => bar.release());
        this.mBars.length = 0;

        if (this.mMarker) {
            this.mMarker.release();
        }

        delete this.mRadius;
        delete this.mConfig;
        delete this.mBars;
        delete this.mBackground;
        delete this.mMarker;
        delete this.mMarkerSpill;
        delete this.mBarRadius;

        super.destroy();
    }

    /**
     * An array containing the bars in this gauge.
     *
     * @type {Array}
     */
    get bars() {
        return this.mBars;
    }

    /**
     * The radius of this circular gauge.
     *
     * @type {Number}
     */
    get radius() {
        return this.mRadius;
    }

    /**
     * Sets the radius of this circular gauge.
     *
     * @param {Number} value - The new radius.
     */
    set radius(value) {
        if (value !== this.mRadius) {
            this.mRadius = Math.max(value, 0);
            this.mBarRadius = Math.max(this.mRadius - this.mConfig.gaugePadding, 0);
            this.size.set(this.mRadius * 2, this.mRadius * 2);

            this.mBackground.radius = this.mRadius;

            this.mBarRadius = Math.max(this.mRadius - this.mConfig.gaugePadding, 0);
            this.mBars.forEach(bar => { bar.radius = this.mBarRadius; });

            this.needsRedraw();
        }
    }

    /**
     * Called every tick, before this object is drawn.
     *
     * @method update
     * @param {Number} delta - The delta time since the last update.
     */
    update(delta) {
        super.update(delta);
        let offset = 0;
        this.mBars.forEach(bar => {
            bar.offset = offset;
            offset += bar.progress;
            bar.position.set(this.mBackground.size.width * 0.5, this.mBackground.size.height * 0.5);
        });
    }

    /**
     * Adds a stacked bar to this gauge tha represents the specified progress.
     *
     * @method addBar
     * @param {Number} progress - A number between 0 and 1 that represents the progress of this bar.
     * @param {String} color - The color of this bar.
     */
    addBar(progress, color) {
        let offset = this.mBars.reduce((acc, bar) => acc + bar.progress, 0);
        const bar = new GaugeBar(this.mBarRadius, offset, progress, color, this.mConfig);
        bar.position.set(this.mBackground.size.width * 0.5, this.mBackground.size.height * 0.5);
        this.mBackground.addChild(bar);
        this.mBars.push(bar);
    }

    /**
     * Removes the stacked bar at the selected index.
     *
     * @method removeBar
     * @param {Number} index - The index of the bar to remove.
     */
    removeBar(index) {
        if (index < this.mBars.length) {
            const bar = this.mBars[index];
            this.mBackground.removeChild(bar);
            this.mBars.splice(index, 1);
            bar.release();
        }
    }

    /**
     * Removes all the stacked bars from this gauge.
     *
     * @method removeAllBars
     */
    removeAllBars() {
        while (this.mBars.length) {
            const bar = this.mBars.pop();
            this.mBackground.removeChild(bar);
            bar.release();
        }
    }
}

export default Gauge;
