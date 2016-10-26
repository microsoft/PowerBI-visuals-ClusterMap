/**
 * Created by dsegura on 2016-01-14.
 */

/* enable strict mode */
'use strict';

/* import modules */
var mediator = require('@uncharted/stories.common').mediator;

/**
 * Utility class to easily keep track, register and unregister events.
 * NOTE: Only one event can be registered per channel.
 *
 * @class EventTracker
 * @constructor
 */
function EventTracker() {
    /* member variables */
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
    this.mRegisteredEvents[channel] = mediator.subscribe(channel, callback);
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
        mediator.remove(channel, eventDescriptor.id);
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
