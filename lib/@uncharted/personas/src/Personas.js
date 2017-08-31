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

import IBindable from './revi/core/IBindable.js';
import Canvas from './revi/graphics/Canvas.js';
import Point from './revi/geometry/Point.js';
import Viewport from './layout/Viewport.js';
import LayoutEvents from './layout/Events.js';
import Persona from './persona/Persona.js';
import PersonaEvents from './persona/Events.js';
import BreadcrumbEvents from './layout/breadcrumbs/Events.js';

import InputManager from './revi/plugins/input/InputManager.js';
import Easing from './revi/plugins/easing/Easing.js';
import EasingEvents from './revi/plugins/easing/Events.js';
import EasingTypes from './revi/plugins/easing/EasingTypes.js';
import Scheduler from './revi/plugins/Scheduler.js';
import Layout from './layout/Layout.js';
import OrbitalLayout from './layout/orbital/OrbitalLayout.js';
import ColaLayout from './layout/cola/ColaLayout.js';
import Breadcrumbs from './layout/breadcrumbs/Breadcrumbs.js';

import GeneralConfig from './config/General.js';
import PersonaConfig from './config/Persona.js';
import LayoutConfig from './config/Layout.js';

import nextTick from './revi/core/nextTick.js';

export class Personas extends IBindable {
    constructor(element, config = {}) {
        super();
        this.mConfig = {
            general: Object.assign({}, GeneralConfig, config.general),
            persona: Object.assign({}, PersonaConfig, config.persona),
            layout: Object.assign({}, LayoutConfig, config.layout),
        };

        this.mCanvas = new Canvas(element, this.mConfig.general.initialDeviceScale);

        this.mCanEmitEvents = true;
        this.mLayoutStack = [];
        this.mEventQueue = [];
        this.mEventTickScheduled = false;
        this.mBoundFlushEventQueue = this._flushEventQueue.bind(this);
        this.mElement = element;
        this.mViewport = new Viewport('100%', '100%', this.mConfig.layout);
        this.mSizeDomain = this.mConfig.layout.layoutPersonaMaxRadius - this.mConfig.layout.layoutPersonaMinRadius;
        this.mBreadcrumbs = null;
        this.mDataLayerEasing = null;
        if (this.mConfig.general.displayBreadcrumbs) {
            this.mBreadcrumbs = new Breadcrumbs(this.mConfig.general.breadcrumbsSegmentedBackground);
            this._forwardWithPriority(0, this.mBreadcrumbs);
        }

        if (this.mConfig.layout.layoutType instanceof Layout) {
            this.mLayoutType = 'custom';
            this.mActiveLayout = this.mConfig.layout.layoutType;
        } else {
            this.mLayoutType = this.mConfig.layout.layoutType;
            this.mActiveLayout = this._getLayoutSystem(this.mLayoutType);
        }

        InputManager.registerContext(this.mCanvas.reviContext);
        Easing.registerContext(this.mCanvas.reviContext);
        Scheduler.registerContext(this.mCanvas.reviContext);

        this.mViewport.addChild(this.mActiveLayout);
        this.mCanvas.addChild(this.mViewport);
        this.mCanvas.addChild(this.mBreadcrumbs);

        this._forwardWithPriority(1, this.mViewport, [LayoutEvents.LAYOUT_AUTO_ZOOM_CLICKED, LayoutEvents.LAYOUT_ZOOM_IN_CLICKED, LayoutEvents.LAYOUT_ZOOM_OUT_CLICKED]);
        this._forwardWithPriority(2, this.mViewport, PersonaEvents.PERSONA_CLICKED);
        this._forwardWithPriority(3, this.mViewport, LayoutEvents.LAYOUT_BLANK_SPACE_CLICKED);
    }

