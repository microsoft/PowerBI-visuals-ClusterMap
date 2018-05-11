/**
 * Copyright (c) 2018 Uncharted Software Inc.
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

import IBindable from '../revi/core/IBindable';
import Node from '../revi/graphics/Node';
import Scheduler from '../revi/plugins/Scheduler';
import Layout from './Layout';
import ForceDirectedLayout from './d3/ForceDirectedLayout';
import ColaLayout from './cola/ColaLayout';
import OrbitalLayout from './orbital/OrbitalLayout';
import Easing from '../revi/plugins/easing/Easing';
import EasingEvents from '../revi/plugins/easing/Events';
import Point from '../revi/geometry/Point';
import EasingTypes from '../revi/plugins/easing/EasingTypes';
import Aura from './Aura';
import Events from './Events';

/**
 * Class to keep track and handle the layout stack used to display hierarchical navigation.
 *
 * @class LayoutStack
 */
export class LayoutStack extends IBindable {
    /**
     * @param {Viewport} viewport - The viewport in which this layout stack will be displayed.
     * @param {Breadcrumbs} breadcrumbs - The breadcrumb trail used to represent this stack.
     * @param {Object} config - An object containing the configuration for this instance.
     * @constructor
     */
    constructor(viewport, breadcrumbs, config) {
        super();
        this.mViewport = viewport;
        this.mBreadcrumbs = breadcrumbs;
        this.mConfig = config;
        this.mStack = [];
        this.mAnimations = [];
        this.mType = null;
        this.mAuraContainer = new Node();

        this.mViewport.addChild(this.mAuraContainer);
        this.type = this.mConfig.layoutType;
    }

    /**
     * Destroys this object. Called automatically when the reference count of this object reaches zero.
     *
     * @method destroy
     */
    destroy() {
        super.destroy();
    }

    /**
     * Returns the top most layout of this stack.
     *
     * @type {Layout|null}
     * @readonly
     */
    get layout() {
        return this.mStack.length ? this.mStack[this.mStack.length - 1].layout : null;
    }

    /**
     * Returns the type of layouts in this stack.
     *
     * @type {String|Layout}
     */
    get type() {
        return this.mType;
    }

    /**
     * Sets the type of layouts in this stack, is a Layout instance is passed, custom layouts are assumed.
     * WARNING: This method recursively sets the layout type for all the layouts in this stack, setting a custom
     * layout type to a stack with a depth higher than one is not supported and will cause undefined behaviour.
     *
     * @param {String|Layout} value - The new type to be set.
     */
    set type(value) {
        if (value !== this.mType) {
            if (value instanceof Layout) {
                this.mType = 'custom';
            } else {
                this.mType = value;
            }

            if (this.mStack.length) {
                for (let i = 0, n = this.mStack.length; i < n; ++i) {
                    const oldLayout = this.mStack[i].layout;
                    const replacement = this._replaceLayout(oldLayout, this.mType);
                    this.mViewport.replaceChild(oldLayout, replacement);
                    this.mStack[i].layout = replacement.retain();
                    this.mStack[i].personaPositions = null;
                    oldLayout.release();
                }

                this._positionObjects(this.layout, true, () => {
                    this.mViewport.autoZoom(true);
                    if (this.mBreadcrumbs && this.mBreadcrumbs.length > 0) {
                        this.mBreadcrumbs.updateLastBreadcrumb(this.layout);
                    }
                });
            }
        }
    }

    /**
     * Returns a new, autoreleased, layout instance to be added to the stack.
     *
     * @method createNewLayout
     * @returns {Layout}
     */
    createNewLayout() {
        return (this.mConfig.layoutType instanceof Layout) ? this.mConfig.layoutType : this._getLayoutSystem(this.mType);
    }

    /**
     * Recursively cancels all the animations playing in this layout stack.
     *
     * @method cancelAnimations
     */
    cancelAnimations() {
        if (this.mStack.length) {
            this.layout.cancelAnimations();
        }

        while (this.mAnimations.length) {
            const easing = this.mAnimations.pop();
            if (easing.retainCount) {
                easing.stop();
            }
        }
    }

    /**
     * Removes all layouts from this stack and the configured viewport.
     *
     * @method clear
     */
    clear() {
        while (this.mStack.length) {
            const layoutWrapper = this.mStack.pop();
            this.mViewport.removeChild(layoutWrapper.layout);
            layoutWrapper.layout.removeAllPersonas();
            layoutWrapper.layout.release();

            if (layoutWrapper.aura) {
                this.mAuraContainer.removeChild(layoutWrapper.aura);
                layoutWrapper.aura.release();
            }
        }

        if (this.mBreadcrumbs) {
            this.mBreadcrumbs.removeAllBreadcrumbs();
        }
    }

