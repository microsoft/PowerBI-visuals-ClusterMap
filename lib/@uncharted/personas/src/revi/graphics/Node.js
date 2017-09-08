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

import IBindable from '../core/IBindable.js';
import BoundingBox from '../geometry/BoundingBox.js';
import Point from '../geometry/Point.js';
import Size from '../geometry/Size.js';
import Matrix from '../geometry/Matrix.js';
import Events from './Events.js';
import GeometryEvents from '../geometry/Events.js';

const REDRAW_REASON = {
    REDRAW_EXTERNAL_REQUEST: Symbol('REDRAW_EXTERNAL_REQUEST'),
    REDRAW_CHILD_ADDED: Symbol('REDRAW_CHILD_ADDED'),
    REDRAW_CHILD_REMOVED: Symbol('REDRAW_CHILD_REMOVED'),
    REDRAW_TRANSFORMATION_CHANGE: Symbol('REDRAW_TRANSFORMATION_CHANGE'),
    REDRAW_CACHE_REFRESH: Symbol('REDRAW_CACHE_REFRESH'),
};
Object.freeze(REDRAW_REASON);

const MATRIX_UPDATE_REASON = {
    MATRIX_UPDATE_UNDEFINED: null,
    MATRIX_UPDATE_POSITION: Symbol('MATRIX_UPDATE_POSITION'),
    MATRIX_UPDATE_SIZE: Symbol('MATRIX_UPDATE_SIZE'),
    MATRIX_UPDATE_SCALE: Symbol('MATRIX_UPDATE_SCALE'),
    MATRIX_UPDATE_ROTATION: Symbol('MATRIX_UPDATE_ROTATION'),
    MATRIX_UPDATE_ANCHOR: Symbol('MATRIX_UPDATE_ANCHOR'),
    MATRIX_UPDATE_PARENT_REQUEST: Symbol('MATRIX_UPDATE_PARENT_REQUEST'),
};
Object.freeze(MATRIX_UPDATE_REASON);

/**
 * Base class for all drawable objects.
 *
 * @class Node
 */
export class Node extends IBindable {
    /**
     * Redrawing this node was requested by an external caller.
     * @type {Symbol}
     */
    static get REDRAW_EXTERNAL_REQUEST() {
        return REDRAW_REASON.REDRAW_EXTERNAL_REQUEST;
    }

    /**
     * Redrawing this node is necessary because a child was added.
     * @type {Symbol}
     */
    static get REDRAW_CHILD_ADDED() {
        return REDRAW_REASON.REDRAW_CHILD_ADDED;
    }

    /**
     * Redrawing this node is necessary because a child was removed.
     * @type {Symbol}
     */
    static get REDRAW_CHILD_REMOVED() {
        return REDRAW_REASON.REDRAW_CHILD_REMOVED;
    }

    /**
     * Redrawing this node is necessary because the transformation matrix of this node changed.
     * @type {Symbol}
     */
    static get REDRAW_TRANSFORMATION_CHANGE() {
        return REDRAW_REASON.REDRAW_TRANSFORMATION_CHANGE;
    }

    /**
     * Redrawing this node is necessary because its internal cache has been updated.
     * @type {Symbol}
     */
    static get REDRAW_CACHE_REFRESH() {
        return REDRAW_REASON.REDRAW_CACHE_REFRESH;
    }

    /**
     * The reason why this node's matrix needs to be updated is unknown.
     * @type {null}
     */
    static get MATRIX_UPDATE_UNDEFINED() {
        return MATRIX_UPDATE_REASON.MATRIX_UPDATE_UNDEFINED;
    }

    /**
     * This node's matrix needs to be updated because its position changed.
     * @type {Symbol}
     */
    static get MATRIX_UPDATE_POSITION() {
        return MATRIX_UPDATE_REASON.MATRIX_UPDATE_POSITION;
    }

    /**
     * This node's matrix needs to be updated because its size changed.
     * @type {Symbol}
     */
    static get MATRIX_UPDATE_SIZE() {
        return MATRIX_UPDATE_REASON.MATRIX_UPDATE_SIZE;
    }

