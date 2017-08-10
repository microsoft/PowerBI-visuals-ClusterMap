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
import Word from './Word.js';

/**
 * Class that represents a line of text.
 *
 * @class Line
 */
export class Line extends IObject {
    /**
     * @param {Number} spaceWidth - The width of a space in ems.
     * @constructor
     */
    constructor(spaceWidth = 0) {
        super();
        this.mWords = [];
        this.mEmWidth = 0;
        this.mEmHeight = 0;
        this.mMinBaseline = 0;
        this.mSpaceWidth = spaceWidth;
    }

    /**
     * Destroys this object. Called automatically when the reference count of this object reaches zero.
     *
     * @method destroy
     */
    destroy() {
        this.mWords.length = 0;

        delete this.mWords;
        delete this.mEmWidth;
        delete this.mEmHeight;
        delete this.mMinBaseline;
        delete this.mSpaceWidth;

        super.destroy();
    }

    /**
     * An array containing the words in this line.
     *
     * @type {Array}
     * @readonly
     */
    get words() {
        return this.mWords;
    }

    /**
     * The total width of this line in ems.
     *
     * @type {Number}
     * @readonly
     */
    get emWidth() {
        return this.mEmWidth;
    }

    /**
     * The total height of this line in ems.
     *
     * @type {Number}
     * @readonly
     */
    get emHeight() {
        return this.mEmHeight;
    }

    /**
     * The minimum baseline of this line.
     *
     * @type {Number}
     * @readonly
     */
    get minBaseline() {
        return this.mMinBaseline;
    }

    /**
     * The left offset of this line.
     *
     * @returns {Number}
     * @readonly
     */
    get offsetLeft() {
        if (this.mWords.length) {
            return this.mWords[0].offsetLeft;
        }
        return 0;
    }

    /**
     * The width of a space, in ems, within this line.
     *
     * @returns {Number}
     * @readonly
     */
    get spaceWidth() {
        return this.mSpaceWidth;
    }

    /**
     * Adds the specified word to this line.
     *
     * @param {Word} word - The word to add.
     */
    addWord(word) {
        this.mWords.push(word);

        if (word === Word.SPACE_WORD) {
            this.mEmWidth += this.mSpaceWidth;
        } else if (word !== Word.LINE_BREAK_WORD) {
            this.mEmWidth += word.emWidth;
            this.mEmHeight = Math.max(word.emHeight, this.mEmHeight);
            this.mMinBaseline = Math.max(word.ascending, this.mMinBaseline);
        }
    }

    /**
     * Adds ellipses to this line and makes sure it fits within the specified.
     *
     * @method addEllipses
     * @param {Number} targetEmWidth - The maximum width, in ems, this line should occupy.
     * @param {Font} font - The font to use to render this word.
     * @param {Number} tracking - The tracking for the characters in this word.
     */
    addEllipses(targetEmWidth, font, tracking) {
        let offset = 0;
        let word = null;

        for (let i = 0, n = this.mWords.length; i < n; ++i) {
            if (this.mWords[i] === Word.SPACE_WORD) {
                offset += this.mSpaceWidth;
            } else if (this.mWords[i] !== Word.LINE_BREAK_WORD) {
                word = this.mWords[i];
                offset += word.emWidth;
                if (offset > targetEmWidth) {
                    break;
                }
            }
        }

        word = word || Word.instance('', font, tracking);

        const ellipsesWord = Word.wordWithEllipses(word, targetEmWidth - offset + word.emWidth);
        const oldWords = this.mWords.slice(0, this.mWords.indexOf(word));
        this._reset();
        oldWords.forEach(oldWord => this.addWord(oldWord));
        this.addWord(ellipsesWord);
    }

    /**
     * Trims the blank space off this line.
     *
     * @method trimBlankSpace
     */
    trimBlankSpace() {
        while (this.mWords.length && this.mWords[0] === Word.SPACE_WORD) {
            this.mWords.shift();
            this.mEmWidth -= this.mSpaceWidth;
        }

        while (this.mWords.length && this.mWords[this.mWords.length - 1] === Word.SPACE_WORD) {
            this.mWords.pop();
            this.mEmWidth -= this.mSpaceWidth;
        }
    }

    /**
     * Adds this line to the given path for rendering.
     *
     * @method addToPath
     * @param {Path} path - The OpenType path to which this word will be added.
     * @param {Number} fontSize - The desired font size for this line.
     * @param {Number} scale - The scale of this font size.
     * @param {Number} x - The x coordinate for this line.
     * @param {Number} y - The y coordinate for this line.
     */
    addToPath(path, fontSize, scale, x = 0, y = 0) {
        const spaceWidth = this.mSpaceWidth * scale;
        const spaceWord = Word.SPACE_WORD;
        const lineBreakWord = Word.LINE_BREAK_WORD;
        let offsetX = x;
        let offsetY = y;
        this.mWords.forEach(word => {
            if (word === spaceWord) {
                offsetX += spaceWidth;
            } else if (word !== lineBreakWord) {
                offsetX += word.addToPath(path, fontSize, scale, offsetX, offsetY);
            }
        });
    }

    /**
     * Removes all the words in this line and resets its size.
     *
     * @method _reset
     * @private
     */
    _reset() {
        this.mWords.length = 0;
        this.mEmWidth = 0;
        this.mEmHeight = 0;
        this.mMinBaseline = 0;
    }
}

export default Line;
