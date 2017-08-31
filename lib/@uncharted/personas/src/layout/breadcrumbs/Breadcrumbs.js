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
import Breadcrumb from './Breadcrumb.js';
import Separator from './Separator.js';

/**
 * Class to create and manage breadcrumbs, for navigation.
 *
 * @class Breadcrumbs
 */
export class Breadcrumbs extends Node {
    /**
     * @constructor
     */
    constructor(segmentedBackground = true) {
        super();

        this.mSegmentedBackground = segmentedBackground;
        this.mBreadcrumbSize = 60;
        this.mBreadcrumbs = [];
    }
    /**
     * Destroys this object. Called automatically when the reference count of this object reaches zero.
     *
     * @method destroy
     */
    destroy() {
        this.removeAllBreadcrumbs();

        delete this.mBreadcrumbSize;
        delete this.mBreadcrumbs;

        super.destroy();
    }

    /**
     * The individual breadcrumbs contained in this instance.
     *
     * @type {Array}
     */
    get breadcrumbs() {
        return this.mBreadcrumbs;
    }

    /**
     * Adds a breadcrumb to this chain using the provided layout, persona and label to generate its graphical appearance.
     *
     * @method addBreadcrumb
     * @param {Layout} layout - The layout from which a snapshot will ba taken and used as the breadcrumb icon.
     * @param {Persona=} persona - If a persona is passed, the circle representing such persona will have a different color.
     * @param {String=} label - The text that the breadcrumb will display.
     */
    addBreadcrumb(layout, persona = null, label = null) {
        if (layout.personas.length) {
            const breadcrumb = new Breadcrumb(this.mBreadcrumbSize, this.mBreadcrumbSize * 3, layout, this.mSegmentedBackground, persona, label);

            if (this.mBreadcrumbs.length) {
                const separator = Separator.instance(this.mBreadcrumbSize + 10); // hardcoded padding :(
                this.addChild(separator);
            }

            this.addChild(breadcrumb);
            this.mBreadcrumbs.push(breadcrumb);
            this.forward(breadcrumb);
        }
    }

    /**
     * Updates the last breadcrumb with the provided arguments.
     *
     * @method updateLastBreadcrumb
     * @param {Layout} layout - The layout from which a snapshot will ba taken and used as the breadcrumb icon.
     * @param {Persona=} persona - If a persona is passed, the circle representing such persona will have a different color.
     */
    updateLastBreadcrumb(layout, persona = null) {
        const lastBreadcrumb = this.mBreadcrumbs[this.mBreadcrumbs.length - 1];
        lastBreadcrumb.updateIcon(layout, persona);
    }

    /**
     * Removes the number of breadcrumbs specified in the `count` argument. Defaults to 1.
     *
     * @method removeBreadcrumb
     * @param {Number=} count - The number of breadcrumbs to be removed.
     */
    removeBreadcrumb(count = 1) {
        const layersToRemove = Math.min(this.mBreadcrumbs.length, count);
        if (layersToRemove > 0) {
            for (let i = 0; i < layersToRemove; ++i) {
                const toRemove = this.mBreadcrumbs.pop();
                toRemove.cancelAnimations();
                this.removeChild(toRemove);
                this._removeLastSeparator();
                this.unforward(toRemove);
                toRemove.release();
            }
        }
    }

    /**
     * Removes all the breadcrumbs in this chain.
     *
     * @method removeAllBreadcrumbs
     */
    removeAllBreadcrumbs() {
        while (this.mBreadcrumbs.length) {
            const toRemove = this.mBreadcrumbs.pop();
            toRemove.cancelAnimations();
            this.removeChild(toRemove);
            this._removeLastSeparator();
            this.unforward(toRemove);
            toRemove.release();
        }
    }

    /**
     * Called every tick, before this object is drawn.
     *
     * @method update
     * @param {Number} delta - The delta time since the last update.
     */
    update(delta) {
        let offset = 0;
        this.children.forEach(child => {
            child.position.set(offset, 0);
            offset += child.size.width;
        });
        super.update(delta);
    }

    /**
     * Called every tick, drawing operations should be performed here.
     *
     * @method draw
     * @param {CanvasRenderingContext2D} context - The canvas context in which the drawing operations will be performed.
     * @param {MatrixStack} matrixStack - The matrix stack used for drawing.
     */
    draw(context, matrixStack) {
        if (!this.mSegmentedBackground) {
            let width = 0;
            let height = 0;
            this.children.forEach(child => {
                width += child.size.width;
                height = Math.max(height, child.size.height);
            });
            context.fillStyle = 'rgba(255,255,255,0.8)';
            context.fillRect(0, 0, width, height);
        }
        super.draw(context, matrixStack);
    }

    /**
     * Removes the last separator (arrow) in the chain.
     *
     * @method _removeLastSeparator
     * @private
     */
    _removeLastSeparator() {
        for (let i = this.children.length - 1; i >= 0; --i) {
            if (this.children[i] instanceof Separator) {
                this.removeChildAt(i);
                break;
            }
        }
    }
}

export default Breadcrumbs;
