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

import Node from '../revi/graphics/Node.js';
import TextLabel from '../revi/text/Label.js';
import TextEvents from '../revi/text/Events.js';
import GeometryEvents from '../revi/geometry/Events.js';
import FontManager from '../revi/text/FontManager.js';
import Arial from '../config/fonts/Arial.js';
import Oswald from '../config/fonts/Oswald700.js';
import Rectangle from '../revi/graphics/primitives/Rectangle.js';
import Size from '../revi/geometry/Size.js';

const PERSONA_FONTS = {
    NAME: Symbol('PERSONA_NAME_FONT'),
    COUNT: Symbol('PERSONA_COUNT_FONT'),
    TOTAL_COUNT: Symbol('PERSONA_TOTAL_COUNT_FONT'),
};

/**
 * Creates and renders a persona's label. Includes the persona name, count and total count.
 *
 * @class Label
 */
export class Label extends Node {
    /**
     * The key used to load the name font.
     *
     * @type {Symbol}
     * @readonly
     */
    static get PERSONA_NAME_FONT() {
        return PERSONA_FONTS.NAME;
    }

    /**
     * The key used to load the count font.
     *
     * @type {Symbol}
     * @readonly
     */
    static get PERSONA_COUNT_FONT() {
        return PERSONA_FONTS.COUNT;
    }

    /**
     * The key used to load the total count font.
     *
     * @type {Symbol}
     * @readonly
     */
    static get PERSONA_TOTAL_COUNT_FONT() {
        return PERSONA_FONTS.TOTAL_COUNT;
    }

    /**
     *
     * @param {String} name - the name of this persona.
     * @param {String|Number|null} count - The count of this persona or null if it should not be rendered.
     * @param {String|Number|null} totalCount - The total count of this persona or null if it should not be rendered.
     * @param {Number} width - The width within which the label should fit.
     * @param {Number} height - The height within which the label should fit.
     * @param {Object} config - The label's configuration.
     * @constructor
     */
    constructor(name, count, totalCount, width, height, config) {
        super();
        this.mMaxSize = new Size(width, height);
        this.mLabelRenderPadding = 4;
        this.mName = name;
        this.mCount = count;
        this.mTotalCount = totalCount;
        this.mConfig = config;
        this.mFontSizeScale = this.mConfig.labelScaleFontSizes ? (this.maxSize.height / (this.mConfig.labelScaleBasePersonaRadius * 2)) : 1;
        this.mBiggestFontSize = Math.max(this.mConfig.labelNameFontSize, this.mConfig.labelCountFontSize, this.mConfig.labelTotalCountFontSize);
        this.mSmallestFontSize = Math.min(this.mConfig.labelNameFontSize, this.mConfig.labelCountFontSize, this.mConfig.labelTotalCountFontSize);

        this.mNameLabel = null;
        this.mCountLabel = null;
        this.mTotalCountLabel = null;
        this.mShowLabel = this.mConfig.labelNameShow;

        this.mNameBack = new Rectangle(0, 0, {
            fillEnabled: true,
            fillColor: config.labelNameBackgroundColor,
        });

        this.maxSize.on(GeometryEvents.GEOMETRY_VALUE_CHANGED, this.maxSize.safeBind(this._handleMaxSizeChanged, this));

        this._initName();

        if (this.mCount !== null) {
            const countFont = this.mConfig.labelCountFont === 'default' ? Oswald : this.mConfig.labelCountFont;
            FontManager.sharedInstance().loadFont(countFont, PERSONA_FONTS.COUNT).then(this._handleCountFontLoaded.bind(this));
        }

        if (this.mTotalCount !== null) {
            const totalCountFont = this.mConfig.labelTotalCountFont === 'default' ? Arial : this.mConfig.labelTotalCountFont;
            FontManager.sharedInstance().loadFont(totalCountFont, PERSONA_FONTS.TOTAL_COUNT).then(this._handleTotalCountFontLoaded.bind(this));
        }
    }