    destroy() {
        InputManager.unregisterContext(this.mCanvas.reviContext);
        this._unforwardWithPriority(this.mBreadcrumbs);
        this._unforwardWithPriority(this.mViewport, [PersonaEvents.PERSONA_CLICKED, LayoutEvents.LAYOUT_BLANK_SPACE_CLICKED, LayoutEvents.LAYOUT_AUTO_ZOOM_CLICKED, LayoutEvents.LAYOUT_ZOOM_IN_CLICKED, LayoutEvents.LAYOUT_ZOOM_OUT_CLICKED]);

        super.destroy();
    }

    get personas() {
        return this.mActiveLayout.personas;
    }

    get breadcrumbs() {
        return this.mBreadcrumbs ? this.mBreadcrumbs.breadcrumbs : null;
    }

    get layoutType() {
        return this.mLayoutType;
    }

    set layoutType(value) {
        if (value !== this.mLayoutType) {
            if (value instanceof Layout) {
                this.mLayoutType = 'custom';
            } else {
                this.mLayoutType = value;
            }

            const newLayout = this._replaceLayout(this.mActiveLayout, value);
            this.mViewport.removeChild(this.mActiveLayout);
            this.mActiveLayout.release();
            this.mActiveLayout = newLayout;

            for (let i = 0, n = this.mLayoutStack.length; i < n; ++i) {
                const oldLayout = this.mLayoutStack[i].layout;
                const replacement = this._replaceLayout(oldLayout, this.mLayoutType);
                this.mViewport.replaceChild(oldLayout, replacement);
                this.mLayoutStack[i].layout = replacement;
                oldLayout.release();
            }

            this.mViewport.addChild(this.mActiveLayout);
            this.mActiveLayout.positionObjects(true);
            Scheduler.instanceForContext(this.mCanvas.reviContext).scheduleTimeout(() => {
                this.mViewport.autoZoom(true);
                this.mBreadcrumbs.updateLastBreadcrumb(this.mActiveLayout);
            }, 300);
        }
    }

    get deviceScale() {
        return this.mCanvas.deviceScale;
    }

    set deviceScale(value) {
        this.mCanvas.deviceScale = value;
    }

    /**
     * Emits the specified event and forwards all passed parameters.
     *
     * @method emit
     * @param {String} event - The name of the event to emit.
     * @param {...*} varArgs - Arguments to forward to the event listener callbacks.
     */
    emit(event, ...varArgs) {
        if (this.mCanEmitEvents) {
            super.emit(event, ...varArgs);
        }
    }

    loadData(data = null, update = false) {
        this.mData = data;
        this.mActiveLayout.cancelAnimations();

        if (!update) {
            this.mActiveLayout.removeAllPersonas();
        }

        if (data && data.personas) {
            this._loadData(data);
            this.mActiveLayout.positionObjects(update);
            if (!update) {
                this.mLayoutStack.length = 0;
                this.mViewport.autoZoom(false);
                if (this.mBreadcrumbs) {
                    this.mBreadcrumbs.removeAllBreadcrumbs();
                    this.mBreadcrumbs.addBreadcrumb(this.mActiveLayout);
                }
            } else {
                Scheduler.instanceForContext(this.mCanvas.reviContext).scheduleTimeout(() => {
                    this.mBreadcrumbs.updateLastBreadcrumb(this.mActiveLayout);
                    this.mViewport.autoZoom(true);
                }, 300);
            }
        }
    }

