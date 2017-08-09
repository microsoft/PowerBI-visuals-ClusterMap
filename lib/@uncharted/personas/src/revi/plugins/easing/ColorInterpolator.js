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

import IBindable from '../../core/IBindable.js';

/**
 * Class used to interpolate between two HTML colors.
 *
 * @class ColorInterpolator
 */
export class ColorInterpolator extends IBindable {
    /**
     * @constructor
     * @param {String} initialColor - The color to interpolate from.
     * @param {String} endColor - The color to interpolate to.
     */
    constructor(initialColor, endColor) {
        super();

        this.mInitialColor = this._parseColor(initialColor);
        this.mEndColor = this._parseColor(endColor);
    }

    /**
     * Destroys this object. Called automatically when the reference count of this object reaches zero.
     *
     * @method destroy
     */
    destroy() {
        delete this.mInitialColor;
        delete this.mEndColor;

        super.destroy();
    }

    /**
     * Returns a string that represents the color resulting of the interpolation at the specified progress between the
     * two colors specified in the constructor.
     *
     * @method colorForProgress
     * @param {Number} progress - A number between ~0 and ~1 representing the progress of the interpolation.
     * @returns {String}
     */
    colorForProgress(progress) {
        const r = Math.min(255, Math.max(0, Math.round(this.mInitialColor.r + (this.mEndColor.r - this.mInitialColor.r) * progress)));
        const g = Math.min(255, Math.max(0, Math.round(this.mInitialColor.g + (this.mEndColor.g - this.mInitialColor.g) * progress)));
        const b = Math.min(255, Math.max(0, Math.round(this.mInitialColor.b + (this.mEndColor.b - this.mInitialColor.b) * progress)));
        const a = Math.min(1, Math.max(0, this.mInitialColor.a + (this.mEndColor.a - this.mInitialColor.a) * progress));

        return `rgba(${r},${g},${b},${a})`;
    }

    /**
     * Parses a color string into an object containing the rgba color components as number properties.
     * NOTE: Requires a modern browser that can convert a color style to rgb format.
     *
     * @method _parseColor
     * @param {String} color - The color string to parse.
     * @returns {{r: Number, g: Number, b: Number, a: Number}}
     * @private
     */
    _parseColor(color) {
        /* first try the `rgb` or `rgba` variants */
        if (color.indexOf('rgb(') === 0) {
            return this._parseRGBAComponents(color.substr(4, color.indexOf(')')));
        } else if (color.indexOf('rgba(') === 0) {
            return this._parseRGBAComponents(color.substr(5, color.indexOf(')')));
        }
        /* if not an rgb formatted string, convert it to one using the browser */
        const div = document.createElement('div');
        div.style.color = color;
        if (div.style.color.indexOf('rgb') === 0) {
            return this._parseColor(div.style.color);
        }

        const computedColor = getComputedStyle(div).color;
        if (computedColor.indexOf('rgb') === 0) {
            return this._parseColor(computedColor);
        }

        /* modern browsers should never get here */
        /* console.log('WARNING: Cannot parse color ' + color); */
        return {
            r: 255,
            g: 255,
            b: 0,
            a: 1,
        };
    }

    /**
     * Parses the color components of a comma separated string assuming the order 'R, G, B, A'
     *
     * @method _parseRGBAComponents
     * @param {String} color - The color component string to parse in format 'R, G, B, A' (the alpha channel is optional)
     * @returns {{r: Number, g: Number, b: Number, a: Number}}
     * @private
     */
    _parseRGBAComponents(color) {
        const components = color.split(',');
        return {
            r: parseInt(components[0], 10),
            g: parseInt(components[1], 10),
            b: parseInt(components[2], 10),
            a: (components.length >= 4) ? parseFloat(components[3]) : 1.0,
        };
    }
}

export default ColorInterpolator;
