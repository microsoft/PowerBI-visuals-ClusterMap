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

import CachedNode from '../revi/graphics/CachedNode.js';
import Circle from '../revi/graphics/primitives/Circle.js';
import Gauge from './Gauge.js';
import Avatar from './Avatar.js';
import Label from './Label.js';
import InputManager from '../revi/plugins/input/InputManager.js';
import InputEvents from '../revi/plugins/input/Events.js';
import Events from './Events.js';
import Easing from '../revi/plugins/easing/Easing.js';
import EasingEvents from '../revi/plugins/easing/Events.js';
import EasingTypes from '../revi/plugins/easing/EasingTypes.js';
import ColorInterpolator from '../revi/plugins/easing/ColorInterpolator.js';
import SubLevelBadge from './SubLevelBadge.js';
import Canvas from '../revi/graphics/Canvas.js';
import Point from '../revi/geometry/Point.js';

/**
 * Class that represents a Persona in the visualization.
 *
 * @class Persona
 */
export class Persona extends CachedNode {
    /**
     * @param {Number} radius - The radius of this persona.
     * @param {Object} data - The data this persona will represent.
     * @param {Object} config - Rendering configuration.
     * @constructor
     */
    constructor(radius, data, config) {
        const size = Math.max(radius * 2, 0);
        const sizeWithBorder = Math.ceil(size + Math.max(config.selectedBorder, config.unselectedBorder) * 2);
        const labelWidth = size + Math.ceil(config.labelWidthSpill * 2);
        const personaWidth = Math.max(labelWidth, sizeWithBorder);
        const personaHeight = Math.max(sizeWithBorder, size + config.gaugeMarkerSpill * 2);

        super(personaWidth, personaHeight);
        this.mConfig = config;
        this.mRadius = Math.max(radius, 0);
        this.mID = data.id;
        this.mSelected = data.selected || false;
        this.mPointerOver = false;
        this.mTrackingPointer = null;
        this.mTrackingPoint = null;
        this.mTrackingMoveThreshold = Math.pow(8, 2);
        this.mLinks = data.links ? data.links.slice() : [];
        this.mGaugeBackup = null;
        this.mBarsEasing = null;
        this.mFocusEasing = null;
        this.mHighlighted = false;
        this.mAlpha = 1;
        this.mInFocus = true;
        this.mSubLevelBadge = null;
        this.mSubLevelEasing = null;
        this.mDisplaySubLevelBadge = false;
        this.mGlobalScaleChanged = false;
        this.mGlobalTL = new Point();
        this.mGlobalBR = new Point();
        this.mLoaded = false;
        this.mIgnoreGlobalScaleChanges = false;

        /* background */
        const backgroundRadius = Math.max(this.mRadius - this.mConfig.radiusOverlap, 0);
        const backgroundStroke = this.mSelected ? this.mConfig.selectedBorder : this.mConfig.unselectedBorder + this.mConfig.radiusOverlap;
        const backgroundStrokeColor = this.mSelected ? this.mConfig.selectedBorderColor : this.mConfig.unselectedBorderColor;
        this.mBackground = new Circle(backgroundRadius, {
            fillEnabled: true,
            fillColor: this.mConfig.backgroundColor,
            stroke: backgroundStroke,
            strokeColor: backgroundStrokeColor,
            strokeType: Circle.STROKE_OUTER,
        });
        this.mBackground.position.set('50%', '50%');
        this.addChild(this.mBackground);

        /* gauge */
        this.mGauge = new Gauge(this.mRadius, this.mConfig);
        this.mGauge.position.set('50%', '50%');
        this.addChild(this.mGauge);
        data.properties.forEach(property => this.mGauge.addBar(property.count / data.totalCount, property.color));

        /* avatar */
        const avatarRadius = Math.max(this.mRadius - this.mConfig.gaugeThickness, 0);
        this.mAvatar = new Avatar(avatarRadius, data.images, this.mConfig);
        this.mAvatar.position.set('50%', '50%');
        this.addChild(this.mAvatar);

        /* label */
        let countLabel = null;
        let totalCountLabel = null;
        if (this.mConfig.labelCountDisplayMode === 'propertyCount/totalCount') {
            const property = data.properties[this.mConfig.labelPropertyCountIndex];
            countLabel = property.formattedCount ? property.formattedCount : property.count;
            totalCountLabel = data.formattedTotalCount ? data.formattedTotalCount : data.totalCount;
        } else if (this.mConfig.labelCountDisplayMode === 'propertyCount') {
            const property = data.properties[this.mConfig.labelPropertyCountIndex];
            countLabel = property.formattedCount ? property.formattedCount : property.count;
        } else if (this.mConfig.labelCountDisplayMode === 'totalCount') {
            countLabel = data.formattedTotalCount ? data.formattedTotalCount : data.totalCount;
        }

        this.mLabel = new Label(data.label, countLabel, totalCountLabel, labelWidth, this.size.height, this.mConfig);
        this.mLabel.anchor.set('50%', this.mConfig.labelVerticalPosition);
        this.mLabel.position.set('50%', this.mConfig.labelVerticalPosition);
        this.addChild(this.mLabel);

        this.mSubLevelBadge = new SubLevelBadge(this.mConfig.subLevelBadgeRadius, this.mConfig.subLevelBadgeColor, this.mConfig.subLevelBadgeAccentColor);
        this.mSubLevelBadge.mParent = this;
        this.mSubLevelBadge.position.set(
            this.size.width * 0.5 + Math.cos(Math.PI * 0.25) * (this.mRadius - this.mSubLevelBadge.size.width * 0.1),
            this.size.height * 0.5 + Math.sin(Math.PI * 0.25) * (this.mRadius - this.mSubLevelBadge.size.width * 0.1)
        );
        this.forward(this.mSubLevelBadge);
    }

