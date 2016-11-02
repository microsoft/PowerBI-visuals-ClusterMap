/**
 * Copyright (c) 2016 Uncharted Software Inc.
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

/* global mina */

/* enable strict mode */
'use strict';

/* import modules */
var Snap = require('snapsvg');
var Node = require('./personas.core.node.js');
var $ = require('jquery');
var Promise = require('bluebird');

/**
 * This class represents the background image used as an "avatar" for personas.
 *
 * @class Avatar
 * @param {Array|String} imageURLs - The URLs of the images to load as the avatar, it can be any number of images from 1 to 4.
 * @param {Number} radius - The radius for this avatar.
 * @param {String=} color - The color to use for the background in CSS style notation.
 * @constructor
 */
function Avatar(imageURLs, radius, color) {
    /* inheritance */
    Node.call(this);

    /* member variables */
    this.mRadius = radius;
    this.mFilter = null;
    this.mImages = null;
    this.mBlurEnabled = true;
    this.mImageURLs = [];
    this.mBlurStrength = 5;
    this.mImageRadius = 0;

    /* initialization */
    var backgroundColor;
    if (color) {
        var color32bit = parseInt(color.substr(1), 16);
        var r = (color32bit >> 16) & 255;
        var g = (color32bit >> 8) & 255;
        var b = color32bit & 255;

        var gray8bit = Math.floor(((r + g + b) / 3) * 0.7);
        var grayHex = gray8bit.toString(16);

        backgroundColor = '#' + grayHex + grayHex + grayHex;
    } else {
        backgroundColor = '#333';
    }
    this.mBackground = new Node('circle', { 'cx': 0, 'cy': 0, 'r': radius });
    this.mBackground.attr({ 'fill': backgroundColor, 'stroke': '#fff', 'stroke-width': 3 });
    this.append(this.mBackground);

    /* populate the URLs array */
    if (imageURLs instanceof Array) {
        Array.prototype.push.apply(this.mImageURLs, imageURLs);
    } else {
        this.mImageURLs.push(imageURLs);
    }

    /* images container */
    this.mContainer = new Node();
    this.mContainer.addClass('prsnas_nopointer');
    this.append(this.mContainer);

    /* blur filter */
    var blurStrength = this.mBlurStrength;
    var blur = Snap.parse(Snap.filter.blur(blurStrength, blurStrength));
    blur.node.firstChild.setAttribute('color-interpolation-filters', 'sRGB'); // safari fix
    var filter = new Node('filter');
    filter.append(blur);
    this.mContainer.append(filter);
    this.mContainer.attr({filter: filter});
    this.mFilter = filter;

    /* mask */
    this.mMask = new Node('circle', { 'cx': 0, 'cy': 0, 'r': radius });
    this.mMask.attr('fill', '#fff');
    this.mContainer.attr({ mask: this.mMask });

    /* load the images */
    var imageRadius = radius + (blurStrength * 2); // consider the blur to avoid displaying semi-transparent edges
    this.mImageRadius = imageRadius;
    this.mContainer.attr({ display: 'none' });
    this.loadImages(this.mContainer, imageRadius, imageURLs).then(function (loadedImages) {
        this.mImages = loadedImages;
        this.mContainer.attr({ display: 'block' });
    }.bind(this));
}

/* inheritance */
Avatar.prototype = Object.create(Node.prototype);
Avatar.prototype.constructor = Avatar;

/**
 * Enables or disables the blur effect of this avatar.
 *
 * @property blurEnabled
 * @type {Boolean}
 */
Object.defineProperty(Avatar.prototype, 'blurEnabled', {
    get: function() {
        return this.mBlurEnabled;
    },

    set: function(val) {
        if (val !== this.mBlurEnabled) {
            this.mBlurEnabled = val;
            this.mContainer.attr({ filter: (val ? this.mFilter : null) });
        }
    },
});

/**
 * Returns an array containing the Snap.svg representations of the images loaded by this avatar.
 *
 * @property images
 * @type {Array}
 * @readonly
 */
Object.defineProperty(Avatar.prototype, 'images', {
    get: function () {
        return this.mImages;
    },
});

/**
 * Returns an array containing the URLs of the images loaded by this avatar.
 *
 * @property imageURLs
 * @type {Array}
 * @readonly
 */
Object.defineProperty(Avatar.prototype, 'imageURLs', {
    get: function () {
        return this.mImageURLs;
    },
});

/**
 * The radius of this avatar.
 *
 * @property radius
 * @type {Number}
 */
Object.defineProperty(Avatar.prototype, 'radius', {
    get: function () {
        return this.mRadius;
    },

    set: function (value) {
        this.setRadius(value, false);
    },
});

/**
 * The radius of the images in this avatar.
 *
 * @property radius
 * @type {Number}
 * @readonly
 */
Object.defineProperty(Avatar.prototype, 'imageRadius', {
    get: function () {
        return this.mImageRadius;
    },
});

/**
 * Returns the SVG group that contains the images in this avatar.
 *
 * @property imageContainer
 * @type {Element}
 * @readonly
 */
Object.defineProperty(Avatar.prototype, 'imageContainer', {
    get: function () {
        return this.mContainer;
    },
});

/**
 * Utility function to change the radius. Can be animated.
 *
 * @method setRadius
 * @param {Number} newRadius - The new radius for this persona.
 * @param {Boolean} animated - Should the radius change be animated.
 */