    addDataLayer(data, sourcePersona = null, autoZoom = true, layout = null) {
        if (data && data.personas) {
            const oldLayout = this.mActiveLayout;
            const newLayout = layout ? layout : this._getLayoutSystem(this.mLayoutType);
            const startAlpha = oldLayout.alpha;
            const changeAlpha = -startAlpha;
            const maxDistance = Math.max(this.mActiveLayout.size.width, this.mActiveLayout.size.height) * 0.25;
            const layoutPoint = sourcePersona ?
                Point.instance(sourcePersona.position.x, sourcePersona.position.y) :
                Point.instance(this.mActiveLayout.size.width * 0.5, this.mActiveLayout.size.height * 0.5);
            const personasToAnimate = [];

            this.mActiveLayout.personas.forEach(wrapper => {
                const persona = wrapper.object;
                if (persona !== sourcePersona) {
                    const vectorX = persona.position.x - layoutPoint.x;
                    const vectorY = persona.position.y - layoutPoint.y;
                    const distanceFromPoint = Math.sqrt(vectorX * vectorX + vectorY * vectorY);
                    const distanceToMove = Math.max(maxDistance - distanceFromPoint, 0);
                    personasToAnimate.push({
                        persona: persona,
                        startX: persona.position.x,
                        startY: persona.position.y,
                        changeX: (vectorX / distanceFromPoint) * distanceToMove,
                        changeY: (vectorY / distanceFromPoint) * distanceToMove,
                    });
                }
            });

            if (this.mBreadcrumbs && this.mBreadcrumbs.breadcrumbs.length) {
                this.mBreadcrumbs.updateLastBreadcrumb(oldLayout, sourcePersona);
                this.mBreadcrumbs.breadcrumbs[this.mBreadcrumbs.breadcrumbs.length - 1].displayLabel = false;
            }

            const viewportPoint = this.mViewport.mContent.globalToLocalPoint(this.mActiveLayout.localToGlobalPoint(layoutPoint));
            const startLayoutScale = oldLayout.scale;
            const changeLayoutScale = startLayoutScale;

            const startLayoutX = oldLayout.position.x;
            const startLayoutY = oldLayout.position.y;
            const changeLayoutX = (startLayoutX - viewportPoint.x);
            const changeLayoutY = (startLayoutY - viewportPoint.y);

            const newLayoutStartX = viewportPoint.x;
            const newLayoutStartY = viewportPoint.y;
            const newLayoutEndX = newLayoutStartX - newLayout.size.width * 0.5;
            const newLayoutEndY = newLayoutStartY - newLayout.size.height * 0.5;
            const newLayoutChangeX = newLayoutEndX - newLayoutStartX;
            const newLayoutChangeY = newLayoutEndY - newLayoutStartY;

            const easingType = EasingTypes.Cubic.EaseOut;
            const easing = Easing.instance(this.mCanvas.reviContext, {
                type: easingType,
                duration: 400,
            });

            newLayout.alpha = 0;
            easing.on(EasingEvents.EASING_UPDATE, (sender, progress) => {
                oldLayout.alpha = startAlpha + changeAlpha * progress;
                oldLayout.scale = startLayoutScale + changeLayoutScale * progress;
                oldLayout.position.set(startLayoutX + changeLayoutX * progress, startLayoutY + changeLayoutY * progress);

                newLayout.alpha = progress;
                newLayout.scale = progress;
                newLayout.position.set(newLayoutStartX + newLayoutChangeX * progress, newLayoutStartY + newLayoutChangeY * progress);

                personasToAnimate.forEach(info => {
                    info.persona.position.set(info.startX + info.changeX * progress, info.startY + info.changeY * progress);
                });
            });

            easing.on([EasingEvents.EASING_END, EasingEvents.EASING_STOP], () => {
                this.mViewport.removeChild(oldLayout);
                if (autoZoom) {
                    this.mViewport.autoZoom(true);
                }

                if (this.mBreadcrumbs) {
                    this.mBreadcrumbs.addBreadcrumb(newLayout, null, sourcePersona ? sourcePersona.mLabel.mName : null);
                }

                newLayout.position.set(newLayoutEndX, newLayoutEndY);

                this.mCanEmitEvents = true;
            });

            this.mCanEmitEvents = false;
            easing.start();

            this.mLayoutStack.push({
                layout: this.mActiveLayout,
                startX: startLayoutX + changeLayoutX,
                startY: startLayoutY + changeLayoutY,
                changeX: -changeLayoutX,
                changeY: -changeLayoutY,
                startAlpha: startAlpha + changeAlpha,
                changeAlpha: - changeAlpha,
                startScale: startLayoutScale + changeLayoutScale,
                changeScale: -changeLayoutScale,
            });
            this.mActiveLayout = newLayout;
            this.mActiveLayout.position.set(newLayoutEndX, newLayoutEndY);
            this.mViewport.addChild(this.mActiveLayout);

            this._loadData(data);
            this.mActiveLayout.clearNewObjects();
            this.mActiveLayout.positionObjects(true);
        }
    }

