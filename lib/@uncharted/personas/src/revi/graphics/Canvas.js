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

import Node from './Node.js';
import Events from './Events.js';
import GeometryEvents from '../geometry/Events.js';
import Matrix from '../geometry/Matrix.js';
import MatrixStack from '../geometry/MatrixStack.js';

const CANVAS_MAP = new Map();

/**
 * Class that wraps the HTML canvas into so it behaves as a Node.
 *
 * @class Canvas
 */
export class Canvas extends Node {
    /**
     * Gets the canvas registered for the given revi context. If no canvas is registered for the context, this method returns null.
     *
     * @method getCanvasForContext
     * @param {Symbol} reviContext - The context for which its canvas will be retrieved.
     * @returns {Canvas}
     * @static
     */
    static getCanvasForContext(reviContext) {
        if (CANVAS_MAP.has(reviContext)) {
            return CANVAS_MAP.get(reviContext);
        }
        return null;
    }

    /**
     * @constructor
     * @param {HTMLElement} element - A canvas element or an element in which a new canvas will be created.
     * @param {Number=} initialPixelDensity - The initial pixel density of this canvas, this value can be overridden by the minPixelDensity.
     * @param {Number=} minPixelDensity - The minimum pixel density that elements will be rendered at.
     */
    constructor(element, initialPixelDensity = 0, minPixelDensity = 0) {
        super();
        this.mElement = element;
        this.mAnimationID = null;
        this.mReviContext = Symbol('REVI_CONTEXT');
        this.mMinPixelDensity = minPixelDensity;
        this.mIdle = true;

        this.mDelta = 0;
        this.mLastTimestamp = 0;

        if (element instanceof HTMLCanvasElement) {
            this.mCanvas = element;
            this.mOwnsCanvas = false;
        } else {
            this.mCanvas = document.createElement('canvas');
            this.mCanvas.style.width = '100%';
            this.mCanvas.style.height = '100%';
            element.appendChild(this.mCanvas);
            this.mOwnsCanvas = true;
        }

        this.anchor.set(0, 0);
        this.size.set(this.mCanvas.scrollWidth, this.mCanvas.scrollHeight);
        this.deviceScale = Math.max(initialPixelDensity || window.devicePixelRatio || 1, this.mMinPixelDensity);
        this.mCanvas.width = this.size.width * this.deviceScale * this.globalScale;
        this.mCanvas.height = this.size.height * this.deviceScale * this.globalScale;
        this.mBoundTick = this._tick.bind(this);
        this.mContext = this.mCanvas.getContext('2d');
        this.mCanvasMatrix = new Matrix();
        this.mMatrixStack = new MatrixStack();

        /* register a listener for changes in the devicePixelRatio */
        this.mMediaQuery = window.matchMedia('screen and (min-resolution: 2dppx)');
        this.mPixelRatioChanged = () => {
            this.deviceScale = Math.max(window.devicePixelRatio || 1, this.mMinPixelDensity); // eslint-disable-line no-warning-comments // TODO: Add a way for users to control the pixel density + device scale.
        };
        this.mMediaQuery.addListener(this.mPixelRatioChanged);

        /* register this canvas and its context */
        CANVAS_MAP.set(this.mReviContext, this);

        this.size.on(GeometryEvents.GEOMETRY_VALUE_CHANGED, this.size.safeBind(this._handleSizeChanged, this));
        this.onEnter(this.mReviContext);
    }

    /**
     * Destroys this object. Called automatically when the reference count of this object reaches zero.
     *
     * @method destroy
     */
    destroy() {
        if (this.running) {
            this.onExit();
        }

        if (this.mOwnsCanvas) {
            this.mElement.removeChild(this.mCanvas);
        }

        this.mCanvasMatrix.release();
        this.mMatrixStack.release();

        CANVAS_MAP.delete(this.mReviContext);

        this.size.off(GeometryEvents.GEOMETRY_VALUE_CHANGED, this._handleSizeChanged, this);
        this.mMediaQuery.removeListener(this.mPixelRatioChanged);

        delete this.mElement;
        delete this.mAnimationID;
        delete this.mReviContext;
        delete this.mMinPixelDensity;
        delete this.mIdle;
        delete this.mDelta;
        delete this.mLastTimestamp;
        delete this.mCanvas;
        delete this.mOwnsCanvas;
        delete this.mBoundTick;
        delete this.mContext;
        delete this.mCanvasMatrix;
        delete this.mMatrixStack;
        delete this.mMediaQuery;
        delete this.mPixelRatioChanged;

        super.destroy();
    }

    /**
     * The device scale used to render this node's internal buffer.
     *
     * @type {Number}
     */
    get deviceScale() {
        return super.deviceScale;
    }

