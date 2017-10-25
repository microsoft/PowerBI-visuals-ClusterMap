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
import Circle from '../revi/graphics/primitives/Circle.js';
import InputManager from '../revi/plugins/input/InputManager.js';
import InputEvents from '../revi/plugins/input/Events.js';
import Events from './Events.js';

export class SubLevelBadge extends Node {
    constructor(radius, color, accentColor) {
        super(radius * 2, radius * 2);

        this.mRadius = radius;
        this.mTrackingPointer = null;
        this.mTrackingPoint = null;
        this.mTrackingMoveThreshold = Math.pow(8, 2);
        this.mBackground = new Circle(radius, {
            fillColor: color,
            strokeType: Circle.STROKE_MIDDLE,
            strokeColor: accentColor,
            stroke: 2,
        });
        this.mBackground.position.set('50%', '50%');
        this.addChild(this.mBackground);

        const circles = 3;
        const maxRadius = radius / (3 * 1.8);
        const circleRadius = radius / (circles * 1.8);
        const slice = (Math.PI * 2) / circles;
        for (let i = 0; i < circles; ++i) {
            const circle = new Circle(Math.min(maxRadius, circleRadius), { fillColor: accentColor });
            circle.position.set(
                Math.cos(slice * i - Math.PI * 0.5) * circleRadius * 0.75 * (circles - 1) + radius,
                Math.sin(slice * i - Math.PI * 0.5) * circleRadius * 0.75 * (circles - 1) + radius
            );
            this.addChild(circle);
        }
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
        super.onExit();
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
        const localPoint = this.globalToLocalPoint(event.point);
        const distanceSQ = Math.pow(localPoint.x - this.size.width * 0.5, 2) + Math.pow(localPoint.y - this.size.height * 0.5, 2);

        this.mTrackingPointer = null;
        if (this.mTrackingPoint) {
            this.mTrackingPoint.release();
            this.mTrackingPoint = null;
        }

        if (distanceSQ < this.mRadius * this.mRadius) {
            this.mTrackingPointer = event.identifier;
            this.mTrackingPoint = event.point.retain();
        }
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
            if (distanceSQ > this.mTrackingMoveThreshold) {
                this.mTrackingPointer = null;
                if (this.mTrackingPoint) {
                    this.mTrackingPoint.release();
                    this.mTrackingPoint = null;
                }
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
            const localPoint = this.globalToLocalPoint(event.point);
            const distanceSQ = Math.pow(localPoint.x - this.size.width * 0.5, 2) + Math.pow(localPoint.y - this.size.height * 0.5, 2);

            this.mTrackingPointer = null;
            if (this.mTrackingPoint) {
                this.mTrackingPoint.release();
                this.mTrackingPoint = null;
            }

            if (distanceSQ < this.mRadius * this.mRadius) {
                this.emit(Events.PERSONA_SUB_LEVEL_CLICKED, this.mParent, event.position, localPoint);
            }
        }
    }
}

export default SubLevelBadge;
