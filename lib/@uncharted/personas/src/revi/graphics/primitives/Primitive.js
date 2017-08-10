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

import Node from '../Node.js';

/**
 * Stroke rendering types.
 *
 * @type {{STROKE_NONE: null, STROKE_MIDDLE: Symbol, STROKE_INNER: Symbol, STROKE_OUTER: Symbol}}
 */
const STROKE_TYPES = {
    STROKE_NONE: null,
    STROKE_MIDDLE: Symbol('STROKE_MIDDLE'),
    STROKE_INNER: Symbol('STROKE_INNER'),
    STROKE_OUTER: Symbol('STROKE_OUTER'),
};

const LINE_CAP_TYPES = {
    LINE_CAP_BUTT: 'butt',
    LINE_CAP_ROUND: 'round',
    LINE_CAP_SQUARE: 'square',
};

/**
 * Default options for rendering a primitive shape.
 *
 * @type {Object}
 */
const primitiveDefaultOptions = {
    fillEnabled: true,
    fillColor: '#000000',
    stroke: 1,
    strokeColor: '#000000',
    strokeType: STROKE_TYPES.STROKE_NONE,
    lineCapType: LINE_CAP_TYPES.LINE_CAP_BUTT,
    closePath: false,
};

/**
 * Base class for all primitive shapes.
 *
 * @class Primitive
 */
export class Primitive extends Node {
    /**
     * Returns a copy of the default rendering options. Modifying this object has no effect.
     *
     * @returns {Object}
     */
    static get defaultOptions() {
        return Object.assign({}, primitiveDefaultOptions);
    }

    /**
     * The internal type used to not render a stroke.
     *
     * @type {null}
     */
    static get STROKE_NONE() {
        return STROKE_TYPES.STROKE_NONE;
    }

    /**
     * The internal type used to render the stroke at the mid point of the edge.
     *
     * @type {Symbol}
     */
    static get STROKE_MIDDLE() {
        return STROKE_TYPES.STROKE_MIDDLE;
    }

    /**
     * The internal type used to render the stroke from the edge of the shape inwards.
     *
     * @type {Symbol}
     */
    static get STROKE_INNER() {
        return STROKE_TYPES.STROKE_INNER;
    }

    /**
     * The internal type used to render the stroke from the edge of the shape outwards.
     *
     * @type {Symbol}
     */
    static get STROKE_OUTER() {
        return STROKE_TYPES.STROKE_OUTER;
    }

    /**
     * The internal type used to render flat edge line caps.
     *
     * @type {String}
     */
    static get LINE_CAP_BUTT() {
        return LINE_CAP_TYPES.LINE_CAP_BUTT;
    }

    /**
     * The internal type used to render rounded line caps.
     * Note: This line cap type makes the lines slightly longer.
     *
     * @type {String}
     */
    static get LINE_CAP_ROUND() {
        return LINE_CAP_TYPES.LINE_CAP_ROUND;
    }

    /**
     * The internal type used to render squared line caps.
     * Note: This line cap type makes the lines slightly longer.
     *
     * @type {String}
     */
    static get LINE_CAP_SQUARE() {
        return LINE_CAP_TYPES.LINE_CAP_SQUARE;
    }

    /**
     * @param {Object} options - The rendering options of this primitive shape.
     * @constructor
     */
    constructor(options = null) {
        super();
        this.mOptions = Object.assign({}, primitiveDefaultOptions, options);
    }

    /**
     * Destroys this object. Called automatically when the reference count of this object reaches zero.
     *
     * @method destroy
     */
    destroy() {
        delete this.mOptions;
        super.destroy();
    }

    /**
     * Is the fill of this shape enabled.
     *
     * @type {Boolean}
     */
    get fillEnabled() {
        return this.mOptions.fillEnabled;
    }

    /**
     * Sets whether the fill of this shape is enabled or not.
     *
     * @param {Boolean} value - The new value
     */
    set fillEnabled(value) {
        if (value !== this.mOptions.fillEnabled) {
            this.mOptions.fillEnabled = value;
            this.needsRedraw();
        }
    }

    /**
     * The fill color of this shape.
     *
     * @type {String}
     */
    get fillColor() {
        return this.mOptions.fillColor;
    }

