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
var Snap = require('snapsvg');
var Node = require('./personas.core.node.js');

/**
 * Class that creates a label with the info required for a persona.
 *
 * @class Label
 * @param {String} name - The mane of this persona.
 * @param {Number|String} count - The number of hits for this persona.
 * @param {Number|String} totalCount - The total number of documents for this persona.
 * @param {Object} options - An object containing the configuration options for the persona that owns this instance.
 * @param {Number=} maxNameWidth - If passed, the maximum width in pixels for the name. If the name is truncated the class automatically adds ellipses at the end of the string.
 * @constructor
 */
function Label(name, count, totalCount, options, maxNameWidth) {
    /* inheritance */
    Node.call(this);

    /* member variables */
    this.mOptions = options;
    this.mShadowFilter = null;
    this.mNameBackground = null;
    this.mName = name;
    this.mCountGroup = null;
    this.mNameText = null;
    this.mCountText = null;
    this.mTotalCount = totalCount.toString();
    this.mTotalCountText = null;
    this.mPaper = null;
    this.mMaxNameWidth = maxNameWidth;

    /* initialization */
    var shadow = Snap.parse(Snap.filter.shadow(0, 0, 2, '#000000'));
    this.mShadowFilter = new Node('filter');
    this.mShadowFilter.append(shadow);
    this.append(this.mShadowFilter);

    /* create the name background */
    this.mNameBackground = new Node('rect');
    this.mNameBackground.attr({'pointer-events': 'none'});
    this.mNameBackground.addClass(this.mOptions.classes.namecontainer);
    this.append(this.mNameBackground);

    /* create the name text */
    this.mNameText = new Node('text', {x: 0, y: 0});
    this.mNameText.attr({
        'text': name,
        'text-anchor': 'middle',
        'pointer-events': 'none',
    });
    this.mNameText.addClass(this.mOptions.classes.name);
    this.mNameText.addClass(this.mOptions.classes.unselectable);
    this.append(this.mNameText);

    /* create the count text, a group is needed to fix a rendering bug in EDGE */
    this.mCountGroup = new Node();
    this.mCountGroup.attr({
        'filter': this.mShadowFilter,
    });
    this.append(this.mCountGroup);

    this.mCountText = new Node('text');
    this.mCountText.attr({
        'text': this.mOptions.config.displayTotalCountLabel ? count.toString() : totalCount.toString(),
        'text-anchor': 'middle',
        'pointer-events': 'none',
    });
    this.mCountText.addClass(this.mOptions.classes.count);
    this.mCountText.addClass(this.mOptions.classes.unselectable);
    this.mCountGroup.append(this.mCountText);

    /* create the total count text */
    if (this.mOptions.config.displayTotalCountLabel) {
        this.mTotalCountText = new Node('text');
        this.mTotalCountText.attr({
            'text': ' / ' + totalCount.toString(),
            'filter': this.mShadowFilter,
            'pointer-events': 'none',
        });
        this.mTotalCountText.addClass(this.mOptions.classes.totalcount);
        this.mTotalCountText.addClass(this.mOptions.classes.unselectable);
        this.mTotalCountText.node.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
        this.append(this.mTotalCountText);
    }
}

/* inheritance */
Label.prototype = Object.create(Node.prototype);
Label.prototype.constructor = Label;

/**
 * The name text of this label.
 *
 * @property name
 * @type {String}
 */
Object.defineProperty(Label.prototype, 'name', {
    get: function () {
        return this.mName;
    },

    set: function (value) {
        this.mName = value;
        this.mNameText.node.textContent = value;
        if (this.mMaxNameWidth) {
            this.trimTextToFit(this.mNameText.node, this.mMaxNameWidth);
            /* set the name background size and position */
            var nameBB = this.mNameText.getBBox();
            this.mNameBackground.attr({
                x: nameBB.x - this.mOptions.layout.textpadding,
                y: nameBB.y - this.mOptions.layout.textpadding,
                width: nameBB.width + this.mOptions.layout.textpadding * 2,
                height: nameBB.height + this.mOptions.layout.textpadding * 2,
            });
        }
    },
});

/**
 * The count text of this label.
 *
 * @property count
 * @type {String}
 */
Object.defineProperty(Label.prototype, 'count', {
    get: function () {
        return this.mCountText.node.textContent;
    },

    set: function (value) {
        this.mCountText.node.textContent = value;

        if (!this.mOptions.config.displayLabelsAtOneCount) {
            var valueInt = parseInt(value, 10);
            if (valueInt > 1 && this.mCountGroup.parent() !== this) {
                this.append(this.mCountGroup);
            } else if (valueInt <= 1) {
                this.mCountGroup.remove();
            }
        }
        /* set the count text position */
        var nameBB = this.mNameText.getBBox();
        this.mCountText.attr({
            x: 0,
            y: this.mOptions.layout.textpadding + (nameBB.y2 - nameBB.y) - nameBB.y,
        });
        /* trigger a repositioning of the total count text */
        this.totalCount = this.mTotalCount;
    },
});

