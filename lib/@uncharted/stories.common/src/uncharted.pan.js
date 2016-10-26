'use strict';

var $ = require('jquery');

/**
 * Simple helper class to pan an SVG element around using the mouse.
 * Uses a group as a viewport to perform the transformations.
 *
 * @class Pan
 * @param {SVGElement} targetSvg - The svg element where the viewport resides.
 * @param {Snap.group} viewport - A group within the svg element where the pan transformations should be performed.
 * @param {Function} onPanStart - A callback function to be invoked when a pan gesture starts.
 * @param {Function} onPanEnd - A callback function to be invoked when a pan gesture ends.
 * @param {Function} onPanDrag - A callback function to be invoked when a pan gesture drags.
 * @constructor
 */
function Pan(targetSvg, viewport, onPanStart, onPanEnd, onPanDrag) {
    var matrix = null;
    var startX = 0;
    var startY = 0;
    var currentX = 0;
    var currentY = 0;
    var canDrag = false;
    var cbPanStart = onPanStart;
    var cbPanEnd = onPanEnd;
    var cbPanDrag = onPanDrag;

    /* setup the drag */
    targetSvg.drag(
        function(dx, dy) { // drag moved
            if (canDrag) {
                currentX = startX + dx;
                currentY = startY + dy;
                matrix.e = currentX;
                matrix.f = currentY;
                viewport.transform(matrix);
                if (cbPanDrag) {
                    cbPanDrag({deltaX: dx, deltaY: dy, startX: startX, startY: startY, x: currentX, y: currentY});
                }
            }
        },
        function() { // drag started
            if (!arguments[2] || arguments[2].button === 0) {
                canDrag = true;
                matrix = viewport.transform().localMatrix.clone();
                startX = matrix.e;
                startY = matrix.f;
                if (cbPanStart) {
                    cbPanStart({x: startX, y: startY});
                }
            }
        },
        function() {
            canDrag = false;
            if (cbPanEnd) {
                cbPanEnd({startX: startX, startY: startY, x: currentX, y: currentY});
            }
        }
    );

    targetSvg.node.addEventListener('mouseleave', function() {
        canDrag = false;
        if (cbPanEnd) {
            cbPanEnd({startX: startX, startY: startY, x: currentX, y: currentY});
        }
    });
}

/**
 * @export
 * @type {Pan}
 */
module.exports = Pan;
module.exports.AsJQueryPlugin = function() {
    $.fn.pan = function(options) {
        return new Pan(this, options);
    };
};
