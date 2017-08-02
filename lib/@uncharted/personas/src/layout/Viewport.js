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
import InputManager from '../revi/plugins/input/InputManager.js';
import InputEvents from '../revi/plugins/input/Events.js';
import Easing from '../revi/plugins/easing/Easing.js';
import EasingTypes from '../revi/plugins/easing/EasingTypes.js';
import EasingEvents from '../revi/plugins/easing/Events.js';
import Canvas from '../revi/graphics/Canvas.js';
import Scheduler from '../revi/plugins/Scheduler.js';
import ZoomControl from './ZoomControl.js';
import GeometryEvents from '../revi/geometry/Events.js';
import Events from './Events.js';
import PersonaEvents from '../persona/Events.js';
import Layout from './Layout.js';
import nextTick from '../revi/core/nextTick.js';

/**
 * Class to manage the area where objects are displayed. Implements pan and zoom.
 *
 * @class Viewport
 */
export class Viewport extends Node {
    /**
     * @param {Number|String} width - The width of the viewport.
     * @param {Number|String} height - The height of the viewport.
     * @param {Object} config - The layout configuration of this Personas instance.
     * @constructor
     */
    constructor(width, height, config) {
        super(width, height);
        this.mConfig = config;
        this.mDragging = false;
        this.mUpdateScale = null;
        this.mTrackingMoveThreshold = Math.pow(this.mConfig.viewportDragThreshold, 2);
        this.mZoomScrollMultiplier = this.mConfig.viewportZoomScrollMultiplier;
        this.mDelayedUpdateScale = this.mConfig.viewportDelayedRedraw;
        this.mDelayedUpdateScaleTime = this.mConfig.viewportDelayedRedrawTime;
        this.mScheduler = null;
        this.mContent = new Node(width, height);
        this.mZoomControls = new ZoomControl(this.mConfig);
        this.mEventQueue = [];
        this.mEventTickScheduled = false;
        this.mBoundFlushEventQueue = this._flushEventQueue.bind(this);
        this.mLayout = null;

        this.mContent.anchor.set(0, 0);

        super.addChildAt(this.mContent, 0);
        super.addChildAt(this.mZoomControls, 1);

        this.anchor.set(0, 0);
    }

    /**
     * Destroys this object. Called automatically when the reference count of this object reaches zero.
     *
     * @method destroy
     */
    destroy() {
        this.mEventQueue.length = 0;

        this.mContent.release();
        this.mZoomControls.release();

        while (this.mChildren.length) {
            super.removeChildAt(this.mChildren.length - 1);
        }

        delete this.mConfig;
        delete this.mDragging;
        delete this.mUpdateScale;
        delete this.mTrackingMoveThreshold;
        delete this.mZoomScrollMultiplier;
        delete this.mDelayedUpdateScale;
        delete this.mDelayedUpdateScaleTime;
        delete this.mScheduler;
        delete this.mContent;
        delete this.mZoomControls;
        delete this.mEventQueue;
        delete this.mEventTickScheduled;
        delete this.mBoundFlushEventQueue;
        delete this.mLayout;

        super.destroy();
    }

    /**
     * The zoom that the content of this viewport is at.
     *
     * @type {Number}
     */
    get contentZoom() {
        return this.mContent.scale;
    }

    /**
     * The position of this viewport's content.
     *
     * @returns {Point}
     */
    get contentPosition() {
        return this.mContent.position;
    }