    /**
     * Destroys this object. Called automatically when the reference count of this object reaches zero.
     *
     * @method destroy
     */
    destroy() {
        if (this.mBarsEasing) {
            this.mBarsEasing.stop();
            this.mBarsEasing = null;
        }

        if (this.mGaugeBackup) {
            this.mGaugeBackup.length = 0;
            this.mGaugeBackup = null;
        }

        this.mBackground.release();
        this.mGauge.release();
        this.mAvatar.release();
        this.mLabel.release();
        this.mGlobalTL.release();
        this.mGlobalBR.release();

        if (this.mTrackingPoint) {
            this.mTrackingPoint.release();
            this.mTrackingPoint = null;
        }

        delete this.mConfig;
        delete this.mRadius;
        delete this.mID;
        delete this.mSelected;
        delete this.mPointerOver;
        delete this.mTrackingPointer;
        delete this.mTrackingPoint;
        delete this.mTrackingMoveThreshold;
        delete this.mLinks;
        delete this.mBackground;
        delete this.mGauge;
        delete this.mAvatar;
        delete this.mLabel;
        delete this.mGaugeBackup;
        delete this.mBarsEasing;
        delete this.mFocusEasing;
        delete this.mHighlighted;
        delete this.mAlpha;
        delete this.mInFocus;
        delete this.mSubLevelBadge;
        delete this.mSubLevelEasing;
        delete this.mDisplaySubLevelBadge;
        delete this.mGlobalScaleChanged;
        delete this.mGlobalTL;
        delete this.mGlobalBR;
        delete this.mLoaded;
        delete this.mIgnoreGlobalScaleChanges;

        super.destroy();
    }

    /**
     * The ID assigned to this persona through the data.
     *
     * @type {*}
     */
    get id() {
        return this.mID;
    }

    /**
     * An array representing this persona links to other personas.
     *
     * @type {Array}
     */
    get links() {
        return this.mLinks;
    }