    /**
     * This node's matrix needs to be updated because its scale changed.
     * @type {Symbol}
     */
    static get MATRIX_UPDATE_SCALE() {
        return MATRIX_UPDATE_REASON.MATRIX_UPDATE_SCALE;
    }

    /**
     * This node's matrix needs to be updated because its rotation changed.
     * @type {Symbol}
     */
    static get MATRIX_UPDATE_ROTATION() {
        return MATRIX_UPDATE_REASON.MATRIX_UPDATE_ROTATION;
    }

    /**
     * This node's matrix needs to be updated because its anchor point changed.
     * @type {Symbol}
     */
    static get MATRIX_UPDATE_ANCHOR() {
        return MATRIX_UPDATE_REASON.MATRIX_UPDATE_ANCHOR;
    }

    /**
     * This node's matrix needs to be updated because its parent has updated its matrix and this node's matrix needs to
     * be recalculated if it uses percentages for its size or position.
     * @type {Symbol}
     */
    static get MATRIX_UPDATE_PARENT_REQUEST() {
        return MATRIX_UPDATE_REASON.MATRIX_UPDATE_PARENT_REQUEST;
    }

    /**
     * @param {Number|String=} width - The width of this node. Optional, defaults to 0.
     * @param {Number|String=} height - The height of this node. Optional, defaults to 0.
     * @constructor
     */
    constructor(width = 0, height = 0) {
        super();
        this.mRunning = false;
        this.mChildren = [];
        this.mParent = null;
        this.mBoundingBox = new BoundingBox();
        this.mPosition = new Point();
        this.mPixelPosition = new Point();
        this.mSize = new Size();
        this.mPixelSize = new Size();
        this.mAnchor = new Point('50%', '50%');
        this.mPixelAnchor = new Point();
        this.mMatrix = new Matrix();
        this.mCachedMatrix = new Matrix();
        this.mGlobalMatrix = new Matrix();
        this.mRotation = 0;
        this.mScale = 1;
        this.mDeviceScale = 1;
        this.mGlobalScale = 1;
        this.mReviContext = null;

        this._mIU = 0;
        this._mNU = 0;
        this._mID = 0;
        this._mND = 0;

        this.mSize.on(GeometryEvents.GEOMETRY_VALUE_CHANGED, this.mSize.safeBind(this._updateMatrix, this, Node.MATRIX_UPDATE_SIZE));
        this.mPosition.on(GeometryEvents.GEOMETRY_VALUE_CHANGED, this.mPosition.safeBind(this._updateMatrix, this, Node.MATRIX_UPDATE_POSITION));
        this.mAnchor.on(GeometryEvents.GEOMETRY_VALUE_CHANGED, this.mAnchor.safeBind(this._updateMatrix, this, Node.MATRIX_UPDATE_ANCHOR));

        this.size.set(width, height);
    }

    /**
     * Destroys this object. Called automatically when the reference count of this object reaches zero.
     *
     * @method destroy
     */
    destroy() {
        if (this.mRunning) {
            this.onExit();
        }
        this.removeChildren();

        this.mSize.off(GeometryEvents.GEOMETRY_VALUE_CHANGED, this._updateMatrix, this);
        this.mPosition.off(GeometryEvents.GEOMETRY_VALUE_CHANGED, this._updateMatrix, this);
        this.mAnchor.off(GeometryEvents.GEOMETRY_VALUE_CHANGED, this._updateMatrix, this);

        this.mBoundingBox.release();
        this.mPosition.release();
        this.mSize.release();
        this.mAnchor.release();
        this.mMatrix.release();
        this.mCachedMatrix.release();
        this.mGlobalMatrix.release();

        delete this.mRunning;
        delete this.mChildren;
        delete this.mParent;
        delete this.mBoundingBox;
        delete this.mPosition;
        delete this.mPixelPosition;
        delete this.mSize;
        delete this.mPixelSize;
        delete this.mAnchor;
        delete this.mPixelAnchor;
        delete this.mMatrix;
        delete this.mCachedMatrix;
        delete this.mGlobalMatrix;
        delete this.mRotation;
        delete this.mDeviceScale;
        delete this.mScale;
        delete this.mGlobalScale;
        delete this.mReviContext;

        delete this._mIU;
        delete this._mNU;
        delete this._mID;
        delete this._mND;

        super.destroy();
    }