    /**
     * Called every time the object is added to the currently running scene graph.
     *
     * @method onEnter
     * @param {Symbol} reviContext - A unique symbol that identifies the rendering context of this object.
     */
    onEnter(reviContext) {
        const inputManager = InputManager.instanceForContext(reviContext);
        inputManager.on(InputEvents.INPUT_POINTER_BEGAN, inputManager.safeBind(this._handlePointerBegan, this));
        inputManager.on(InputEvents.INPUT_POINTER_MOVED, inputManager.safeBind(this._handlePointerMoved, this));
        inputManager.on([InputEvents.INPUT_POINTER_ENDED, InputEvents.INPUT_POINTER_CANCELLED], inputManager.safeBind(this._handlePointerEnded, this));
        inputManager.on(InputEvents.INPUT_MOUSE_SCROLL_UP, inputManager.safeBind(this._handleScrollUp, this));
        inputManager.on(InputEvents.INPUT_MOUSE_SCROLL_DOWN, inputManager.safeBind(this._handleScrollDown, this));

        this.mScheduler = Scheduler.instanceForContext(reviContext);
        this._positionZoomControls(this.pixelSize.width, this.pixelSize.height);

        this.pixelSize.on(GeometryEvents.GEOMETRY_VALUE_CHANGED, this.pixelSize.safeBind(this._handlePixelSizeChanged, this));

        this.mZoomControls.on(Events.LAYOUT_ZOOM_IN_CLICKED, this.mZoomControls.safeBind(this._handleEndEvent, this, Events.LAYOUT_ZOOM_IN_CLICKED));
        this.mZoomControls.on(Events.LAYOUT_ZOOM_OUT_CLICKED, this.mZoomControls.safeBind(this._handleEndEvent, this, Events.LAYOUT_ZOOM_OUT_CLICKED));
        this.mZoomControls.on(Events.LAYOUT_AUTO_ZOOM_CLICKED, this.mZoomControls.safeBind(this._handleEndEvent, this, Events.LAYOUT_AUTO_ZOOM_CLICKED));

        this.on(Events.LAYOUT_ZOOM_IN_CLICKED, this.safeBind(this.zoomIn, this, true));
        this.on(Events.LAYOUT_ZOOM_OUT_CLICKED, this.safeBind(this.zoomOut, this, true));
        this.on(Events.LAYOUT_AUTO_ZOOM_CLICKED, this.safeBind(this.autoZoom, this, true));

        super.onEnter(reviContext);
    }

    /**
     * Called when this objects is removed from the scene graph.
     *
     * @method onExit
     */
    onExit() {
        const inputManager = InputManager.instanceForContext(this.reviContext);
        inputManager.off(InputEvents.INPUT_POINTER_BEGAN, this._handlePointerBegan, this);
        inputManager.off(InputEvents.INPUT_POINTER_MOVED, this._handlePointerMoved, this);
        inputManager.off([InputEvents.INPUT_POINTER_ENDED, InputEvents.INPUT_POINTER_CANCELLED], this._handlePointerEnded, this);
        inputManager.off(InputEvents.INPUT_MOUSE_SCROLL_UP, this._handleScrollUp, this);
        inputManager.off(InputEvents.INPUT_MOUSE_SCROLL_DOWN, this._handleScrollDown, this);

        this.mScheduler = null;

        this.pixelSize.off(GeometryEvents.GEOMETRY_VALUE_CHANGED, this._handlePixelSizeChanged, this);

        this.mZoomControls.off(Events.LAYOUT_ZOOM_IN_CLICKED, this._handleEndEvent, this);
        this.mZoomControls.off(Events.LAYOUT_ZOOM_OUT_CLICKED, this._handleEndEvent, this);
        this.mZoomControls.off(Events.LAYOUT_AUTO_ZOOM_CLICKED, this._handleEndEvent, this);

        this.off(Events.LAYOUT_ZOOM_IN_CLICKED, this.zoomIn, this);
        this.off(Events.LAYOUT_ZOOM_OUT_CLICKED, this.zoomOut, this);
        this.off(Events.LAYOUT_AUTO_ZOOM_CLICKED, this.autoZoom, this);

        super.onExit();
    }

    /**
     * Adds a child node to this object.
     *
     * @method addChild
     * @param {Node} child - The node to add as a child.
     * @returns {Node}
     */
    addChild(child) {
        if (child instanceof Layout) {
            if (this.mLayout) {
                this.mLayout.off(PersonaEvents.PERSONA_CLICKED, this._handleEndEvent, this);
            }
            this.mLayout = child;
            this.mLayout.on(PersonaEvents.PERSONA_CLICKED, this.mLayout.safeBind(this._handleEndEvent, this, PersonaEvents.PERSONA_CLICKED));
        }
        return this.mContent.addChild(child);
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
        if (child instanceof Layout) {
            if (this.mLayout) {
                this.mLayout.off(PersonaEvents.PERSONA_CLICKED, this._handleEndEvent, this);
            }
            this.mLayout = child;
            this.mLayout.on(PersonaEvents.PERSONA_CLICKED, this.mLayout.safeBind(this._handleEndEvent, this, PersonaEvents.PERSONA_CLICKED));
        }
        return this.mContent.addChildAt(child, index);
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
        const index = this.mContent.children.indexOf(child);
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
        const result = this.mContent.removeChild(child);
        if (result && result === this.mLayout) {
            this.mLayout.off(PersonaEvents.PERSONA_CLICKED, this._handleEndEvent, this);
            this.mLayout = null;
        }
        return result;
    }

