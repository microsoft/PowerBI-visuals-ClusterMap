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

import IObject from '../core/IObject.js';
import Canvas from '../graphics/Canvas.js';
import GraphicEvents from '../graphics/Events.js';

const __INSTANCES__ = new Map();

/**
 * Plugin used to schedule functions, equivalent to `setInterval` and `setTimeout` but this class makes sure that the
 * scheduled function timers are in sync with the rendering engine.
 *
 * @class Scheduler
 */
export class Scheduler extends IObject {
    /**
     * Registers a revi context and binds a new InputManager to it.
     *
     * @method registerContext
     * @param {Symbol} context - The revi context of the canvas.
     * @static
     */
    static registerContext(context) {
        if (__INSTANCES__.has(context)) {
            throw new Error('The context is already registered.');
        }

        const canvas = Canvas.getCanvasForContext(context);
        if (!canvas) {
            throw new Error('No canvas is registered for the provided context');
        }

        __INSTANCES__.set(context, new Scheduler(canvas));
    }

    /**
     * Unregisters a revi context and destroys the InputManager instance associated with it.
     *
     * @method unregisterContext
     * @param {Symbol} context - The revi context of the canvas.
     * @static
     */
    static unregisterContext(context) {
        const instance = __INSTANCES__.get(context);
        if (instance) {
            __INSTANCES__.delete(context);
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
        return __INSTANCES__.get(context) || null;
    }

    /**
     * @param {Canvas} canvas - The canvas to which the scheduled functions should be synced to.
     * @constructor
     */
    constructor(canvas) {
        super();

        this.mCurrentTimer = 0;
        this.mCanvas = canvas;
        this.mMethods = [];
        this.mMethodsScheduled = 0;
        this.mTimeout = null;
        this.mTimeoutStartTime = 0;
        this.mTimeoutHandler = this._handleTimeout.bind(this);

        this.mCanvas.on(GraphicEvents.GRAPHICS_CANVAS_IDLE_STATE_CHANGED, this.mCanvas.safeBind(this._handleIdleStateChange, this));
        this.mCanvas.on(GraphicEvents.GRAPHICS_CANVAS_PRE_UPDATE, this.mCanvas.safeBind(this._handleCanvasUpdate, this));
    }

    /**
     * Destroys this object. Called automatically when the reference count of this object reaches zero.
     *
     * @method destroy
     */
    destroy() {
        super.destroy();
    }

    /**
     * Schedules a function to be called once after the specified delay. Returns a unique identifier that can be used to
     * cancel the scheduled function before it fires.
     *
     * @method scheduleTimeout
     * @param {Function} func - The function to call.
     * @param {Number} delay - The delay after which the function will be called.
     * @returns {Number}
     */
    scheduleTimeout(func, delay = 0) {
        return this._scheduleFunction(func, delay, false);
    }

    /**
     * Schedules a function to be repeatedly called at the specified interval. Returns a unique identifier that can be
     * used to cancel the scheduled function.
     *
     * @method scheduleInterval
     * @param {Function} func - The function to call.
     * @param {Number} interval - The time interval at which the function will be called.
     * @returns {Number}
     */
    scheduleInterval(func, interval) {
        return this._scheduleFunction(func, interval, true);
    }

    /**
     * Cancels the function scheduled with the specified id.
     *
     * @method cancel
     * @param {Number} id - The id of the function to cancel.
     */
    cancel(id) {
        const index = this.mMethods.findIndex(method => method.id === id);
        if (index !== -1) {
            this.mMethods.splice(index, 1);

            const idle = this.mCanvas.idle;
            if (idle && this.mTimeout !== null) {
                clearTimeout(this.mTimeout);
                this.mTimeout = null;
                if (this.mMethods.length) {
                    this.mCurrentTimer += Date.now() - this.mTimeoutStartTime;
                    this._scheduleTimeout();
                } else {
                    this.mCurrentTimer = 0;
                }
            }
        }
    }

    /**
     * Utility method to schedule a function to be called after a delay. Returns a unique identifier for the scheduled function.
     *
     * @method _scheduleFunction
     * @param {Function} func - The function to schedule.
     * @param {Number} delay - The delay after which the function will fire.
     * @param {Boolean} repeats - Should this function be re-scheduled after it fires.
     * @param {Number=} id - The id used to schedule the function. Optional.
     * @returns {Number}
     * @private
     */
    _scheduleFunction(func, delay, repeats, id = null) {
        const idle = this.mCanvas.idle;
        if (idle && this.mTimeout !== null) {
            this.mCurrentTimer += Date.now() - this.mTimeoutStartTime;
        }

        const targetTime = delay + this.mCurrentTimer;
        const container = {
            func: func,
            delay: delay,
            targetTime: targetTime,
            repeats: repeats,
            id: id !== null ? id : this.mMethodsScheduled++,
        };

        const methods = this.mMethods;
        if (!methods.length) {
            methods.push(container);
        } else {
            let min = 0;
            let max = methods.length - 1;
            let mid = 0;

            if (targetTime <= methods[max].targetTime) {
                methods.push(container);
            } else if (targetTime >= methods[min].targetTime) {
                methods.unshift(container);
            } else {
                while (min < max && min + 1 !== max) {
                    mid = min + Math.floor((max - min) * 0.5);
                    if (targetTime < methods[mid].targetTime) {
                        min = mid;
                    } else {
                        max = mid;
                    }
                }
                methods.splice(max, 0, container);
            }
        }

        if (idle) {
            if (this.mTimeout !== null) {
                clearTimeout(this.mTimeout);
                this.mTimeout = null;
            }
            this._scheduleTimeout();
        }

        return container.id;
    }

    /**
     * Schedules a timeout to be fired as soon as the next function in the queue should fire.
     *
     * @method _scheduleTimeout
     * @private
     */
    _scheduleTimeout() {
        const nextTargetTime = this.mMethods[this.mMethods.length - 1].targetTime;
        this.mTimeout = setTimeout(this.mTimeoutHandler, nextTargetTime - this.mCurrentTimer);
        this.mTimeoutStartTime = Date.now();
    }

    /**
     * Handles changes of the idle state of the canvas linked to this scheduler.
     *
     * @method _handleIdleStateChange
     * @param {Canvas} sender - The canvas that triggered the event.
     * @param {Boolean} idle - Is the canvas idle.
     * @private
     */
    _handleIdleStateChange(sender, idle) {
        if (this.mMethods.length) {
            if (!idle && this.mTimeout !== null) {
                clearTimeout(this.mTimeout);
                this.mTimeout = null;
                this.mCurrentTimer += Date.now() - this.mTimeoutStartTime;
                this._executeFunctions();
            } else if (idle) {
                this._scheduleTimeout();
            }
        }
    }

    /**
     * Handles the canvas update event.
     *
     * @method _handleCanvasUpdate
     * @param {Canvas} sender - The canvas that triggered the event.
     * @param {Number} delta - The amount of milliseconds since the last update.
     * @private
     */
    _handleCanvasUpdate(sender, delta) {
        if (this.mMethods.length) {
            this.mCurrentTimer += Math.floor(delta);
            this._executeFunctions();
        }
    }

    /**
     * Handles a timeout scheduled by this scheduler.
     *
     * @method _handleTimeout
     * @private
     */
    _handleTimeout() {
        this.mTimeout = null;
        const time = Date.now();
        this.mCurrentTimer += time - this.mTimeoutStartTime;
        this._executeFunctions();
        this.mCurrentTimer += Date.now() - time;
        if (this.mMethods.length) {
            this._scheduleTimeout();
        }
    }

    /**
     * Executes all timed out functions since the last time this function got called. Uses the internal timer variable to
     * calculate time outs.
     *
     * @method _executeFunctions
     * @private
     */
    _executeFunctions() {
        const elapsedTime = this.mCurrentTimer;
        while (this.mMethods.length && this.mMethods[this.mMethods.length - 1].targetTime <= elapsedTime) {
            const container = this.mMethods.pop();
            container.func();
            if (container.repeats) {
                this._scheduleFunction(container.func, container.delay, container.repeats, container.id);
            }
        }

        if (!this.mMethods.length) {
            this.mCurrentTimer = 0;
        }
    }
}

export default Scheduler;