    /**
     * Pushes a new layout onto the stack and displays it on the configured viewport.
     *
     * @method pushLayout
     * @param {Layout} layout - The new layout instance to push, will be retained.
     * @param {Array=} subLayouts - An array containing layouts to be displayed outside of the central layout.
     * @param {Boolean=} animated - Should the transition be animated. Defaults to true.
     * @param {Persona=} sourcePersona - The persona that originated the push, is any.
     * @param {Boolean=} autoZoom - Should the viewport auto zoom to show its contents once the operation is completed.
     * @param {Object=} metadata - An object containing metadata to be stored on the breadcrumb.
     */
    pushLayout(layout, subLayouts = null, animated = true, sourcePersona = null, autoZoom = true, metadata = null) {
        this.emit(Events.LAYOUT_ANIMATION_REPULSION_START, this);

        this.mViewport.addChild(layout);

        const newLayoutWrapper = {
            layout: layout.retain(),
            subLevelOffsetX: 0,
            subLevelOffsetY: 0,
            aura: null,
            auraRadius: 0,
            sourceRadius: 0,
            personaPositions: null,
            subLayouts: null,
        };

        if (subLayouts && subLayouts.length) {
            newLayoutWrapper.subLayouts = [];

            subLayouts.forEach(subLayout => {
                subLayout.layout.clearNewObjects();
                subLayout.layout.positionObjects(false);
                const subLayoutBB = subLayout.layout.boundingBox;
                const auraRadius = Math.sqrt(Math.pow(subLayoutBB.width, 2) + Math.pow(subLayoutBB.height, 2)) * 0.5;
                const aura = new Aura(auraRadius, {
                    fillEnabled: this.mConfig.layoutAuraFillEnabled,
                    fillColor: this.mConfig.layoutAuraFillColor,
                });

                subLayout.layout.position.set(auraRadius - subLayoutBB.x - subLayoutBB.width * 0.5, auraRadius - subLayoutBB.y - subLayoutBB.height * 0.5);
                aura.addChild(subLayout.layout);

                newLayoutWrapper.subLayouts.push({
                    aura: aura,
                    direction: subLayout.direction,
                    distance: subLayout.distance,
                });
            });
        }

        if (this.mStack.length) {
            const oldLayoutWrapper = this.mStack[this.mStack.length - 1];
            const oldLayout = oldLayoutWrapper.layout;

            layout.clearNewObjects();
            layout.positionObjects(false);
            newLayoutWrapper.personaPositions = this._savePersonaPositions(layout);

            if (this.mBreadcrumbs) {
                if (this.mBreadcrumbs.breadcrumbs.length) {
                    this.mBreadcrumbs.breadcrumbs[this.mBreadcrumbs.breadcrumbs.length - 1].displayLabel = false;
                }
                this.mBreadcrumbs.addBreadcrumb(oldLayout, sourcePersona, sourcePersona ? sourcePersona.mLabel.mName : null, metadata);
            }

            const layoutPoint = sourcePersona ?
                Point.instance(sourcePersona.position.x, sourcePersona.position.y) :
                Point.instance(oldLayout.size.width * 0.5, oldLayout.size.height * 0.5);
            const viewportPoint = this.mViewport.mContent.globalToLocalPoint(oldLayout.localToGlobalPoint(layoutPoint));

            oldLayoutWrapper.subLevelOffsetX = oldLayout.pixelPosition.x - viewportPoint.x;
            oldLayoutWrapper.subLevelOffsetY = oldLayout.pixelPosition.y - viewportPoint.y;
            oldLayoutWrapper.sourceRadius = sourcePersona ? sourcePersona.radius : 0;

            const newLayoutBB = layout.boundingBox;
            const maxDistance = Math.sqrt(Math.pow(newLayoutBB.width, 2) + Math.pow(newLayoutBB.height, 2)) * 0.5;
            const personasToAnimate = this._calculatePersonasRepulsion(oldLayout, layoutPoint, maxDistance, [sourcePersona]);

            newLayoutWrapper.auraRadius = Math.sqrt(Math.pow(newLayoutBB.width, 2) + Math.pow(newLayoutBB.height, 2)) * 0.5;
            newLayoutWrapper.aura = new Aura(newLayoutWrapper.auraRadius, {
                fillEnabled: this.mConfig.layoutAuraFillEnabled,
                fillColor: this.mConfig.layoutAuraFillColor,
            });
            newLayoutWrapper.aura.position.set(viewportPoint.x, viewportPoint.y);
            this.mAuraContainer.addChild(newLayoutWrapper.aura);

            if (animated) {
                this._animateLayoutExpansion(newLayoutWrapper, oldLayoutWrapper, viewportPoint, personasToAnimate, autoZoom, () => {
                    this.emit(Events.LAYOUT_ANIMATION_REPULSION_END, this);
                });
            } else {
                Object.keys(personasToAnimate).forEach(key => {
                    const info = personasToAnimate[key];
                    info.persona.position.set(info.startX + info.changeX, info.startY + info.changeY);
                });
                this.emit(Events.LAYOUT_ANIMATION_REPULSION_END, this);
            }
        } else {
            this._positionObjects(layout, animated, () => {
                newLayoutWrapper.personaPositions = this._savePersonaPositions(layout);

                if (autoZoom) {
                    this.mViewport.autoZoom(animated);
                }

                if (this.mBreadcrumbs) {
                    this.mBreadcrumbs.addBreadcrumb(layout, sourcePersona, sourcePersona ? sourcePersona.mLabel.mName : null, metadata);
                }

                this.emit(Events.LAYOUT_ANIMATION_REPULSION_END, this);
            });
        }

        this.mStack.push(newLayoutWrapper);
    }

