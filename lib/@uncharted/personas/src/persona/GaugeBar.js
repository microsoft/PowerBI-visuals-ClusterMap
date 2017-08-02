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

import SemiCircle from '../revi/graphics/primitives/SemiCircle.js';

const doublePI = Math.PI * 2;

/**
 * This class draws a bar inside a circular gauge.
 *
 * @class GaugeBar
 */
export class GaugeBar extends SemiCircle {
    /**
     * @param {Number} radius - The radius of the gauge this bar belongs to.
     * @param {Number} offset - A number between 0 and 1 that represents where in the gauge this bar will be drawn.
     * @param {Number} progress - A number between 0 and 1 that represents the progress of this bar.
     * @param {String} color - The color to use when drawns the bar.
     * @param {Object} config - Configuration object.
     * @constructor
     */
    constructor(radius, offset, progress, color, config) {
        const radPadding = (config.gaugeBarPadding / radius) * 0.5;
        super(radius, (offset * doublePI) + radPadding, Math.max((progress * doublePI) - (radPadding * 2), 0), {
            fillEnabled: false,
            strokeType: SemiCircle.STROKE_INNER,
            stroke: config.gaugeThickness - (config.gaugePadding * 2),
            strokeColor: color,
            lineCapType: config.gaugeBarCaps,
        });

        this.mConfig = config;
        this.mRadPadding = radPadding;
        this.mOffsetPercentage = offset;
        this.mProgressPercentage = progress;
    }

    /**
     * The radius of this circular bar.
     *
     * @type {Number}
     */
    get radius() {
        return super.radius;
    }

    /**
     * Sets the radius of this circular bar.
     *
     * @param {Number} value - The new radius.
     */
    set radius(value) {
        if (value !== super.radius) {
            super.radius = value;
            this.mRadPadding = (this.mConfig.gaugeBarPadding / value) * 0.5;
            this.offset = this.offset;
            this.progress = this.progress;
        }
    }

    /**
     * This bar's offset.
     *
     * @type {Number}
     */
    get offset() {
        return this.mOffsetPercentage;
    }

    /**
     * Sets the bar's offset.
     *
     * @param {Number} value - The new offset.
     */
    set offset(value) {
        this.mOffsetPercentage = value;
        super.offset = (this.mOffsetPercentage * doublePI) + this.mRadPadding;
    }

    /**
     * This bar's progress.
     *
     * @type {Number}
     */
    get progress() {
        return this.mProgressPercentage;
    }

    /**
     * Sets this bar's progress.
     *
     * @param {Number} value - The new progress.
     */
    set progress(value) {
        this.mProgressPercentage = value;
        super.angle = Math.max((this.mProgressPercentage * doublePI) - (this.mRadPadding * 2), 0);
    }

    /**
     * This bar's color.
     *
     * @type {String}
     */
    get color() {
        return this.strokeColor;
    }

    /**
     * Sets the bar's color.
     *
     * @param {String} value - The new color.
     */
    set color(value) {
        this.strokeColor = value;
    }
}

export default GaugeBar;
