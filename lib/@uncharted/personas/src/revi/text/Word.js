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

import IObject from '../core/IObject.js';

const LINE_BREAK_WORD = Symbol('LINE_BREAK_WORD');
const SPACE_WORD = Symbol('SPACE_WORD');

/**
 * Class that represents a word of text.
 *
 * @class Word
 */
export class Word extends IObject {
    /**
     * The internal type used to recognize line breaks.
     *
     * @type {Symbol}
     * @readonly
     */
    static get LINE_BREAK_WORD() {
        return LINE_BREAK_WORD;
    }

    /**
     * The internal type used to recognize spaces.
     *
     * @type {Symbol}
     * @readonly
     */
    static get SPACE_WORD() {
        return SPACE_WORD;
    }

    /**
     * Creates a new word using the given `word` as a base with added ellipses to the end, this function replaces the
     * last characters of the word so it fits within the specified `maxEmWidth`.
     *
     * @method wordWithEllipses
     * @param {Word} word - The word to use as a base.
     * @param {Number} maxEmWidth - The maximum width, in ems, that this word can take, including the ellipses.
     * @returns {Word}
     */
    static wordWithEllipses(word, maxEmWidth) {
        const ellipsesWord = Word.instance('...', word.mFont, word.mTracking);
        const ellipsesWidth = ellipsesWord.emWidth;
        const offsets = word.offsets;
        let i;
        for (i = offsets.length - 1; i >= 0 && offsets[i] + ellipsesWidth > maxEmWidth; --i) {
            // empty
        }
        const wordText = word.mText.substr(0, i) + '...';
        return Word.instance(wordText, word.mFont, word.mTracking);
    }

    /**
     * @param {String} text - The text of this word.
     * @param {Font} font - The font to use to render this word.
     * @param {Number} tracking - The tracking for the characters in this word.
     * @constructor
     */
    constructor(text = null, font = null, tracking = 0) {
        super();
        this.mGlyphs = null;
        this.mOffsets = [];
        this.mEmWidth = 0;
        this.mEmHeight = 0;
        this.mAscending = 0;
        this.mDescending = 0;
        this.mTracking = tracking;
        this.mOffsetLeft = 0;
        this.mText = text;
        this.mFont = font;
        this.mOffsetLeft = 0;

        this._calculateMetrics();
    }

    /**
     * Destroys this object. Called automatically when the reference count of this object reaches zero.
     *
     * @method destroy
     */
    destroy() {
        if (this.mGlyphs) {
            this.mGlyphs.length = 0;
        }
        this.mOffsets.length = 0;

        delete this.mGlyphs;
        delete this.mOffsets;
        delete this.mEmWidth;
        delete this.mEmHeight;
        delete this.mAscending;
        delete this.mDescending;
        delete this.mOffsetLeft;
        delete this.mText;
        delete this.mFont;
        delete this.mOffsetLeft;

        super.destroy();
    }

    /**
     * An array of glyphs representing the characters of this word.
     * @type {null|Glyph[]}
     * @readonly
     */
    get glyphs() {
        return this.mGlyphs;
    }

    /**
     * An array with the offsets of each charatecr in this word.
     *
     * @type {Array}
     * @readonly
     */
    get offsets() {
        return this.mOffsets;
    }

    /**
     * The total width, in ems, of this word.
     *
     * @type {Number}
     * @readonly
     */
    get emWidth() {
        return this.mEmWidth;
    }

    /**
     * The total height, in ems, of this word.
     *
     * @type {Number}
     * @readonly
     */
    get emHeight() {
        return this.mEmHeight;
    }

    /**
     * The max ascending distance of this word.
     *
     * @type {Number}
     * @readonly
     */
    get ascending() {
        return this.mAscending;
    }

    /**
     * The max descending distance of this word.
     *
     * @type {Number}
     * @readonly
     */
    get descending() {
        return this.mDescending;
    }

    /**
     * The left side offset for this word.
     *
     * @type {Number}
     * @readonly
     */
    get offsetLeft() {
        return this.mOffsetLeft;
    }

    /**
     * Adds this word to the given path for rendering and returns the width of the rendered word.
     *
     * @method addToPath
     * @param {Path} path - The OpenType path to which this word will be added.
     * @param {Number} size - The desired font size for this word.
     * @param {Number} scale - The scale of this font size.
     * @param {Number} x - The x coordinate for this word.
     * @param {Number} y - The y coordinate for this word.
     * @returns {Number}
     */
    addToPath(path, size, scale, x = 0, y = 0) {
        const offsets = this.mOffsets;
        this.mGlyphs.forEach((glyph, i) => {
            const glyphPath = glyph.getPath(x + (offsets[i] * scale), y, size);
            path.extend(glyphPath);
        });

        return this.mEmWidth * scale;
    }

    /**
     * Calculates the metrics of this word.
     * An optional context object that can be passed to use the builtin canvas renderer to calculate glyph widths.
     * NOTE: The context object should be properly configured to use the font and a size of 1em.
     *
     * @method _calculateMetrics
     * @param {CanvasRenderingContext2D=} context - optional context object.
     * @private
     */
    _calculateMetrics(context = null) {
        if (this.mFont && this.mText) {
            const offsets = this.mOffsets;
            const tracking = this.mTracking;
            let height = null;
            let ascending = null;
            let descending = null;
            let offset = 0;
            let glyphMetrics;

            this.mOffsets.length = 0;
            this.mGlyphs = this.mFont.stringToGlyphs(this.mText);
            this.mGlyphs.forEach((glyph, i) => {
                offsets.push(offset);
                glyphMetrics = glyph.getMetrics();
                if (context && glyph.name === '.notdef') {
                    offset += context.measureText(this.mText[i]).width * this.mFont.unitsPerEm;
                    offset += tracking;
                } else if (glyph.advanceWidth) {
                    offset += glyph.advanceWidth;
                    offset += tracking;
                }

                if (ascending === null || glyphMetrics.yMax > ascending) {
                    ascending = glyphMetrics.yMax;
                }

                if (descending === null || glyphMetrics.yMin < descending) {
                    descending = glyphMetrics.yMin;
                }

                if (height === null || (ascending - descending) > height) {
                    height = (ascending - descending);
                }

                if (i === 0) {
                    this.mOffsetLeft = -glyphMetrics.xMin;
                }
            });

            this.mEmWidth = offset;
            this.mEmHeight = height;
            this.mAscending = ascending;
            this.mDescending = descending;
        }
    }
}

export default Word;