    /**
     * Pops the top most layout(s) from this stack.
     *
     * @method popLayout
     * @param {Number=} count - How many layouts to pop. Defaults to 1.
     * @param {Boolean=} animated - Should the transition be animated. Defaults to true.
     * @param {Boolean=} autoZoom - Should the viewport auto zoom to show its contents once the operation is completed.
     */
    popLayout(count = 1, animated = true, autoZoom = true) {
        const removeCount = Math.min(this.mStack.length, count);
        if (removeCount > 0) {
            this.emit(Events.LAYOUT_ANIMATION_CONTRACTION_START, this);

            const oldLayoutWrapper = this.mStack[this.mStack.length - 1];
            const oldLayout = oldLayoutWrapper.layout.retain();
            const targetCount = this.mStack.length - removeCount;

            if (oldLayoutWrapper.aura) {
                oldLayoutWrapper.aura.retain();
            }

            while (this.mStack.length > targetCount) {
                const toRemove = this.mStack.pop();
                this.mViewport.removeChild(toRemove.layout);
                toRemove.layout.release();
                if (toRemove.aura) {
                    this.mAuraContainer.removeChild(toRemove.aura);
                    toRemove.aura.release();
                }

                if (toRemove.subLayouts) {
                    toRemove.subLayouts.forEach(subLayout => {
                        subLayout.aura.scale = 1;
                        subLayout.aura.alpha = 1;
                        this.mAuraContainer.removeChild(subLayout.aura);
                    });
                }
            }
            this.mViewport.addChild(oldLayout);

            if (this.mBreadcrumbs) {
                if (this.mBreadcrumbs.breadcrumbs.length - removeCount > 0) {
                    this.mBreadcrumbs.breadcrumbs[this.mBreadcrumbs.breadcrumbs.length - removeCount - 1].displayLabel = true;
                }
                this.mBreadcrumbs.removeBreadcrumb(removeCount);
            }

            if (this.layout) {
                /* align the layout to the center of the layout being removed */
                const newlayoutWrapper = this.mStack[this.mStack.length - 1];
                const newLayout = newlayoutWrapper.layout;
                const oldLayoutCenter = this.mViewport.mContent.globalToLocalPoint(oldLayout.localToGlobalCoords(oldLayout.pixelSize.width * 0.5, oldLayout.pixelSize.height * 0.5));
                newLayout.position.set(oldLayoutCenter.x + newlayoutWrapper.subLevelOffsetX * newLayout.scale, oldLayoutCenter.y + newlayoutWrapper.subLevelOffsetY * newLayout.scale);
                this.mViewport.addChild(newLayout);

                if (newlayoutWrapper.aura) {
                    this.mAuraContainer.addChild(newlayoutWrapper.aura);
                    newlayoutWrapper.aura.position.set(
                        oldLayoutCenter.x + newlayoutWrapper.subLevelOffsetX + newLayout.pixelSize.width * 0.5,
                        oldLayoutCenter.y + newlayoutWrapper.subLevelOffsetY + newLayout.pixelSize.height * 0.5
                    );
                }

                if (oldLayoutWrapper.aura) {
                    this.mAuraContainer.addChild(oldLayoutWrapper.aura);
                }

                const personasToAnimate = this._calculatePersonasRestitution(newlayoutWrapper);
                if (animated) {
                    if (oldLayoutWrapper.subLayouts) {
                        oldLayoutWrapper.subLayouts.forEach(subLayout => {
                            this.mAuraContainer.addChild(subLayout.aura);
                        });
                    }

                    this._animateLayoutContraction(newlayoutWrapper, oldLayoutWrapper, personasToAnimate, autoZoom, () => {
                        this.emit(Events.LAYOUT_ANIMATION_CONTRACTION_END, this);
                    });
                } else {
                    Object.keys(personasToAnimate).forEach(key => {
                        const info = personasToAnimate[key];
                        info.persona.position.set(info.startX + info.changeX, info.startY + info.changeY);
                    });
                    this.emit(Events.LAYOUT_ANIMATION_CONTRACTION_END, this);
                }
            } else {
                this.mViewport.removeChild(oldLayout);
                this.emit(Events.LAYOUT_ANIMATION_CONTRACTION_END, this);
            }
        }
    }

