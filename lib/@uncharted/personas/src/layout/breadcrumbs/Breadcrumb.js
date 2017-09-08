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

import CachedNode from '../../revi/graphics/CachedNode.js';
import Circle from '../../revi/graphics/primitives/Circle.js';
import Label from '../../revi/text/Label.js';
import TextEvents from '../../revi/text/Events.js';
import Easing from '../../revi/plugins/easing/Easing.js';
import EasingEvents from '../../revi/plugins/easing/Events.js';
import EasingTypes from '../../revi/plugins/easing/EasingTypes.js';
import PersonaLabel from '../../persona/Label.js';
import InputManager from '../../revi/plugins/input/InputManager.js';
import InputEvents from '../../revi/plugins/input/Events.js';
import Rectangle from '../../revi/graphics/primitives/Rectangle.js';
import Matrix from '../../revi/geometry/Matrix.js';
import Events from './Events.js';
import nextTick from '../../revi/core/nextTick.js';

const BREADCRUMB_PADDING = 5;

/**
 * Represents a single breadcrumb in a breadcrumbs chain.
 *
 * @class Breadcrumb
 */
export class Breadcrumb extends CachedNode {
    /**
     * @constructor
     * @param {Number} size - The size of the icon in this breadcrumb.
     * @param {Number} maxWidth - The maximum width of this breadcrumb, including its label.
     * @param {Layout} layout - The layout to use for the snapshot.
     * @param {Boolean=} background - Should this breadcrumb draw its own background.
     * @param {Persona=} persona - If a persona is passed, the circle representing such persona will have a different color.
     * @param {String=} label - The text that the breadcrumb will display.
     */
    constructor(size, maxWidth, layout, background = true, persona = null, label = null) {
        super(label ? maxWidth + BREADCRUMB_PADDING * 3 : size + BREADCRUMB_PADDING * 2, size + BREADCRUMB_PADDING * 2);

        this.mActiveEasing = null;
        this.mTrackingPointer = null;
        this.mAvatar = null;
        this.mAvatarMatrix = new Matrix();
        this.mIconRadius = 0;
        this.mOriginalSize = size;
        this.mIconSize = size + BREADCRUMB_PADDING * 2;
        this.mMaxWidth = maxWidth + BREADCRUMB_PADDING * 3;
        this.mDisplayLabel = true;
        this.mBackground = background ? Rectangle.instance(this.mMaxWidth, this.mIconSize, { fillColor: 'rgba(255,255,255,0.8)' }) : null;
        if (this.mBackground) {
            this.mBackground.anchor.set(0, 0);
            this.addChild(this.mBackground);
        }

        this.mLabel = label ? Label.instance(this.mMaxWidth - size - BREADCRUMB_PADDING * 2, size, label, PersonaLabel.PERSONA_NAME_FONT, null, {
            color: 'rgb(70,70,70)',
            fontSize: 12,
            autoSize: true,
            truncateMode: Label.TEXT_TRUNCATING_MODE.ELLIPSES,
            multiLineMode: Label.TEXT_MULTI_LINE_MODE.SINGLE_LINE,
        }) : null;
        if (this.mLabel) {
            this.mLabel.anchor.set(0, '50%');
            this.mLabel.position.set(this.mIconSize, '50%');

            this.mLabel.on(TextEvents.TEXT_LABEL_RENDERED, () => {
                if (this.mDisplayLabel) {
                    setTimeout(() => {
                        this.size.width = this.mIconSize + this.mLabel.size.width + BREADCRUMB_PADDING;
                    });
                }
            });

            this.addChild(this.mLabel);
        }

        this.anchor.set(0, 0);

        this._drawIcon(layout, persona);
    }

    /**
     * Destroys this object. Called automatically when the reference count of this object reaches zero.
     *
     * @method destroy
     */
    destroy() {
        this.cancelAnimations();

        if (this.mAvatar) {
            this.mAvatar.release();
            this.mAvatar = null;
        }

        delete this.mActiveEasing;
        delete this.mTrackingPointer;
        delete this.mAvatar;
        delete this.mIconRadius;
        delete this.mOriginalSize;
        delete this.mIconSize;
        delete this.mMaxWidth;
        delete this.mDisplayLabel;
        delete this.mBackground;
        delete this.mLabel;

        super.destroy();
    }

    /**
     * Returns the label instance to display this breadcrumb's text.
     *
     * @type {Label|null}
     */
    get label() {
        return this.mLabel;
    }

    /**
     * Is this breadcrumb's label displayed.
     *
     * @type {Boolean}
     */
    get displayLabel() {
        return this.mDisplayLabel;
    }

