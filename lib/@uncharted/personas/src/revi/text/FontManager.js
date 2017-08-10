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
    }

    /**
     * Destroys this object. Called automatically when the reference count of this object reaches zero.
     *
     * @method destroy
     */
    destroy() {
        const fontKeys = Object.keys(this.mFontCache);
        fontKeys.forEach(key => delete this.mFontCache[key]);

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
            const loaded = OpenType.parse(buffer);
            this.mFontCache[fontKey] = loaded;
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
            const binaryString = window.atob(data);
            const len = binaryString.length;
            const arrayBuffer = new ArrayBuffer(len);
            const bytes = new Uint8Array(arrayBuffer);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            loadedFont = OpenType.parse(arrayBuffer);
            this.mFontCache[fontKey] = loadedFont;

            return loadedFont;
        } catch (e) {
            return null;
        }
    }
}

export default FontManager;
