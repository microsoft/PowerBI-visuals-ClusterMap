/**
 * Copyright (c) 2016 Uncharted Software Inc.
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

/* enable strict mode */
'use strict';

/* import modules */

/**
 * Value wrapper class to be abe to observe changes to the wrapped value. Works similarly to an ES6 Proxy.
 *
 * @class Observable
 * @param {*|Observable} value - The initial value of this observable object.
 * @constructor
 */
function Observable(value) {
    /* member variables */
    this.mValue = value;
    this.mObservers = [];
    this.mEmptySpaces = 0;
    this.mParent = null;
    this.mParentId = -1;
    this.mIgnoreCount = 0;

    /* initialization */
}

/**
 * The value of this observable object.
 *
 * @property value
 * @type {*|Observable}
 */
Object.defineProperty(Observable.prototype, 'value', {
    get: function () {
        return this.mValue;
    },

    set: function (value) {
        this.setValue(value);
    },
});

/**
 * Utility function to set the value of this observable object.
 *
 * @method setValue
 * @param {*|Observable} value - The new value of this object.
 */
Observable.prototype.setValue = function (value) {
    if (this.mIgnoreCount) {
        --this.mIgnoreCount;
    } else {
        if (value instanceof Observable) {
            if (this.mParent !== value) {
                if (this.mParent && this.mParentId !== -1) {
                    this.mParent.unobserve(this.mParentId);
                }
                this.mParent = value;
                this.mParentId = value.observe(this._handleParentValueChanged.bind(this));
            }

            var parentValue = value.getValue();
            if (this.mValue !== parentValue) {
                this.mValue = parentValue;
                this._notifyObservers(parentValue);
            }
        } else if (value !== this.mValue) {
            this.mValue = value;
            this._notifyObservers(value);
        }
    }
};

/**
 * Utility function to get the value of this Object.
 *
 * @method getValue
 * @returns {*|Observable}
 */
Observable.prototype.getValue = function () {
    return this.mValue;
};

/**
 * Starts observing the value of this object. The passed `callback` will be called when changes are made.
 *
 * @method observe
 * @param {Function} callback - The callback function to be called when the value of this object changes.
 * @returns {Number} The id assigned to this observer, used to un-observe the value.
 */
Observable.prototype.observe = function (callback) {
    var observers = this.mObservers;
    var id = observers.length;
    if (!this.mEmptySpaces) { // if there are no empty spots in the observer array
        observers.push(callback);
    } else {
        for (var i = 0; i < id; ++i) {
            if (observers[i] === null) {
                observers[i] = callback;
                id = i;
                --this.mEmptySpaces;
                break;
            }
        }
    }

    return id;
};

/**
 * Removes the observer with the given `id` from the observer list.
 *
 * @method unobserve
 * @param {Number} id - The id of the observer to remove.
 * @returns {boolean} If an observer with the specified `id` is removed the result will be `true`, `false` otherwise.
 */
Observable.prototype.unobserve = function (id) {
    var observers = this.mObservers;
    if (observers[id]) {
        observers[id] = null;
        ++this.mEmptySpaces;
        return true;
    }

    return false;
};

/**
 * Ignores changes made to the this observable by the number of times specified in this function.
 * NOTE: This is cumulative if called in succession.
 *
 * @method ignoreChanges
 * @param {Number} times - The number of times changes should be ignored.
 */
Observable.prototype.ignoreChanges = function (times) {
    this.mIgnoreCount += times;
};

/**
 * Resets this observable state.
 *
 * @method reset
 * @param {boolean} deep - Should the reset remove all observers registered with this object or only break the link to its parent.
 */
Observable.prototype.reset = function(deep) {
    if (this.mParent && this.mParentId !== -1) {
        this.mParent.unobserve(this.mParentId);
        this.mParent = null;
        this.mParentId = -1;
    }

    if (deep) {
        delete this.mObservers;
        this.mObservers = [];
    }

    this.mValue = null;
    this.mIgnoreCount = 0;
};

/**
 * Internal function to notify the observers that a change in the value of this object has happened.
 *
 * @method _notifyObservers
 * @param {*|Object} value - The new value of this object.
 * @private
 */
Observable.prototype._notifyObservers = function (value) {
    var observers = this.mObservers;
    for (var i = 0, n = observers.length; i < n; ++i) {
        if (observers[i]) {
            observers[i](this, value);
        }
    }
};

/**
 * Internal function to handle changes in the value when a parent observable was set.
 *
 * @method _handleParentValueChanged
 * @param {Observable} sender - The Observable that triggered the change.
 * @param {*} value - The new value of the Observable.
 * @private
 */
Observable.prototype._handleParentValueChanged = function (sender, value) {
    if (sender === this.mParent && value !== this.mValue) {
        this.mValue = value;
        this._notifyObservers(value);
    }
};

/**
 * @export
 * @type {Observable}
 */
module.exports = Observable;