    /**
     * Removes the child node at the specified index.
     *
     * @method removeChildAt
     * @param {Number} index - The index of this child to remove.
     * @returns {Node}
     */
    removeChildAt(index) {
        const result = this.mContent.removeChildAt(index);
        if (result && result === this.mLayout) {
            this.mLayout.off(PersonaEvents.PERSONA_CLICKED, this._handleEndEvent, this);
            this.mLayout = null;
        }
        return result;
    }

    /**
     * Removes all the children of from this node.
     *
     * @method removeChildren
     */
    removeChildren() {
        if (this.mLayout) {
            this.mLayout.off(PersonaEvents.PERSONA_CLICKED, this._handleEndEvent, this);
            this.mLayout = null;
        }
        this.mContent.removeChildren();
    }

    /**
     * Zooms this viewport by the desired amount using the origin as the center point for the zoom.
     * NOTE: This method respects the maximum and minimum zoom levels configured in the constructor.
     *
     * @method zoom
     * @param {number} amount - The scale to apply where 1 means 100%
     * @param {Number} x - The x coordinate from which the zoom will be applied.
     * @param {Number} y - The y coordinate from which the zoom will be applied.
     * @param {boolean=} animated - Should the zoom be animated
     * @param {boolean=} useActualAmount - If true, will zoom to amount, otherwise zooms to current scale plus amount
     * @return {Easing|null}
     */
    zoom(amount, x, y, animated = false, useActualAmount = false) {
        const localPoint = this.mContent.globalToLocalCoords(x, y);
        const oldScale = this.mContent.scale;

        let newScale;
        if (useActualAmount) {
            newScale = amount;
        } else {
            newScale = oldScale + amount;
        }

        /* check against min/max scale */
        newScale = Math.max(Math.min(newScale, this.mConfig.viewportMaxZoomMultiplier), this.mConfig.viewportMinZoomMultiplier);

        if (newScale === oldScale) {
            return null;
        }

        const scaleDifference = newScale - oldScale;

        if (animated && this.reviContext) {
            const startX = this.mContent.position.x;
            const startY = this.mContent.position.y;
            const startScale = oldScale;
            const zoomEasing = Easing.instance(this.reviContext, {
                type: EasingTypes.Quadratic.EaseInOut,
                duration: this.mConfig.viewportAnimatedZoomDuration,
            });

            localPoint.retain();
            zoomEasing.on(EasingEvents.EASING_UPDATE, (sender, progress) => {
                this.mContent.position.set(startX - localPoint.x * scaleDifference * progress, startY - localPoint.y * scaleDifference * progress);
                this.mContent.scale = startScale + scaleDifference * progress;

                if (!this.mDelayedUpdateScale) {
                    this.mParent.updateGlobalScale();
                }
            });

            zoomEasing.on(EasingEvents.EASING_END, () => {
                localPoint.release();
                if (this.mDelayedUpdateScale) {
                    this.mParent.updateGlobalScale();
                }
            });

            zoomEasing.start();

            return zoomEasing;
        }

        this.mContent.position.set(this.mContent.position.x - localPoint.x * scaleDifference, this.mContent.position.y - localPoint.y * scaleDifference);
        this.mContent.scale = newScale;

        if (this.mDelayedUpdateScale) {
            if (this.mScheduler) {
                if (this.mUpdateScale !== null) {
                    this.mScheduler.cancel(this.mUpdateScale);
                    this.mUpdateScale = null;
                }

                this.mUpdateScale = this.mScheduler.scheduleTimeout(() => {
                    this.mParent.updateGlobalScale();
                    this.mUpdateScale = null;
                }, this.mDelayedUpdateScaleTime);
            } else {
                if (this.mUpdateScale !== null) {
                    clearTimeout(this.mUpdateScale);
                    this.mUpdateScale = null;
                }

                this.mUpdateScale = setTimeout(() => {
                    this.mParent.updateGlobalScale();
                    this.mUpdateScale = null;
                }, this.mDelayedUpdateScaleTime);
            }
        } else {
            this.mParent.updateGlobalScale();
        }

        this.needsRedraw();
        return null;
    }

