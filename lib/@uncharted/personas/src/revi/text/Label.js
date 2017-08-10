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

import CachedNode from '../graphics/CachedNode.js';
import FontManager from './FontManager.js';
import GeometryEvents from '../geometry/Events.js';
import Events from './Events.js';
import Size from '../geometry/Size.js';
import Point from '../geometry/Point.js';
import Line from './Line.js';
import Word from './Word.js';
import * as OpenType from 'opentype.js/src/opentype.js';
import nextTick from '../core/nextTick.js';

/**
 * Text alignment types.
 *
 * @type {{LEFT: Symbol, CENTER: Symbol, RIGHT: Symbol}}
 */
const TEXT_ALIGNMENT = {
    'LEFT': Symbol('LEFT'),
    'CENTER': Symbol('CENTER'),
    'RIGHT': Symbol('RIGHT'),
};
Object.freeze(TEXT_ALIGNMENT);

/**
 * Text truncating types.
 *
 * @type {{TRUNCATE: Symbol, AUTO_FIT: Symbol, ELLIPSES: Symbol}}
 */
const TEXT_TRUNCATING_MODE = {
    'TRUNCATE': Symbol('TRUNCATE'),
    'AUTO_FIT': Symbol('AUTO_FIT'),
    'ELLIPSES': Symbol('ELLIPSES'),
};
Object.freeze(TEXT_TRUNCATING_MODE);

/**
 * Multi-line text types.
 *
 * @type {{AS_IS: Symbol, AUTO_LINES: Symbol, SINGLE_LINE: Symbol}}
 */
const TEXT_MULTI_LINE_MODE = {
    'AS_IS': Symbol('AS_IS'),
    'AUTO_LINES': Symbol('AUTO_LINES'),
    'SINGLE_LINE': Symbol('SINGLE_LINE'),
};
Object.freeze(TEXT_MULTI_LINE_MODE);

/**
 * Text rendering backend.
 *
 * @type {{CANVAS: Symbol, SVG: Symbol, SVG_OPTIMIZE_SPEED: Symbol, SVG_CRISP_EDGES: Symbol, SVG_GEOMETRIC_PRECISION: Symbol}}
 */
const TEXT_RENDERING_BACKEND = {
    'CANVAS': Symbol('CANVAS'),
    'SVG': Symbol('SVG'),
    'SVG_OPTIMIZE_SPEED': Symbol('SVG_OPTIMIZE_SPEED'),
    'SVG_CRISP_EDGES': Symbol('SVG_CRISP_EDGES'),
    'SVG_GEOMETRIC_PRECISION': Symbol('SVG_GEOMETRIC_PRECISION'),
};
Object.freeze(TEXT_RENDERING_BACKEND);

/**
 * Default label rendering types.
 *
 * @type {Object}
 */
const DefaultLabelOptions = {
    fontSize: 10,
    color: '#000000',
    alignment: TEXT_ALIGNMENT.LEFT,
    multiLineMode: TEXT_MULTI_LINE_MODE.AS_IS,
    truncateMode: TEXT_TRUNCATING_MODE.TRUNCATE,
    tracking: 0,
    autoSize: false,
    renderShadow: false,
    shadowColor: '#000000',
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    shadowBlur: 5,
    renderingBackend: TEXT_RENDERING_BACKEND.CANVAS,
    renderingPadding: 4,
};
Object.freeze(DefaultLabelOptions);

/**
 * Class that represents and renders text in its determined label space.
 */
export class Label extends CachedNode {
    /**
     * Text alignment types.
     *
     * @type {{LEFT: Symbol, CENTER: Symbol, RIGHT: Symbol}}
     * @readonly
     */
    static get TEXT_ALIGNMENT() {
        return TEXT_ALIGNMENT;
    }

    /**
     * Text truncating types.
     *
     * @type {{TRUNCATE: Symbol, AUTO_FIT: Symbol, ELLIPSES: Symbol}}
     * @readonly
     */
    static get TEXT_TRUNCATING_MODE() {
        return TEXT_TRUNCATING_MODE;
    }

    /**
     * Multi-line text types.
     *
     * @type {{AS_IS: Symbol, AUTO_LINES: Symbol, SINGLE_LINE: Symbol}}
     * @readonly
     */
    static get TEXT_MULTI_LINE_MODE() {
        return TEXT_MULTI_LINE_MODE;
    }

    /**
     * Text rendering backend.
     *
     * @type {{CANVAS: Symbol, SVG: Symbol, SVG_OPTIMIZE_SPEED: Symbol, SVG_CRISP_EDGES: Symbol, SVG_GEOMETRIC_PRECISION: Symbol}}
     */
    static get TEXT_RENDERING_BACKEND() {
        return TEXT_RENDERING_BACKEND;
    }