    /**
     * Defines if this breadcrumb's label is displayed.
     *
     * @param {Boolean} value - The new value.
     */
    set displayLabel(value) {
        if (value !== this.mDisplayLabel) {
            if (this.mLabel) {
                this.cancelAnimations();

                const startWidth = this.size.width;
                const targetWidth = value ? this.mIconSize + this.mLabel.size.width + BREADCRUMB_PADDING : this.mIconSize;
                const changeWidth = targetWidth - startWidth;
                const easing = Easing.instance(this.reviContext, {
                    type: EasingTypes.Cubic.EaseInOut,
                    duration: 300,
                });

                easing.on(EasingEvents.EASING_UPDATE, (sender, progress) => {
                    this.size.width = startWidth + changeWidth * progress;
                });

                easing.on([EasingEvents.EASING_END, EasingEvents.EASING_STOP], () => {
                    this.mActiveEasing = null;
                });

                easing.start();
                this.mActiveEasing = easing;
            }
            this.mDisplayLabel = value;
        }
    }

    /**
     * Called every time the object is added to the currently running scene graph.
     *
     * @method onEnter
     * @param {Symbol} reviContext - A unique symbol that identifies the rendering context of this object.
     */
    onEnter(reviContext) {
        const inputManager = InputManager.instanceForContext(reviContext);
        inputManager.on(InputEvents.INPUT_POINTER_BEGAN, inputManager.safeBind(this._handlePointerBegan, this));
        inputManager.on(InputEvents.INPUT_POINTER_MOVED, inputManager.safeBind(this._handlePointerMoved, this));
        inputManager.on([InputEvents.INPUT_POINTER_ENDED, InputEvents.INPUT_POINTER_CANCELLED], inputManager.safeBind(this._handlePointerEnded, this));
        super.onEnter(reviContext);
    }

    /**
     * Called when this objects is removed from the scene graph.
     *
     * @method onExit
     */
    onExit() {
        const inputManager = InputManager.instanceForContext(this.reviContext);
        inputManager.off(InputEvents.INPUT_POINTER_BEGAN, this._handlePointerBegan, this);
        inputManager.off(InputEvents.INPUT_POINTER_MOVED, this._handlePointerMoved, this);
        nextTick(() => {
            inputManager.off([InputEvents.INPUT_POINTER_ENDED, InputEvents.INPUT_POINTER_CANCELLED], this._handlePointerEnded, this);
        });
        super.onExit();
    }

    /**
     * Cancels all running animations in this layout.
     *
     * @method cancelAnimations
     */
    cancelAnimations() {
        if (this.mActiveEasing) {
            this.mActiveEasing.stop();
            this.mActiveEasing = null;
        }
    }

    /**
     * Updates this breadcrumb's icon.
     *
     * @method updateIcon
     *
     * @param {Layout} layout - The layout to use for the snapshot.
     * @param {Persona=} persona - If a persona is passed, the circle representing such persona will have a different color.
     */
    updateIcon(layout, persona = null) {
        this.removeChildren();

        if (this.mAvatar) {
            this.mAvatar.release();
            this.mAvatar = null;
        }

        if (this.mBackground) {
            this.addChild(this.mBackground);
        }

        if (this.mLabel) {
            this.addChild(this.mLabel);
        }

        this._drawIcon(layout, persona);
    }

    /**
     * Called every tick, drawing operations should be performed here.
     *
     * @method draw
     * @param {CanvasRenderingContext2D} context - The canvas context in which the drawing operations will be performed.
     * @param {MatrixStack} matrixStack - The matrix stack used for drawing.
     */
    draw(context, matrixStack) {
        if (this.mDirty) {
            this.mDirty = false;
            this.mOffscreenCanvas.width = this.pixelSize.width * this.deviceScale * this.globalScale;
            this.mOffscreenCanvas.height = this.pixelSize.height * this.deviceScale * this.globalScale;
            this.mOffscreenContext.setTransform(1, 0, 0, 1, 0, 0);
            this.mOffscreenContext.clearRect(0, 0, this.mOffscreenCanvas.width, this.mOffscreenCanvas.height);
            this.mOffscreenMatrix.reset();
            this.mOffscreenMatrix.scale(this.deviceScale * this.globalScale, this.deviceScale * this.globalScale);
            this.mOffscreenMatrixStack.reset();
            this.mOffscreenMatrixStack.push(this.mOffscreenMatrix);
            this.mOffscreenMatrixStack.apply(this.mOffscreenContext);
            this.updateCache(this.mOffscreenContext, context, matrixStack);

            if (this.mLabel) {
                this.mLabel._pushTransform(this.mOffscreenContext, this.mOffscreenMatrixStack);
                this.mLabel.draw(this.mOffscreenContext, this.mOffscreenMatrixStack);
                this.mLabel._popTransform(this.mOffscreenContext, this.mOffscreenMatrixStack);
            }

            this.mOffscreenContext.save();
            this.mOffscreenContext.beginPath();
            this.mOffscreenContext.rect(BREADCRUMB_PADDING, BREADCRUMB_PADDING, this.mOriginalSize, this.mOriginalSize);
            this.mOffscreenContext.closePath();
            this.mOffscreenContext.clip();

            for (this._mID = 0, this._mND = this.mChildren.length; this._mID < this._mND; ++this._mID) {
                if (this.mChildren[this._mID] !== this.mLabel) {
                    this.mChildren[this._mID]._pushTransform(this.mOffscreenContext, this.mOffscreenMatrixStack);
                    this.mChildren[this._mID].draw(this.mOffscreenContext, this.mOffscreenMatrixStack);
                    this.mChildren[this._mID]._popTransform(this.mOffscreenContext, this.mOffscreenMatrixStack);
                }
            }

            if (this.mAvatar) {
                const scale = this.mIconRadius / this.mAvatar.radius;
                this.mAvatarMatrix.reset();
                this.mAvatarMatrix.translate(BREADCRUMB_PADDING + this.mOriginalSize * 0.5 - this.mAvatar.radius * scale, BREADCRUMB_PADDING + this.mOriginalSize * 0.5 - this.mAvatar.radius * scale);
                this.mAvatarMatrix.scale(scale, scale);
                this.mOffscreenMatrixStack.push(this.mAvatarMatrix);
                this.mOffscreenMatrixStack.apply(this.mOffscreenContext);
                this.mAvatar.draw(this.mOffscreenContext, this.mOffscreenMatrixStack);
            }

            this.mOffscreenContext.restore();
        }
        this.drawCache(this.mOffscreenCanvas, context);
    }