    removeDataLayer(count = 1, autoZoom = true) {
        const removeCount = Math.min(this.mLayoutStack.length, count);
        if (removeCount > 0) {
            const layersToRemove = this.mLayoutStack.splice(this.mLayoutStack.length - removeCount + 1, removeCount - 1);
            while(layersToRemove.length) {
                layersToRemove.pop().layout.release();
            }

            const oldLayout = this.mActiveLayout;
            const layoutWrapper = this.mLayoutStack.pop();

            this.mActiveLayout = layoutWrapper.layout;
            this.mViewport.addChild(this.mActiveLayout);

            if (this.mBreadcrumbs && this.mBreadcrumbs.breadcrumbs.length - removeCount > 0) {
                this.mBreadcrumbs.breadcrumbs[this.mBreadcrumbs.breadcrumbs.length - removeCount - 1].displayLabel = true;
            }

            const startLayoutScale = oldLayout.scale;
            const startLayoutX = oldLayout.position.x;
            const startLayoutY = oldLayout.position.y;
            const changeLayoutX = oldLayout.size.width * 0.5;
            const changeLayoutY = oldLayout.size.height * 0.5;
            const startAlpha = oldLayout.alpha;
            const changeAlpha = -startAlpha;
            const easingType = EasingTypes.Cubic.EaseOut;
            const easing = Easing.instance(this.mCanvas.reviContext, {
                type: easingType,
                duration: 400,
            });

            easing.on(EasingEvents.EASING_UPDATE, (sender, progress) => {
                oldLayout.alpha = startAlpha + changeAlpha * progress;
                oldLayout.scale = startLayoutScale * (1.0 - progress);
                oldLayout.position.set(startLayoutX + changeLayoutX * progress, startLayoutY + changeLayoutY * progress);

                layoutWrapper.layout.alpha = layoutWrapper.startAlpha + layoutWrapper.changeAlpha * progress;
                layoutWrapper.layout.scale = layoutWrapper.startScale + layoutWrapper.changeScale * progress;
                layoutWrapper.layout.position.set(layoutWrapper.startX + layoutWrapper.changeX * progress, layoutWrapper.startY + layoutWrapper.changeY * progress);
            });

            easing.on([EasingEvents.EASING_END, EasingEvents.EASING_STOP], () => {
                this.mViewport.removeChild(oldLayout);
                oldLayout.release();

                if (this.mBreadcrumbs) {
                     this.mBreadcrumbs.updateLastBreadcrumb(this.mActiveLayout);
                }

                if (autoZoom) {
                    this.mViewport.autoZoom(true);
                }

                this.mCanEmitEvents = true;
            });

            if (this.mBreadcrumbs) {
                this.mBreadcrumbs.removeBreadcrumb(removeCount);
            }

            this.mActiveLayout.positionObjects(true);
            this.mCanEmitEvents = false;
            easing.start();
        }
    }

    highlight(data, animated = true, append = false) {
        this.mActiveLayout.personas.forEach(wrapper => {
            const persona = wrapper.object;
            const personaData = data.personas.find(d => d.id === persona.id);

            if (personaData) {
                persona.highlight(personaData, animated);
            } else if (!append || !persona.highlighted) {
                persona.highlight({ properties: [] }, animated);
            }
        });
    }

    unhighlight(animated = true) {
        this.mActiveLayout.personas.forEach(wrapper => {
            wrapper.object.unhighlight(animated);
        });
    }

    autoZoom() {
        this.mViewport.autoZoom(true);
    }