    /**
     * Returns a copy of the default rendering options for labels.
     *
     * @returns {Object}
     * @readonly
     */
    static get DefaultLabelOptions() {
        return Object.assign({}, DefaultLabelOptions);
    }

    /**
     * @param {Number} width - The max width of this label.
     * @param {Number} height - The max height of this label.
     * @param {String} text - The text to render on this label.
     * @param {String} fontKey - The key, in the font manager, of the font to use.
     * @param {String=} fontURL - The font to load, if it hasn't been loaded yet. URL or Base64.
     * @param {Object=} options - The rendering options for this label.
     * @constructor
     */
    constructor(width, height, text, fontKey, fontURL = null, options = null) {
        super(0, 0);
        this.mMaxSize = new Size(width, height);
        this.mEffectsSize = new Size(width, height);
        this.mEffectsOffset = new Point(0, 0);
        this.mText = text;
        this.mFont = null;
        this.mOptions = Object.assign({}, DefaultLabelOptions, options);
        this.mMinDeviceScale = 2;

        if (!this.mOptions.autoSize) {
            this.size.set(width, height);
        }
        this.maxSize.on(GeometryEvents.GEOMETRY_VALUE_CHANGED, this.maxSize.safeBind(this._handleMaxSizeChanged, this));
        this._loadFont(fontKey, fontURL);
    }

    /**
     * Destroys this object. Called automatically when the reference count of this object reaches zero.
     *
     * @method destroy
     */
    destroy() {
        this.maxSize.off(GeometryEvents.GEOMETRY_VALUE_CHANGED, this._handleMaxSizeChanged, this);

        this.mMaxSize.release();
        this.mEffectsSize.release();
        this.mEffectsOffset.release();

        delete this.mMaxSize;
        delete this.mEffectsSize;
        delete this.mEffectsOffset;
        delete this.mText;
        delete this.mFont;
        delete this.mOptions;

        super.destroy();
    }

    /**
     * The font used to render this label.
     *
     * @type {Font}
     * @readonly
     */
    get font() {
        return this.mFont;
    }

    /**
     * The font size used to render this label.
     *
     * @type {Number}
     */
    get fontSize() {
        return this.mOptions.fontSize;
    }

    /**
     * Sets the font size used to render this label.
     *
     * @param {Number} value - The new font size.
     */
    set fontSize(value) {
        if (value !== this.mOptions.fontSize) {
            this.mOptions.fontSize = value;
            this.needsRedraw();
        }
    }

    /**
     * The ascender of this label in pixels.
     *
     * @type {Number}
     * @readonly
     */
    get ascender() {
        return this.mFont.tables.hhea.ascender * (this.fontSize / this.mFont.unitsPerEm);
    }

    /**
     * The descender of this label in pixels.
     *
     * @type {Number}
     * @readonly
     */
    get descender() {
        return this.mFont.tables.hhea.descender * (this.fontSize / this.mFont.unitsPerEm);
    }

    /**
     * The tracking of this label.
     *
     * @returns {Number}
     * @readonly
     */
    get tracking() {
        return this.mOptions.tracking;
    }

    /**
     * The maximum size of this label.
     *
     * @returns {Size}
     * @readonly
     */
    get maxSize() {
        return this.mMaxSize;
    }

    /**
     * The device scale used to render this node's internal buffer.
     *
     * @type {Number}
     */
    get deviceScale() {
        return super.deviceScale;
    }

    /**
     * Sets the device scale used to render this node's internal buffer.
     *
     * @param {Number} value - The new device scale.
     */
    set deviceScale(value) {
        super.deviceScale = Math.max(value, this.mMinDeviceScale); // force to render at the minimum device scale resolution to reduce anti-aliasing
    }

    /**
     * The text of this label.
     *
     * @type {String}
     */
    get text() {
        return this.mText;
    }

    /**
     * Sets the text of this label.
     *
     * @param {String} value - The new
     */
    set text(value) {
        if (value !== this.mText) {
            this.mText = value;
            this.needsRedraw();
        }
    }

    /**
     * Notifies the rendering system that this node needs to be redrawn to properly display its updated state.
     *
     * @method needsRedraw
     */
    needsRedraw() {
        this.emit(Events.TEXT_LABEL_WILL_RENDER, this);
        super.needsRedraw();
    }