    /**
     * Gets a new, auto released, instance of the specified layout type.
     *
     * @method _getLayoutSystem
     * @param {String} type - A string describing the layout type to create.
     * @returns {Layout}
     * @private
     */
    _getLayoutSystem(type) {
        switch (type) {
            case 'cola':
                return ColaLayout.instance(this.mViewport.pixelSize.width, this.mViewport.pixelSize.height);

            case 'force-directed':
                return ForceDirectedLayout.instance(this.mViewport.pixelSize.width, this.mViewport.pixelSize.height);

            case 'orbital':
            default:
                return OrbitalLayout.instance(this.mViewport.pixelSize.width, this.mViewport.pixelSize.height, this.mConfig.layoutOrbitalPadding);
        }
    }

    /**
     * Replaces the specified layout with a new instance of the specified layout type. This method also transfers all
     * personas from the old layout to the new layout.
     *
     * @mrthod _replaceLayout
     * @param {Layout} layout - The layout to replace.
     * @param {String} type - The type of the new layout to be created.
     * @returns {Layout}
     * @private
     */
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

    /**
     * Utility function to position the objects within a layout with a callback.
     *
     * @method _positionObjects
     * @param {Layout} layout - The layout in which objects will be positioned.
     * @param {Boolean=} animated - Should the operation be animated. Defaults to true.
     * @param {Function=} callback - Function to be called once the operation completes.
     * @private
     */
    _positionObjects(layout, animated = true, callback = null) {
        layout.positionObjects(animated);
        if (callback) {
            if (animated) {
                Scheduler.instanceForContext(this.mViewport.reviContext).scheduleTimeout(() => {
                    callback(layout);
                }, this.mConfig.layoutPositionAnimationDuration);
            } else {
                /* eslint-disable */
                callback(layout);
                /* eslint-enable */
            }
        }
    }

    /**
     * Used to compute the end positions of personas within a layout after a repulsion event originated at the specified point.
     * Returns an object containing a set of personas and their initial position and change of position using the persona ids as keys.
     *
     * @method _calculatePersonasRepulsion
     * @param {Layout} layout - The layout containing the personas.
     * @param {Point} center - A point representing the cented of the repulsion event.
     * @param {Number} maxDistance - Maximum distance fron the center that a persona should move.
     * @param {Array} exclude - An array containing personas to exclude during the computations.
     * @returns {Object}
     * @private
     */
    _calculatePersonasRepulsion(layout, center, maxDistance, exclude = []) {
        const personasToAnimate = {};
        layout.personas.forEach(wrapper => {
            const persona = wrapper.object;
            if (exclude.indexOf(persona) === -1) {
                const vectorX = persona.position.x - center.x;
                const vectorY = persona.position.y - center.y;
                const distanceFromPoint = Math.sqrt(vectorX * vectorX + vectorY * vectorY);
                const distanceToMove = Math.max(maxDistance - distanceFromPoint, 0) + persona.radius;
                personasToAnimate[persona.id] = {
                    persona: persona,
                    startX: persona.position.x,
                    startY: persona.position.y,
                    changeX: (vectorX / distanceFromPoint) * distanceToMove,
                    changeY: (vectorY / distanceFromPoint) * distanceToMove,
                };
            }
        });
        return personasToAnimate;
    }

