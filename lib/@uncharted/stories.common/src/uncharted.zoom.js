'use strict';

var $ = require('jquery');
var Snap = require('snapsvg');

/**
 * Default settings for the Zoom class.
 *
 * @type {{minScale: number, maxScale: number, step: number}}
 */
var Defaults = {
    minScale: 0.5,
    maxScale: 2,
    step: 0.001,
};

/**
 * Simple class to "zoom" in and out of an SVG element. Uses a group as a viewport to perform the transformations.
 * WARNING: This class does not take into consideration the possibility of transformations being applied to the
 * viewport outside of this class. Unexpected behaviour may occur.
 *
 * @class Zoom
 * @param {SVGElement} targetSvg - The svg element where the viewport resides.
 * @param {Snap.group} viewport - A group within the svg element where the zoom transformations should be performed.
 * @param {Object} options - Object containing the options used to control the zoom.
 * @constructor
 */
function Zoom(targetSvg, viewport, options) {
    var $svg = $(targetSvg.node);
    var config = $.extend(Defaults, options);
    var minScale = config.minScale;
    var maxScale = config.maxScale;
    var step = config.step;
    var offsetX = $svg.offset().left;
    var offsetY = $svg.offset().top;

    targetSvg.node.addEventListener('wheel', function(event) {
        if (event.ctrlKey && event.deltaY !== 0) {
            /* get the local matrix and current scale of the viewport */
            var matrix = viewport.transform().localMatrix;
            var scale = Math.sqrt((matrix.a * matrix.a) + (matrix.c * matrix.c));

            /* create a mew matrix to perform the transformations on */
            var newMatrix = Snap.matrix();

            /* calculate the zoom step to perform */
            var localStep = (step * event.deltaY);

            /* calculate the mouse coordinates relative to the container */
            var mouseX = event.pageX - offsetX;
            var mouseY = event.pageY - offsetY;

            /* calculate mouse coordinates within the original viewport */
            var localX = (mouseX - matrix.e) / scale;
            var localY = (mouseY - matrix.f) / scale;

            /* new scale to be zoomed to */
            var newScale = scale + localStep;

            if (newScale > maxScale) {
                newScale = maxScale;
            } else if (newScale < minScale) {
                newScale = minScale;
            }

            /* transform the matrix */
            newMatrix.translate(mouseX, mouseY);
            newMatrix.scale(newScale);
            newMatrix.translate(-localX, -localY);

            /* apply the matrix */
            viewport.transform(newMatrix);
        }
    });
}

/**
 * @export
 * @type {Zoom}
 */
module.exports = Zoom;
module.exports.AsJQueryPlugin = function() {
    $.fn.zoom = function(options) {
        return new Zoom(this, options);
    };
};