    /**
     * Automatically zooms this viewport to the bounding box of the viewport's layout (if any).
     *
     * @method autoZoom
     * @param {Boolean} animated - Should the zooming be animated.
     * @returns {Easing|null}
     */
    autoZoom(animated) {
        if (this.reviContext) {
            const layout = this.mLayout;
            if (layout) {
                const canvas = Canvas.getCanvasForContext(this.reviContext);
                const bb = layout.boundingBox;
                const globalTL = layout.localToGlobalPoint(bb.v1);
                const globalBR = layout.localToGlobalPoint(bb.v4);
                const globalWidth = globalBR.x - globalTL.x;
                const globalHeight = globalBR.y - globalTL.y;
                const centerX = globalTL.x + globalWidth * 0.5;
                const centerY = globalTL.y + globalHeight * 0.5;
                const centerPosition = this.globalToLocalCoords(centerX, centerY);
                const targetPosition = this.globalToLocalCoords(canvas.pixelSize.width * 0.5, canvas.pixelSize.height * 0.5);

                const scale = Math.min(canvas.pixelSize.width / globalWidth, canvas.pixelSize.height / globalHeight);
                const easing = this.zoom(scale * this.mContent.scale, centerX, centerY, animated, true);
                if (easing) {
                    const startX = this.mContent.pixelPosition.x;
                    const startY = this.mContent.pixelPosition.y;
                    const targetX = targetPosition.x + (startX - centerPosition.x) * scale;
                    const targetY = targetPosition.y + (startY - centerPosition.y) * scale;
                    const changeX = targetX - startX;
                    const changeY = targetY - startY;

                    easing.on(EasingEvents.EASING_UPDATE, (sender, progress) => {
                        this.mContent.position.set(startX + changeX * progress, startY + changeY * progress);
                    });
                } else {
                    this.mContent.position.set(this.mContent.position.x + targetPosition.x - centerPosition.x, this.mContent.position.y + targetPosition.y - centerPosition.y);
                }

                return easing;
            }
        }
        return null;
    }

    /**
     * Zooms in by the configured zoom step.
     *
     * @method zoomIn
     * @param {Boolean} animated - Should the zooming be animated.
     * @returns {Easing|null}
     */
    zoomIn(animated) {
        return this.zoom(this.mContent.scale * this.mConfig.viewportZoomInOutMultiplier, this.pixelSize.width * 0.5, this.pixelSize.height * 0.5, animated);
    }

    /**
     * Zooms out by the configured zoom step.
     *
     * @method zoomOut
     * @param {Boolean} animated - Should the zooming be animated.
     * @returns {Easing|null}
     */
    zoomOut(animated) {
        return this.zoom(-this.mContent.scale * this.mConfig.viewportZoomInOutMultiplier, this.pixelSize.width * 0.5, this.pixelSize.height * 0.5, animated);
    }

    /**
     * Handles the pointer began input event.
     *
     * @method _handlePointerBegan
     * @param {*} sender - The sender of the event.
     * @param {PointerEvent} event - Object containing the event's description.
     * @private
     */
    _handlePointerBegan(sender, event) {
        this.mDragging = false;
        this.mTrackingPointer = null;
        if (this.mTrackingPoint) {
            this.mTrackingPoint.release();
            this.mTrackingPoint = null;
        }

        this.mTrackingPointer = event.identifier;
        this.mTrackingPoint = event.point.retain();
    }


    /**
     * Handles the pointer moved event.
     *
     * @method _handlePointerMoved
     * @param {*} sender - The sender of the event.
     * @param {PointerEvent} event - Object containing the event's description.
     * @private
     */
    _handlePointerMoved(sender, event) {
        if (event.identifier === this.mTrackingPointer) {
            const point = event.point;
            const distanceSQ = Math.pow(point.x - this.mTrackingPoint.x, 2) + Math.pow(point.y - this.mTrackingPoint.y, 2);
            if (!this.mDragging && distanceSQ > this.mTrackingMoveThreshold) {
                this.mDragging = true;
            }

            if (this.mDragging) {
                const xOff = point.x - this.mTrackingPoint.x;
                const yOff = point.y - this.mTrackingPoint.y;
                this.mContent.position.set(this.mContent.position.x + xOff, this.mContent.position.y + yOff);
                this.mTrackingPoint.release();
                this.mTrackingPoint = point.retain();
            }
        }
    }