/**
 * The total count text of this label.
 *
 * @property totalCount
 * @type {String}
 */
Object.defineProperty(Label.prototype, 'totalCount', {
    get: function () {
        return this.mTotalCount;
    },

    set: function (value) {
        this.mTotalCount = value.toString();
        if (this.mOptions.config.displayTotalCountLabel) {
            this.mTotalCountText.node.textContent = ' / ' + value;
            /* set the total count text position */
            var countBB = this.mCountText.getBBox();
            this.mTotalCountText.attr({
                x: countBB.x2,
                y: countBB.y2 - (this.mTotalCountText.getBBox().height * 0.5),
            });
        }
    },
});

/**
 * The maximum width that this label's name can spawn. If `0`, `null`, `false` or `undefined` are set, the width
 * of the name is not constrained.
 *
 * @property maxNameWidth
 * @type {Number}
 */
Object.defineProperty(Label.prototype, 'maxNameWidth', {
    get: function () {
        return this.mMaxNameWidth;
    },

    set: function (value) {
        this.mMaxNameWidth = value;
        if (this.mMaxNameWidth) {
            this.mNameText.node.textContent = this.mName;
            this.trimTextToFit(this.mNameText.node, this.mMaxNameWidth);
            /* set the name background size and position */
            var nameBB = this.mNameText.getBBox();
            this.mNameBackground.attr({
                x: nameBB.x - this.mOptions.layout.textpadding,
                y: nameBB.y - this.mOptions.layout.textpadding,
                width: nameBB.width + this.mOptions.layout.textpadding * 2,
                height: nameBB.height + this.mOptions.layout.textpadding * 2,
            });
        }
    },
});

/**
 * This function is called the first time the node is added to a paper. Used to initialize the layout because actual text
 * sizes are not computed until the text has been added to the paper.
 *
 * @method onEnter
 */
Label.prototype.onEnter = function() {
    if (this.mMaxNameWidth) {
        this.trimTextToFit(this.mNameText.node, this.mMaxNameWidth);
    }

    /* set the name background size and position */
    var nameBB = this.mNameText.getBBox();
    this.mNameBackground.attr({
        x: nameBB.x - this.mOptions.layout.textpadding,
        y: nameBB.y - this.mOptions.layout.textpadding,
        width: nameBB.width + this.mOptions.layout.textpadding * 2,
        height: nameBB.height + this.mOptions.layout.textpadding * 2,
    });

    /* if configured to skip the text count label when the count is 1, return */
    var countInt = parseInt(this.count, 10);
    if (!this.mOptions.config.displayLabelsAtOneCount && countInt <= 1) {
        this.mCountGroup.remove();
        return;
    }

    /* set the count text position */
    this.mCountText.attr({
        x: 0,
        y: this.mOptions.layout.textpadding + (nameBB.y2 - nameBB.y) - nameBB.y,
    });

    /* set the total count text position */
    if (this.mOptions.config.displayTotalCountLabel) {
        var countBB = this.mCountText.getBBox();
        this.mTotalCountText.attr({
            x: countBB.x2,
            y: countBB.y2 - (this.mTotalCountText.getBBox().height * 0.5),
        });
    }
};

/**
 * Utility function used to trim the text in the given text `element` to the desired `width` in pixels.
 *
 * @method trimTextToFit
 * @param {Element} element - The SVG text element containing the string to truncate.
 * @param {Number} width - The desired with of the text in pixels.
 */
Label.prototype.trimTextToFit = function (element, width) {
    var text = element.textContent;
    try {
        /* Start off with ComputedTextLength to get the length of string. The result will always be >=0.
         *  Use GetSubStringLength for calculating elipsis if needed. Solves for case where getComputedTextLength == 0.
         *  (element has not been rendered yet but we're trying to calculate the text value) */
        var x;
        if (element.getComputedTextLength() >= width) {
            for (x = text.length - 3; x > 0; x -= 3) {
                if (element.getSubStringLength(0, x) <= width) {
                    element.textContent = text.substring(0, x) + '...';
                    return;
                }
            }
            element.textContent = '...'; // can't place at all
        }
    } catch (e) {
        var bbox = element.getBBox();
        var y;
        if (bbox.width > width) {
            for (y = text.length - 3; y > 0; y -= 3) {
                element.textContent = text.substring(0, y) + '...';
                bbox = element.getBBox();
                if (bbox.width <= width) {
                    return;
                }
            }
            element.textContent = '...'; // can't place at all
        }
    }
};


/**
 * @export
 * @type {Label}
 */
module.exports = Label;
