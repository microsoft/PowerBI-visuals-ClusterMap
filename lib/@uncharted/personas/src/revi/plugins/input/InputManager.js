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
import PointerEvent from './PointerEvent.js';
import Events from './Events.js';
import Canvas from '../../graphics/Canvas';

const InputManagerInstances = new Map();

/**
 * Class used to manage input events. Includes utility functions to associate an InoutManager to a canvas by its reviContext.
 *
 * @class InputManager
 */
export class InputManager extends IBindable {
    /**
     * Registers a revi context and binds a new InputManager to it.
     *
     * @method registerContext
     * @param {Symbol} context - The revi context of the canvas.
     * @static
     */
    static registerContext(context) {
        if (InputManagerInstances.has(context)) {
            throw new Error('The context is already registered.');
        }

        const canvas = Canvas.getCanvasForContext(context);
        if (!canvas) {
            throw new Error('No canvas is registered for the provided context');
        }

        InputManagerInstances.set(context, new InputManager(canvas));
    }

    /**
     * Unregisters a revi context and destroys the InputManager instance associated with it.
     *
     * @method unregisterContext
     * @param {Symbol} context - The revi context of the canvas.
     * @static
     */
    static unregisterContext(context) {
        const instance = InputManagerInstances.get(context);
        if (instance) {
            InputManagerInstances.delete(context);
            instance.release();
        } else {
            throw new Error('The context was never registered.');
        }
    }

    /**
     * Finds the InputManager linked to the provided context and returns it or null if not found.
     *
     * @method instanceForContext
     * @param {Symbol} context - The revi context to look for.
     * @returns {InputManager|null}
     * @static
     */
    static instanceForContext(context) {
        return InputManagerInstances.get(context) || null;
    }

    /**
     * @param {Canvas} canvas - The revi canvas this InputManager will be bound to.
     * @constructor
     */
    constructor(canvas) {
        super();
        this.mCanvas = canvas;
        this.mElement = this.mCanvas.mCanvas;

        this.mPointerDown = false;
        this.mTouchTrackingID = -1;
        this.mAllowsMultiplePointers = false;
        this.mEnabled = true;

        this.mLineHeight = 16; /* -.- */
        this.mPageHeight = this.mCanvas.size.height;
        this.mInputScale = 1;

        this.mBoundMouseHandler = this._mouseHandler.bind(this);
        this.mElement.addEventListener('mousedown', this.mBoundMouseHandler, false);
        this.mElement.addEventListener('mouseup', this.mBoundMouseHandler, false);
        this.mElement.addEventListener('mouseover', this.mBoundMouseHandler, false);
        this.mElement.addEventListener('mouseout', this.mBoundMouseHandler, false);
        this.mElement.addEventListener('mousemove', this.mBoundMouseHandler, false);

        this.mBoundTouchHandler = this._touchHandler.bind(this);
        this.mElement.addEventListener('touchstart', this.mBoundTouchHandler, false);
        this.mElement.addEventListener('touchmove', this.mBoundTouchHandler, false);
        this.mElement.addEventListener('touchend', this.mBoundTouchHandler, false);
        this.mElement.addEventListener('touchenter', this.mBoundTouchHandler, false);
        this.mElement.addEventListener('touchleave', this.mBoundTouchHandler, false);
        this.mElement.addEventListener('touchcancel', this.mBoundTouchHandler, false);

        this.mBoundWheelHandler = this._wheelHandler.bind(this);
        this.mElement.addEventListener('wheel', this.mBoundWheelHandler);
    }

    /**
     * Destroys this object. Called automatically when the reference count of this object reaches zero.
     *
     * @method destroy
     */
    destroy() {
        this.mElement.removeEventListener('mousedown', this.mBoundMouseHandler, false);
        this.mElement.removeEventListener('mouseup', this.mBoundMouseHandler, false);
        this.mElement.removeEventListener('mouseover', this.mBoundMouseHandler, false);
        this.mElement.removeEventListener('mouseout', this.mBoundMouseHandler, false);
        this.mElement.removeEventListener('mousemove', this.mBoundMouseHandler, false);

        this.mElement.removeEventListener('touchstart', this.mBoundTouchHandler, false);
        this.mElement.removeEventListener('touchmove', this.mBoundTouchHandler, false);
        this.mElement.removeEventListener('touchend', this.mBoundTouchHandler, false);
        this.mElement.removeEventListener('touchenter', this.mBoundTouchHandler, false);
        this.mElement.removeEventListener('touchleave', this.mBoundTouchHandler, false);
        this.mElement.removeEventListener('touchcancel', this.mBoundTouchHandler, false);

        this.mElement.removeEventListener('wheel', this.mBoundWheelHandler);

        delete this.mCanvas;
        delete this.mElement;
        delete this.mPointerDown;
        delete this.mTouchTrackingID;
        delete this.mAllowsMultiplePointers;
        delete this.mEnabled;
        delete this.mLineHeight;
        delete this.mPageHeight;
        delete this.mBoundMouseHandler;
        delete this.mBoundTouchHandler;
        delete this.mBoundWheelHandler;

        super.destroy();
    }

    /**
     * Is this InputManager enabled.
     *
     * @type {Boolean}
     */
    get enabled() {
        return this.mEnabled;
    }