    /**
     * Sets the fill color of this shape.
     *
     * @param {String} value - The new fill color.
     */
    set fillColor(value) {
        if (value !== this.mOptions.fillColor) {
            this.mOptions.fillColor = value;
            if (this.mOptions.fillEnabled) {
                this.needsRedraw();
            }
        }
    }

    /**
     * The width of the stroke for this shape.
     *
     * @type {Number}
     */
    get stroke() {
        return this.mOptions.stroke;
    }

    /**
     * Sets the width of the stroke for this shape.
     *
     * @param {Number} value - The new width of the stroke.
     */
    set stroke(value) {
        if (value !== this.mOptions.stroke) {
            this.mOptions.stroke = value;
            if (this.mOptions.strokeType) {
                this.needsRedraw();
            }
        }
    }

    /**
     * The stroke color of this shape.
     *
     * @type {String}
     */
    get strokeColor() {
        return this.mOptions.strokeColor;
    }

    /**
     * Sets the stroke color of this shape.
     *
     * @param {String} value - The new color.
     */
    set strokeColor(value) {
        if (value !== this.mOptions.strokeColor) {
            this.mOptions.strokeColor = value;
            if (this.mOptions.strokeType && this.mOptions.stroke > 0) {
                this.needsRedraw();
            }
        }
    }

    /**
     * The stroke type of this shape.
     *
     * @type {Symbol|null}
     */
    get strokeType() {
        return this.mOptions.strokeType;
    }

    /**
     * Sets the stroke type of this shape
     *
     * @param {Symbol|null} value - The new stroke type.
     */
    set strokeType(value) {
        if (value !== this.mOptions.strokeType) {
            this.mOptions.strokeType = value;
            if (this.mOptions.stroke > 0) {
                this.needsRedraw();
            }
        }
    }

    /**
     * If the stroke is enabled, the line cap type for this shape.
     *
     * @type {String}
     */
    get lineCapType() {
        return this.mOptions.lineCapType;
    }

    /**
     * Sets the line cap type of this shape.
     *
     * @param {String} value - The new line cap type.
     */
    set lineCapType(value) {
        if (value !== this.mOptions.lineCapType) {
            this.mOptions.lineCapType = value;
            if (this.mOptions.strokeType && this.mOptions.stroke > 0) {
                this.needsRedraw();
            }
        }
    }

    /**
     * Should the path of this shape always be closed.
     *
     * @type {Boolean}
     */
    get closePath() {
        return this.mOptions.closePath;
    }

    /**
     * Defines if the path of this shape should always be closed.
     *
     * @param {Boolean} value - The new flag.
     */
    set closePath(value) {
        if (value !== this.mOptions.closePath) {
            this.mOptions.closePath = value;
            this.needsRedraw();
        }
    }

    /**
     * Called every tick, drawing operations should be performed here.
     *
     * @method draw
     * @param {CanvasRenderingContext2D} context - The canvas context in which the drawing operations will be performed.
     * @param {MatrixStack} matrixStack - The matrix stack used for drawing.
     */
    draw(context, matrixStack) {
        this._renderPath(context, this.mOptions);
        this._applyRenderOptions(context, this.mOptions);
        super.draw(context, matrixStack);
    }

    /**
     * Renders the path of this shape to the context.
     * NOTE: This method must be overridden in Primitive subclasses.
     *
     * @method _renderPath
     * @param {CanvasRenderingContext2D} context - The canvas context in which the drawing operations will be performed.
     * @param {Object} options - The rendering options for this shape.
     * @private
     */
    _renderPath(/* context, options */) {
        throw new Error('_renderPath must be overridden in subclasses. Cannot render Primitive directly to context.');
    }

    /**
     * Applies the fill, stroke, etc. as described in the provided `options` object.
     *
     * @method _applyRenderOptions
     * @param {CanvasRenderingContext2D} context - The canvas context in which the drawing operations will be performed.
     * @param {Object} options - The rendering options for this shape.
     * @private
     */
    _applyRenderOptions(context, options) {
        if (options.fillEnabled) {
            context.fillStyle = options.fillColor;
            context.fill();
        }

        if (options.strokeType && options.stroke > 0) {
            context.lineCap = options.lineCapType;
            context.strokeStyle = options.strokeColor;
            context.lineWidth = options.stroke;
            context.stroke();
        }
    }
}

export default Primitive;