    /**
     * Sets the device scale used to render this node's internal buffer.
     *
     * @param {Number} value - The new device scale.
     */
    set deviceScale(value) {
        const newValue = Math.max(value, this.mMinPixelDensity);
        if (newValue !== this.deviceScale) {
            super.deviceScale = newValue;
            this.size.emit(GeometryEvents.GEOMETRY_VALUE_CHANGED, this.size, this.size.width, this.size.height);
            this.updateGlobalScale();
            this.needsRedraw();
        } else {
            super.deviceScale = newValue;
        }
    }

    /**
     * Is this canvas drawing in an idle state.
     *
     * @type {Boolean}
     */
    get idle() {
        return this.mIdle;
    }

    /**
     * Called every time the object is added to the currently running scene graph.
     *
     * @method onEnter
     * @param {Symbol} reviContext - A unique symbol that identifies the rendering context of this object.
     */
    onEnter(reviContext) {
        this.on(Events.GRAPHICS_NODE_NEEDS_REDRAW, this.safeBind(this.needsRedraw, this));
        super.onEnter(reviContext);
    }

    /**
     * Called when this objects is removed from the scene graph.
     *
     * @method onExit
     */
    onExit() {
        if (this.mAnimationID !== null) {
            cancelAnimationFrame(this.mAnimationID);
            this.mAnimationID = null;
        }
        this.off(Events.GRAPHICS_NODE_NEEDS_REDRAW, this.needsRedraw, this);
        super.onExit();
    }

    /**
     * Overrides the super method and schedules a tick of the canvas (which implies an update and a redraw)
     *
     * @method needsRedraw
     */
    needsRedraw() {
        if (this.running && this.mAnimationID === null) {
            this.mAnimationID = requestAnimationFrame(this.mBoundTick);
            this._setIdle(false);
        }
    }

    /**
     * Triggers a global scale update.
     *
     * @method updateGlobalScale
     */
    updateGlobalScale() {
        this.globalScale = this.mScale;
    }

    /**
     * Function called every time the browser is ready to draw a new frame.
     *
     * @method _tick
     * @param {Number} timestamp - The time stamp of this function call.
     * @private
     */
    _tick(timestamp) {
        this.mDelta = Math.max(Math.min(timestamp - this.mLastTimestamp, 33.333), 1);
        this.mLastTimestamp = timestamp;
        if (this.running) {
            this.mAnimationID = null;
            this.emit(Events.GRAPHICS_CANVAS_PRE_UPDATE, this, this.mDelta);
            this.update(this.mDelta);
            this.emit(Events.GRAPHICS_CANVAS_POST_UPDATE, this, this.mDelta);
            this.mContext.setTransform(1, 0, 0, 1, 0, 0);
            this.mContext.clearRect(0, 0, this.mCanvas.width, this.mCanvas.height);
            this.mCanvasMatrix.reset();
            this.mCanvasMatrix.scale(this.deviceScale, this.deviceScale);
            this.mMatrixStack.reset();
            this.mMatrixStack.push(this.mCanvasMatrix);
            this.mMatrixStack.apply(this.mContext);
            this.emit(Events.GRAPHICS_CANVAS_PRE_DRAW, this, this.mContext, this.mMatrixStack);
            this.draw(this.mContext, this.mMatrixStack);
            this.emit(Events.GRAPHICS_CANVAS_POST_DRAW, this, this.mContext, this.mMatrixStack);
            this._setIdle(this.mAnimationID === null);
        }
    }

    /**
     * When this node's size is modified, this method is called and also changes the size of the internal buffer.
     *
     * @method _handleSizeChanged
     * @param {*} sender - The instance that originally triggered this event.
     * @param {Number} width - The new width of this node.
     * @param {Number} height - The new height of this node.
     * @private
     */
    _handleSizeChanged(sender, width, height) {
        if (sender === this.size) {
            this.mCanvas.width = width * this.deviceScale * this.globalScale;
            this.mCanvas.height = height * this.deviceScale * this.globalScale;
            if (this.running) {
                this.needsRedraw();
            }
        }
    }

    /**
     * Sets the idle state of this canvas, used to know when a canvas is actively being redrawn.
     *
     * @method _setIdle
     * @param {Boolean} idle - The new idle state of this canvas.
     * @private
     */
    _setIdle(idle) {
        if (idle !== this.mIdle) {
            if (this.mIdle) {
                this.mLastTimestamp = performance.now();
            }
            this.mIdle = idle;
            this.emit(Events.GRAPHICS_CANVAS_IDLE_STATE_CHANGED, this, this.mIdle);
        }
    }
}

export default Canvas;