    /**
     * Is this node currently added to the scene graph and running.
     *
     * @readonly
     * @type {Boolean}
     */
    get running() {
        return this.mRunning;
    }

    /**
     * This node's parent.
     *
     * @readonly
     * @type {Node|null}
     */
    get parent() {
        return this.mParent;
    }

    /**
     * This node's children.
     *
     * @readonly
     * @type {Array}
     */
    get children() {
        return this.mChildren;
    }

    /**
     * This node's boundingBox in non-scaled space.
     *
     * @readonly
     * @type {BoundingBox}
     */
    get boundingBox() {
        return this.mBoundingBox;
    }

    /**
     * The position of this object.
     *
     * @readonly
     * @type {Point}
     */
    get position() {
        return this.mPosition;
    }

    /**
     * The position, in pixels, of this object.
     *
     * @readonly
     * @type {Point}
     */
    get pixelPosition() {
        return this.mPixelPosition;
    }

    /**
     * The anchor point of this object.
     *
     * @readonly
     * @type {Point}
     */
    get anchor() {
        return this.mAnchor;
    }

    /**
     * The anchor point, in pixels, of this object.
     *
     * @readonly
     * @type {Point}
     */
    get pixelAnchor() {
        return this.mPixelAnchor;
    }

    /**
     * The size of this object.
     *
     * @readonly
     * @type {Size}
     */
    get size() {
        return this.mSize;
    }

    /**
     * The size, in pixels, of this object.
     *
     * @readonly
     * @type {Size}
     */
    get pixelSize() {
        return this.mPixelSize;
    }

    /**
     * The revi context this node belongs to, or null if no context is available.
     *
     * @readonly
     * @type {Symbol|null}
     */
    get reviContext() {
        return this.mReviContext;
    }

    /**
     * The rotation of this node.
     *
     * @type {Number}
     */
    get rotation() {
        return this.mRotation;
    }

    /**
     * The rotation of this node.
     *
     * @param {Number} value - The new value.
     */
    set rotation(value) {
        this.mRotation = value;
        this._updateMatrix(Node.MATRIX_UPDATE_ROTATION);
    }

    /**
     * The scale of this node.
     *
     * @type {Number}
     */
    get scale() {
        return this.mScale;
    }

    /**
     * The scale of this node.
     *
     * @param {Number} value - The new value.
     */
    set scale(value) {
        this.mScale = value;
        this._updateMatrix(Node.MATRIX_UPDATE_SCALE);
    }

    /**
     * The device scale used to render this node's internal buffer.
     *
     * @type {Number}
     */
    get deviceScale() {
        return this.mDeviceScale;
    }

    /**
     * Sets the device scale used to render this node's internal buffer.
     *
     * @param {Number} value - The new device scale.
     */
    set deviceScale(value) {
        this.mDeviceScale = value;
        this.mChildren.forEach(child => {
            child.deviceScale = this.mDeviceScale;
        });
    }

    /**
     * The global scale of this node.
     *
     * @type {Number}
     */
    get globalScale() {
        return this.mGlobalScale;
    }

    /**
     * Sets the global scale of this node and its children. Usually this property should not be set manually.
     *
     * @param {Number} value - the new global scale of the node.
     */
    set globalScale(value) {
        this.mGlobalScale = value;
        this.mChildren.forEach(child => {
            child.globalScale = this.mGlobalScale * this.mScale;
        });
    }

    /**
     * Called every time the object is added to the currently running scene graph.
     *
     * @method onEnter
     * @param {Symbol} reviContext - A unique symbol that identifies the rendering context of this object.
     */
    onEnter(reviContext) {
        this.mReviContext = reviContext;
        this.mRunning = true;
        this.mChildren.forEach(child => child.onEnter(reviContext));
    }

    /**
     * Called when this objects is removed from the scene graph.
     *
     * @method onExit
     */
    onExit() {
        this.mReviContext = null;
        this.mRunning = false;
        this.mChildren.forEach(child => child.onExit());
    }