    /**
     * Handles the pointer moved input event.
     *
     * @method _handlePointerEnded
     * @param {*} sender - The sender of the event.
     * @param {PointerEvent} event - Object containing the event's description.
     * @private
     */
    _handlePointerEnded(sender, event) {
        if (event.identifier === this.mTrackingPointer) {
            if (!this.mDragging) {
                const localPoint = this.globalToLocalPoint(event.point);
                this._handleEndEvent(Events.LAYOUT_BLANK_SPACE_CLICKED, this, event.position, localPoint);
            } else {
                this.mDragging = false;
            }

            this.mTrackingPointer = null;
            if (this.mTrackingPoint) {
                this.mTrackingPoint.release();
                this.mTrackingPoint = null;
            }
        }
    }

    /**
     * Handles the scroll up input event.
     *
     * @method _handleScrollUp
     * @param {*} sender - The sender of the event.
     * @param {Number} delta - The amount scrolled.
     * @param {Number} x - The x position of the pointer when the event was triggered.
     * @param {Number} y - The y position of the pointer when the event was triggered.
     * @private
     */
    _handleScrollUp(sender, delta, x, y) {
        const zoomAmount = delta * this.mZoomScrollMultiplier;
        this.zoom(this.mContent.scale - zoomAmount, x, y, false, true);
    }

    /**
     * Handles the scroll down input event.
     *
     * @method _handleScrollDown
     * @param {*} sender - The sender of the event.
     * @param {Number} delta - The amount scrolled.
     * @param {Number} x - The x position of the pointer when the event was triggered.
     * @param {Number} y - The y position of the pointer when the event was triggered.
     * @private
     */
    _handleScrollDown(sender, delta, x, y) {
        const zoomAmount = delta * this.mZoomScrollMultiplier;
        this.zoom(this.mContent.scale + zoomAmount, x, y, false, true);
    }

    /**
     * Position the zoom controls at the desired configured position.
     *
     * @method _positionZoomControls
     * @param {Number} width - The width of the container where the zoom controls will be positioned.
     * @param {Number} height - The height of the container where the zoom controls will be positioned.
     * @private
     */
    _positionZoomControls(width, height) {
        const padding = this.mConfig.zoomControlsPadding;
        switch (this.mConfig.zoomControlsPosition) {
            case 'top-left':
                this.mZoomControls.anchor.set(0, 0);
                this.mZoomControls.position.set(padding, padding);
                break;

            case 'bottom-left':
                this.mZoomControls.anchor.set(0, '100%');
                this.mZoomControls.position.set(padding, height - padding);
                break;

            case 'bottom-right':
                this.mZoomControls.anchor.set('100%', '100%');
                this.mZoomControls.position.set(width - padding, height - padding);
                break;

            case 'top-right':
            default:
                this.mZoomControls.anchor.set('100%', 0);
                this.mZoomControls.position.set(width - padding, padding);
                break;
        }
    }

    /**
     * Handles pixel size changes.
     *
     * @method _handlePixelSizeChanged
     * @param {Size} sender - The object that generated the event.
     * @param {Number} width - The new width.
     * @param {Number} height - the new height.
     * @private
     */
    _handlePixelSizeChanged(sender, width, height) {
        if (sender === this.pixelSize) {
            this._positionZoomControls(width, height);
        }
    }

    /**
     * Handles end events triggered by personas, zoom controls of this viewport.
     *
     * @method _handleEndEvent
     * @param {String} event - The event to handle.
     * @param {...*} varArgs - The arguments related to the event.
     * @private
     */
    _handleEndEvent(event, ...varArgs) {
        this.mEventQueue.push({
            event: event,
            args: varArgs,
        });

        if (!this.mEventTickScheduled) {
            this.mEventTickScheduled = true;
            nextTick(this.mBoundFlushEventQueue);
        }
    }

    /**
     * Flushes the end event queue.
     *
     * @method _flushEventQueue
     * @private
     */
    _flushEventQueue() {
        /* account for the situation where the object was destroyed before this function gets called */
        if (this.retainCount > 0) {
            this.mEventTickScheduled = false;
            if (this.mEventQueue.length === 1 && this.mEventQueue[0].event === Events.LAYOUT_BLANK_SPACE_CLICKED) {
                this.emit(Events.LAYOUT_BLANK_SPACE_CLICKED, ...this.mEventQueue[0].args);
                this.mEventQueue.length = 0;
            } else {
                while (this.mEventQueue.length) {
                    const wrapper = this.mEventQueue.pop();
                    if (wrapper.event !== Events.LAYOUT_BLANK_SPACE_CLICKED) {
                        this.emit(wrapper.event, ...wrapper.args);
                    }
                }
            }
        }
    }
}

export default Viewport;