    /**
     * Used to compute the end position of personas that should be positioned to the layout's default organization.
     * Returns an object containing a set of personas and their initial position and change of position using the persona ids as keys.
     *
     * @method _calculatePersonasRestitution
     * @param {Object} layoutWrapper - An object wrapping the layout containing the personas.
     * @returns {Object}
     * @private
     */
    _calculatePersonasRestitution(layoutWrapper) {
        const layout = layoutWrapper.layout;
        const personasToAnimate = {};

        layout.personas.forEach(wrapper => {
            const persona = wrapper.object;
            personasToAnimate[persona.id] = {
                persona: persona,
                startX: persona.position.x,
                startY: persona.position.y,
                changeX: 0,
                changeY: 0,
            };

            if (layoutWrapper.personaPositions) {
                personasToAnimate[persona.id].changeX = layoutWrapper.personaPositions[persona.id].local.x - persona.position.x;
                personasToAnimate[persona.id].changeY = layoutWrapper.personaPositions[persona.id].local.y - persona.position.y;
            }
        });

        if (!layoutWrapper.personaPositions) {
            layout.positionObjects(false);

            layout.personas.forEach(wrapper => {
                const persona = wrapper.object;
                const toAnimate = personasToAnimate[persona.id];
                toAnimate.changeX = persona.position.x - toAnimate.startX;
                toAnimate.changeY = persona.position.y - toAnimate.startY;
                persona.position.set(toAnimate.changeX, toAnimate.changeY);
            });
        }

        return personasToAnimate;
    }

    /**
     * Utility function used to save the persona positions, in local and viewport coordinates, in the specified layout. Returns an object with the current
     * positions of the personas in the layout sorted by their IDs.
     *
     * @param {Layout} layout - The layout for which the persona positions will be saved.
     * @returns {Object}
     * @private
     */
    _savePersonaPositions(layout) {
        const personaPositions = {};
        if (layout.personas) {
            layout.personas.forEach(wrapper => {
                const persona = wrapper.object;
                const localPoint = new Point(persona.pixelPosition.x, persona.pixelPosition.y);
                const viewportPoint = this.mViewport.globalToLocalPoint(persona.localToGlobalPoint(localPoint));
                personaPositions[persona.id] = {
                    local: localPoint,
                    viewport: viewportPoint,
                };
            });
        }
        return personaPositions;
    }

