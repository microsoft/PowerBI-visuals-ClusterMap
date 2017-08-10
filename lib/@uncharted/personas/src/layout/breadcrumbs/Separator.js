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

import Node from '../../revi/graphics/Node.js';
import Point from '../../revi/geometry/Point.js';
import Polygon from '../../revi/graphics/primitives/Polygon.js';

const ARROW_SIZE = 5;
const ARROW_PADDING = 3;

/**
 * A class that represents a simple arrow to use as a separator between breadcrumbs in a breadcrumb chain.
 *
 * @class Separator
 */
export class Separator extends Node {
    /**
     * @constructor
     * @param {Number} size - The size of the breadcrumbs this arrow will be separating.
     */
    constructor(size) {
        super(ARROW_SIZE + ARROW_PADDING * 2, size);
        this.mPolygon = new Polygon({ fillColor: 'rgb(183,183,183)' },
            Point.instance(ARROW_PADDING, size * 0.5 - ARROW_SIZE),
            Point.instance(ARROW_PADDING, size * 0.5 + ARROW_SIZE),
            Point.instance(ARROW_SIZE + ARROW_PADDING, size * 0.5)
        );

        this.anchor.set(0, 0);
        this.addChild(this.mPolygon);
    }

    /**
     * Destroys this object. Called automatically when the reference count of this object reaches zero.
     *
     * @method destroy
     */
    destroy() {
        this.mPolygon.release();
        delete this.mPolygon;

        super.destroy();
    }
}

export default Separator;