    resize(width, height) {
        this.mCanvas.size.set(width, height);
    }

    _getLayoutSystem(type) {
        switch (type) {
            case 'cola':
                return new ColaLayout(this.mCanvas.size.width, this.mCanvas.size.height);

            case 'orbital':
            default:
                return new OrbitalLayout(this.mCanvas.size.width, this.mCanvas.size.height, this.mConfig.layout.layoutOrbitalPadding);
        }
    }

    _replaceLayout(layout, type) {
        let newLayout;
        if (type instanceof Layout) {
            newLayout = type;
        } else {
            newLayout = this._getLayoutSystem(type);
        }

        const personas = layout.personas.map(wrapper => wrapper.object);
        personas.forEach(persona => newLayout.addPersona(persona));
        newLayout.position.set(layout.position.x, layout.position.y);
        newLayout.clearNewObjects();
        layout.removeAllPersonas();

        return newLayout;
    }

    _loadData(data) {
        const newPersonas = [];
        const oldPersonas = this.mActiveLayout.personas.slice();
        const midX = this.mActiveLayout.size.width * 0.5;
        const midY = this.mActiveLayout.size.height * 0.5;
        let persona = null;

        data.personas.forEach(personaData => {
            const old = oldPersonas.findIndex(p => p.object.id === personaData.id);
            const personaScale = this.mActiveLayout.personaScale(personaData.scalingFactor);
            const personaSize = this.mConfig.layout.layoutPersonaMinRadius + (personaScale * this.mSizeDomain);

            if (old !== -1) {
                persona = oldPersonas.splice(old, 1)[0].object;
                persona.updateData(personaData);
                persona.radius = personaSize;
            } else {
                persona = Persona.instance(10, personaData, this.mConfig.persona);
                persona.position.set(midX, midY);
                newPersonas.push(persona);
                this.mActiveLayout.addPersona(persona);

                persona.radius = personaSize;
            }
        });

        oldPersonas.forEach(wrapper => {
            this.mActiveLayout.removePersona(wrapper.object);
        });
    }

    _forwardWithPriority(priority, bindable, events = null) {
        if (events === null) {
            bindable.on(null, bindable.safeBind(this._handleForwardedEvent, this, priority));
        } else {
            const eventArray = events instanceof Array ? events : events.split(' ');
            eventArray.forEach(event => {
                bindable.on(event, this.safeBind(this._handleForwardedEvent, this, priority, event));
            });
        }
    }

    _unforwardWithPriority(bindable, events = null) {
        if (events === null) {
            bindable.off(null, this._handleForwardedEvent, this);
        } else {
            const eventArray = events instanceof Array ? events : events.split(' ');
            eventArray.forEach(event => {
                bindable.off(event, this._handleForwardedEvent, this);
            });
        }
    }

    _handleForwardedEvent(priority, event, ...varArgs) {
        if (!this.mEventQueue[priority]) {
            this.mEventQueue[priority] = [];
        }

        this.mEventQueue[priority].push({
            event: event,
            args: varArgs,
        });

        if (!this.mEventTickScheduled) {
            this.mEventTickScheduled = true;
            nextTick(this.mBoundFlushEventQueue);
        }
    }

    /**
     * Flushes the end event queue.
     *
     * @method _flushEventQueue
     * @private
     */
    _flushEventQueue() {
        /* account for the situation where the object was destroyed before this function gets called */
        if (this.retainCount > 0) {
            this.mEventTickScheduled = false;
            for (let i = 0, n = this.mEventQueue.length; i < n; ++i) {
                const queue = this.mEventQueue[i];
                if (queue && queue.length) {
                    queue.forEach(wrapper => {
                        this.emit(wrapper.event, ...wrapper.args);
                    });
                    break;
                }
            }
            this.mEventQueue.length = 0;
        }
    }
}

export default Personas;
export { PersonaEvents };
export { BreadcrumbEvents };
export { LayoutEvents };

