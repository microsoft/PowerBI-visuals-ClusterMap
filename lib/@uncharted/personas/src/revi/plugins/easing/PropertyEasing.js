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

import Easing from './Easing.js';

export class PropertyEasing extends Easing {
    /**
     * @param {Symbol} context - The context this easing belongs to.
     * @param {Object} object - The object who's property will be updated.
     * @param {String} property - The name of the property to update.
     * @param {Object} options - An object with options for this easing instance.
     * @constructor
     */
    constructor(context, object, property, options) {
        super(context, options);
        this.mObject = object;
        this.mProperty = property;
    }

    /**
     * Called every time the easing is updated and should perform any complex tasks assigned to this easing.
     *
     * @method _performUpdate
     * @param {Number} progress - The current progress of this easing, represents the result of the easing function configured.
     * @private
     */
    _performUpdate(progress) {
        const valueChange = this.mOptions.endValue - this.mOptions.startValue;
        const newValue = this.mOptions.startValue + (valueChange * progress);
        this.mObject[this.mProperty] = newValue;
        this.emit(Events.EASING_UPDATE, this, progress, newValue);
    }
}

export default PropertyEasing;
