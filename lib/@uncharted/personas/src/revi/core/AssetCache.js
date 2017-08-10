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

import IObject from './IObject.js';

/**
 * Simple substitute for Storage, useful when to save objects rather than only strings.
 *
 * @class AssetCacheStorage
 */
class AssetCacheStorage extends IObject {
    /**
     * @constructor
     */
    constructor() {
        super();
        this.mData = {};
        this.mKeys = [];
    }

    /**
     * Destroys this object. Called automatically when the reference count of this object reaches zero.
     *
     * @method destroy
     */
    destroy() {
        this.clear();

        delete this.mData;
        delete this.mKeys;

        super.destroy();
    }

    /**
     * The length read-only property of the AssetCacheStorage interface returns an integer representing the number of
     * data items stored in the AssetCacheStorage object.
     *
     * @type {Number}
     */
    get length() {
        return this.mKeys.length;
    }

    /**
     * The clear() method of the AssetCacheStorage interface, when invoked, will empty all keys out of the storage.
     */
    clear() {
        this.mKeys.forEach(key => {
            delete this.mData[key];
        });
        this.mKeys.length = 0;
    }

    /**
     * The key() method of the AssetCacheStorage interface, when passed a number n, returns the name of the nth key in
     * the storage. The order of keys is user-agent defined, so you should not rely on it.
     *
     * @method key
     * @param {Number} key - An integer representing the number of the key you want to get the name of. This is a zero-based index.
     * @returns {String}
     */
    key(key) {
        if (key < this.mKeys.length) {
            return this.mKeys[key];
        }
        return null;
    }

    /**
     * The getItem() method of the AssetCacheStorage interface, when passed a key name, will return that key's value.
     *
     * @method getItem
     * @param {String} keyName - A DOMString containing the name of the key you want to retrieve the value of.
     * @returns {*}
     */
    getItem(keyName) {
        const i = this.mKeys.indexOf(keyName);
        if (i >= 0) {
            return this.mData[keyName];
        }
        return null;
    }

    /**
     * The removeItem() method of the AssetCacheStorage interface, when passed a key name, will remove that key from the storage.
     *
     * @method removeItem
     * @param {String} keyName - A DOMString containing the name of the key you want to remove.
     */
    removeItem(keyName) {
        const i = this.mKeys.indexOf(keyName);
        if (i >= 0) {
            delete this.mData[keyName];
            this.mKeys.splice(i, 1);
        }
    }

    /**
     * The setItem() method of the AssetCacheStorage interface, when passed a key name and value, will add that key to
     * the storage, or update that key's value if it already exists.
     *
     * @param {String} keyName - A DOMString containing the name of the key you want to create/update.
     * @param {*} keyValue - An object containing the value you want to give the key you are creating/updating.
     */
    setItem(keyName, keyValue) {
        const i = this.mKeys.indexOf(keyName);
        if (i < 0) {
            this.mKeys.push(keyName);
        }
        this.mData[keyName] = keyValue;
    }
}

/**
 * Regular expression used to detect if strings are URLs.
 *
 * @type {RegExp}
 */
const URLPattern = new RegExp('^(https?)://[^\s/$.?#].[^\s]*', 'i');

/**
 * Class to load and hold assets in the cache, specially useful when loading things within power bi's own loader which
 * bypasses the browser cache (probably by adding parameters to the end of the URL. Something like a request to load
 * `image.png` become a request to load `https://powerbi.com/load/?url=image.png&id=somethingUnique&timestamp=time`.
 *
 * @class AssetCache
 */
class AssetCache extends IObject {
    /**
     * @constructor
     */
    constructor() {
        super();
        this.mStorage = new AssetCacheStorage();
    }

    /**
     * Destroys this object. Called automatically when the reference count of this object reaches zero.
     * NOTE: Instances of this class cannot be destroyed.
     *
     * @method destroy
     */
    destroy() {
        throw new Error('This instance cannot be destroyed.');
    }

    /**
     * Loads an image from the provided URL and saves it to the cache.
     *
     * @method loadImage
     * @param {String} url - The URL from which the image should be loaded.
     * @returns {Promise}
     */
    loadImage(url) {
        const loaded = this.mStorage.getItem(url);
        if (loaded) {
            return Promise.resolve(loaded);
        }

        const image = new Image();
        const promise = new Promise(resolve => {
            image.addEventListener('load', () => {
                this.mStorage.setItem(url, image);
                resolve(image);
            }, true);
        });

        this.mStorage.setItem(url, promise);
        image.src = url;

        return promise;
    }

    /**
     * Loads an Array Buffer from the provided URL and saves it to the cache.
     *
     * @method loadArrayBuffer
     * @param {String} url - The URL from which the buffer should be loaded.
     * @returns {Promise}
     */
    loadArrayBuffer(url) {
        const loaded = this.mStorage.getItem(url);
        if (loaded) {
            return Promise.resolve(loaded);
        }

        const request = new XMLHttpRequest();
        request.open('get', url, true);
        request.responseType = 'arraybuffer';

        const promise = new Promise((resolve, reject) => {
            request.onload = () => {
                if (request.status !== 200) {
                    reject(`Array Buffer (${url}) could not be loaded: ${request.statusText}`);
                }

                this.mStorage.setItem(url, request.response);
                resolve(request.response);
            };
        });

        this.mStorage.setItem(url, promise);
        request.send();

        return promise;
    }

    /**
     * Tests if a string of text is a URL.
     *
     * @method isURL
     * @param {String} text - The text to test.
     * @returns {Boolean}
     */
    isURL(text) {
        return URLPattern.test(text);
    }
}

/**
 * Don't you love yourself a nice hack?
 * A a hack a day keeps the architect away.
 */
/* find if the session storage is available */
let storage = null;
try {
    sessionStorage.setItem('__ESSEX_STORAGE_CHECK__', Boolean(sessionStorage.getItem('__ESSEX_STORAGE_CHECK__')) || true);
    storage = sessionStorage;
} catch (e) {
    /* session storage not available */
}

/* if the storage is available try to find a registered asset cache, or register a new one */
let cache = null;
if (storage) {
    let varName = storage.getItem('__ESSEX_ASSET_CACHE_VAR_NAME__');
    if (varName && window[varName] instanceof AssetCache) {
        cache = window[varName];
    } else {
        cache = new AssetCache();
        const varNameBase = '__ESSEX_SHARED_ASSET_CACHE__';
        varName = varNameBase;
        let i = 0;
        while (window.hasOwnProperty(varName)) {
            varName = varNameBase + (i++);
        }
        storage.setItem('__ESSEX_ASSET_CACHE_VAR_NAME__', varName);
        window[varName] = cache;
    }
} else {
    cache = new AssetCache();
}

export default cache;
