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
import AssetCache from '../core/AssetCache.js';
import * as OpenType from 'opentype.js/src/opentype.js';

/**
 * Variable to hold the shared instance of the FontManager.
 *
 * @type {FontManager}
 */
let fontManagerSharedInstance = null;

/**
 * Class used to load and unload font files.
 *
 * @class FontManager
 */
export class FontManager extends IObject {
    /**
     * Returns a shared instance of the FontManager. Useful to make the FontManager behave as a singleton.
     *
     * @method sharedInstance
     * @returns {FontManager}
     * @static
     */
    static sharedInstance() {
        if (!fontManagerSharedInstance) {
            fontManagerSharedInstance = new FontManager();
        }
        return fontManagerSharedInstance;
    }

    /**
     * @constructor
     */
    constructor() {
        super();
        this.mFontCache = {};
        this.mDOMFontMap = {};
        this.mSupportsFontFace = Boolean(window.document.fonts);

        if (!this.mSupportsFontFace) {
            this.mStyleElement = window.document.createElement('style');
            window.document.head.appendChild(this.mStyleElement);
            this.mStyleSheet = Array.prototype.find.call(window.document.styleSheets, ss => ss.ownerNode === this.mStyleElement);
        }
    }

    /**
     * Destroys this object. Called automatically when the reference count of this object reaches zero.
     *
     * @method destroy
     */
    destroy() {
        const fontKeys = Object.keys(this.mFontCache);
        fontKeys.forEach(key => delete this.mFontCache[key]);

        const _URL = window.URL || window.webkitURL;
        Object.keys(this.mDOMFontMap).forEach(key => {
            if (this.mSupportsFontFace) {
                window.document.fonts.delete(this.mDOMFontMap[key]);
            } else {
                _URL.revokeObjectURL(this.mDOMFontMap[key]);
            }
        });

        if (!this.mSupportsFontFace) {
            delete this.mStyleSheet;
            window.document.head.removeChild(this.mStyleElement);
            delete this.mStyleSheet;
        }

        delete this.mDOMFontMap;
        delete this.mSupportsFontFace;
        delete this.mFontCache;

        super.destroy();
    }

    /**
     * The underlying cache object used by this FontManager.
     *
     * @type {{}}
     */
    get fontCache() {
        return this.mFontCache;
    }

    /**
     * Loads a font from the provided URL and saves it to the cache. If the optional `fontKey` parameter is passed, the
     * specified key is used to save the font to the cache, the URL is used as key otherwise.
     *
     * @method loadFont
     * @param {String} url - The URL from which the font should be loaded from.
     * @param {String=} fontKey - The key to be used to save the font into the cache.
     * @returns {Promise}
     */
    loadFont(url, fontKey = null) {
        const key = fontKey === null ? url : fontKey;
        let loadedFont = this.mFontCache[key];
        if (loadedFont) {
            return Promise.resolve(loadedFont);
        }

        if (!AssetCache.isURL(url)) {
            loadedFont = this.loadFontB64(key, url);
            if (loadedFont) {
                return Promise.resolve(loadedFont);
            }
        }

        return AssetCache.loadArrayBuffer(url).then(buffer => {
            /* load open type font */
            const loaded = OpenType.parse(buffer);
            this.mFontCache[fontKey] = loaded;

            /* load DOM font */
            const familyName = loadedFont.getEnglishName('fontFamily');
            this.addFontToDocument(buffer, familyName);

            return Promise.resolve(loaded);
        }, reason => Promise.reject(reason));
    }

    /**
     * Loads a font from the provided Base64 encoded `data` and saves it in the cache using the specified `fontKey`.
     *
     * @method loadFontB64
     * @param {String} fontKey - The key to be used to save the font into the cache.
     * @param {String} data - Base64 encoded font data.
     * @returns {Font}
     */
    loadFontB64(fontKey, data) {
        let loadedFont = this.mFontCache[fontKey];
        if (loadedFont) {
            return loadedFont;
        }

        try {
            /* parse base64 string */
            const binaryString = window.atob(data);
            const len = binaryString.length;
            const arrayBuffer = new ArrayBuffer(len);
            const bytes = new Uint8Array(arrayBuffer);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            /* load open type font */
            loadedFont = OpenType.parse(arrayBuffer);
            this.mFontCache[fontKey] = loadedFont;

            /* load DOM font */
            const familyName = loadedFont.getEnglishName('fontFamily');
            this.addFontToDocument(arrayBuffer, familyName);

            return loadedFont;
        } catch (e) {
            return null;
        }
    }

    /**
     * Adds the specified buffer to the document as a font with the specified family name.
     *
     * @method addFontToDocument
     * @param {ArrayBuffer} buffer - The buffer representing the font to add.
     * @param {String} familyName - The Font Family Name to use.
     */
    addFontToDocument(buffer, familyName) {
        try {
            if (this.mSupportsFontFace) {
                this._addFontToDocumentFontFace(buffer, familyName);
            } else {
                this._addFontToDocumentLegacy(buffer, familyName);
            }
        } catch (e) {
            /* eslint-disable */
            console.log(`${familyName} Font -  ${e}`);
            /* eslint-enable */
        }
    }

    /**
     * Adds the specified buffer as a font to the document using the FontFace object.
     *
     * @method _addFontToDocumentFontFace
     * @param {ArrayBuffer} buffer - The buffer representing the font to add.
     * @param {String} familyName - The Font Family Name to use.
     * @private
     */
    _addFontToDocumentFontFace(buffer, familyName) {
        if (!this.mDOMFontMap[familyName]) {
            const fontFace = new window.FontFace(familyName, buffer);
            if (fontFace.status === 'error') {
                /* eslint-disable */
                console.log(`FontFace ${familyName} is invalid and cannot be displayed`);
                /* eslint-enable */
            } else {
                this.mDOMFontMap[familyName] = fontFace;
                window.document.fonts.add(fontFace);
            }
        }
    }

    /**
     * Adds the specified buffer as a font to the document using a style in the document's header.
     *
     * @method _addFontToDocumentLegacy
     * @param {ArrayBuffer} buffer - The buffer representing the font to add.
     * @param {String} familyName - The Font Family Name to use.
     * @private
     */
    _addFontToDocumentLegacy(buffer, familyName) {
        if (!this.mDOMFontMap[familyName]) {
            const _URL = window.URL || window.webkitURL;
            const url = _URL.createObjectURL(new Blob([new DataView(buffer)], {type: 'font/opentype'}));
            this.mStyleSheet.insertRule(
                '@font-face { font-family: "' + familyName + '";' +
                'src: url(' + url + '); }',
                0
            );
            this.mDOMFontMap[familyName] = url;
        }
    }
}

export default FontManager;
