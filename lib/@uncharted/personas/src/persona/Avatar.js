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
import Circle from '../revi/graphics/primitives/Circle.js';
import AssetCache from '../revi/core/AssetCache.js';

/**
 * Class to draw a Persona's avatar (images).
 *
 * @class Avatar
 */
export class Avatar extends Node {
    /**
     * @param {Number} radius - The radius of this avatar.
     * @param {String[]|null} imageURLs - An array containing the URLs of the images to display in this avatar.
     * @param {Object} config - Configuration object.
     * @constructor
     */
    constructor(radius, imageURLs, config) {
        super();
        this.mRadius = Math.max(radius, 0);
        this.mConfig = config;
        this.mImages = [];

        this.size.set(this.mRadius * 2, this.mRadius * 2);

        this.mBorder = new Circle(this.mRadius, {
            fillEnabled: false,
            strokeType: Circle.STROKE_INNER,
            stroke: this.mConfig.avatarBorder,
            strokeColor: this.mConfig.avatarBorderColor,
        });
        this.mBorder.position.set('50%', '50%');
        this.addChild(this.mBorder);

        if (imageURLs) {
            this._loadImages(imageURLs);
        }
    }

    /**
     * Destroys this object. Called automatically when the reference count of this object reaches zero.
     *
     * @method destroy
     */
    destroy() {
        this.mBorder.release();
        this.mImages.length = 0;

        delete this.mRadius;
        delete this.mConfig;
        delete this.mImages;
        delete this.mBorder;

        super.destroy();
    }

    /**
     * The radius of this avatar.
     *
     * @type {Number}
     */
    get radius() {
        return this.mRadius;
    }

    /**
     * Sets the radius of this avatar.
     *
     * @param {Number} value - The new radius.
     */
    set radius(value) {
        if (value !== this.mRadius) {
            this.mRadius = value;
            this.size.set(this.mRadius * 2, this.mRadius * 2);

            this.mBorder.radius = this.mRadius;
            this.mBorder.position.set(this.size.width * 0.5, this.size.height * 0.5);

            this.needsRedraw();
        }
    }

    /**
     * Called every tick, drawing operations should be performed here.
     *
     * @method draw
     * @param {CanvasRenderingContext2D} context - The canvas context in which the drawing operations will be performed.
     * @param {MatrixStack} matrixStack - The matrix stack used for drawing.
     */
    draw(context, matrixStack) {
        const images = this.mImages.filter(image => Boolean(image));
        if (images.length) {
            const imageRadius = Math.max(this.mRadius - this.mConfig.avatarBorder + Math.min(this.mConfig.avatarBorder, this.mConfig.radiusOverlap), 0);
            context.save();
            context.beginPath();
            context.arc(this.mRadius, this.mRadius, imageRadius, 0, Circle.circleRadians, false);
            context.closePath();
            context.clip();

            const mainImageHeight = images.length > 1 ? this.size.height * this.mConfig.avatarSubImagePosition : this.size.height;
            this._drawImage(images[0], context, 0, 0, this.size.width, mainImageHeight);

            const subImageY = this.size.height * this.mConfig.avatarSubImagePosition;
            const subImageWidth = this.size.width / (images.length - 1);
            const subImageHeight = this.size.height * (1.0 - this.mConfig.avatarSubImagePosition);
            for (let i = 1; i < images.length; ++i) {
                this._drawImage(images[i], context, subImageWidth * (i - 1), subImageY, subImageWidth, subImageHeight);
            }

            context.restore();
        }
        super.draw(context, matrixStack);
    }

    /**
     * Updates the images contained in this avatar.
     *
     * @method updateImages
     * @param {Array} imageURLs - An array containing the URLs of the images to render.
     */
    updateImages(imageURLs) {
        if (imageURLs && imageURLs.length !== this.mImages.length) {
            this.mImages.length = 0;
            if (imageURLs.length) {
                this._loadImages(imageURLs);
            } else {
                this.needsRedraw();
            }
        } else if (!imageURLs && this.mImages.length) {
            this.mImages.length = 0;
            this.needsRedraw();
        }
    }

    /**
     * Draws an image in the specified context, within the specified rect.
     *
     * @method _drawImage
     * @param {Image} image - The image to draw.
     * @param {CanvasRenderingContext2D} context - The context where the image will be rendered.
     * @param {Number} x - X coordinate, within the context, where the image should be drawn.
     * @param {Number} y - Y coordinate, within the context, where the image should be drawn.
     * @param {Number} width - The width of the rect where the image must be drawn.
     * @param {Number} height - The height of the rect where the image must be drawn.
     * @private
     */
    _drawImage(image, context, x, y, width, height) {
        const scale = Math.min(image.width / width, image.height / height);
        const scaledWidth = Math.floor(width * scale);
        const scaledHeight = Math.floor(height * scale);
        context.drawImage(
            image,
            (image.width - scaledWidth) * 0.5,
            (image.height - scaledHeight) * 0.5,
            scaledWidth,
            scaledHeight,
            x,
            y,
            width,
            height
        );
    }

    /**
     * Loads an array of image URLs and schedules a redraw every time one finishes loading.
     *
     * @method _loadImage
     * @param {String[]} imageURLs - An array os trings representing the URLs of the images to load.
     * @private
     */
    _loadImages(imageURLs) {
        imageURLs.forEach((imageURL, i) => {
            AssetCache.loadImage(imageURL).then(image => {
                /* handle the case where the object could have been destroyed at this point */
                if (this.retainCount > 0) {
                    this.mImages[i] = image;
                    this.needsRedraw();
                }
            });
        });
    }
}

export default Avatar;