Avatar.prototype.setRadius = function (newRadius, animated) {
    if (newRadius !== this.mRadius) {
        var scale = newRadius / this.mRadius;
        this.mRadius = newRadius;
        this.mImageRadius = this.mRadius + (this.mBlurStrength * 2);

        if (animated) {
            this.mBackground.animate({ r: newRadius }, 500, mina.easeinout);
            this.mMask.animate({ r: newRadius }, 500, mina.easeinout);
        } else {
            this.mBackground.attr({ r: newRadius });
            this.mMask.attr({ r: newRadius });
        }

        var images = this.mImages;
        if (images) {
            for (var i = 0, n = images.length; i < n; ++i) {
                var image = images[i];
                var x = parseFloat(image.attr('x'));
                var y = parseFloat(image.attr('y'));
                var width = parseFloat(image.attr('width'));
                var height = parseFloat(image.attr('height'));
                if (animated) {
                    image.animate({
                        x: x * scale,
                        y: y * scale,
                        width: width * scale,
                        height: height * scale,
                    }, 500, mina.easeinout);
                } else {
                    image.attr({
                        x: x * scale,
                        y: y * scale,
                        width: width * scale,
                        height: height * scale,
                    });
                }
            }
        }
    }
};

/**
 * Preloads the image at the specified URL. Useful to get image attributes before it is loaded in SVG.
 *
 * @method preloadImage
 * @param {String} url - The URL of the image to load.
 * @returns {Promise}
 */
Avatar.prototype.preloadImage = function (url) {
    return new Promise(function(resolve) {
        var img = $('<img />');

        img.on('load', function() {
            resolve(img[0]);
        });

        img.on('error', function() {
            resolve(null);
        });

        img.attr('src', url);
    });
};

/**
 * Loads an image and places it in the container at the specified coordinates while filling the passed `fitWidth` and `fitHeight`
 *
 * @method loadImage
 * @param {Node} container - The container for the loaded image.
 * @param {String} url - The URL of the image to load.
 * @param {Number} x - X coordinate where to place the image within the container.
 * @param {Number} y - Y coordinate where to place the image within the container.
 * @param {Number} fitWidth - The desired width that this image should fit.
 * @param {Number} fitHeight - The desired height that this image should fit.
 * @returns {Promise}
 */
Avatar.prototype.loadImage = function (container, url, x, y, fitWidth, fitHeight) {
    var preloadImageFunc = this.preloadImage;
    return new Promise(function (resolve) {
        preloadImageFunc(url).then(function (img) {
            if (img) {
                var scale = Math.max(fitWidth / img.width, fitHeight / img.height);
                var image = container.image(url, x, y, img.width * scale, img.height * scale);
                resolve(image);
            } else {
                resolve(null);
            }
        });
    });
};

/**
 * Loads all the images passed in the `imageURLs` array and places them in the `container` provided.
 *
 * @method loadImages
 * @param {Node} container - The container where the images will be placed. NOTE: The container is treated as a circle.
 * @param {Number} radius - The radius of the container.
 * @param {Array} imageURLs - An array containing the URLs of the images to load.
 * @returns {Promise}
 */
Avatar.prototype.loadImages = function (container, radius, imageURLs) {
    var urls = [];
    /* make a copy of the array since we are going to be modifying it */
    if (imageURLs instanceof Array) {
        Array.prototype.push.apply(urls, imageURLs);
    } else {
        urls.push(imageURLs);
    }

    var containerSize = radius * 2;
    var url = urls.shift();
    var imagesLoaded = [];
    var loadImageFunc = this.loadImage.bind(this);

    var promiseFunction = function (resolve) {
        loadImageFunc(container, url, -radius, -radius, containerSize, containerSize).then(function(image) {
            if (image) {
                imagesLoaded.push(image);

                var xPosition = -radius;
                var yPosition = radius * 0.4;
                var widthSize = containerSize / (urls.length || 1);
                var heightSize = containerSize * 0.3;

                var expectedSubImages = urls.length;
                var subImages = [];

                var loadSubImage = function () {
                    if (urls.length) {
                        url = urls.shift();
                        loadImageFunc(container, url, xPosition, yPosition, widthSize, heightSize).then(function (img) {
                            if (img) {
                                imagesLoaded.push(img);
                                subImages.push(img);
                                xPosition += widthSize;
                            }
                            loadSubImage();
                        });
                    } else {
                        if (subImages.length && subImages.length !== expectedSubImages) {
                            xPosition = -radius;
                            widthSize = containerSize / subImages.length;
                            heightSize = containerSize * 0.3;
                            for (var i = 0, n = subImages.length; i < n; ++i) {
                                var subImage = subImages[i];
                                var imgWidth = parseInt(subImage.attr('width'), 10);
                                var imgHeight = parseInt(subImage.attr('height'), 10);
                                var scale = Math.max(widthSize / imgWidth, heightSize / imgHeight);
                                subImage.attr({
                                    x: xPosition,
                                    width: imgWidth * scale,
                                    height: imgHeight * scale,
                                });
                                xPosition += widthSize;
                            }
                        }
                        resolve(imagesLoaded);
                    }
                };

                loadSubImage();
            } else {
                if (urls.length) {
                    url = urls.shift();
                    promiseFunction(resolve);
                }
            }
        });
    };

    return new Promise(promiseFunction);
};

/**
 * @export
 * @type {Avatar}
 */
module.exports = Avatar;