    /**
     * Destroys this object. Called automatically when the reference count of this object reaches zero.
     *
     * @method destroy
     */
    destroy() {
        this.maxSize.off(GeometryEvents.GEOMETRY_VALUE_CHANGED, this._handleMaxSizeChanged, this);

        this.mMaxSize.release();
        this.mNameBack.release();
        if (this.mNameLabel) {
            this.mNameLabel.release();
        }
        if (this.mCountLabel) {
            this.mCountLabel.release();
        }
        if (this.mTotalCountLabel) {
            this.mTotalCountLabel.release();
        }

        delete this.mMaxSize;
        delete this.mLabelRenderPadding;
        delete this.mName;
        delete this.mCount;
        delete this.mTotalCount;
        delete this.mConfig;
        delete this.mFontSizeScale;
        delete this.mBiggestFontSize;
        delete this.mSmallestFontSize;
        delete this.mNameLabel;
        delete this.mCountLabel;
        delete this.mTotalCountLabel;
        delete this.mNameBack;

        super.destroy();
    }

    /**
     * The maximum size of this label.
     *
     * @type {Size}
     */
    get maxSize() {
        return this.mMaxSize;
    }

    /**
     * Gets whether the cluster name label should be shown.
     * @returns {boolean}
     */
    get showName() {
        return this.mShowLabel === true;
    }

    /**
     * Sets whether the cluster name label should be shown.
     *
     * @param {Boolean} value - True to display the cluster name label.
     */
    set showName(value) {
        if (value !== this.mShowLabel) {
            this.mShowLabel = value;
            this.mConfig.labelNameShow = value;
            this._initName();
            this.needsRedraw();
        }
    }

    /**
     * Updates the text of this label as specified.
     *
     * @method updateText
     * @param {String|null} name - The new name to display or null if no change is needed.
     * @param {String|Number|null} count - The new count to display or null if no count should be displayed.
     * @param {String|Number|null} totalCount - The new total count to display or null if no total count should be displayed.
     */
    updateText(name = null, count = null, totalCount = null) {
        if (name !== null && name !== this.mName) {
            this.mName = name;
            if (this.mNameLabel) {
                this.mNameLabel.text = this.mName.toString();
            }
        }

        if (count !== null && count !== this.mCount) {
            this.mCount = count;
            if (!this.mCountLabel) {
                const countFont = this.mConfig.labelCountFont === 'default' ? Oswald : this.mConfig.labelCountFont;
                FontManager.sharedInstance().loadFont(countFont, PERSONA_FONTS.COUNT).then(this._handleCountFontLoaded.bind(this));
            } else {
                this.mCountLabel.text = this.mCount.toString();
            }
        } else if (count === null && this.mCountLabel) {
            this.mCountLabel.parent.removeChild(this.mCountLabel);
            this.mCountLabel.release();
            this.mCountLabel = null;
        }

        if (totalCount !== null && totalCount !== this.mTotalCount) {
            this.mTotalCount = totalCount;
            if (!this.mTotalCountLabel) {
                const totalCountFont = this.mConfig.labelTotalCountFont === 'default' ? Arial : this.mConfig.labelTotalCountFont;
                FontManager.sharedInstance().loadFont(totalCountFont, PERSONA_FONTS.TOTAL_COUNT).then(this._handleTotalCountFontLoaded.bind(this));
            } else {
                this.mTotalCountLabel.text = this.mTotalCount.toString();
            }
        } else if (totalCount === null && this.mTotalCountLabel) {
            this.mTotalCountLabel.parent.removeChild(this.mTotalCountLabel);
            this.mTotalCountLabel.release();
            this.mTotalCountLabel = null;
        }
    }

