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

import IBIndable from '../../core/IBindable.js';
import EasingTypes from './EasingTypes.js';
import Events from './Events.js';
import Canvas from '../../graphics/Canvas.js';
import GraphicsEvents from '../../graphics/Events.js';

const __CONTEXTS__ = new Map();

const EASING_OPTIONS_DEFAULTS = {
    type: EasingTypes.Linear,
    duration: 1000,
    startValue: 0,
    endValue: 1,
    amplitude: 1,
    period: 0.3,
    overshoot: 1.70158,
};

/**
 * Simple easing class. Used as the base of more complex easing classes.
 *
 * @class Easing
 */
export class Easing extends IBIndable {
    /**
     * Registers a revi context and starts executing easing functions within it.
     *
     * @method registerContext
     * @param {Symbol} context - The revi context of the canvas.
     * @static
     */
    static registerContext(context) {
        if (__CONTEXTS__.has(context)) {
            throw new Error('The context is already registered.');
        }

        const canvas = Canvas.getCanvasForContext(context);
        if (!canvas) {
            throw new Error('No canvas is registered for the provided context');
        }

        __CONTEXTS__.set(context, new Set());

        canvas.on(GraphicsEvents.GRAPHICS_CANVAS_PRE_UPDATE, Easing.update);
    }

    /**
     * Unregisters a revi context and removes all easing functions from it.
     *
     * @method unregisterContext
     * @param {Symbol} context - The revi context of the canvas.
     * @static
     */
    static unregisterContext(context) {
        if (__CONTEXTS__.has(context)) {
            const easings = __CONTEXTS__.get(context);
            easings.clear();
            const canvas = Canvas.getCanvasForContext(context);
            if (canvas) {
                canvas.off(GraphicsEvents.GRAPHICS_CANVAS_PRE_UPDATE, Easing.update);
            }

            __CONTEXTS__.delete(context);
        } else {
            throw new Error('The context was never registered.');
        }
    }

    /**
     * Schedules the specified easing to be updated during the next context update.
     *
     * @method scheduleEasing
     * @param {Symbol} context - The context to which the easing will be added.
     * @param {Easing} easing - Easing to add.
     * @returns {Boolean}
     * @static
     */
    static scheduleEasing(context, easing) {
        if (__CONTEXTS__.has(context)) {
            const easings = __CONTEXTS__.get(context);
            if (!easings.has(easing)) {
                easings.add(easing);
                easing.retain();
                return true;
            }
        }
        return false;
    }

    /**
     * Removes the specified easing from the provided context.
     *
     * @method removeEasing
     * @param {Symbol} context - the context from which the easing will be removed.
     * @param {Easing} easing - the easing to remove.
     * @returns {Boolean}
     * @static
     */
    static removeEasing(context, easing) {
        if (__CONTEXTS__.has(context)) {
            const easings = __CONTEXTS__.get(context);
            if (easings.has(easing)) {
                easings.delete(easing);
                easing.autorelease();
                return true;
            }
        }
        return false;
    }

    /**
     * Advances the easing functions attached to the specified canvas by delta time.
     *
     * @method update
     * @param {Canvas} canvas - The canvas to which the easing functions are attached.
     * @param {Number} delta - Delta time to advance the easing function by.
     */
    static update(canvas, delta) {
        const instances = __CONTEXTS__.get(canvas.reviContext);
        if (instances.size) {
            instances.forEach(easing => {
                easing.update(delta);
            });
            canvas.needsRedraw();
        }
    }

    /**
     * @param {Symbol} context - The context this easing belongs to.
     * @param {Object} options - An object with options for this easing instance.
     * @constructor
     */
    constructor(context, options) {
        if (context !== null && !__CONTEXTS__.has(context)) {
            throw new Error('You must register the easing plugin first by calling: Easing.registerContext(reviContext)');
        }

        super();
        this.mContext = context;
        this.mOptions = Object.assign({}, EASING_OPTIONS_DEFAULTS, options);
        this.mElapsed = 0;
        this.mProgress = 0;
        this.mArguments = this._buildArguments(this.mOptions);
    }

    /**
     * Destroys this object. Called automatically when the reference count of this object reaches zero.
     *
     * @method destroy
     */
    destroy() {
        if (this.mContext !== null && __CONTEXTS__.has(this.mContext)) {
            const easings = __CONTEXTS__.get(this.mContext);
            easings.delete(this);
        }

        delete this.mContext;
        delete this.mOptions;
        delete this.mElapsed;
        delete this.mArguments;

        super.destroy();
    }

    /**
     * The context of this easing object.
     *
     * @type {Symbol}
     */
    get context() {
        return this.mContext;
    }

    /**
     * The time elapsed since this easing was started.
     *
     * @type {Number}
     */
    get elapsed() {
        return this.mElapsed;
    }

    /**
     * The progress of this easing, reflects the easing type applied.
     *
     * @type {Number}
     */
    get progress() {
        return this.mProgress;
    }

    /**
     * Starts updating this easing within its context.
     *
     * @method start
     */
    start() {
        if (this.mContext !== null && Easing.scheduleEasing(this.mContext, this)) {
            if (this.mElapsed === 0) {
                this.emit(Events.EASING_START, this);
            } else {
                this.mProgress = this.mOptions.type(this.mElapsed, ...this.mArguments);
                this.emit(Events.EASING_CONTINUE, this, this.mProgress);
            }
            const canvas = Canvas.getCanvasForContext(this.mContext);
            canvas.needsRedraw();
        }
    }

    /**
     * Stops updating this easing within its context.
     *
     * @method stop
     */
    stop() {
        if (this.mContext !== null && Easing.removeEasing(this.mContext, this)) {
            this.emit(Events.EASING_STOP, this, this.mProgress);
        }
    }

    /**
     * Resets this easing so it can be reused.
     *
     * @method reset.
     */
    reset() {
        this.mProgress = 0;
        this.mElapsed = 0;
    }

    /**
     * Called every tick this easing needs to be updated.
     *
     * @method update
     * @param {Number} delta - The delta time since the last update.
     * @returns {Number}
     */
    update(delta) {
        if (this.mElapsed < this.mOptions.duration) {
            this.mElapsed = Math.min(this.mElapsed + delta, this.mOptions.duration);
            this.mProgress = this.mOptions.type(this.mElapsed, ...this.mArguments);
            this._performUpdate(this.mProgress);
            if (this.mElapsed === this.mOptions.duration) {
                if (this.mContext !== null) {
                    Easing.removeEasing(this.mContext, this);
                }
                this.emit(Events.EASING_END, this);
            }
            return this.mProgress;
        }
        return 1;
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
        this.emit(Events.EASING_UPDATE, this, progress, this.mOptions.startValue + (valueChange * progress));
    }

    /**
     * Builds the arguments needed for the easing function configured.
     *
     * @method _buildArguments
     * @param {Object} options - This easing's options.
     * @returns {Array}
     * @private
     */
    _buildArguments(options) {
        const args = [];

        args.push(options.duration);
        args.push(0);
        args.push(1);

        if (
            options.type === EasingTypes.Elastic.EaseIn ||
            options.type === EasingTypes.Elastic.EaseOut ||
            options.type === EasingTypes.Elastic.EaseInOut
        ) {
            args.push(options.amplitude);
            args.push(options.period);
        } else if (
            options.type === EasingTypes.Back.EaseIn ||
            options.type === EasingTypes.Back.EaseOut ||
            options.type === EasingTypes.Back.EaseInOut
        ) {
            args.push(options.overshoot);
        }

        return args;
    }
}

export default Easing;
