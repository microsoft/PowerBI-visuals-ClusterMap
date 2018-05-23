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
import Viewport from './layout/Viewport.js';
import LayoutEvents from './layout/Events.js';
import Persona from './persona/Persona.js';
import PersonaEvents from './persona/Events.js';
import BreadcrumbEvents from './layout/breadcrumbs/Events.js';

import InputManager from './revi/plugins/input/InputManager.js';
import Easing from './revi/plugins/easing/Easing.js';
import Scheduler from './revi/plugins/Scheduler.js';
import LayoutStack from './layout/LayoutStack';
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
        this.mEventQueue = [];
        this.mEventTickScheduled = false;
        this.mBoundFlushEventQueue = this._flushEventQueue.bind(this);
        this.mElement = element;
        this.mViewport = new Viewport('100%', '100%', this.mConfig.layout);
        this.mSizeDomain = this.mConfig.layout.layoutPersonaMaxRadius - this.mConfig.layout.layoutPersonaMinRadius;
        this.mBreadcrumbs = null;
        if (this.mConfig.general.displayBreadcrumbs) {
            this.mBreadcrumbs = new Breadcrumbs(this.mConfig.general.breadcrumbsSegmentedBackground);
            this._forwardWithPriority(0, this.mBreadcrumbs);
        }

        InputManager.registerContext(this.mCanvas.reviContext);
        Easing.registerContext(this.mCanvas.reviContext);
        Scheduler.registerContext(this.mCanvas.reviContext);

        this.mLayoutStack = new LayoutStack(this.mViewport, this.mBreadcrumbs, this.mConfig.layout);
        this.mCanvas.addChild(this.mViewport);

        if (this.mBreadcrumbs) {
            this.mCanvas.addChild(this.mBreadcrumbs);
        }

        this._forwardWithPriority(1, this.mViewport, [LayoutEvents.LAYOUT_AUTO_ZOOM_CLICKED, LayoutEvents.LAYOUT_ZOOM_IN_CLICKED, LayoutEvents.LAYOUT_ZOOM_OUT_CLICKED]);
        this._forwardWithPriority(2, this.mViewport, PersonaEvents.PERSONA_SUB_LEVEL_CLICKED);
        this._forwardWithPriority(3, this.mViewport, [PersonaEvents.PERSONA_CLICKED, PersonaEvents.PERSONA_POINTER_OVER, PersonaEvents.PERSONA_POINTER_OUT]);
        this._forwardWithPriority(4, this.mViewport, LayoutEvents.LAYOUT_BLANK_SPACE_CLICKED);

        this.mLayoutStack.on([LayoutEvents.LAYOUT_ANIMATION_REPULSION_START, LayoutEvents.LAYOUT_ANIMATION_CONTRACTION_START], () => { this.mCanEmitEvents = false; });
        this.mLayoutStack.on([LayoutEvents.LAYOUT_ANIMATION_REPULSION_END, LayoutEvents.LAYOUT_ANIMATION_CONTRACTION_END], () => { this.mCanEmitEvents = true; });
    }

    destroy() {
        InputManager.unregisterContext(this.mCanvas.reviContext);

        if (this.mBreadcrumbs) {
            this._unforwardWithPriority(this.mBreadcrumbs);
        }

        this._unforwardWithPriority(this.mViewport, [
            PersonaEvents.PERSONA_CLICKED,
            PersonaEvents.PERSONA_SUB_LEVEL_CLICKED,
            LayoutEvents.LAYOUT_BLANK_SPACE_CLICKED,
            LayoutEvents.LAYOUT_AUTO_ZOOM_CLICKED,
            LayoutEvents.LAYOUT_ZOOM_IN_CLICKED,
            LayoutEvents.LAYOUT_ZOOM_OUT_CLICKED,
        ]);

        super.destroy();
    }

    get personas() {
        return this.mLayoutStack.layout.personas;
    }

    get breadcrumbs() {
        return this.mBreadcrumbs ? this.mBreadcrumbs.breadcrumbs : null;
    }

    get displayBreadcrumbs() {
        return this.mBreadcrumbs && this.mBreadcrumbs.visible;
    }

    set displayBreadcrumbs(value) {
        if (this.mBreadcrumbs) {
            this.mBreadcrumbs.visible = value;
        }
    }

    get layoutType() {
        return this.mLayoutStack.type;
    }

    set layoutType(value) {
        this.mLayoutStack.type = value;
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
        this.mLayoutStack.cancelAnimations();

        if (!update) {
            this.mLayoutStack.clear();
        }

        if (data && data.personas) {
            if (this.mLayoutStack.layout) {
                this._loadData(data, this.mLayoutStack.layout);
                this.mLayoutStack._positionObjects(this.mLayoutStack.layout, true, () => {
                    this.mViewport.autoZoom(true);
                    if (this.mBreadcrumbs && this.mBreadcrumbs.length > 0) {
                        this.mBreadcrumbs.updateLastBreadcrumb(this.mLayoutStack.layout);
                    }
                });
            } else {
                const layout = this.mLayoutStack.createNewLayout();
                this._loadData(data, layout);
                this.mLayoutStack.pushLayout(layout);
            }
        }
    }

    addDataLayer(data, sourcePersona = null, autoZoom = true, layout = null, metadata = null) {
        if (data && data.personas) {
            const newLayout = layout ? layout : this.mLayoutStack.createNewLayout();
            this._loadData(data, newLayout);

            const subLayouts = [];
            if (data.subLayouts && data.subLayouts.length) {
                data.subLayouts.forEach(subLayoutData => {
                    const subLayout = this.mLayoutStack.createNewLayout();
                    this._loadData(subLayoutData, subLayout);
                    subLayouts.push({
                        layout: subLayout,
                        direction: subLayoutData.direction,
                        distance: subLayoutData.distance,
                    });
                });
            }

            this.mLayoutStack.pushLayout(newLayout, subLayouts, true, sourcePersona, autoZoom, metadata);
        }
    }

    removeDataLayer(count = 1, autoZoom = true) {
        this.mLayoutStack.popLayout(count, true, autoZoom);
    }

    highlight(data, animated = true, append = false) {
        this.mLayoutStack.layout.personas.forEach(wrapper => {
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
        this.mLayoutStack.layout.personas.forEach(wrapper => {
            wrapper.object.unhighlight(animated);
        });
    }

    autoZoom() {
        this.mViewport.autoZoom(true);
    }

    resize(width, height) {
        this.mCanvas.size.set(width, height);
    }

    _loadData(data, layout = this.mLayoutStack.layout) {
        const newPersonas = [];
        const oldPersonas = layout.personas.slice();
        const midX = layout.pixelSize.width * 0.5;
        const midY = layout.pixelSize.height * 0.5;
        let persona = null;

        data.personas.forEach(personaData => {
            const old = oldPersonas.findIndex(p => p.object.id === personaData.id);
            const personaScale = layout.personaScale(personaData.scalingFactor);
            const personaSize = this.mConfig.layout.layoutPersonaMinRadius + (personaScale * this.mSizeDomain);

            if (old !== -1) {
                persona = oldPersonas.splice(old, 1)[0].object;
                persona.updateData(personaData);
                persona.radius = personaSize;
            } else {
                persona = Persona.instance(personaSize, personaData, this.mConfig.persona);
                persona.position.set(midX, midY);
                newPersonas.push(persona);
                layout.addPersona(persona);
            }
        });

        oldPersonas.forEach(wrapper => {
            layout.removePersona(wrapper.object);
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