    /**
     * Called when the font for the name label is loaded.
     *
     * @method _handleNameFontLoaded
     * @param {Font} font - The loaded font.
     * @private
     */
    _handleNameFontLoaded(font) {
        /* handle the case where the object could have been destroyed at this point */
        if (this.retainCount > 0) {
            const padding = this.mConfig.labelNameBackgroundPadding;
            const fontScale = this._getFontSize(this.mSmallestFontSize) / this.mSmallestFontSize;
            this.mNameLabel = this._createLabel(this.mName.toString(), this.maxSize.width, this.mConfig.labelNameMaxLines, padding * fontScale, font, PERSONA_FONTS.NAME, {
                color: this.mConfig.labelNameColor,
                fontSize: this._getFontSize(this.mConfig.labelNameFontSize),
                renderShadow: this.mConfig.labelNameShadow,
                shadowColor: this.mConfig.labelNameShadowColor,
                shadowBlur: this.mConfig.labelNameShadowBlur,
                shadowOffsetX: this.mConfig.labelNameShadowOffsetX,
                shadowOffsetY: this.mConfig.labelNameShadowOffsetY,
            });

            this.mNameLabel.on(TextEvents.TEXT_LABEL_RENDERED, () => {
                const scale = this._getFontSize(this.mSmallestFontSize) / this.mSmallestFontSize;
                const scaledPadding = padding * scale;
                const renderPadding = this.mLabelRenderPadding;
                this._positionLabels();
                this.mNameBack.anchor.set('50%', 0);
                this.mNameBack.position.set(
                    '50%',
                    this.mNameLabel.position.y - scaledPadding + renderPadding
                );
                this.mNameBack.size.set(
                    this.mNameLabel.boundingBox.width + scaledPadding * 2 - renderPadding * 2,
                    this.mNameLabel.boundingBox.height + scaledPadding * 2 - renderPadding * 2
                );
            });

            this.mNameLabel.on(TextEvents.TEXT_LABEL_WILL_RENDER, () => { this.scale = 1; });

            this.addChild(this.mNameBack);
            this.addChild(this.mNameLabel);
        }
    }

    /**
     * Called when the font for the count label is loaded.
     *
     * @method _handleCountFontLoaded
     * @param {Font} font - The loaded font.
     * @private
     */
    _handleCountFontLoaded(font) {
        /* handle the case where the object could have been destroyed at this point */
        if (this.retainCount > 0 && this.mCount !== null) {
            const labelWidth = this.mTotalCount === null ? this.maxSize.width : this.maxSize.width * 0.5;
            this.mCountLabel = this._createLabel(this.mCount.toString(), labelWidth, 1, 0, font, PERSONA_FONTS.COUNT, {
                color: this.mConfig.labelCountColor,
                fontSize: this._getFontSize(this.mConfig.labelCountFontSize),
                renderShadow: this.mConfig.labelCountShadow,
                shadowColor: this.mConfig.labelCountShadowColor,
                shadowBlur: this.mConfig.labelCountShadowBlur,
                shadowOffsetX: this.mConfig.labelCountShadowOffsetX,
                shadowOffsetY: this.mConfig.labelCountShadowOffsetY,
            });

            this.mCountLabel.on(TextEvents.TEXT_LABEL_RENDERED, () => this._positionLabels());
            this.mCountLabel.on(TextEvents.TEXT_LABEL_WILL_RENDER, () => { this.scale = 1; });

            this.addChild(this.mCountLabel);
        }
    }

    /**
     * Called when the font for the total count label is loaded.
     *
     * @method _handleCountFontLoaded
     * @param {Font} font - The loaded font.
     * @private
     */
    _handleTotalCountFontLoaded(font) {
        /* handle the case where the object could have been destroyed at this point */
        if (this.retainCount > 0 && this.mTotalCount !== null) {
            const labelWidth = this.mCount === null ? this.maxSize.width : this.maxSize.width * 0.5;
            this.mTotalCountLabel = this._createLabel('/' + this.mTotalCount, labelWidth, 1, 0, font, PERSONA_FONTS.TOTAL_COUNT, {
                color: this.mConfig.labelTotalCountColor,
                fontSize: this._getFontSize(this.mConfig.labelTotalCountFontSize),
                renderShadow: this.mConfig.labelTotalCountShadow,
                shadowColor: this.mConfig.labelTotalCountShadowColor,
                shadowBlur: this.mConfig.labelTotalCountShadowBlur,
                shadowOffsetX: this.mConfig.labelTotalCountShadowOffsetX,
                shadowOffsetY: this.mConfig.labelTotalCountShadowOffsetY,
            });

            this.mTotalCountLabel.on(TextEvents.TEXT_LABEL_RENDERED, () => this._positionLabels());
            this.mTotalCountLabel.on(TextEvents.TEXT_LABEL_WILL_RENDER, () => { this.scale = 1; });

            this.addChild(this.mTotalCountLabel);
        }
    }