    /**
     * Utility function used to animate personas and layouts when a new layout is pushed onto the stack.
     *
     * @method  _animateLayoutExpansion
     * @param {Object} newLayoutWrapper - An object wrapping the layout being pushed onto the stack.
     * @param {Object} oldLayoutWrapper - an object wrapping the current top layout on the stack.
     * @param {Point} center - The center where the event originated, in viewport coordinates.
     * @param {Object=} personasToAnimate - An object containing personas to be animated and their positional information.
     * @param {Boolean=} autoZoom - Should the viewport auto zoom to fit its contents once the operation has completed.
     * @param {Function=} callback - Function to be called once the operation is completed.
     * @returns {Easing}
     * @private
     */
    _animateLayoutExpansion(newLayoutWrapper, oldLayoutWrapper, center, personasToAnimate = {}, autoZoom = true, callback = null) {
        const easing = Easing.instance(this.mViewport.reviContext, {
            type: EasingTypes.Cubic.EaseOut,
            duration: this.mConfig.layoutRepulsionAnimationDuration,
        });

        const newLayout = newLayoutWrapper.layout;
        const oldLayout = oldLayoutWrapper.layout;
        const personaKeys = Object.keys(personasToAnimate);

        const newAura = newLayoutWrapper.aura;
        const oldAura = oldLayoutWrapper.aura;
        const newAuraRadiusStart = newAura ? oldLayoutWrapper.sourceRadius : 0;
        const newAuraRadiusEnd = newAura ? newLayoutWrapper.auraRadius : 1;
        const newAuraRadiusChange = newAuraRadiusEnd - newAuraRadiusStart;

        const oldAuraRadius = oldAura ? oldAura.radius : 0;

        const viewportPoint = center;

        const oldLayoutScaleStart = oldLayout.scale;
        const oldLayoutScaleChange = oldLayoutScaleStart * this.mConfig.layoutRepulsionScaleMultiplier;

        const oldLayoutStartX = oldLayout.position.x;
        const oldLayoutStartY = oldLayout.position.y;
        const oldLayoutChangeX = (oldLayoutStartX - viewportPoint.x) * this.mConfig.layoutRepulsionScaleMultiplier;
        const oldLayoutChangeY = (oldLayoutStartY - viewportPoint.y) * this.mConfig.layoutRepulsionScaleMultiplier;

        const newLayoutScaleStart = newAuraRadiusStart / newAuraRadiusEnd;
        const newLayoutScaleChange = 1 - newLayoutScaleStart;

        const newLayoutStartX = viewportPoint.x - newLayout.size.width * 0.5 * (1 - Math.abs(newLayoutScaleChange));
        const newLayoutStartY = viewportPoint.y - newLayout.size.height * 0.5 * (1 - Math.abs(newLayoutScaleChange));
        const newLayoutChangeX = -newLayout.size.width * 0.5 * Math.abs(newLayoutScaleChange);
        const newLayoutChangeY = -newLayout.size.height * 0.5 * Math.abs(newLayoutScaleChange);

        newLayout.alpha = 0;
        oldLayout.alpha = 1;

        if (oldLayoutWrapper.subLayouts) {
            oldLayoutWrapper.subLayouts.forEach(subLayout => {
                subLayout.aura.scale = 1;
                subLayout.aura.alpha = 1;
            });
        }

        if (this.mConfig.layoutAuraFillColor && oldAura && newAura && this.mConfig.viewportBackground) {
            newAura.fillColor = this.mConfig.viewportBackgroundColor;
        }

        easing.on(EasingEvents.EASING_UPDATE, (sender, progress) => {
            oldLayout.alpha = 1 - progress;
            oldLayout.scale = oldLayoutScaleStart + oldLayoutScaleChange * progress;
            oldLayout.position.set(oldLayoutStartX + oldLayoutChangeX * progress, oldLayoutStartY + oldLayoutChangeY * progress);

            newLayout.alpha = progress;
            newLayout.scale = newLayoutScaleStart + newLayoutScaleChange * progress;
            newLayout.position.set(newLayoutStartX + newLayoutChangeX * progress, newLayoutStartY + newLayoutChangeY * progress);

            personaKeys.forEach(key => {
                const info = personasToAnimate[key];
                info.persona.position.set(info.startX + info.changeX * progress, info.startY + info.changeY * progress);
            });

            if (newAura) {
                newAura.radius = newAuraRadiusStart + newAuraRadiusChange * progress;
                if (this.mConfig.layoutAuraFillColor && progress > 0.5) {
                    newAura.fillColor = this.mConfig.layoutAuraFillColor;
                }
            }

            if (oldAura) {
                oldAura.radius = oldAuraRadius + newAuraRadiusEnd * progress;
                oldAura.alpha = 0.7 - (0.7 * progress);
            }

            if (oldLayoutWrapper.subLayouts) {
                oldLayoutWrapper.subLayouts.forEach(subLayout => {
                    subLayout.aura.scale = 1 - progress;
                    subLayout.aura.alpha = 1 - progress;
                });
            }
        });

        easing.on([EasingEvents.EASING_END, EasingEvents.EASING_STOP], () => {
            const easingIndex = this.mAnimations.indexOf(easing);
            if (easingIndex !== -1) {
                this.mAnimations.splice(easingIndex, 1);
            }

            this.mViewport.removeChild(oldLayout);
            if (oldAura) {
                this.mAuraContainer.removeChild(oldAura);
            }

            if (oldLayoutWrapper.subLayouts) {
                oldLayoutWrapper.subLayouts.forEach(subLayout => {
                    subLayout.aura.scale = 1;
                    subLayout.aura.alpha = 1;
                    this.mAuraContainer.removeChild(subLayout.aura);
                });
            }

            if (newAura && newLayoutWrapper.subLayouts) {
                newLayoutWrapper.subLayouts.forEach(subLayout => {
                    subLayout.aura.position.set(
                        newAura.pixelPosition.x + Math.cos(subLayout.direction) * (newAura.radius + subLayout.aura.radius + this.mConfig.subLayoutMinDistanceFromMain + (this.mConfig.subLayoutMaxDistanceFromMain - this.mConfig.subLayoutMinDistanceFromMain) * subLayout.distance),
                        newAura.pixelPosition.y + Math.sin(subLayout.direction) * (newAura.radius + subLayout.aura.radius + this.mConfig.subLayoutMinDistanceFromMain + (this.mConfig.subLayoutMaxDistanceFromMain - this.mConfig.subLayoutMinDistanceFromMain) * subLayout.distance)
                    );
                    this.mAuraContainer.addChild(subLayout.aura);
                });
            }

            let result = null;
            if (autoZoom) {
                const objects = [];
                if (newAura) {
                    objects.push(newAura);
                    if (newLayoutWrapper.subLayouts) {
                        newLayoutWrapper.subLayouts.forEach(subLayout => {
                            objects.push(subLayout.aura);
                        });
                    }
                }

                result = this.mViewport.autoZoom(true, objects.length ? objects : null);
            }

            if (newAura && newLayoutWrapper.subLayouts) {
                this._animateSubLayoutsAppear(newLayoutWrapper.subLayouts);
            }

            if (result) {
                result.on([EasingEvents.EASING_END, EasingEvents.EASING_STOP], () => {
                    newLayout.ignoreGlobalScaleChanges = false;
                });
            } else {
                newLayout.ignoreGlobalScaleChanges = false;
            }

            newLayout.position.set(newLayoutStartX + newLayoutChangeX, newLayoutStartY + newLayoutChangeY);

            if (callback) {
                /* eslint-disable */
                callback(this, newLayout, oldLayout);
                /* eslint-enable */
            }
        });

        oldLayout.ignoreGlobalScaleChanges = true;
        newLayout.ignoreGlobalScaleChanges = true;

        this.mAnimations.push(easing);
        easing.start();

        return easing;
    }