    /**
     * The radius that encloses all elements of this persona.
     *
     * @type {Number}
     */
    get safeRadius() {
        const size = this.mRadius * 2;
        const sizeWithBorder = Math.ceil(size + Math.max(this.mConfig.selectedBorder, this.mConfig.unselectedBorder) * 2);
        const labelWidth = size + Math.ceil(this.mConfig.labelWidthSpill * 2);
        const personaWidth = Math.max(labelWidth, sizeWithBorder);
        const personaHeight = Math.max(sizeWithBorder, size + this.mConfig.gaugeMarkerSpill * 2);
        return Math.max(personaWidth, personaHeight) * 0.5;
    }

    /**
     * Is this persona highlighted.
     *
     * @type {Boolean}
     */
    get highlighted() {
        return this.mHighlighted;
    }

    /**
     * The configured radius of this persona.
     *
     * @type {Number}
     */
    get radius() {
        return this.mRadius;
    }

    /**
     * Sets the radius of this persona.
     *
     * @param {Number} value - The new radius.
     */
    set radius(value) {
        if (value !== this.mRadius) {
            this.mRadius = Math.max(value, 0);

            const scale = this.mGlobalScale * this.mScale;
            const radius = this.mRadius * scale;
            const size = this.mRadius * 2;
            const sizeWithBorder = Math.ceil(size + Math.max(this.mConfig.selectedBorder, this.mConfig.unselectedBorder) * 2 / scale);
            const labelWidth = size + Math.ceil(this.mConfig.labelWidthSpill * 2 / scale);
            const personaWidth = Math.max(labelWidth, sizeWithBorder);
            const personaHeight = Math.max(sizeWithBorder, size + this.mConfig.gaugeMarkerSpill * 2 / scale);
            this.size.set(personaWidth, personaHeight);

            this.mBackground.radius = Math.max(radius - this.mConfig.radiusOverlap, 0);
            this.mGauge.radius = radius;
            this.mAvatar.radius = Math.max(radius - this.mConfig.gaugeThickness, 0);
            this.mLabel.maxSize.set(radius * 2 + Math.ceil(this.mConfig.labelWidthSpill * 2), this.size.height * scale);

            this.mSubLevelBadge.position.set(
                this.size.width * 0.5 + Math.cos(Math.PI * 0.25) * (this.mRadius - this.mSubLevelBadge.size.width * 0.1),
                this.size.height * 0.5 + Math.sin(Math.PI * 0.25) * (this.mRadius - this.mSubLevelBadge.size.width * 0.1)
            );

            this.needsRedraw();
        }
    }

    /**
     * Is this persona selected.
     *
     * @type {Boolean}
     */
    get selected() {
        return this.mSelected;
    }

    /**
     * Sets the selection state of this persona.
     *
     * @param {Boolean} value - The new selection state.
     */
    set selected(value) {
        if (value !== this.mSelected) {
            this.mSelected = value;
            this.mBackground.stroke = (this.mSelected ? this.mConfig.selectedBorder : this.mConfig.unselectedBorder) + this.mConfig.radiusOverlap;
            this.mBackground.strokeColor = this.mSelected ? this.mConfig.selectedBorderColor : this.mConfig.unselectedBorderColor;
        }
    }

    /**
     * Does this persona ignore global scale changes.
     *
     * @type {Boolean}
     */
    get ignoreGlobalScaleChanges() {
        return this.mIgnoreGlobalScaleChanges;
    }

    /**
     * Sets if this persona should ignore global scale changes to its children.
     *
     * @param {Boolean} value - The new value.
     */
    set ignoreGlobalScaleChanges(value) {
        this.mIgnoreGlobalScaleChanges = value;
    }

    /**
     * The aggregated scale of this node and all its ancestors.
     *
     * @type {Number}
     */
    get globalScale() {
        return super.globalScale;
    }

    /**
     * Sets the global scale of this node and its children. Usually this property should not be set manually.
     *
     * @param {Number} value - the new global scale of the node.
     */
    set globalScale(value) {
        if (!this.mIgnoreGlobalScaleChanges) {
            if (value !== this.globalScale) {
                this.mDirty = true;
                this.mGlobalScaleChanged = true;
                this.needsRedraw();
            }
            this.mGlobalScale = value;
        }
    }