    /**
     * Handles the pointer began input event.
     *
     * @method _handlePointerBegan
     * @param {*} sender - The sender of the event.
     * @param {PointerEvent} event - Object containing the event's description.
     * @private
     */
    _handlePointerBegan(sender, event) {
        const point = event.point;
        const localPoint = this.globalToLocalPoint(point);

        this.mTrackingPointer = null;
        if (localPoint.x >= 0 && localPoint.x <= this.pixelSize.width && localPoint.y >= 0 && localPoint.y <= this.pixelSize.height) {
            this.mTrackingPointer = event.identifier;
        }
    }

    /**
     * Handles the pointer moved event.
     *
     * @method _handlePointerMoved
     * @param {*} sender - The sender of the event.
     * @param {PointerEvent} event - Object containing the event's description.
     * @private
     */
    _handlePointerMoved(sender, event) {
        const point = event.point;
        const localPoint = this.globalToLocalPoint(point);
        if (localPoint.x < 0 || localPoint.x > this.pixelSize.width || localPoint.y < 0 || localPoint.y > this.pixelSize.height) {
            if (event.identifier === this.mTrackingPointer) {
                this.mTrackingPointer = null;
            }

            if (this.parent.breadcrumbs[this.parent.breadcrumbs.length - 1] !== this) {
                this.displayLabel = false;
            }
        } else {
            this.displayLabel = true;
        }
    }

    /**
     * Handles the pointer moved input event.
     *
     * @method _handlePointerEnded
     * @param {*} sender - The sender of the event.
     * @param {PointerEvent} event - Object containing the event's description.
     * @private
     */
    _handlePointerEnded(sender, event) {
        const point = event.point;
        const localPoint = this.globalToLocalPoint(point);
        if (event.identifier === this.mTrackingPointer) {
            this.mTrackingPointer = null;

            if (localPoint.x >= 0 && localPoint.x <= this.pixelSize.width && localPoint.y >= 0 && localPoint.y <= this.pixelSize.height) {
                const index = this.parent.breadcrumbs.indexOf(this);
                this.emit(Events.LAYOUT_BREADCRUMB_CLICKED, this, index);
                this.emit(Events.LAYOUT_BREADCRUMB_CLICKED, this, index);
            }
        }
    }

    /**
     * Draws the icon for this breadcrumb.
     *
     * @method _drawIcon
     * @param {Layout} layout - The layout to use for the snapshot.
     * @param {Persona=} persona - If a persona is passed, the circle representing such persona will have a different color.
     * @private
     */
    _drawIcon(layout, persona = null) {
        const size = this.mOriginalSize;
        const layoutBB = layout.boundingBox;
        const hasImages = Boolean(persona && persona.mAvatar.mImages.length);
        const scale = hasImages ? size / (persona.radius * 3.5) : size / Math.max(layoutBB.width, layoutBB.height);
        const offsetX = hasImages ? size * 0.5 - (persona.position.x - layoutBB.x) * scale : (size - layoutBB.width * scale) * 0.5;
        const offsetY = hasImages ? size * 0.5 - (persona.position.y - layoutBB.y) * scale : (size - layoutBB.height * scale) * 0.5;

        layout.personas.forEach(wrapper => {
            const p = wrapper.object;
            const circle = Circle.instance(p.radius * scale, {
                fillColor: p === persona ? 'rgb(70,70,70)' : 'rgb(183,183,183)',
            });

            circle.position.set(
                (p.position.x - layoutBB.x) * scale + BREADCRUMB_PADDING + offsetX,
                (p.position.y - layoutBB.y) * scale + BREADCRUMB_PADDING + offsetY
            );

            if (p === persona && hasImages) {
                this.mAvatar = persona.mAvatar.retain();
                circle.strokeType = Circle.STROKE_OUTER;
                circle.strokeColor = 'rgb(70,70,70)';
                circle.stroke = 1;
            }

            this.addChild(circle);
        });

        this.mIconRadius = persona ? persona.radius * scale : 0;
    }
}

export default Breadcrumb;
