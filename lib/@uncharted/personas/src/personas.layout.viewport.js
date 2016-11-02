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
var $ = require('jquery');
var Node = require('./personas.core.node');
var Events = require('./personas.defaults').Persona.events;
var Point2D = require('./personas.core.point2d');
/**
 * Class that represents a viewport where personas will be created.
 *
 * @class Viewport
 * @param {Snap.paper} paper - The paper where this viewport will be created.
 * @param {Object} globalConfig - Global configuration object.
 * @param {Number=} minZoomScale - The minimum scale this viewport will zoom to.
 * @param {Number=} maxZoomScale - The maximum scale this viewport will zoom to.
 * @constructor
 */
function Viewport(paper, globalConfig, minZoomScale, maxZoomScale) {
    /* inheritance */
    Node.call(this);

    /* member variables */
    this.mConfig = globalConfig;
    this.mMinScale = minZoomScale || 0.5;
    this.mMaxScale = maxZoomScale || 2.0;
    this.mWheelZoomStep = 0.05;
    this.mPaper = paper;
    this.mCanDrag = false;
    this.mDragging = false;
    this.mMutationObserver = null;
    this.mEventCenter = globalConfig.eventCenter;

    this.mHandleClickBound = this.handleClick.bind(this);
    this.mHandleWheelBound = this.handleWheel.bind(this);
    this.mHandlePinchBound = this.handlePinch.bind(this);
    this.mHandleMouseLeaveBound = this.handleMouseLeave.bind(this);

    /* initialization */
    var $svg = $(this.mPaper.node);
    this.mSvgOffsetX = $svg.offset().left;
    this.mSvgOffsetY = $svg.offset().top;
    /* initialize current zoom level */
    var matrix = this.transform().localMatrix;
    this.mCurrentZoom = Math.sqrt((matrix.a * matrix.a) + (matrix.c * matrix.c));
    this.registerEvents();
}

/* inheritance */
Viewport.prototype = Object.create(Node.prototype);
Viewport.prototype.constructor = Viewport;

/**
 * Returns the minimum scale that this viewport can be set to.
 *
 * @property minZoomScale
 * @type {Number}
 * @readonly
 */
Object.defineProperty(Viewport.prototype, 'minZoomScale', {
    get: function() {
        return this.mMinScale;
    },
});

/**
 * Returns the maximum scale that this viewport can be set to.
 *
 * @property maxZoomScale
 * @type {Number}
 * @readonly
 */
Object.defineProperty(Viewport.prototype, 'maxZoomScale', {
    get: function() {
        return this.mMaxScale;
    },
});

/**
 * Returns a `Point2D` instance that represents the static center of this viewport.
 *
 * @property center
 * @type {Point2D}
 * @readonly
 */
Object.defineProperty(Viewport.prototype, 'center', {
    get: function() {
        var $svg = $(this.mPaper.node);
        return new Point2D($svg.width() * 0.5, $svg.height() * 0.5);
    },
});

/**
 * Property to keep track of the zoom amount aplied to this viewport.
 *
 * @property zoomAmount
 * @type {number}
 */
Object.defineProperty(Viewport.prototype, 'zoomAmount', {
    get: function() {
        return this.mCurrentZoom;
    },
    set: function(amount) {
        this.mCurrentZoom = amount;
    },
});

/**
 * Registers the events this instance should listen to.
 *
 * @method registerEvents
 */
Viewport.prototype.registerEvents = function() {
    /* click */
    this.mPaper.click(this.mHandleClickBound);

    /* wheel (zoom) */
    this.mPaper.node.addEventListener('wheel', this.mHandleWheelBound);

    /* pinch (zoom) */
    this.mPaper.pinch(this.mHandlePinchBound);

    /* panning */
    var matrix = null;
    var startX = 0;
    var startY = 0;
    var currentX = 0;
    var currentY = 0;
    this.mCanDrag = false;
    this.mPaper.drag(
        function(dx, dy) { // drag moved
            if (this.mCanDrag) {
                currentX = startX + dx;
                currentY = startY + dy;
                matrix.e = currentX;
                matrix.f = currentY;
                this.transform(matrix);
                this.mDragging = true;
            }
        }.bind(this),
        function() { // drag started
            if (!arguments[2] || arguments[2].button === 0) {
                this.mCanDrag = true;
                matrix = this.transform().localMatrix.clone();
                startX = matrix.e;
                startY = matrix.f;
            }
        }.bind(this),
        function(event) { // drag end
            this.mCanDrag = false;
            if (!event || event.button === 0) {
                setTimeout(function () {
                    this.mDragging = false;
                }.bind(this), 0);
            }
        }.bind(this)
    );

    this.mPaper.node.addEventListener('mouseleave', this.mHandleMouseLeaveBound);

    this.mPaper.mousedown(this.handleMouseDown);

    /* eslint-disable */
    /* This is a horrible hack to fix edge SVG rendering issues */
    /* TODO: Remove once edge fixes its renderer. */
    /* eslint-enable */
    var timeout = null;
    this.mMutationObserver = new MutationObserver(function() {
        if ('msAnimationDelay' in document.body.style) {
            if (timeout !== null) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(function() {
                this.remove();
                this.mPaper.prepend(this);
                timeout = null;
            }.bind(this), 50);
        } else {
            this.remove();
            this.mPaper.prepend(this);
        }
    }.bind(this));
    this.mMutationObserver.observe(this.node, { attributes: true });
};