    /**
     * Sets if this InputManager is enabled.
     *
     * @param {Boolean} value - The new value.
     */
    set enabled(value) {
        if (value !== this.mEnabled) {
            this.mEnabled = value;
        }
    }

    /**
     * Gets the scale to apply to input events.
     *
     * @type {Boolean}
     */
    get inputScale() {
        return this.mInputScale;
    }

    /**
     * Sets the scale to apply to input events.
     *
     * @param {Boolean} value - The new value.
     */
    set inputScale(value) {
        if (value !== this.mInputScale) {
            this.mInputScale = value;
        }
    }

    /**
     * Handles mouse inputs events.
     *
     * @method _mouseHandler
     * @param {InputEvent} inputEvent - The event to handle.
     * @private
     */
    _mouseHandler(inputEvent) {
        inputEvent.preventDefault();
        inputEvent.stopPropagation();

        let eventType = null;
        switch (inputEvent.type) {
            case 'mousedown':
                if (this.enabled) {
                    this.mPointerDown = true;
                    eventType = Events.INPUT_POINTER_BEGAN;
                }
                break;

            case 'mousemove':
                eventType = Events.INPUT_POINTER_MOVED;
                break;

            case 'mouseup':
                this.mPointerDown = false;
                eventType = Events.INPUT_POINTER_ENDED;
                break;

            case 'mouseout':
                if (this.mPointerDown) {
                    this.mPointerDown = false;
                    eventType = Events.INPUT_POINTER_CANCELLED;
                }
                break;

            case 'mouseover':
            default:
                break;
        }

        if (eventType) {
            const rect = this.mElement.getBoundingClientRect();
            const x = (inputEvent.clientX - rect.left) / this.mInputScale;
            const y = (inputEvent.clientY - rect.top) / this.mInputScale;
            const pointerEvent = PointerEvent.instance(eventType, x, y, 123456789, Date.now());
            this.emit(eventType, this, pointerEvent);
        }
    }

    /**
     * Handles touch input events.
     *
     * @method _touchHandler
     * @param {InputEvent} inputEvent - The event to handle.
     * @private
     */
    _touchHandler(inputEvent) {
        inputEvent.preventDefault();

        let shouldResetTouchID = false;

        const handleTouchEvent = inputEventType => {
            const touches = inputEvent.changedTouches;
            const touchesLength = touches.length;
            for (let i = 0; i < touchesLength; ++i) {
                const touch = touches[i];
                const touchID = touch.identifier;
                if (this.mAllowsMultiplePointers || this.mTouchTrackingID === -1 || touchID === this.mTouchTrackingID) {
                    this.mTouchTrackingID = touchID;

                    const rect = this.mElement.getBoundingClientRect();
                    const x = (touch.clientX - rect.left) / this.mInputScale;
                    const y = (touch.clientY - rect.top) / this.mInputScale;

                    const pointerEvent = PointerEvent.instance(inputEventType, x, y, touch.identifier, Date.now());
                    this.emit(inputEventType, this, pointerEvent);

                    if (shouldResetTouchID) {
                        this.mTouchTrackingID = -1;
                    }
                }
            }
        };

        let eventType = null;
        switch (inputEvent.type) {
            case 'touchstart':
                if (this.enabled) {
                    // because touch doesn't send hover events, fake a move event to update anything listening for hovers
                    handleTouchEvent(Events.INPUT_POINTER_MOVED);
                    eventType = Events.INPUT_POINTER_BEGAN;
                }
                break;

            case 'touchmove':
                eventType = Events.INPUT_POINTER_MOVED;
                break;

            case 'touchend':
                shouldResetTouchID = true;
                eventType = Events.INPUT_POINTER_ENDED;
                break;

            case 'touchleave':
            case 'touchcancel':
                shouldResetTouchID = true;
                eventType = Events.INPUT_POINTER_CANCELLED;
                break;

            case 'touchenter':
            default:
                break;
        }

        if (eventType) {
            handleTouchEvent(eventType);
        }
    }

    /**
     * Handles scroll wheel events.
     *
     * @method _wheelHandler
     * @param {WheelEvent} wheelEvent - The event to handle.
     * @private
     */
    _wheelHandler(wheelEvent) {
        if (wheelEvent.deltaY !== 0) {
            if (this.enabled) {
                wheelEvent.preventDefault();

                let eventType = null;
                if (wheelEvent.deltaY > 0) {
                    eventType = Events.INPUT_MOUSE_SCROLL_UP;
                } else if (wheelEvent.deltaY < 0) {
                    eventType = Events.INPUT_MOUSE_SCROLL_DOWN;
                }

                if (eventType) {
                    const x = wheelEvent.layerX;
                    const y = wheelEvent.layerY;

                    let delta = Math.abs(wheelEvent.deltaY);
                    if (wheelEvent.deltaMode === 1) { /* per-line scrolling */
                        delta *= this.mLineHeight;
                    } else if (wheelEvent.deltaMode === 2) { /* per-page scrolling */
                        delta *= this.mPageHeight;
                    }

                    this.emit(eventType, this, delta, x, y);
                }
            }
        }
    }
}

export default InputManager;