    /**
     * Gets the alpha value that this persona will be rendered at.
     *
     * @type {Number}
     */
    get alpha() {
        return this.mAlpha;
    }

    /**
     * Sets the alpha value that this persona will be rendered at.
     *
     * @param {Number} value - The new value.
     */
    set alpha(value) {
        if (value !== this.mAlpha) {
            this.mAlpha = value;
            this.needsRedraw();
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
        if (this.mDisplaySubLevelBadge) {
            this.mSubLevelBadge.onEnter(reviContext);
        }
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
        inputManager.off([InputEvents.INPUT_POINTER_ENDED, InputEvents.INPUT_POINTER_CANCELLED], this._handlePointerEnded, this);
        if (this.mDisplaySubLevelBadge) {
            this.mSubLevelBadge.onExit();
        }
        super.onExit();
    }

    /**
     * Called every tick, drawing operations should be performed here.
     *
     * @method draw
     * @param {CanvasRenderingContext2D} context - The canvas context in which the drawing operations will be performed.
     * @param {MatrixStack} matrixStack - The matrix stack used for drawing.
     * @param {Boolean} startDrawTime - The time at which personas started to be drawn.
     */
    draw(context, matrixStack, startDrawTime) {
        /* check if the persona is in view */
        const canvas = Canvas.getCanvasForContext(this.reviContext);
        this.localToGlobalCoords(0, 0, this.mGlobalTL);
        this.localToGlobalCoords(this.mPixelSize.width, this.mPixelSize.height, this.mGlobalBR);

        if (
            this.mGlobalBR.x <= 0 ||
            this.mGlobalBR.y <= 0 ||
            this.mGlobalTL.x >= canvas.pixelSize.width ||
            this.mGlobalTL.y >= canvas.pixelSize.height
        ) {
            return;
        }

        if (this.mDirty && (!this.mLoaded || (!this.mIgnoreGlobalScaleChanges && Date.now() - startDrawTime < 33))) {
            if (this.mGlobalScaleChanged) {
                this.mGlobalScaleChanged = false;
                this._popTransform(context, matrixStack);
                const radius = this.mRadius;
                this.mRadius += 5;
                this.radius = radius;
                this._pushTransform(context, matrixStack);
            }

            this.mDirty = false;
            this.mOffscreenCanvas.width = this.size.width * this.deviceScale * this.globalScale;
            this.mOffscreenCanvas.height = this.size.height * this.deviceScale * this.globalScale;
            this.mOffscreenContext.setTransform(1, 0, 0, 1, 0, 0);
            this.mOffscreenContext.clearRect(0, 0, this.mOffscreenCanvas.width, this.mOffscreenCanvas.height);
            this.mOffscreenMatrix.reset();
            this.mOffscreenMatrix.scale(this.deviceScale, this.deviceScale);
            this.mOffscreenMatrix.translate(this.size.width * this.globalScale * 0.5 - this.size.width * 0.5, this.size.height * this.globalScale * 0.5 - this.size.height * 0.5);
            this.mOffscreenMatrixStack.reset();
            this.mOffscreenMatrixStack.push(this.mOffscreenMatrix);
            this.mOffscreenMatrixStack.apply(this.mOffscreenContext);
            this.updateCache(this.mOffscreenContext, context, matrixStack);
            for (this._mID = 0, this._mND = this.mChildren.length; this._mID < this._mND; ++this._mID) {
                this.mChildren[this._mID]._pushTransform(this.mOffscreenContext, this.mOffscreenMatrixStack);
                if (this.mLoaded || this.mChildren[this._mID] !== this.mLabel) {
                    this.mChildren[this._mID].draw(this.mOffscreenContext, this.mOffscreenMatrixStack);
                }
                this.mChildren[this._mID]._popTransform(this.mOffscreenContext, this.mOffscreenMatrixStack);
            }

            if (!this.mLoaded) {
                this.mLoaded = true;
                this.mDirty = true;
                this.needsRedraw();
            }
        } else if (this.mDirty) {
            this.needsRedraw();
        }

        const oldAlpha = context.globalAlpha;
        context.globalAlpha = oldAlpha * this.mAlpha;

        this.drawCache(this.mOffscreenCanvas, context);
        if (this.mDisplaySubLevelBadge || this.mSubLevelEasing) {
            this.mSubLevelBadge._pushTransform(context, matrixStack);
            this.mSubLevelBadge.draw(context, matrixStack);
            this.mSubLevelBadge._popTransform(context, matrixStack);
        }

        context.globalAlpha = oldAlpha;
    }

    /**
     * Updates this persona with the data provided.
     *
     * @method updateData
     * @param {Object} data - the data used to update this persona.
     */
    updateData(data) {
        let countLabel = null;
        let totalCountLabel = null;
        if (this.mConfig.labelCountDisplayMode === 'propertyCount/totalCount') {
            const property = data.properties[this.mConfig.labelPropertyCountIndex];
            countLabel = property.formattedCount ? property.formattedCount : property.count;
            totalCountLabel = data.formattedTotalCount ? data.formattedTotalCount : data.totalCount;
        } else if (this.mConfig.labelCountDisplayMode === 'propertyCount') {
            const property = data.properties[this.mConfig.labelPropertyCountIndex];
            countLabel = property.formattedCount ? property.formattedCount : property.count;
        } else if (this.mConfig.labelCountDisplayMode === 'totalCount') {
            countLabel = data.formattedTotalCount ? data.formattedTotalCount : data.totalCount;
        }
        this.mLabel.updateText(data.label, countLabel, totalCountLabel);

        this.mAvatar.updateImages(data.images);

        this.mLinks = data.links ? data.links.slice() : [];

        /* update gauge here */
        const properties = data.properties;
        const bars = this.mGauge.bars;

        while (bars.length > properties.length) {
            this.mGauge.removeBar(bars.length - 1);
        }

        const barsCount = bars.length;
        properties.forEach((property, i) => {
            if (i < barsCount) {
                bars[i].progress = property.count / data.totalCount;
                bars[i].color = property.color;
            } else {
                this.mGauge.addBar(property.count / data.totalCount, property.color);
            }
        });
    }

    /**
     * Applies a highlight to this persona using the specified data.
     *
     * @method highlight
     * @param {Object} data - the data used to update this persona.
     * @param {Boolean} animated - Should the highlight appear animated.
     */
    highlight(data, animated = true) {
        if (this.mBarsEasing) {
            this.mBarsEasing.stop();
            this.mBarsEasing = null;
        }

        if (!this.mGaugeBackup) {
            this.mGaugeBackup = [];
            /* make a backup of the gauge bars' data */
            this.mGauge.bars.forEach(bar => {
                this.mGaugeBackup.push({
                    progress: bar.progress,
                    color: bar.color,
                });
            });
        }

        const properties = data.properties;
        const bars = this.mGauge.bars;
        const barsCount = Math.min(bars.length, properties.length);

        this.mHighlighted = properties.length > 0;

        if (animated) {
            this.mBarsEasing = Easing.instance(this.reviContext, {
                type: EasingTypes.Cubic.EaseInOut,
                duration: 300,
            });

            for (let i = bars.length; i > barsCount; --i) {
                const index = i - 1;
                const toRemove = bars[index];
                const startProgress = toRemove.progress;

                this.mBarsEasing.on(EasingEvents.EASING_UPDATE, (sender, progress) => {
                    toRemove.progress = startProgress * (1 - progress);
                });

                this.mBarsEasing.on([EasingEvents.EASING_END, EasingEvents.EASING_STOP], () => {
                    this.mGauge.removeBar(index);
                });
            }

            properties.forEach((property, i) => {
                const endProgress = property.count / data.totalCount;
                let interpolator = null;

                if (i < barsCount) {
                    const startProgress = bars[i].progress;
                    const progressChange = endProgress - startProgress;
                    interpolator = new ColorInterpolator(bars[i].color, property.color);

                    this.mBarsEasing.on(EasingEvents.EASING_UPDATE, (sender, progress) => {
                        bars[i].progress = startProgress + progressChange * progress;
                        bars[i].color = interpolator.colorForProgress(progress);
                    });
                } else {
                    this.mGauge.addBar(0, property.color);
                    this.mBarsEasing.on(EasingEvents.EASING_UPDATE, (sender, progress) => {
                        bars[i].progress = endProgress * progress;
                    });
                }

                this.mBarsEasing.on([EasingEvents.EASING_END, EasingEvents.EASING_STOP], () => {
                    bars[i].progress = endProgress;
                    bars[i].color = property.color;
                    if (interpolator) {
                        interpolator.release();
                    }
                });
            });

            this.mBarsEasing.on([EasingEvents.EASING_END, EasingEvents.EASING_STOP], () => {
                this.mBarsEasing = null;
            });

            this.mBarsEasing.start();
        } else {
            while (bars.length > properties.length) {
                this.mGauge.removeBar(bars.length - 1);
            }

            properties.forEach((property, i) => {
                if (i < barsCount) {
                    bars[i].progress = property.count / data.totalCount;
                    bars[i].color = property.color;
                } else {
                    this.mGauge.addBar(property.count / data.totalCount, property.color);
                }
            });
        }
    }

    /**
     * Unhighlights this persona, if previosuly highlighted.
     *
     * @method unhighlight
     * @param {Boolean} animated - Should the operation be animated.
     */
    unhighlight(animated = true) {
        if (this.mGaugeBackup) {
            if (this.mBarsEasing) {
                this.mBarsEasing.stop();
                this.mBarsEasing = null;
            }

            const bars = this.mGauge.bars;
            const barsCount = Math.min(bars.length, this.mGaugeBackup.length);
            if (animated) {
                this.mBarsEasing = Easing.instance(this.reviContext, {
                    type: EasingTypes.Cubic.EaseInOut,
                    duration: 300,
                });

                for (let i = bars.length; i > barsCount; --i) {
                    const index = i - 1;
                    const toRemove = bars[index];
                    const startProgress = toRemove.progress;

                    this.mBarsEasing.on(EasingEvents.EASING_UPDATE, (sender, progress) => {
                        toRemove.progress = startProgress * (1 - progress);
                    });

                    this.mBarsEasing.on([EasingEvents.EASING_END, EasingEvents.EASING_STOP], () => {
                        this.mGauge.removeBar(index);
                    });
                }

                this.mGaugeBackup.forEach((backup, i) => {
                    let interpolator = null;

                    if (i < barsCount) {
                        const startProgress = bars[i].progress;
                        const progressChange = backup.progress - startProgress;
                        interpolator = new ColorInterpolator(bars[i].color, backup.color);

                        this.mBarsEasing.on(EasingEvents.EASING_UPDATE, (sender, progress) => {
                            bars[i].progress = startProgress + progressChange * progress;
                            bars[i].color = interpolator.colorForProgress(progress);
                        });
                    } else {
                        this.mGauge.addBar(0, backup.color);
                        this.mBarsEasing.on(EasingEvents.EASING_UPDATE, (sender, progress) => {
                            bars[i].progress = backup.progress * progress;
                        });
                    }

                    this.mBarsEasing.on([EasingEvents.EASING_END, EasingEvents.EASING_STOP], () => {
                        bars[i].progress = backup.progress;
                        bars[i].color = backup.color;
                        if (interpolator) {
                            interpolator.release();
                        }
                    });
                });

                this.mBarsEasing.on([EasingEvents.EASING_END, EasingEvents.EASING_STOP], () => {
                    this.mBarsEasing = null;
                });

                this.mBarsEasing.start();
            } else {
                while (bars.length > this.mGaugeBackup.length) {
                    this.mGauge.removeBar(bars.length - 1);
                }

                this.mGaugeBackup.forEach((backup, i) => {
                    if (i < barsCount) {
                        bars[i].progress = backup.progress;
                        bars[i].color = backup.color;
                    } else {
                        this.mGauge.addBar(backup.progress, backup.color);
                    }
                });
            }
            this.mGaugeBackup = null;
        }
        this.mHighlighted = false;
    }

    /**
     * Defines if this persona should be in "focus".
     *
     * @method setFocus
     * @param {Boolean} focus - Should this persona be in "focus"
     * @param {Boolean} animated - Should the operation be animated.
     */
    setFocus(focus, animated) {
        if (focus !== this.mInFocus) {
            if (this.mFocusEasing) {
                this.mFocusEasing.stop();
                this.mFocusEasing = null;
            }

            this.mInFocus = focus;
            if (animated) {
                this.mFocusEasing = Easing.instance(this.reviContext, {
                    type: EasingTypes.Cubic.EaseInOut,
                    duration: 300,
                });

                const startAlpha = this.alpha;
                const endAlpha = focus ? 1 : this.mConfig.outOfFocusAlpha;
                const changeAlpha = endAlpha - startAlpha;

                this.mFocusEasing.on(EasingEvents.EASING_UPDATE, (sender, progress) => {
                    this.alpha = startAlpha + changeAlpha * progress;
                });

                this.mFocusEasing.on([EasingEvents.EASING_END, EasingEvents.EASING_STOP], () => {
                    this.mAlpha = endAlpha;
                    this.mFocusEasing = null;
                });

                this.mFocusEasing.start();
            } else {
                this.alpha = focus ? 1 : this.mConfig.outOfFocusAlpha;
            }
        }
    }

    /**
     * Displays the sub level badge of this persona.
     *
     * @method showSubLevelBadge
     * @param {Boolean=} animated - Should the badge be shown in an animated way.
     */
    showSubLevelBadge(animated = true) {
        if (!this.mDisplaySubLevelBadge) {
            if (this.mSubLevelEasing) {
                this.mSubLevelEasing.stop();
                this.mSubLevelEasing = null;
            }

            const initialScale = 0.6;
            const scaleChange = 1.0 - initialScale;
            this.mSubLevelBadge.scale = animated ? initialScale : 1;

            if (animated) {
                this.mSubLevelEasing = Easing.instance(this.reviContext, {
                    type: EasingTypes.Back.EaseOut,
                    duration: 400,
                    overshoot: 2,
                });

                this.mSubLevelEasing.on(EasingEvents.EASING_UPDATE, (sender, progress) => {
                    this.mSubLevelBadge.scale = initialScale + scaleChange * progress;
                });

                this.mSubLevelEasing.on([EasingEvents.EASING_END, EasingEvents.EASING_STOP], () => {
                    this.mSubLevelBadge.scale = 1;
                    this.mSubLevelEasing = null;
                });

                this.mSubLevelEasing.start();
            }

            this.mDisplaySubLevelBadge = true;
            if (this.running) {
                this.mSubLevelBadge.onEnter(this.reviContext);
            }
        }
    }

    /**
     * Hides the sub level badge of this persona.
     *
     * @method hideSubLevelBadge
     * @param {Boolean=} animated - Should the badge be hidden in an animated way.
     */
    hideSubLevelBadge(animated = true) {
        if (this.mDisplaySubLevelBadge) {
            if (this.mSubLevelEasing) {
                this.mSubLevelEasing.stop();
                this.mSubLevelEasing = null;
            }

            const endScale = 0.6;
            const scaleChange = 1.0 - endScale;
            this.mSubLevelBadge.scale = 1;

            if (animated) {
                this.mSubLevelEasing = Easing.instance(this.reviContext, {
                    type: EasingTypes.Back.EaseIn,
                    duration: 150,
                });

                this.mSubLevelEasing.on(EasingEvents.EASING_UPDATE, (sender, progress) => {
                    this.mSubLevelBadge.scale = 1.0 - scaleChange * progress;
                });

                this.mSubLevelEasing.on([EasingEvents.EASING_END, EasingEvents.EASING_STOP], () => {
                    this.mSubLevelBadge.scale = 0;
                    this.mSubLevelEasing = null;
                });

                this.mSubLevelEasing.start();
            }

            this.mDisplaySubLevelBadge = false;
            if (this.running) {
                this.mSubLevelBadge.onExit();
            }
        }
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
        const localPoint = this.globalToLocalPoint(event.point);
        const distanceSQ = Math.pow(localPoint.x - this.size.width * 0.5, 2) + Math.pow(localPoint.y - this.size.height * 0.5, 2);

        this.mTrackingPointer = null;
        if (this.mTrackingPoint) {
            this.mTrackingPoint.release();
            this.mTrackingPoint = null;
        }

        if (distanceSQ < this.radius * this.radius) {
            this.mTrackingPointer = event.identifier;
            this.mTrackingPoint = event.point.retain();
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
        if (event.identifier === this.mTrackingPointer) {
            const point = event.point;
            const distanceSQ = Math.pow(point.x - this.mTrackingPoint.x, 2) + Math.pow(point.y - this.mTrackingPoint.y, 2);
            if (distanceSQ > this.mTrackingMoveThreshold) {
                this.mTrackingPointer = null;
                if (this.mTrackingPoint) {
                    this.mTrackingPoint.release();
                    this.mTrackingPoint = null;
                }
            }
        }

        const localPoint = this.globalToLocalPoint(event.point);
        const distanceSQ = Math.pow(localPoint.x - this.size.width * 0.5, 2) + Math.pow(localPoint.y - this.size.height * 0.5, 2);
        if (this.mPointerOver && distanceSQ > this.radius * this.radius) {
            if (this.mDisplaySubLevelBadge) {
                const badgeRadius = this.mSubLevelBadge.size.width * 0.5;
                const badgeLocalPoint = this.mSubLevelBadge.globalToLocalPoint(event.point);
                const badgeDistanceSQ = Math.pow(badgeLocalPoint.x - badgeRadius, 2) + Math.pow(badgeLocalPoint.y - badgeRadius, 2);

                if (badgeDistanceSQ > badgeRadius * badgeRadius) {
                    this.emit(Events.PERSONA_POINTER_OUT, this, event.position, localPoint);
                }
            } else {
                this.mPointerOver = false;
                this.emit(Events.PERSONA_POINTER_OUT, this, event.position, localPoint);
            }
        } else if (!this.mPointerOver && distanceSQ <= this.radius * this.radius) {
            this.mPointerOver = true;
            this.emit(Events.PERSONA_POINTER_OVER, this, event.position, localPoint);
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
        if (event.identifier === this.mTrackingPointer) {
            const localPoint = this.globalToLocalPoint(event.point);
            const distanceSQ = Math.pow(localPoint.x - this.size.width * 0.5, 2) + Math.pow(localPoint.y - this.size.height * 0.5, 2);

            this.mTrackingPointer = null;
            if (this.mTrackingPoint) {
                this.mTrackingPoint.release();
                this.mTrackingPoint = null;
            }

            if (distanceSQ < this.radius * this.radius) {
                this.emit(Events.PERSONA_CLICKED, this, event.position, localPoint);
            }
        }
    }

    /**
     * Updates the underlying affine matrix object.
     *
     * @method _updateMatrix
     * @param {Symbol|null} trigger - A symbol describing what triggered the update as described in the Node.MATRIX_UPDATE_* constants.
     * @private
     */
    _updateMatrix(trigger = null) {
        super._updateMatrix(trigger);
        if (this.mSubLevelBadge) {
            this.mSubLevelBadge._updateMatrix(null);
        }
    }
}

export default Persona;