    /**
     * When this label's max size is modified, this method is called.
     *
     * @method _handleMaxSizeChanged
     * @param {*} sender - The instance that originally triggered this event.
     * @param {Number} width - The new width of the label.
     * @private
     */
    _handleMaxSizeChanged(sender, width) {
        if (sender === this.mMaxSize) {
            this.mFontSizeScale = this.mConfig.labelScaleFontSizes ? (this.maxSize.height / (this.mConfig.labelScaleBasePersonaRadius * 2)) : 1;
            if (this.mNameLabel) {
                // this.mNameLabel.off(TextEvents.TEXT_LABEL_RENDERED);
                this._updateLabel(this.mNameLabel, width, this.mConfig.labelNameMaxLines, this.mConfig.labelNameBackgroundPadding, this.mConfig.labelNameFontSize);
            }

            if (this.mCountLabel) {
                // this.mCountLabel.off(TextEvents.TEXT_LABEL_RENDERED);
                const labelWidth = this.mTotalCount === null ? width : width * 0.5;
                this._updateLabel(this.mCountLabel, labelWidth, 1, 0, this.mConfig.labelCountFontSize);
            }

            if (this.mTotalCountLabel) {
                // this.mTotalCountLabel.off(TextEvents.TEXT_LABEL_RENDERED);
                const labelWidth = this.mCount === null ? width : width * 0.5;
                this._updateLabel(this.mTotalCountLabel, labelWidth, 1, 0, this.mConfig.labelTotalCountFontSize);
            }
        }
    }

    /**
     * Gets the scaled font size.
     *
     * @method _getFontSize
     * @param {Number} fontSize - The original font size to scale.
     * @returns {Number}
     * @private
     */
    _getFontSize(fontSize) {
        let minFontSize;

        if (this.mBiggestFontSize * this.mFontSizeScale > this.mConfig.labelMaxFontSize) {
            minFontSize = Math.max(this.mConfig.labelMaxFontSize * (this.mSmallestFontSize / this.mBiggestFontSize), this.mConfig.labelMinFontSize);
        } else {
            minFontSize = Math.max(this.mSmallestFontSize * this.mFontSizeScale, this.mConfig.labelMinFontSize);
        }

        return Math.min((fontSize / this.mSmallestFontSize) * minFontSize, this.mConfig.labelMaxFontSize);
    }

    /**
     * Creates a label using the specified details.
     *
     * @method _createLabel
     * @param {String} text - The text for the label.
     * @param {Number} maxWidth - The maximum width of the label to create.
     * @param {Number} maxLines - The maximum number of text lines for the label.
     * @param {Number} padding - The padding left around the label.
     * @param {Font} font - The font to be used for the label.
     * @param {String} fontKey - The key used in the font manager to load the font.
     * @param {Object} options - The rendering options for the label.
     * @returns {Label}
     * @private
     */
    _createLabel(text, maxWidth, maxLines, padding, font, fontKey, options) {
        const hhea = font.tables.hhea;
        const fontScale = (options.fontSize / font.unitsPerEm);
        const lineHeight = (hhea.ascender - hhea.descender) * fontScale;
        const labelWidth = Math.max(maxWidth - (padding * 2), 0);
        const labelHeight = Math.max(Math.min(lineHeight * maxLines, this.mMaxSize.height - (padding * 2)), 0);

        options.alignment = TextLabel.TEXT_ALIGNMENT.CENTER;
        options.truncateMode = TextLabel.TEXT_TRUNCATING_MODE.ELLIPSES;
        options.multiLineMode = TextLabel.TEXT_MULTI_LINE_MODE.AUTO_LINES;
        options.renderingBackend = TextLabel.TEXT_RENDERING_BACKEND.CANVAS_NATIVE;
        options.renderingPadding = this.mLabelRenderPadding;
        options.autoSize = true;

        const label = new TextLabel(labelWidth, labelHeight, text, fontKey, null, options);

        return label;
    }

