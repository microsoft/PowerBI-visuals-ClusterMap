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
import Label from '../revi/text/Label.js';
import FontAwesome from '../revi/text/FontAwesome.js';
import FontManager from '../revi/text/FontManager.js';
import Rectangle from '../revi/graphics/primitives/Rectangle.js';
import Line from '../revi/graphics/primitives/Line.js';
import Point from '../revi/geometry/Point.js';
import InputManager from '../revi/plugins/input/InputManager.js';
import InputEvents from '../revi/plugins/input/Events.js';
import Events from './Events.js';

const FONT_AWESOME_KEY = 'FontAwesome';

/**
 * Class to create and handle zoom controls placed on a viewport.
 *
 * @class ZoomControl
 */
export class ZoomControl extends Node {
    /**
     * @constructor
     * @param {Object} config - An object containing the configuration options for this instance.
     */
    constructor(config) {
        super(config.zoomControlsButtonSize, config.zoomControlsButtonSize * 3 + config.zoomControlsBorderSize * 2);

        this.mConfig = config;

        const background = Rectangle.instance(this.size.width, this.size.height, {
            fillEnabled: true,
            fillColor: this.mConfig.zoomControlsBackgroundColor,
            stroke: this.mConfig.zoomControlsBorderSize,
            strokeColor: this.mConfig.zoomControlsBorderColor,
            strokeType: Rectangle.STROKE_OUTER,
        });
        background.anchor.set(0, 0);
        this.addChild(background);

        const separatorOffset = Math.min(2, this.mConfig.zoomControlsBorderSize);
        const separator01 = Line.instance(Point.instance(-separatorOffset, 0), Point.instance(this.size.width + separatorOffset, 0), {
            stroke: this.mConfig.zoomControlsBorderSize,
            strokeColor: this.mConfig.zoomControlsBorderColor,
            strokeType: Rectangle.STROKE_MIDDLE,
        });
        separator01.position.set(0, this.size.height / 3);
        this.addChild(separator01);

        const separator02 = Line.instance(Point.instance(-separatorOffset, 0), Point.instance(this.size.width + separatorOffset, 0), {
            stroke: this.mConfig.zoomControlsBorderSize,
            strokeColor: this.mConfig.zoomControlsBorderColor,
            strokeType: Rectangle.STROKE_MIDDLE,
        });
        separator02.position.set(0, (this.size.height / 3) * 2);
        this.addChild(separator02);

        FontManager.sharedInstance().loadFont(FontAwesome, FONT_AWESOME_KEY).then(this._handleFontAwesomeLoaded.bind(this));
    }

    /**
     * Destroys this object. Called automatically when the reference count of this object reaches zero.
     *
     * @method destroy
     */
    destroy() {
        delete this.mConfig;

        super.destroy();
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
        super.onExit();
    }

    /**
     * Called when font awesome is loaded.
     *
     * @method _handleFontAwesomeLoaded
     * @private
     */
    _handleFontAwesomeLoaded() {
        const buttonSize = this.mConfig.zoomControlsButtonSize;

        const plus = Label.instance(buttonSize, buttonSize, '\uf067', FONT_AWESOME_KEY, null, {
            color: 'black',
            fontSize: this.mConfig.zoomControlsFontSize,
            alignment: Label.TEXT_ALIGNMENT.CENTER,
            truncateMode: Label.TEXT_TRUNCATING_MODE.ELLIPSES,
            multiLineMode: Label.TEXT_MULTI_LINE_MODE.AUTO_LINES,
            renderingBackend: Label.TEXT_RENDERING_BACKEND.CANVAS,
            autoSize: true,
        });
        plus.position.set(buttonSize * 0.5, buttonSize * 0.5);
        this.addChild(plus);

        const home = Label.instance(buttonSize, buttonSize, '\uf066', FONT_AWESOME_KEY, null, {
            color: 'black',
            fontSize: this.mConfig.zoomControlsFontSize,
            alignment: Label.TEXT_ALIGNMENT.CENTER,
            truncateMode: Label.TEXT_TRUNCATING_MODE.ELLIPSES,
            multiLineMode: Label.TEXT_MULTI_LINE_MODE.AUTO_LINES,
            renderingBackend: Label.TEXT_RENDERING_BACKEND.CANVAS,
            autoSize: true,
        });
        home.position.set(buttonSize * 0.5, this.size.height * 0.5);
        this.addChild(home);

        const minus = Label.instance(buttonSize, buttonSize, '\uf068', FONT_AWESOME_KEY, null, {
            color: 'black',
            fontSize: this.mConfig.zoomControlsFontSize,
            alignment: Label.TEXT_ALIGNMENT.CENTER,
            truncateMode: Label.TEXT_TRUNCATING_MODE.ELLIPSES,
            multiLineMode: Label.TEXT_MULTI_LINE_MODE.AUTO_LINES,
            renderingBackend: Label.TEXT_RENDERING_BACKEND.CANVAS,
            autoSize: true,
        });
        minus.position.set(buttonSize * 0.5, this.size.height - buttonSize * 0.5);
        this.addChild(minus);
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
        const point = event.point;
        const localPoint = this.globalToLocalPoint(point);

        this.mTrackingPointer = null;
        if (localPoint.x >= 0 && localPoint.x <= this.pixelSize.width && localPoint.y >= 0 && localPoint.y <= this.pixelSize.height) {
            this.mTrackingPointer = event.identifier;
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
        const point = event.point;
        const localPoint = this.globalToLocalPoint(point);
        if (event.identifier === this.mTrackingPointer) {
            if (localPoint.x < 0 || localPoint.x > this.pixelSize.width || localPoint.y < 0 || localPoint.y > this.pixelSize.height) {
                this.mTrackingPointer = null;
            }
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
        const point = event.point;
        const localPoint = this.globalToLocalPoint(point);
        if (event.identifier === this.mTrackingPointer) {
            this.mTrackingPointer = null;

            if (localPoint.x >= 0 && localPoint.x <= this.pixelSize.width && localPoint.y >= 0 && localPoint.y <= this.pixelSize.height) {
                if (localPoint.y < this.pixelSize.height / 3) {
                    this.emit(Events.LAYOUT_ZOOM_IN_CLICKED, this);
                } else if (localPoint.y < (this.pixelSize.height / 3) * 2) {
                    this.emit(Events.LAYOUT_AUTO_ZOOM_CLICKED, this);
                } else {
                    this.emit(Events.LAYOUT_ZOOM_OUT_CLICKED, this);
                }
            }
        }
    }
}

export default ZoomControl;