/**
 * Unregisters all the events registered in the `registerEvents` function.
 *
 * @method unregisterEvents
 */
Viewport.prototype.unregisterEvents = function() {
    this.mPaper.unclick(this.mHandleClickBound);
    this.mPaper.unpinch(this.mHandlePinchBound);
    this.mPaper.unmousedown(this.handleMouseDown);
    this.mPaper.undrag();

    this.mPaper.node.removeEventListener('wheel', this.mHandleWheelBound);
    this.mPaper.node.removeEventListener('mouseleave', this.mHandleMouseLeaveBound);

    if (this.mMutationObserver) {
        this.mMutationObserver.disconnect();
        this.mMutationObserver = null;
    }
};

/**
 * Zooms this viewport by the desired amount using the origin as the center point for the zoom.
 * NOTE: This method respects the maximum and minimum zoom levels configured in the constructor.
 *
 * @method zoom
 * @param {number} amount - The scale to apply where 1 means 100%
 * @param {Point2D} origin - The origin point of the zoom
 * @param {boolean=} animated - Should the zoom be animated
 * @param {boolean=} useActualAmout - If true, will zoom to amount, otherwise zooms to current scale plus amount
 */
Viewport.prototype.zoom = function(amount, origin, animated, useActualAmout) {
    /* get the local matrix and current scale of the viewport */
    var matrix = this.transform().localMatrix;
    var scale = Math.sqrt((matrix.a * matrix.a) + (matrix.c * matrix.c));

    /* create a mew matrix to perform the transformations on */
    var newMatrix = Snap.matrix();

    /* calculate mouse coordinates within the original viewport */
    var localX = (origin.x - matrix.e) / scale;
    var localY = (origin.y - matrix.f) / scale;

    /* new scale to be zoomed to */
    var newScale;
    if (useActualAmout) {
        newScale = amount;
    } else {
        newScale = scale + amount;
    }

    if (newScale > this.mMaxScale) {
        newScale = this.mMaxScale;
    } else if (newScale < this.mMinScale) {
        newScale = this.mMinScale;
    }

    if (newScale === scale) {
        return;
    }

    /* persist the current zoom level */
    this.mCurrentZoom = newScale;

    /* transform the matrix */
    newMatrix.translate(origin.x, origin.y);
    newMatrix.scale(newScale);
    newMatrix.translate(-localX, -localY);

    /* apply the matrix */
    if (animated) {
        this.stop();
        this.animate({ transform: newMatrix }, 150);
    } else {
        this.transform(newMatrix.toString());
    }

    /* publish that there was a zoom update from user interaction for any handlers hooked in */
    this.mEventCenter.publish(Events.zoomUpdateFromUser, this.mCurrentZoom);
};

/**
 * Function to handle a mouse click on the persona.
 *
 * @method handleClick
 * @param {Event} event - The event that triggered this interaction.
 */
Viewport.prototype.handleClick = function(event) {
    if (!this.mDragging) {
        if (typeof this.mConfig.hooks.onClickEmptySpace === 'function') {
            this.mConfig.hooks.onClickEmptySpace(event);
        } else {
            this.mEventCenter.publish(Events.deselectAll);
        }
    }
};

/**
 * Function to handle the mouse wheel event.
 *
 * @method handleWheel
 * @param {Event} event - The event that triggered this interaction.
 */
Viewport.prototype.handleWheel = function(event) {
    if (event.deltaY !== 0) {
        event.preventDefault();

        var delta = event.deltaY > 0 ? 1 : -1;

        /* calculate the zoom step to perform */
        var localStep = (this.mWheelZoomStep * delta);

        /* calculate the mouse coordinates relative to the container */
        var mouseX = event.pageX - this.mSvgOffsetX;
        var mouseY = event.pageY - this.mSvgOffsetY;

        /* perform the zoom */
        this.zoom(-localStep, new Point2D(mouseX, mouseY));
    }
};

/**
 * Function to handle the pinch event.
 *
 * @method handlePinch
 * @param {Object} origin - The origin point in page coordinates where the gesture originated.
 * @param {number} distanceDelta -
 */
Viewport.prototype.handlePinch = function(origin, distanceDelta) {
    var size = this._.bboxwt;
    var zoom = distanceDelta / ((size.width + size.height) * 0.125);
    this.zoom(zoom, new Point2D(origin.x - this.mSvgOffsetX, origin.y - this.mSvgOffsetY));
};

/**
 * Function to handle the mouse leave event.
 *
 * @method handleMouseLeave
 */
Viewport.prototype.handleMouseLeave = function() {
    this.mCanDrag = false;
    this.mDragging = false;
};

/**
 * Function to handle the mouse down event.
 *
 * @method handleMouseDown
 * @param {Event} event - The event that triggered this interaction.
 */
Viewport.prototype.handleMouseDown = function(event) {
    event.preventDefault();
    event.stopPropagation();
};


/**
 * @export
 * @type {Viewport}
 */
module.exports = Viewport;
