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

/**
 * Creates a node that uses an offscreen buffer to render its content, significantly improving rendering speed.
 * The content is only redrawn when there's a pixel change.
 *
 * @class CachedNode
 */
export class CachedNode extends Node {
    /**
     * Creates an instance of CachedNode.
     * Since a backing buffer is used, the size of this node needs to be known at all times.
     *
     * @constructor
     * @param {Number|String} width - The width of this node.
     * @param {Number|String} height - The height of this node.
     */
    constructor(width, height) {
        super(width, height);
        this.mOffscreenCanvas = document.createElement('canvas');
        this.mOffscreenContext = this.mOffscreenCanvas.getContext('2d');
        this.mOffscreenMatrix = new Matrix();
        this.mOffscreenMatrixStack = new MatrixStack();
        this.mDirty = false;

        this.size.on(GeometryEvents.GEOMETRY_VALUE_CHANGED, this.size.safeBind(this._handleSizeChanged, this));
    }

    /**
     * Destroys this object. Called automatically when the reference count of this object reaches zero.
     *
     * @method destroy
     */
    destroy() {
        this.mOffscreenMatrix.release();
        this.mOffscreenMatrixStack.release();

        this.size.off(GeometryEvents.GEOMETRY_VALUE_CHANGED, this._handleSizeChanged, this);

        delete this.mOffscreenCanvas;
        delete this.mOffscreenContext;
        delete this.mOffscreenMatrix;
        delete this.mOffscreenMatrixStack;
        delete this.mDirty;

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
        if (value !== this.deviceScale) {
            this.mDirty = true;
            this.needsRedraw();
        }
        super.deviceScale = value;
    }

    /**
     * The global scale of this node.
     *
     * @type {Number}
     */
    get globalScale() {
        return super.globalScale;
    }

    /**
     * Sets the global scale of this node and its children. Usually this property should not be set manually.
     *
     * @param {Number} value - the new global scale of the node.
     */
    set globalScale(value) {
        if (value !== this.globalScale) {
            this.mDirty = true;
            this.needsRedraw();
        }
        super.globalScale = value;
    }

    /**
     * Called every time the object is added to the currently running scene graph.
     *
     * @method onEnter
     * @param {Symbol} reviContext - A unique symbol that identifies the rendering context of this object.
     */
    onEnter(reviContext) {
        this.on(Events.GRAPHICS_NODE_NEEDS_REDRAW, this.safeBind(this._handleNeedsRedraw, this));
        this.mDirty = true;
        super.onEnter(reviContext);
    }

    /**
     * Called when this objects is removed from the scene graph.
     *
     * @method onExit
     */
    onExit() {
        this.off(Events.GRAPHICS_NODE_NEEDS_REDRAW, this._handleNeedsRedraw, this);
        super.onExit();
    }

    /**
     * Called every tick, drawing operations should be performed here.
     *
     * @method draw
     * @param {CanvasRenderingContext2D} context - The canvas context in which the drawing operations will be performed.
     * @param {MatrixStack} matrixStack - The matrix stack used for drawing.
     */
    draw(context, matrixStack) {
        if (this.mDirty) {
            this.mDirty = false;
            this.mOffscreenCanvas.width = this.pixelSize.width * this.deviceScale * this.globalScale;
            this.mOffscreenCanvas.height = this.pixelSize.height * this.deviceScale * this.globalScale;
            this.mOffscreenContext.setTransform(1, 0, 0, 1, 0, 0);
            this.mOffscreenContext.clearRect(0, 0, this.mOffscreenCanvas.width, this.mOffscreenCanvas.height);
            this.mOffscreenMatrix.reset();
            this.mOffscreenMatrix.scale(this.deviceScale * this.globalScale, this.deviceScale * this.globalScale);
            this.mOffscreenMatrixStack.reset();
            this.mOffscreenMatrixStack.push(this.mOffscreenMatrix);
            this.mOffscreenMatrixStack.apply(this.mOffscreenContext);
            this.updateCache(this.mOffscreenContext, context, matrixStack);
            this.mChildren.forEach(child => {
                child._pushTransform(this.mOffscreenContext, this.mOffscreenMatrixStack);
                child.draw(this.mOffscreenContext, this.mOffscreenMatrixStack);
                child._popTransform(this.mOffscreenContext, this.mOffscreenMatrixStack);
            });
        }
        this.drawCache(this.mOffscreenCanvas, context);
    }

    /**
     * Called every time the cache needs to be updated, local drawing operations should be performed here.
     *
     * @method updateCache
     * @param {CanvasRenderingContext2D} context - The canvas context in which the drawing operations will be performed.
     * @param {CanvasRenderingContext2D} parentContext - The canvas contex to which this cached node is being drawn to.
     * @param {MatrixStack} matrixStack - The matrix stack used for drawing.
     */
    updateCache(/* context, parentContext, matrixStack */) {
        /* override */
    }

    /**
     * Called every time the cache needs to be drawn onto another context.
     *
     * @method drawCache
     * @param {HTMLCanvasElement} localCanvas - The local canvas that holds the pixel buffer to draw.
     * @param {CanvasRenderingContext2D} context - The canvas context in which the drawing operations will be performed.
     */
    drawCache(localCanvas, context) {
        context.drawImage(localCanvas, 0, 0, this.pixelSize.width, this.pixelSize.height);
    }

    /**
     * When this node needs to be redrawn, this method is called and detects if the internal cache should be updated as well.
     *
     * @method _handleNeedsRedraw
     * @param {IBindable} sender - The instance that originally triggered this event.
     * @param {Symbol} reason - The reason why a redraw is needed, as described in the Node.REDRAW_* constants.
     * @param {Symbol|null} type - The type of update performed for the redraw to be needed, as described in the Node.MATRIX_UPDATE_* constants.
     * @private
     */
    _handleNeedsRedraw(sender, reason, type = null) {
        if (sender !== this ||
            reason === Node.REDRAW_EXTERNAL_REQUEST ||
            reason === Node.REDRAW_CHILD_ADDED ||
            reason === Node.REDRAW_CHILD_REMOVED) {
            this.mDirty = true;
        } else if (reason === Node.REDRAW_TRANSFORMATION_CHANGE) {
            if (type === Node.MATRIX_UPDATE_SCALE || type === Node.MATRIX_UPDATE_SIZE || type === Node.MATRIX_UPDATE_PARENT_REQUEST) {
                this.mDirty = true;
            }
        }
    }

    /**
     * When this node's size is modified, this method is called and also changes the size of the internal buffer.
     *
     * @method _handleSizeChanged
     * @param {*} sender - The instance that originally triggered this event.
     * @private
     */
    _handleSizeChanged(sender) {
        if (sender === this.size) {
            this.mOffscreenCanvas.width = this.pixelSize.width * this.deviceScale * this.globalScale;
            this.mOffscreenCanvas.height = this.pixelSize.height * this.deviceScale * this.globalScale;
            if (this.running) {
                this.mDirty = true;
                this.needsRedraw();
            }
        }
    }
}

export default CachedNode;