    /**
     * Called every time the cache needs to be updated, local drawing operations should be performed here.
     *
     * @method updateCache
     * @param {CanvasRenderingContext2D} context - The canvas context in which the drawing operations will be performed.
     * @param {CanvasRenderingContext2D} parentContext - The canvas context to which this cached node is being drawn to.
     * @param {MatrixStack} matrixStack - The matrix stack used for drawing.
     */
    updateCache(context, parentContext, matrixStack) {
        if (this.mFont && this.mText) {
            const options = this.mOptions;
            const font = this.mFont;
            const fontSize = options.fontSize;
            const tracking = options.tracking;

            const hhea = font.tables.hhea;
            const fontScale = (fontSize / font.unitsPerEm);
            const words = this._extractWords();
            const spaceWidth = (font.charToGlyph(' ').advanceWidth + tracking);
            const lineHeight = (hhea.ascender - hhea.descender);
            const lines = this._buildLines(lineHeight, fontScale, words, spaceWidth);

            const padding = options.renderingPadding;
            const alignment = options.alignment;
            const left = TEXT_ALIGNMENT.LEFT;
            const center = TEXT_ALIGNMENT.CENTER;
            const right = TEXT_ALIGNMENT.RIGHT;
            const textPath = new OpenType.Path();
            let offsetX = 0;
            let offsetY = lines.length ? (lines[0].minBaseline * fontScale) : 0;

            textPath.fill = null;
            textPath.stroke = null;

            /* blah... */
            const computedWidth = Math.min(this.mMaxSize.width - (padding * 2), lines.reduce((width, line) => Math.max(width, line.emWidth), 0) * fontScale);
            const width = options.autoSize ? computedWidth : this.mMaxSize.width - (padding * 2);
            const canvasCenter = width * 0.5;

            lines.forEach(line => {
                const lineWidth = line.emWidth * fontScale;

                if (alignment === left) {
                    offsetX = (line.offsetLeft * fontScale);
                } else if (alignment === center) {
                    offsetX = (canvasCenter - ((line.emWidth - line.offsetLeft) * fontScale * 0.5));
                } else if (alignment === right) {
                    offsetX = (width - lineWidth);
                }

                line.addToPath(textPath, fontSize, fontScale, offsetX, offsetY);
                offsetY += lineHeight * fontScale;
            });

            const bb = textPath.getBoundingBox();
            const bbWidth = (bb.x2 - bb.x1) + (padding * 2);
            const bbHeight = (bb.y2 - bb.y1) + (padding * 2);
            this.mBoundingBox.set(bb.x1, bb.y1, bbWidth, bbHeight);

            if (options.autoSize) {
                this._autoSize(bbWidth, bbHeight, context, parentContext, matrixStack, options);
            }
            this._renderPath(textPath, context, options);
            this.emit(Events.TEXT_LABEL_RENDERED, this, context, parentContext);
        }
        super.updateCache(context, parentContext, matrixStack);
    }

    /**
     * Called every time the cache needs to be drawn onto another context.
     *
     * @method drawCache
     * @param {HTMLCanvasElement} localCanvas - The local canvas that holds the pixel buffer to draw.
     * @param {CanvasRenderingContext2D} context - The canvas context in which the drawing operations will be performed.
     */
    drawCache(localCanvas, context) {
        context.drawImage(localCanvas, -this.mEffectsOffset.x, -this.mEffectsOffset.y, this.mEffectsSize.width, this.mEffectsSize.height);
    }