    /**
     * Updates the specified label.
     *
     * @param {Label} label - the label to update.
     * @param {Number} maxWidth - The new max width of the label.
     * @param {Number} maxLines - The new max number of lines of text for the label.
     * @param {Number} padding - The padding around the text.
     * @param {Number} fontSize - The font size for the label.
     * @private
     */
    _updateLabel(label, maxWidth, maxLines, padding, fontSize) {
        const font = label.font;
        const scaledFontSize = this._getFontSize(fontSize);
        const hhea = font.tables.hhea;
        const fontScale = (scaledFontSize / font.unitsPerEm);
        const lineHeight = (hhea.ascender - hhea.descender) * fontScale;
        const labelWidth = Math.max(maxWidth - (padding * 2), 0);
        const labelHeight = Math.max(Math.min(lineHeight * maxLines, this.mMaxSize.height - (padding * 2)), 0);
        label.fontSize = scaledFontSize;
        label.maxSize.set(labelWidth, labelHeight);
    }

    /**
     * Positions the loaded labels within this persona label.
     *
     * @method _positionLabels
     * @private
     */
    _positionLabels() {
        const renderPadding = this.mLabelRenderPadding;
        let totalHeight = 0;

        if (this.mNameLabel) {
            const fontScale = this._getFontSize(this.mSmallestFontSize) / this.mSmallestFontSize;
            const padding = this.mConfig.labelNameBackgroundPadding * fontScale;
            this.mNameLabel.anchor.set('50%', 0);
            this.mNameLabel.position.set('50%', padding);
            totalHeight += this.mNameLabel.size.height + padding * 2 - renderPadding + (this.mConfig.labelNameAndCountsPadding * fontScale);
        }

        let countLabelHeight = 0;
        if (this.mCountLabel && this.mTotalCountLabel) {
            countLabelHeight = Math.max(this.mCountLabel.size.height, this.mTotalCountLabel.size.height) - renderPadding;

            if (totalHeight + countLabelHeight < this.mMaxSize.height * 0.85) {
                totalHeight += countLabelHeight;
                this.mCountLabel.visible = true;
                this.mTotalCountLabel.visible = true;
            } else {
                this.mCountLabel.visible = false;
                this.mTotalCountLabel.visible = false;
            }

            this.mCountLabel.anchor.set('100%', '100%');
            this.mTotalCountLabel.anchor.set(0, '100%');

            this.mCountLabel.position.set('50%', totalHeight);
            this.mTotalCountLabel.position.set('50%', totalHeight + this.mCountLabel.descender - this.mTotalCountLabel.descender);
        } else if (this.mCountLabel) {
            countLabelHeight = this.mCountLabel.size.height - renderPadding;

            if (totalHeight + countLabelHeight < this.mMaxSize.height * 0.85) {
                totalHeight += countLabelHeight;
                this.mCountLabel.visible = true;
            } else {
                this.mCountLabel.visible = false;
            }

            this.mCountLabel.anchor.set('50%', '100%');
            this.mCountLabel.position.set('50%', totalHeight);
        } else if (this.mTotalCountLabel) {
            countLabelHeight = this.mTotalCountLabel.size.height - renderPadding;

            if (totalHeight + countLabelHeight < this.mMaxSize.height * 0.85) {
                totalHeight += countLabelHeight;
                this.mTotalCountLabel.visible = true;
            } else {
                this.mTotalCountLabel.visible = false;
            }

            this.mTotalCountLabel.anchor.set('50%', '100%');
            this.mTotalCountLabel.position.set('50%', totalHeight);
        }

        this.size.height = totalHeight;
    }

    /**
     * Loads or clears the name label, depending on mShowLabel.
     * @private
     */
    _initName() {
        if (this.mShowLabel) {
            const nameFont = this.mConfig.labelNameFont === 'default' ? Arial : this.mConfig.labelNameFont;
            FontManager.sharedInstance().loadFont(nameFont, PERSONA_FONTS.NAME).then(this._handleNameFontLoaded.bind(this));
        } else if (this.mNameLabel) {
            this.removeChild(this.mNameLabel);
            this.mNameLabel.release();
            delete this.mNameLabel;

            this.removeChild(this.mNameBack);
        }
    }
}

export default Label;