    /**
     * Called every tick, before this object is drawn.
     *
     * @method update
     * @param {Number} delta - The delta time since the last update.
     */
    update(delta) {
        for (this._mIU = 0, this._mNU = this.mChildren.length; this._mIU < this._mNU; ++this._mIU) {
            this.mChildren[this._mIU].update(delta);
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
        for (this._mID = 0, this._mND = this.mChildren.length; this._mID < this._mND; ++this._mID) {
            this.mChildren[this._mID]._pushTransform(context, matrixStack);
            this.mChildren[this._mID].draw(context, matrixStack);
            this.mChildren[this._mID]._popTransform(context, matrixStack);
        }
    }

    /**
     * Adds a child node to this object.
     *
     * @method addChild
     * @param {Node} child - The node to add as a child.
     * @returns {Node}
     */
    addChild(child) {
        return this.addChildAt(child, this.mChildren.length);
    }

    /**
     * Adds a new node as a children to this node at the specified position.
     *
     * @method addChildAt
     * @param {Node} child - The node to add as a child.
     * @param {Number} index - The index at which the node will be added.
     * @returns {Node}
     */
    addChildAt(child, index) {
        if (index >= 0 && index <= this.mChildren.length) {
            /* retain the child */
            child.retain();

            /* if the child node belongs to another parent, remove it from that parent */
            if (child.mParent) {
                child.mParent.removeChild(child);
            }

            /* set the device scale of the child */
            child.deviceScale = this.mDeviceScale;

            /* set the global scale of the child */
            child.globalScale = this.mGlobalScale * this.mScale;

            /* set this node as the parent and add the child to the children array */
            child.mParent = this;
            this.mChildren.splice(index, 0, child);
        } else {
            throw new Error('addChildAt: The index (' + index + ') supplied is out of bounds.');
        }

        /* update the child's matrix, in case it uses percentages for size/position */
        child._updateMatrix(Node.MATRIX_UPDATE_PARENT_REQUEST);

        /* if this node is running, call `onEnter` on the child */
        if (this.mRunning) {
            child.onEnter(this.mReviContext);
        }

        /* start forwarding the child added/removed events */
        this.forward(
            child,
            [
                Events.GRAPHICS_NODE_CHILD_ADDED,
                Events.GRAPHICS_NODE_CHILD_REMOVED,
                Events.GRAPHICS_NODE_NEEDS_REDRAW,
            ]
        );

        /* emit the child added event */
        this.emit(Events.GRAPHICS_NODE_CHILD_ADDED, this, child);
        this._needsRedraw(Node.REDRAW_CHILD_ADDED);

        return child;
    }

    /**
     * If the specified child belongs to this node, it is removed and the given replacement is added in its place.
     * This method returns the removed child or null if the child was not replaced.
     *
     * @method replaceChild
     * @param {Node} child - The child to replace.
     * @param {Node} replacement - The node to add at the child's position.
     * @returns {Node|null}
     */
    replaceChild(child, replacement) {
        const index = this.mChildren.indexOf(child);
        if (index !== -1) {
            const result = this.removeChildAt(index);
            this.addChildAt(replacement, index);
            return result;
        }
        return null;
    }

    /**
     * Removes the specified node from this node's children list.
     *
     * @method removeChild
     * @param {Node} child - The node to remove.
     * @returns {Node}
     */
    removeChild(child) {
        const index = this.mChildren.indexOf(child);
        if (index !== -1) {
            return this.removeChildAt(index);
        }
        return null;
    }

    /**
     * Removes the child node at the specified index.
     *
     * @method removeChildAt
     * @param {Number} index - The index of this child to remove.
     * @returns {Node}
     */
    removeChildAt(index) {
        /* get the child to remove */
        const child = this._getChildAt(index);

        /* stop forwarding this child's events */
        this.unforward(
            child,
            [
                Events.GRAPHICS_NODE_CHILD_ADDED,
                Events.GRAPHICS_NODE_CHILD_REMOVED,
                Events.GRAPHICS_NODE_NEEDS_REDRAW,
            ]
        );

        /* if this node is running call `onExit` */
        if (this.mRunning) {
            child.onExit();
        }

        /* set the child's parent to null and remove from the children array */
        child.mParent = null;
        this.mChildren.splice(index, 1);

        /* emit the child removed event */
        this.emit(Events.GRAPHICS_NODE_CHILD_REMOVED, this, child);
        this._needsRedraw(Node.REDRAW_CHILD_REMOVED);

        /* release the child */
        return child.autorelease();
    }

    /**
     * Removes all the children of from this node.
     *
     * @method removeChildren
     */
    removeChildren() {
        while (this.mChildren.length) {
            this.removeChildAt(this.mChildren.length - 1);
        }
    }

    /**
     * Notifies the rendering system that this node needs to be redrawn to properly display its updated state.
     *
     * @method needsRedraw
     */
    needsRedraw() {
        this._needsRedraw(Node.REDRAW_EXTERNAL_REQUEST);
    }


    /**
     * Safely makes all of this node's children perform the function with the specified method name. If the `recursive`
     * argument is set to `true` it makes invokes `makeChildrenPerform` in its children.
     *
     * @method makeChildrenPerform
     * @param {String} methodName - The name of the method to perform.
     * @param {Boolean} recursive - Should children make their children perform the specified method.
     * @param {...*} varArgs - Arguments to be forwarded when the method is performed.
     */
    makeChildrenPerform(methodName, recursive, ...varArgs) {
        this.mChildren.forEach(child => {
            if (child[methodName] && typeof child[methodName] === 'function') {
                child[methodName](...varArgs);
            }

            if (recursive && child.makeChildrenPerform && typeof child.makeChildrenPerform === 'function') {
                child.makeChildrenPerform(methodName, recursive, ...varArgs);
            }
        });
    }

    /**
     * Converts a point in global space to local space.
     *
     * @method globalToLocalPoint
     * @param {Point} point - The point to convert to local coordinates.
     * @param {Point=} output - An optional point used to store the output, if nothing is provided a new, autoreleased, point is returned.
     * @return {Point}
     */
    globalToLocalPoint(point, output = null) {
        return this.globalToLocalCoords(point.x, point.y, output);
    }

    /**
     * Converts a set of coordinates in global space to local space.
     *
     * @method globalToLocalCoords
     * @param {Number} x - The x coordinate to convert to local coordinates.
     * @param {Number} y - The y coordinate to convert to local coordinates.
     * @param {Point=} output - An optional point used to store the output, if nothing is provided a new, autoreleased, point is returned.
     * @return {Point}
     */
    globalToLocalCoords(x, y, output = null) {
        this.mGlobalMatrix.reset();
        this._getGlobalMatrix(this, this.mGlobalMatrix);
        return this.mGlobalMatrix.applyToPointInverse((output || Point.instance()).set(x, y));
    }

    /**
     * Converts a point from local space to global space.
     *
     * @method localToGlobalPoint
     * @param {Point} point - the point to convert.
     * @param {Point=} output - An optional point used to store the output, if nothing is provided a new, autoreleased, point is returned.
     * @returns {Point}
     */
    localToGlobalPoint(point, output = null) {
        return this.localToGlobalCoords(point.x, point.y, output);
    }

    /**
     * Converts a set of coordinates from local space to global space.
     *
     * @method localToGlobalCoords
     * @param {Number} x - The x coordinate to convert.
     * @param {Number} y - The y coordinate to convert.
     * @param {Point=} output - An optional point used to store the output, if nothing is provided a new, autoreleased, point is returned.
     * @returns {Point}
     */
    localToGlobalCoords(x, y, output) {
        this.mGlobalMatrix.reset();
        this._getGlobalMatrix(this, this.mGlobalMatrix);
        return this.mGlobalMatrix.applyToPoint((output || Point.instance()).set(x, y));
    }

    /**
     * Calculates the global matrix of the given node and saves the result in the specified output matrix.
     *
     * @method _getGlobalMatrix
     * @param {Node} node - the node for which the global matrix will be computed.
     * @param {Matrix} output - An identity matrix where the result will be stored.
     * @private
     */
    _getGlobalMatrix(node, output) {
        if (node.parent) {
            this._getGlobalMatrix(node.parent, output);
        }
        output.multiply(node.mMatrix);
    }

    /**
     * Retrieves the child at the specified index.
     *
     * @method _getChildAt
     * @param {Number} index - The index of the children node to retrieve.
     * @returns {Node}
     * @private
     */
    _getChildAt(index) {
        if (index < 0 || index >= this.mChildren.length) {
            throw new Error('getChildAt: The index (' + index + ') supplied is out of bounds.');
        }
        return this.mChildren[index];
    }

    /**
     * Applies this node's transformations to the supplied context and saves its state.
     *
     * @method _pushTransform
     * @param {CanvasRenderingContext2D} context - The context to which the transformations should be applied.
     * @param {MatrixStack} matrixStack - The matrix stack used for drawing.
     * @private
     */
    _pushTransform(context, matrixStack) {
        matrixStack.push(this.mMatrix);
        matrixStack.apply(context);
    }

    /**
     * Removes the transformations applied by this object from the given context.
     *
     * @method _popTransform
     * @param {CanvasRenderingContext2D} context - The context to which the transformations were previously applied.
     * @param {MatrixStack} matrixStack - The matrix stack used for drawing.
     * @private
     */
    _popTransform(context, matrixStack) {
        matrixStack.pop();
        matrixStack.apply(context);
    }

    /**
     * Updates the underlying affine matrix object.
     *
     * @method _updateMatrix
     * @param {Symbol|null} trigger - A symbol describing what triggered the update as described in the Node.MATRIX_UPDATE_* constants.
     * @private
     */
    _updateMatrix(trigger = null) {
        const x = this.mParent && this.mPosition.xUnits === Point.UNIT_TYPE_PERCENTAGE ? this.mParent.pixelSize.width * this.mPosition.x : this.mPosition.x;
        const y = this.mParent && this.mPosition.yUnits === Point.UNIT_TYPE_PERCENTAGE ? this.mParent.pixelSize.height * this.mPosition.y : this.mPosition.y;
        const width = this.mParent && this.mSize.xUnits === Point.UNIT_TYPE_PERCENTAGE ? this.mParent.pixelSize.width * this.mSize.width : this.mSize.width;
        const height = this.mParent && this.mSize.yUnits === Point.UNIT_TYPE_PERCENTAGE ? this.mParent.pixelSize.height * this.mSize.height : this.mSize.height;
        const xOff = this.mAnchor.xUnits === Point.UNIT_TYPE_PERCENTAGE ? width * this.mAnchor.x : this.mAnchor.x;
        const yOff = this.mAnchor.yUnits === Point.UNIT_TYPE_PERCENTAGE ? height * this.mAnchor.y : this.mAnchor.y;

        this.mPixelAnchor.set(xOff, yOff);
        this.mPixelPosition.set(x, y);

        this.mMatrix.reset();
        this.mMatrix.translate(x, y);
        this.mMatrix.rotate(this.mRotation);
        this.mMatrix.scale(this.mScale, this.mScale);
        this.mMatrix.translate(-xOff, -yOff);

        if (width !== this.mPixelSize.width || height !== this.mPixelSize.height || !this.mMatrix.isEqual(this.mCachedMatrix)) {
            this.mPixelSize.set(width, height);
            this.mCachedMatrix.setFromMatrix(this.mMatrix);
            this.boundingBox.set(0, 0, width, height);
            this.mMatrix.applyToBoundingBox(this.boundingBox);
            this.makeChildrenPerform('_updateMatrix', false, null);
            this._needsRedraw(Node.REDRAW_TRANSFORMATION_CHANGE, trigger || Node.MATRIX_UPDATE_UNDEFINED);
        }
    }

    /**
     * If the node is running, triggers the event that requests for this object to be redrawn.
     *
     * @method _needsRedraw
     * @param {Symbol} reason - The reason why this node needs to be redrawn.
     * @param {...*} varArgs - Extra parameters that will be forwarded in the request to be drawn.
     * @private
     */
    _needsRedraw(reason, ...varArgs) {
        if (this.mRunning) {
            /* this implementation ignores the reason and just requests redraw */
            this.emit(Events.GRAPHICS_NODE_NEEDS_REDRAW, this, reason, ...varArgs);
        }
    }
}

export default Node;