    /**
     * When configured, autosizes this label to fit it's contents and effects.
     *
     * @method _autoSize
     * @param {Number} width - The new expected width of the label.
     * @param {Number} height - the expected height of the label.
     * @param {CanvasRenderingContext2D} context - The context where the label will be drawn.
     * @param {CanvasRenderingContext2D} parentContext - The canvas context to which this cached node is being drawn to.
     * @param {MatrixStack} matrixStack - The matrix stack used for drawing.
     * @param {Object} options - The drawing options of this label.
     * @private
     */
    _autoSize(width, height, context, parentContext, matrixStack, options) {
        /* resize the element */
        this._popTransform(parentContext, matrixStack);
        this.size.value1 = width;
        this.size.value2 = height;
        this._updateMatrix();
        this._pushTransform(parentContext, matrixStack);

        /* calculate the new canvas size */
        this.mEffectsSize.set(width, height);

        if (options.renderShadow) {
            this.mEffectsOffset.x = Math.max(options.shadowBlur - options.shadowOffsetX, 0);
            this.mEffectsSize.width += options.shadowBlur + Math.max(options.shadowBlur, Math.abs(options.shadowOffsetX));

            this.mEffectsOffset.y = Math.max(options.shadowBlur - options.shadowOffsetY, 0);
            this.mEffectsSize.height += options.shadowBlur + Math.max(options.shadowBlur, Math.abs(options.shadowOffsetY));
        } else {
            this.mEffectsOffset.set(0, 0);
        }

        this.mOffscreenCanvas.width = this.mEffectsSize.width * this.deviceScale * this.globalScale;
        this.mOffscreenCanvas.height = this.mEffectsSize.height * this.deviceScale * this.globalScale;

        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, this.mOffscreenCanvas.width, this.mOffscreenCanvas.height);
        context.scale(this.deviceScale * this.globalScale, this.deviceScale * this.globalScale);
        context.translate(this.mEffectsOffset.x, this.mEffectsOffset.y);
    }

    /**
     * Extracts the words from the given text, using the font and tracking provided.
     * NOTE: The returned array contains autoreleased `Word` instances. If the words will be saved for later use, call
     * `retain` on each one of them.
     *
     * @method _extractWords
     * @returns {Word[]}
     * @private
     */
    _extractWords() {
        const font = this.mFont;
        const text = this.mText;
        const tracking = this.mOptions.tracking;
        const words = [];
        let char;
        let wordText = '';

        for (let i = 0, n = text.length; i < n; ++i) {
            char = text[i];
            if (char === ' ') {
                if (wordText !== '') {
                    words.push(Word.instance(wordText, font, tracking));
                    wordText = '';
                }
                words.push(Word.SPACE_WORD);
            } else if (char === '\n' || char === '\r' || char === '\u0003') {
                if (wordText !== '') {
                    words.push(Word.instance(wordText, font, tracking));
                    wordText = '';
                }
                words.push(Word.LINE_BREAK_WORD);
            } else {
                wordText += char;
            }
        }

        if (wordText !== '') {
            words.push(Word.instance(wordText, font, tracking));
        }

        return words;
    }

    /**
     * Builds the text lines for this label using the options provided.
     *
     * @method _buildLines
     * @param {Number} lineHeight - The height, in ems, of a line of text.
     * @param {Number} scale - The desired font size scale.
     * @param {Word[]} words - An array of words to distribute in lines.
     * @param {Number} spaceWidth - The width, in ems, of a space character.
     * @returns {Line[]}
     * @private
     */
    _buildLines(lineHeight, scale, words, spaceWidth) {
        const options = this.mOptions;
        if (options.truncateMode === TEXT_TRUNCATING_MODE.AUTO_FIT) {
            throw new Error('Truncating mode not implemented yet');
        }

        const padding = options.renderingPadding;

        const width = this.mMaxSize.width - (padding * 2);
        const height = this.mMaxSize.height - (padding * 2);

        const lines = [];
        const asIsLineBreak = options.multiLineMode === TEXT_MULTI_LINE_MODE.AS_IS;
        const singleLine = options.multiLineMode === TEXT_MULTI_LINE_MODE.SINGLE_LINE;
        const addEllipses = options.truncateMode === TEXT_TRUNCATING_MODE.ELLIPSES;
        const targetEmWidth = width / scale;
        const targetEmHeight = height / scale;
        let emHeight = 0;
        let line = null;
        let word = null;
        let isLastLine = false;

        for (let i = 0, n = words.length; i < n; ++i) {
            if (!line) {
                emHeight += lineHeight;
                isLastLine = singleLine || emHeight + lineHeight > targetEmHeight;
                line = Line.instance(spaceWidth);
            }

            word = words[i];
            if (word === Word.LINE_BREAK_WORD && singleLine) {
                word = Word.SPACE_WORD;
            }

            if (word === Word.LINE_BREAK_WORD || ((!asIsLineBreak || isLastLine) && word !== Word.SPACE_WORD && (line.emWidth + word.emWidth) > targetEmWidth)) {
                if (isLastLine) {
                    if (addEllipses) {
                        const periodGlyph = this.mFont.charToGlyph('.');
                        const ellipsesEmWidth = (periodGlyph.advanceWidth * 3) + (options.tracking * 2);
                        if (line.emWidth + ellipsesEmWidth < targetEmWidth) {
                            line.addWord(word);
                        }
                        line.addEllipses(targetEmWidth, this.mFont, options.tracking);
                    }
                    break;
                } else {
                    line.trimBlankSpace();
                    lines.push(line);
                    line = null;
                    i = word === Word.LINE_BREAK_WORD ? i : i - 1;
                    continue;
                }
            }

            line.addWord(word);
        }

        if (line) {
            line.trimBlankSpace();
            lines.push(line);
        }

        return lines;
    }

    /**
     * Loads a font from/into the font manager and triggers a re-render of this label when done.
     *
     * @method _loadfont
     * @param {String} fontKey - The key of the font in the font manager.
     * @param {String} fontURL - The URL or Base64 encoded string from which the font should be loaded.
     * @private
     */
    _loadFont(fontKey, fontURL) {
        const fontManager = FontManager.sharedInstance();
        this.mFont = fontManager.fontCache[fontKey];
        if (this.mFont) {
            this.needsRedraw();
        } else {
            if (fontURL !== null) {
                fontManager.loadFont(fontURL, fontKey).then(font => {
                    /* handle the case where the object could have been destroyed before the font was loaded */
                    if (this.retainCount > 0) {
                        this.mFont = font;
                        this.needsRedraw();
                    }
                });
            } else {
                throw new Error('The font ' + fontKey + ' has not been loaded loaded and a URL was not provided.');
            }
        }
    }

    /**
     * Renders the given text path into the specified context using the specified options.
     *
     * @method _renderPath
     * @param {Path} path - The path to render.
     * @param {CanvasRenderingContext2D} context - The context to which the text will be rendered.
     * @param {Object} options - The rendering options of this label.
     * @private
     */
    _renderPath(path, context, options) {
        const padding = options.renderingPadding;
        if (options.renderingBackend === TEXT_RENDERING_BACKEND.CANVAS) {
            context.save();
            context.translate(padding, padding);
            path.draw(context);

            if (options.renderShadow) {
                context.shadowColor = options.shadowColor;
                context.shadowOffsetX = options.shadowOffsetX * this.deviceScale * this.globalScale;
                context.shadowOffsetY = options.shadowOffsetY * this.deviceScale * this.globalScale;
                context.shadowBlur = options.shadowBlur * this.deviceScale * this.globalScale;
            }

            context.fillStyle = options.color;
            context.fill();
            context.restore();
        } else {
            let shapeRendering = 'auto';
            if (options.renderingBackend === TEXT_RENDERING_BACKEND.SVG_OPTIMIZE_SPEED) {
                shapeRendering = 'optimizeSpeed';
            } else if (options.renderingBackend === TEXT_RENDERING_BACKEND.SVG_CRISP_EDGES) {
                shapeRendering = 'crispEdges';
            } else if (options.renderingBackend === TEXT_RENDERING_BACKEND.SVG_GEOMETRIC_PRECISION) {
                shapeRendering = 'geometricPrecision';
            }

            path.fill = 'white';

            const content = path.toSVG();
            const svgString = `<svg xmlns="http://www.w3.org/2000/svg"
                                version="1.1"
                                width="${this.size.width * this.deviceScale * this.globalScale}"
                                height="${this.size.height * this.deviceScale * this.globalScale}"
                                viewBox="0 0 ${this.size.width} ${this.size.height}"
                                shape-rendering="${shapeRendering}"
                                >${content}</svg>`;
            const image = new Image();
            image.src = 'data:image/svg+xml;base64,' + window.btoa(svgString);

            nextTick(() => {
                context.save();

                context.drawImage(image, padding, padding, this.size.width, this.size.height);
                context.globalCompositeOperation = 'source-in';
                context.fillStyle = options.color;
                context.fillRect(padding, padding, this.size.width, this.size.height);

                if (options.renderShadow) {
                    context.shadowColor = options.shadowColor;
                    context.shadowOffsetX = options.shadowOffsetX * this.deviceScale * this.globalScale;
                    context.shadowOffsetY = options.shadowOffsetY * this.deviceScale * this.globalScale;
                    context.shadowBlur = options.shadowBlur * this.deviceScale * this.globalScale;
                    context.globalCompositeOperation = 'destination-over';
                    context.drawImage(image, padding, padding, this.size.width, this.size.height);
                }

                context.restore();

                this._needsRedraw(Label.REDRAW_CACHE_REFRESH);
            });
        }
    }

    /**
     * When this node's size is modified, this method is called and also changes the size of the internal buffer.
     *
     * @method _handleSizeChanged
     * @param {*} sender - The instance that originally triggered this event.
     * @param {Number} width - The new width of this node.
     * @param {Number} height - The new height of this node.
     * @private
     */
    _handleSizeChanged(sender, width, height) {
        if (sender === this.size) {
            this.maxSize.set(width, height);
        }
        super._handleSizeChanged(sender, width, height);
    }

    /**
     * When this label's max size is modified, this method is called and also changes the size of the internal buffer.
     *
     * @method _handleMaxSizeChanged
     * @param {*} sender - The instance that originally triggered this event.
     * @private
     */
    _handleMaxSizeChanged(sender) {
        if (sender === this.maxSize && this.running) {
            this.mDirty = true;
            this.needsRedraw();
        }
    }
}

export default Label;