    /**
     * Utility function used to animate layouts and their personas when one or several layouts are popped from the stack.
     *
     * @method _animateLayoutContraction
     * @param {Object} newLayoutWrapper - An object wrapping the layout being pushed onto the stack.
     * @param {Object} oldLayoutWrapper - an object wrapping the current top layout on the stack.
     * @param {Object=} personasToAnimate - An object containing personas to be animated and their positional information.
     * @param {Boolean=} autoZoom - Should the viewport auto zoom to fit its contents once the operation has completed.
     * @param {Function=} callback - Function to be called once the operation is completed.
     * @returns {Easing}
     * @private
     */
    _animateLayoutContraction(newLayoutWrapper, oldLayoutWrapper, personasToAnimate = {}, autoZoom = true, callback = null) {
        const easing = Easing.instance(this.mViewport.reviContext, {
            type: EasingTypes.Cubic.EaseOut,
            duration: this.mConfig.layoutContractionAnimationDuration,
        });

        const newAura = newLayoutWrapper.aura;
        const oldAura = oldLayoutWrapper.aura;

        const newAuraRadiusStart = newAura ? newAura.radius : 0;
        const newAuraRadiusChange = newAura ? newLayoutWrapper.auraRadius - newAuraRadiusStart : 0;

        const oldAuraRadiusStart = oldAura ? oldAura.radius : 1;
        const oldAuraRadiusChange = oldAura ? newLayoutWrapper.sourceRadius - oldAuraRadiusStart : 1;

        const newLayout = newLayoutWrapper.layout;
        const oldLayout = oldLayoutWrapper.layout;
        const personaKeys = Object.keys(personasToAnimate);

        const oldLayoutCenter = oldLayout.localToGlobalCoords(oldLayout.pixelSize.width * 0.5, oldLayout.pixelSize.height * 0.5);
        const viewportPoint = this.mViewport.mContent.globalToLocalPoint(oldLayoutCenter);

        const oldLayoutScaleStart = oldLayout.scale;
        const oldLayoutScaleChange = oldAuraRadiusChange / oldAuraRadiusStart;

        const oldLayoutStartX = oldLayout.position.x;
        const oldLayoutStartY = oldLayout.position.y;
        const oldLayoutChangeX = (viewportPoint.x - oldLayoutStartX) * Math.abs(oldLayoutScaleChange);
        const oldLayoutChangeY = (viewportPoint.y - oldLayoutStartY) * Math.abs(oldLayoutScaleChange);

        const newLayoutScaleStart = newLayout.scale;
        const newLayoutScaleChange = 1.0 - newLayoutScaleStart;

        const newLayoutStartX = newLayout.position.x;
        const newLayoutStartY = newLayout.position.y;
        const newLayoutChangeX = (viewportPoint.x - newLayoutStartX) * (this.mConfig.layoutRepulsionScaleMultiplier / (1.0 + this.mConfig.layoutRepulsionScaleMultiplier));
        const newLayoutChangeY = (viewportPoint.y - newLayoutStartY) * (this.mConfig.layoutRepulsionScaleMultiplier / (1.0 + this.mConfig.layoutRepulsionScaleMultiplier));

        newLayout.alpha = 0;
        oldLayout.alpha = 1;

        if (this.mConfig.layoutAuraFillColor && oldAura && newAura && this.mConfig.viewportBackground) {
            oldAura.fillColor = this.mConfig.viewportBackgroundColor;
        }

        easing.on(EasingEvents.EASING_UPDATE, (sender, progress) => {
            oldLayout.alpha = 1 - progress;
            oldLayout.scale = oldLayoutScaleStart + oldLayoutScaleChange * progress;
            oldLayout.position.set(oldLayoutStartX + oldLayoutChangeX * progress, oldLayoutStartY + oldLayoutChangeY * progress);

            newLayout.alpha = progress;
            newLayout.scale = newLayoutScaleStart + newLayoutScaleChange * progress;
            newLayout.position.set(newLayoutStartX + newLayoutChangeX * progress, newLayoutStartY + newLayoutChangeY * progress);

            personaKeys.forEach(key => {
                const info = personasToAnimate[key];
                info.persona.position.set(info.startX + info.changeX * progress, info.startY + info.changeY * progress);
            });

            if (newAura) {
                newAura.radius = newAuraRadiusStart + newAuraRadiusChange * progress;
                newAura.alpha = progress;
            }

            if (oldAura) {
                oldAura.radius = oldAuraRadiusStart + oldAuraRadiusChange * progress;
            }

            if (oldLayoutWrapper.subLayouts) {
                oldLayoutWrapper.subLayouts.forEach(subLayout => {
                    subLayout.aura.scale = 1 - progress;
                    subLayout.aura.alpha = 1 - progress;
                });
            }
        });

        easing.on([EasingEvents.EASING_END, EasingEvents.EASING_STOP], () => {
            const easingIndex = this.mAnimations.indexOf(easing);
            if (easingIndex !== -1) {
                this.mAnimations.splice(easingIndex, 1);
            }

            this.mViewport.removeChild(oldLayout);
            oldLayout.release();

            if (oldAura) {
                this.mAuraContainer.removeChild(oldAura);
                oldAura.release();
            }

            if (oldLayoutWrapper.subLayouts) {
                oldLayoutWrapper.subLayouts.forEach(subLayout => {
                    subLayout.aura.scale = 1;
                    subLayout.aura.alpha = 1;
                    this.mAuraContainer.removeChild(subLayout.aura);
                });
            }

            if (newAura && newLayoutWrapper.subLayouts) {
                newLayoutWrapper.subLayouts.forEach(subLayout => {
                    subLayout.aura.scale = 1;
                    subLayout.aura.alpha = 1;
                    subLayout.aura.position.set(
                        newAura.pixelPosition.x + Math.cos(subLayout.direction) * (newAura.radius + subLayout.aura.radius + this.mConfig.subLayoutMinDistanceFromMain + (this.mConfig.subLayoutMaxDistanceFromMain - this.mConfig.subLayoutMinDistanceFromMain) * subLayout.distance),
                        newAura.pixelPosition.y + Math.sin(subLayout.direction) * (newAura.radius + subLayout.aura.radius + this.mConfig.subLayoutMinDistanceFromMain + (this.mConfig.subLayoutMaxDistanceFromMain - this.mConfig.subLayoutMinDistanceFromMain) * subLayout.distance)
                    );
                    this.mAuraContainer.addChild(subLayout.aura);
                });
            }

            let result = null;
            if (autoZoom) {
                const objects = [];
                if (newAura) {
                    objects.push(newAura);
                    if (newLayoutWrapper.subLayouts) {
                        newLayoutWrapper.subLayouts.forEach(subLayout => {
                            objects.push(subLayout.aura);
                        });
                    }
                }

                result = this.mViewport.autoZoom(true, objects.length ? objects : null);
            }

            if (newAura && newLayoutWrapper.subLayouts) {
                this._animateSubLayoutsAppear(newLayoutWrapper.subLayouts);
            }

            if (result) {
                result.on([EasingEvents.EASING_END, EasingEvents.EASING_STOP], () => {
                    newLayout.ignoreGlobalScaleChanges = false;
                });
            } else {
                newLayout.ignoreGlobalScaleChanges = false;
            }

            newLayout.position.set(newLayoutStartX + newLayoutChangeX, newLayoutStartY + newLayoutChangeY);

            if (callback) {
                /* eslint-disable */
                callback(this, newLayout, oldLayout);
                /* eslint-enable */
            }
        });

        oldLayout.ignoreGlobalScaleChanges = true;
        newLayout.ignoreGlobalScaleChanges = true;

        this.mAnimations.push(easing);
        easing.start();

        return easing;
    }

