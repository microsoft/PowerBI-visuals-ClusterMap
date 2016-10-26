/**
 * Created by dsegura on 2016-04-18.
 */

/* enable strict mode */
'use strict';

/* import modules */
var Node = require('./personas.core.node');

/**
 * Simple class that creates and handles graphical zoom controls.
 *
 * @class ZoomControls
 * @param {Object} globalConfig - Global configuration object.
 * @param {Function=} zoomIn - A callback to be called when the user clicks the zoom in button.
 * @param {Function=} zoomOut - A callback to be called when the user clicks the zoom out button.
 * @param {Function=} home - A callback to be called when the user clicks the home button.
 * @constructor
 */
function ZoomControls(globalConfig, zoomIn, zoomOut, home) {
    /* inheritance */
    Node.apply(this);

    /* member variables */
    this.mConfig = globalConfig.Persona;
    this.mButtonSide = 24;
    this.mHalfButtonSide = this.mButtonSide * 0.5;
    this.mSymbolsOffset = 5;
    this.mZoomInCallback = zoomIn;
    this.mZoomOutCallback = zoomOut;
    this.mHomeCallback = home;
    this.$node = $(this.node);

    /* initialization */
    this.addClass(this.mConfig.classes.zoomcontrols);

    /* create the background */
    this.mBackground = new Node('rect');
    this.mBackground.attr({
        x: 0,
        y: 0,
        width: this.mButtonSide,
        height: this.mButtonSide * 3,
    });
    this.append(this.mBackground);

    /* dividers */
    this.mDivider01 = new Node('line', {
        'x1': 0,
        'y1': this.mButtonSide,
        'x2': this.mButtonSide,
        'y2': this.mButtonSide,
    });
    this.append(this.mDivider01);

    this.mDivider02 = new Node('line', {
        'x1': 0,
        'y1': this.mButtonSide * 2,
        'x2': this.mButtonSide,
        'y2': this.mButtonSide * 2,
    });
    this.append(this.mDivider02);

    /* plus */
    this.mPlus = new Node('text', {x: this.mHalfButtonSide, y: this.mHalfButtonSide + this.mSymbolsOffset});
    this.mPlus.attr({
        'text': '\uf067',
        'text-anchor': 'middle',
        'pointer-events': 'none',
    });
    this.mPlus.addClass(this.mConfig.classes.zoomcontrolslabel);
    this.mPlus.addClass(this.mConfig.classes.unselectable);
    this.append(this.mPlus);

    /* collapse */
    this.mFit = new Node('text', {x: this.mHalfButtonSide, y: this.mButtonSide + this.mHalfButtonSide + this.mSymbolsOffset});
    this.mFit.attr({
        'text': '\uf066',
        'text-anchor': 'middle',
        'pointer-events': 'none',
    });
    this.mFit.addClass(this.mConfig.classes.zoomcontrolslabel);
    this.mFit.addClass(this.mConfig.classes.unselectable);
    this.append(this.mFit);

    /* minus */
    this.mMinus = new Node('text', {x: this.mHalfButtonSide, y: (this.mButtonSide * 2) + this.mHalfButtonSide + this.mSymbolsOffset});
    this.mMinus.attr({
        'text': '\uf068',
        'text-anchor': 'middle',
        'pointer-events': 'none',
    });
    this.mMinus.addClass(this.mConfig.classes.zoomcontrolslabel);
    this.mMinus.addClass(this.mConfig.classes.unselectable);
    this.append(this.mMinus);

    /* finally, register the events */
    this.registerEvents();
}

/**
 * @inheritance
 * @type {Node}
 */
ZoomControls.prototype = Object.create(Node.prototype);
ZoomControls.prototype.constructor = ZoomControls;

/**
 * Returns the width of this object.
 *
 * @property width
 * @type {Number}
 * @readonly
 */
Object.defineProperty(ZoomControls.prototype, 'width', {
    get: function () {
        return this.mButtonSide;
    },
});

/**
 * Returns the height of this object.
 *
 * @property height
 * @type {Number}
 * @readonly
 */
Object.defineProperty(ZoomControls.prototype, 'height', {
    get: function () {
        return this.mButtonSide * 3;
    },
});

/**
 * Registers this object to listen for the events that it needs to function.
 *
 * @method registerEvents
 */
ZoomControls.prototype.registerEvents = function() {
    /* click */
    this.mBackground.click(this.handleClick.bind(this));
};

/**
 * Unregisters all the events registered in the `registerEvents` function.
 *
 * @method unregisterEvents
 */
ZoomControls.prototype.unregisterEvents = function() {
    this.mBackground.unclick();
};

/**
 * Function to handle a mouse click.
 *
 * @method handleClick
 * @param {MouseEvent} event - The event that was triggered.
 * @param {number} x - The x coordinate of the event.
 * @param {number} y - The y coordinate of the event.
 */
ZoomControls.prototype.handleClick = function (event, x, y) {
    if (event) {
        event.stopPropagation();
    }

    var localY = y - this.$node.offset().top;
    var size = this.$node[0].getBoundingClientRect();
    var buttonHeight = size.height / 3;

    if (localY <= buttonHeight) {
        // plus
        if (this.mZoomInCallback) {
            this.mZoomInCallback();
        }
    } else if (localY <= buttonHeight * 2) {
        // home
        if (this.mHomeCallback) {
            this.mHomeCallback();
        }
    } else {
        // minus
        if (this.mZoomOutCallback) {
            this.mZoomOutCallback();
        }
    }
};

/**
 * @export
 * @type {ZoomControls}
 */
module.exports = ZoomControls;
