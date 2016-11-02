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

/**
 * Utility class to easily keep track, register and unregister events.
 * NOTE: Only one event can be registered per channel.
 *
 * @class EventTracker
 * @param {EventCenter} eventCenter - The event center to use in this event tracker.
 * @constructor
 */
function EventTracker(eventCenter) {
    /* member variables */
    this.mEventCenter = eventCenter;
    this.mRegisteredEvents = {};
}

/**
 * Returns the internal container with all registered events.
 *
 * @property registeredEvents
 * @type {Object}
 * @readonly
 */
Object.defineProperty(EventTracker.prototype, 'registeredEvents', {
    get: function() {
        return this.mRegisteredEvents;
    },
});

/**
 * Registers and tracks an event at the specified channel.
 *
 * @method registerEvent
 * @param {String} channel - The channel to listen to.
 * @param {Function} callback - The function to be called when the event is triggered.
 */
EventTracker.prototype.registerEvent = function (channel, callback) {
    if (this.mRegisteredEvents[channel]) {
        this.unregisterEvent(channel);
    }
    this.mRegisteredEvents[channel] = this.mEventCenter.subscribe(channel, callback);
};

/**
 * Unregisters an event listener for the specified channel.
 *
 * @method unregisteredEvent
 * @param {String} channel - The channel in which the event was registered.
 */
EventTracker.prototype.unregisterEvent = function (channel) {
    if (this.mRegisteredEvents.hasOwnProperty(channel) && this.mRegisteredEvents[channel]) {
        var eventDescriptor = this.mRegisteredEvents[channel];
        this.mEventCenter.remove(eventDescriptor);
        this.mRegisteredEvents[channel] = null;
    }
};

/**
 * Unregisters all the events being tracked by this instance.
 *
 * @method unregisterAllEvents
 */
EventTracker.prototype.unregisterAllEvents = function () {
    for (var channel in this.mRegisteredEvents) {
        if (this.mRegisteredEvents.hasOwnProperty(channel)) {
            this.unregisterEvent(channel);
        }
    }
};

/**
 * @export
 * @type {EventTracker}
 */
module.exports = EventTracker;
