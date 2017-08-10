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

import Tuple from './../core/Tuple.js';
import Events from './Events.js';

const UNIT_TYPES = {
    PIXELS: Symbol('UNIT_TYPE_PIXELS'),
    PERCENTAGE: Symbol('UNIT_TYPE_PERCENTAGE'),
    UNSUPPORTED: Symbol('UNIT_TYPE_UNSUPPORTED'),
};

/**
 * Utility class that represents a point in a 2D space.
 *
 * @class Point
 */
export class Point extends Tuple {
    /**
     * Returns a new Point with the same values as the provided point.
     *
     * @method fromPoint
     * @param {Point} point - The point to copy.
     * @returns {Point}
     * @static
     */
    static fromPoint(point) {
        const xValue = point.xUnits === Point.UNIT_TYPE_PERCENTAGE ? (point.x * 100) + '%' : point.x;
        const yValue = point.yUnits === Point.UNIT_TYPE_PERCENTAGE ? (point.y * 100) + '%' : point.y;
        return new Point(xValue, yValue);
    }

    /**
     * Flag used to define that this point uses pixels as its units.
     *
     * @type {Symbol}
     */
    static get UNIT_TYPE_PIXELS() {
        return UNIT_TYPES.PIXELS;
    }

    /**
     * Flag used to define that this point uses percentages as its units.
     *
     * @type {Symbol}
     */
    static get UNIT_TYPE_PERCENTAGE() {
        return UNIT_TYPES.PERCENTAGE;
    }

    /**
     * Flag used to define unsupported measurement units.
     *
     * @type {Symbol}
     */
    static get UNIT_TYPE_UNSUPPORTED() {
        return UNIT_TYPES.UNSUPPORTED;
    }

    /**
     * @constructor Point
     * @param {String|Number=} x - The X coordinate of this point.
     * @param {String|Number=} y - The Y coordinate of this point.
     */
    constructor(x = 0, y = 0) {
        super(0, 0);
        this.mUnitsTypeX = UNIT_TYPES.UNSUPPORTED;
        this.mUnitsTypeY = UNIT_TYPES.UNSUPPORTED;
        this._assignValue(x, 'value1', 'mUnitsTypeX');
        this._assignValue(y, 'value2', 'mUnitsTypeY');
    }

    /**
     * Destroys this object. Called automatically when the reference count of this object reaches zero.
     *
     * @method destroy
     */
    destroy() {
        delete this.mUnitsTypeX;
        delete this.mUnitsTypeY;
        super.destroy();
    }

    /**
     * Gets the X coordinate of this point.
     * @type {Number|String}
     */
    get x() {
        return this.value1;
    }

    /**
     * Sets the X coordinate of this point.
     * @param {Number|String} value - The new value of the property.
     */
    set x(value) {
        if (this._assignValue(value, 'value1', 'mUnitsTypeX')) {
            this.emit(Events.GEOMETRY_VALUE_CHANGED, this, this.value1, this.value2);
        }
    }

    /**
     * The units type that the x value uses.
     *
     * @type {Symbol}
     */
    get xUnits() {
        return this.mUnitsTypeX;
    }

    /**
     * Sets the units type for the x value.
     *
     * @param {Symbol} value - The new units type.
     */
    set xUnits(value) {
        if (value !== this.mUnitsTypeX) {
            this.mUnitsTypeX = value;
        }
    }

    /**
     * Gets the Y coordinate of this point.
     * @type {Number|String}
     */
    get y() {
        return this.value2;
    }

    /**
     * Sets the Y coordinate of this point.
     *
     * @param {Number|String} value - The new value of the property.
     */
    set y(value) {
        if (this._assignValue(value, 'value2', 'mUnitsTypeY')) {
            this.emit(Events.GEOMETRY_VALUE_CHANGED, this, this.value1, this.value2);
        }
    }

    /**
     * The units type that the y value uses.
     *
     * @type {Symbol}
     */
    get yUnits() {
        return this.mUnitsTypeY;
    }

