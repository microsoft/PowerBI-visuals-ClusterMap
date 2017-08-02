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

/**
 * Interface class to create task queues.
 */
class ITaskQueue {
    /**
     * Creates a "double buffered" queue pool.
     *
     * @constructor
     */
    constructor() {
        this.mQueuePool = [[], []];
        this.mQueuePoolIndex = 0;
        this.mTickCallback = this.tick.bind(this);
    }

    /**
     * Destroys the task queues.
     *
     * @method destroy
     */
    destroy() {
        this.mQueuePool[0].length = 0;
        this.mQueuePool[1].length = 0;
        this.mQueuePool.length = 0;
    }

    /**
     * Adds a task to the queue and schedules a queue drain.
     *
     * @method enqueue
     * @param {Function} task - the task to enqueue.
     */
    enqueue(task) {
        this.mQueuePool[this.mQueuePoolIndex].push(task);
        this.scheduleDrain();
    }

    /**
     * Handles the queue drain as during the scheduled tick. If an exception is thrown, it schedules a queue drain for the next tick.
     *
     * @method tick
     */
    tick() {
        const queue = this.mQueuePool[this.mQueuePoolIndex];
        let task = null;
        this.mQueuePoolIndex = (++this.mQueuePoolIndex % 2);

        while (queue.length) {
            task = queue.shift();
            try {
                task();
            } catch (e) {
                const activeQueue = this.mQueuePool[this.mQueuePoolIndex];
                this.mQueuePoolIndex = (++this.mQueuePoolIndex % 2);

                queue.push(...activeQueue);
                activeQueue.length = 0;

                this.scheduleDrain();
                throw e;
            }
        }
    }

    /**
     * Schedules a queue drain based on the underlying system.
     * This method must be overridden by inheriting classes.
     *
     * @method scheduleDrain
     */
    scheduleDrain() {
        throw new Error('Not Implemented.');
    }
}

/**
 * Task queue based on MutationObservers.
 */
class ObserverTaskQueue extends ITaskQueue {
    /**
     * Creates and initializes a mutation observer based on the provided ObserverClass.
     *
     * @constructor
     * @param {constructor} ObserverClass - Constructor of the observer class to use.
     */
    constructor(ObserverClass) {
        super();
        this.mTextNode = document.createTextNode('');
        this.mTextNodeData = 0;
        this.mObserver = new ObserverClass(this.mTickCallback);
        this.mDrainQueued = false;

        this.mObserver.observe(this.mTextNode, { characterData: true });
    }

    /**
     * Disconnects the observer object.
     *
     * @method destroy
     */
    destroy() {
        this.mObserver.disconnect();
        super.destroy();
    }

    /**
     * Switches the drain flag and calls the super method.
     *
     * @method tick
     */
    tick() {
        this.mDrainQueued = false;
        super.tick();
    }

    /**
     * Schedules a queue drain.
     *
     * @method scheduleDrain
     */
    scheduleDrain() {
        if (!this.mDrainQueued) {
            this.mDrainQueued = true;
            this.mTextNodeData = ++this.mTextNodeData % 2;
            this.mTextNode.data = this.mTextNodeData;
        }
    }
}

/**
 * Class to create a task queue based on the `setImmediate` method
 */
class ImmediateTaskQueue extends ITaskQueue {
    /**
     * @constructor
     */
    constructor() {
        super();
        this.mImmediateHandle = null;
    }

    /**
     * If set, invalidates the scheduled queue drain.
     *
     * @method destroy
     */
    destroy() {
        if (this.mImmediateHandle !== null) {
            clearImmediate(this.mImmediateHandle);
            this.mImmediateHandle = null;
        }
        super.destroy();
    }

    /**
     * Switches the drain flag and calls the super method.
     *
     * @method tick
     */
    tick() {
        this.mImmediateHandle = null;
        super.tick();
    }

    /**
     * Schedules a queue drain.
     *
     * @method scheduleDrain
     */
    scheduleDrain() {
        if (this.mImmediateHandle !== null) {
            this.mImmediateHandle = setImmediate(this.mTickCallback);
        }
    }
}

/**
 * Class to create a task queue based on the `setTimeout` method
 */
class TimeoutTaskQueue extends ITaskQueue {
    /**
     * @constructor
     */
    constructor() {
        super();
        this.mTimeoutHandle = null;
    }

    /**
     * If set, invalidates the scheduled queue drain.
     *
     * @method destroy
     */
    destroy() {
        if (this.mTimeoutHandle !== null) {
            clearTimeout(this.mTimeoutHandle);
            this.mTimeoutHandle = null;
        }
        super.destroy();
    }

    /**
     * Switches the drain flag and calls the super method.
     *
     * @method tick
     */
    tick() {
        this.mTimeoutHandle = null;
        super.tick();
    }

    /**
     * Schedules a queue drain.
     *
     * @method scheduleDrain
     */
    scheduleDrain() {
        if (this.mTimeoutHandle !== null) {
            this.mTimeoutHandle = setTimeout(this.mTickCallback, 0);
        }
    }
}

/**
 * Exports a single function that uses the most viable implementation of the `nextTick` functionality or a function that
 * throws an error if no viable implementation is found.
 *
 * @export
 */
export default (() => {
    /* Node.js */
    if ((typeof process === 'object') && process && (typeof process.nextTick === 'function')) {
        return process.nextTick;
    }

    let taskQueue = null;

    /* MutationObserver */
    if ((typeof document === 'object') && document) {
        if (typeof MutationObserver === 'function') {
            taskQueue = new ObserverTaskQueue(MutationObserver);
        } else if (typeof window.WebKitMutationObserver === 'function') {
            taskQueue = new ObserverTaskQueue(window.WebKitMutationObserver);
        }
    }

    /* fallback */
    if (!taskQueue) {
        if (typeof setImmediate === 'function') {
            taskQueue = new ImmediateTaskQueue();
        } else if (typeof setTimeout === 'function' || typeof setTimeout === 'object') {
            taskQueue = new TimeoutTaskQueue();
        }
    }

    /* if a task queue was created, return a function wrapping it */
    if (taskQueue) {
        return task => {
            taskQueue.enqueue(task);
        };
    }

    /* if no viable implementation is found, throw an error every time `nextTick` is called */
    return () => {
        throw new Error('nextTick cannot be implemented on this system.');
    };
})();