    /**
     * Utility function used to animate sub layouts into place.
     *
     * @method _animateSubLayoutsAppear
     * @param {Array} subLayouts - an array containing the sub layouts to animate.
     * @private
     */
    _animateSubLayoutsAppear(subLayouts) {
        const duration = this.mConfig.subLayoutEntryAnimationDuration * 0.8;
        const delay = (this.mConfig.subLayoutEntryAnimationDuration * 0.2) / subLayouts.length;
        subLayouts.forEach((subLayout, i) => {
            subLayout.aura.scale = 0;

            const easing = Easing.instance(this.mViewport.reviContext, {
                type: EasingTypes.Back.EaseOut,
                duration: duration,
            });

            easing.on(EasingEvents.EASING_UPDATE, (sender, progress) => {
                subLayout.aura.scale = progress;
            });

            easing.on([EasingEvents.EASING_END, EasingEvents.EASING_STOP], () => {
                subLayout.aura.scale = 1;
                const oldScale = subLayout.aura.globalScale;
                subLayout.aura.globalScale *= 2;
                subLayout.aura.globalScale = oldScale;
            });

            easing.retain();

            Scheduler.instanceForContext(this.mViewport.reviContext).scheduleTimeout(() => {
                easing.start();
                easing.release();
            }, Math.round(delay * (i + 1)));
        });
    }
}

export default LayoutStack;