    /**
     * Sets the units type for the y value.
     *
     * @param {Symbol} value - The new units type.
     */
    set yUnits(value) {
        if (value !== this.mUnitsTypeY) {
            this.mUnitsTypeY = value;
        }
    }

    /**
     * Sets the X and Y coordinates of this point.
     *
     * @method set
     * @param {Number|String} x - The new X coordinate for this point.
     * @param {Number|String} y - The new Y coordinate for this point.
     * @returns {Point}
     */
    set(x, y) {
        const changedX = this._assignValue(x, 'value1', 'mUnitsTypeX');
        const changedY = this._assignValue(y, 'value2', 'mUnitsTypeY');
        if (changedX || changedY) {
            this.emit(Events.GEOMETRY_VALUE_CHANGED, this, this.value1, this.value2);
        }
        return this;
    }

    /**
     * Sets the X and Y coordinates of this point using the provided point as reference.
     *
     * @method setFromPoint
     * @param {Point} point - The point to use as reference.
     * @returns {Point}
     */
    setFromPoint(point) {
        if (point.x !== this.value1 || point.y !== this.value2) {
            this.value1 = point.x;
            this.value2 = point.y;
            this.emit(Events.GEOMETRY_VALUE_CHANGED, this, this.value1, this.value2);
        }
        return this;
    }

    /**
     * Adds the passed point to this point. The result is saved in this point.
     *
     * @method add
     * @param {Point} point - The point to add.
     */
    add(point) {
        if (point.value1 !== 0 || point.value2 !== 0) {
            this.value1 += point.value1;
            this.value2 += point.value2;
            this.emit(Events.GEOMETRY_VALUE_CHANGED, this, this.value1, this.value2);
        }
    }

    /**
     * Subtracts the passed point from this point. The result is saved in this point.
     *
     * @method subtract
     * @param {Point} point - The point to subtract.
     */
    subtract(point) {
        if (point.value1 !== 0 || point.value2 !== 0) {
            this.value1 -= point.value1;
            this.value2 -= point.value2;
            this.emit(Events.GEOMETRY_VALUE_CHANGED, this, this.value1, this.value2);
        }
    }

    /**
     * Clones this point and returns the copied point.
     * NOTE: The resulting point is returned as an auto released instance.
     *
     * @method clone
     * @returns {Point}
     */
    clone() {
        return (new Point(this.value1, this.value2)).autorelease();
    }

    /**
     * Assigns the given value to the property with `valueProperty` name and changes the unit type if needed.
     *
     * @method _assignValue
     * @param {Number|String} value - The new value to parse.
     * @param {String} valueProperty - The name of the property in this object where the value will be stored.
     * @param {String} unitsProperty - The name of the property in this object where the unit type of the value should be stored.
     * @returns {Boolean} Whether or not the value or its units changed.
     * @private
     */
    _assignValue(value, valueProperty, unitsProperty) {
        if (typeof value === 'string' || value instanceof String) {
            let newValue = Number.NaN;
            let numberString = value.toString();
            /* check the number type */
            const lastChar = numberString[numberString.length - 1];
            let unitsType;
            if (lastChar === '%') {
                unitsType = UNIT_TYPES.PERCENTAGE;
                newValue = parseFloat(numberString.slice(0, -1)) / 100;
            } else if (lastChar === 'x' && numberString[numberString.length - 2] === 'p') {
                unitsType = UNIT_TYPES.PIXELS;
                newValue = parseFloat(numberString.slice(0, -2));
            } else if (!isNaN(parseInt(lastChar, 10))) {
                unitsType = UNIT_TYPES.PIXELS;
                newValue = parseFloat(numberString);
            }

            if (isNaN(newValue)) {
                throw new Error('Cannot parse value: ' + value);
            }

            if (newValue !== this[valueProperty] || unitsType !== this[unitsProperty]) {
                this[valueProperty] = newValue;
                this[unitsProperty] = unitsType;
                return true;
            }
        } else if (value !== this[valueProperty] || this[unitsProperty] !== UNIT_TYPES.PIXELS) {
            this[valueProperty] = value;
            this[unitsProperty] = UNIT_TYPES.PIXELS;
            return true;
        }
        return false;
    }
}

export default Point;
