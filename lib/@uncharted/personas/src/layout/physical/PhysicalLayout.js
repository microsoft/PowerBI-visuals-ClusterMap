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

import {Engine, World, Body, Bodies, use as matterUse} from 'matter-js';
import Layout from '../Layout.js';
import Easing from '../../revi/plugins/easing/Easing.js';
import EasingEvents from '../../revi/plugins/easing/Events.js';
import EasingTypes from '../../revi/plugins/easing/EasingTypes.js';
import * as MatterAttractors from 'matter-attractors';

matterUse(MatterAttractors);

export class PhysicalLayout extends Layout {
    /**
     * @param {Number} width - The desired with of the layout.
     * @param {Number} height - The desired height of the layout.
     * @param {Number} density - The initial density of objects added to this layout.
     * @param {Number} mass - The initial mass of objects added to this layout.
     * @constructor
     */
    constructor(width, height, density = 0.01, mass = 0.01) {
        super(width, height);

        this.mDensity = density;
        this.mMass = mass;
        this.mInsertionSpeed = 30;
        this.mInsertionMultiplier = 2;

        this.mKing = null;
        this.mWorld = World.create({
            label: 'World',
            gravity: {
                x: 0,
                y: 0,
                scale: 0,
            },
        });

        this.mEngine = Engine.create({
            world: this.mWorld,
        });

        this.mAttractor = Bodies.circle(this.size.width * 0.5, this.size.height * 0.5, 250, {
            isStatic: true,
            density: 5,
            mass: 5,
            plugin: {
                attractors: [
                    function(bodyA, bodyB) {
                        return {
                            x: (bodyA.position.x - bodyB.position.x) * 1e-6,
                            y: (bodyA.position.y - bodyB.position.y) * 1e-6,
                        };
                    },
                ],
            },
        });
        this.mAttractorRadius = 250;

        this.mPhysicalPersonaMap = new Map();

        World.add(this.mWorld, this.mAttractor);
    }

    /**
     * Destroys this object. Called automatically when the reference count of this object reaches zero.
     *
     * @method destroy
     */
    destroy() {
        if (this.mKing) {
            this.mKing.release();
            this.mKing = null;
        }

        World.clear(this.mWorld, false, true);
        Engine.clear(this.mEngine);

        this.mPhysicalPersonaMap.clear();

        delete this.mDensity;
        delete this.mMass;
        delete this.mKing;
        delete this.mWorld;
        delete this.mEngine;
        delete this.mAttractor;
        delete this.mAttractorRadius;
        delete this.mPhysicalPersonaMap;

        super.destroy();
    }

    /**
     * The speed at which objects are inserted into this layout.
     *
     * @type {Number}
     */
    get insertionSpeed() {
        return this.mInsertionSpeed;
    }

    /**
     * Sets the speed at which objects are inserted into this layout.
     *
     * @param {Number} value - The new insertion speed.
     */
    set insertionSpeed(value) {
        this.mInsertionSpeed = value;
    }

    /**
     * A multiplier used to compute the distance at which new objects are added.
     *
     * @type {Number}
     */
    get insertionMultiplier() {
        return this.mInsertionMultiplier;
    }

    /**
     * Sets a multiplier used to compute the distance at which new objects are added.
     * @param {Number} value - The new multiplier.
     */
    set insertionMultiplier(value) {
        this.mInsertionMultiplier = value;
    }

    /**
     * Adds a persona to this layout.
     *
     * @method addPersona
     * @param {Persona} persona - The persona to add to the layout.
     * @returns {LayoutObject}
     */
    addPersona(persona) {
        const wrapper = super.addPersona(persona);
        const radius = wrapper.safeRadius;
        const body = Bodies.circle(wrapper.position.x, wrapper.position.y, radius, {
            density: this.mDensity,
            mass: this.mMass,
        });

        const physicalData = {
            body: body,
            radius: radius,
            isKing: false,
            isNew: true,
            id: persona.id,
        };

        World.add(this.mWorld, body);
        this.mPhysicalPersonaMap.set(persona.id, physicalData);

        this.addChild(persona);
        return wrapper;
    }

    /**
     * Removes the child node at the specified index.
     *
     * @method removeChildAt
     * @param {Number} index - The index of this child to remove.
     * @returns {Node}
     */
    removeChildAt(index) {
        const persona = super.removeChildAt(index);
        const physicalData = this.mPhysicalPersonaMap.get(persona.id);
        const body = physicalData.body;

        if (persona === this.mKing) {
            this.mKing.release();
            this.mKing = null;
        }

        World.remove(this.mWorld, body);
        this.mPhysicalPersonaMap.delete(persona.id);

        return persona;
    }

    /**
     * Remove the specified persona from this layout.
     *
     * @method removePersona
     * @param {Persona} persona - The persona to remove.
     */
    removePersona(persona) {
        const personaIndex = this.personas.findIndex(wrapper => wrapper.object === persona);
        if (personaIndex !== -1) {
            const wrapper = this.personas[personaIndex];

            let isKing = false;
            let king = this.mKing;
            if (wrapper === king) {
                isKing = true;
                king = null;
                for (let i = 0, n = this.personas.length; i < n; ++i) {
                    if (this.personas[i] !== wrapper && !king || this.personas[i].radius > king.radius) {
                        king = this.personas[i];
                    }
                }
            }

            const physicalData = this.mPhysicalPersonaMap.get(persona.id);
            const body = physicalData.body;
            const centerX = king ? king.objectPosition.x : this.size.width * 0.5;
            const centerY = king ? king.objectPosition.y : this.size.height * 0.5;
            const startX = wrapper.objectPosition.x;
            const startY = wrapper.objectPosition.y;
            const fromCenterX = startX - centerX;
            const fromCenterY = startY - centerY;
            const distance = Math.sqrt(fromCenterX * fromCenterX + fromCenterY * fromCenterY);
            const offLength = wrapper.radius * 4;
            const offX = (fromCenterX / distance) * offLength;
            const offY = (fromCenterY / distance) * offLength;
            const startRadius = wrapper.objectRadius;
            const radiusChange = 10 - startRadius;
            const leaveEase = Easing.instance(this.reviContext, {
                type: EasingTypes.Quadratic.EaseIn,
                duration: 300,
            });

            Body.translate(body, {
                x: persona.position.x - body.position.x,
                y: persona.position.y - body.position.y,
            });

            leaveEase.on(EasingEvents.EASING_UPDATE, (sender, progress) => {
                if (!isKing) {
                    Body.translate(body, {
                        x: (startX + offX * progress) - body.position.x,
                        y: (startY + offY * progress) - body.position.y,
                    });
                }

                const oldRadius = persona.radius;
                persona.radius = startRadius + radiusChange * progress;

                const scale = persona.radius / oldRadius;
                Body.scale(body, scale, scale);
            });

            leaveEase.on([EasingEvents.EASING_END, EasingEvents.EASING_STOP], () => {
                World.remove(this.mWorld, body);
                this.removeChild(persona);
            });

            leaveEase.start();
            if (!isKing) {
                Body.setStatic(body, true);
            }

            this.mAnimations.push(leaveEase);
            super.removePersona(persona);
        }
    }

    /**
     * Removes all personas from this layout.
     *
     * @method removeAllPersonas
     */
    removeAllPersonas() {
        this.removeChildren();
        super.removeAllPersonas();
    }

    /**
     * Positions the objects in this layout.
     *
     * @method positionObjects
     * @param {Boolean} animated - Should the objects be animated after being positioned.
     */
    positionObjects(animated) {
        const newObjects = [];
        const centerX = this.size.width * 0.5;
        const centerY = this.size.height * 0.5;
        let baseRadius = 0;
        let king = null;

        /* find the king, new personas and the closest to the center a new persona can be safely added to the layout */
        this.personas.forEach(wrapper => {
            const persona = wrapper.object;
            const physicalData = this.mPhysicalPersonaMap.get(wrapper.id);
            const isNew = physicalData.isNew;

            if (isNew) {
                newObjects.push(wrapper);
                physicalData.isNew = false;
            } else {
                baseRadius = Math.max(baseRadius, Math.pow(persona.position.x - centerX, 2) + Math.pow(persona.position.y - centerY, 2) + Math.pow(persona.safeRadius, 2));
            }

            if (wrapper.radius !== wrapper.objectRadius && animated) {
                const radiusEase = Easing.instance(this.reviContext, {
                    type: EasingTypes.Back.EaseOut,
                    duration: 300,
                    overshoot: 2,
                });

                const startRadius = wrapper.radius;
                const startSafeRadius = wrapper.safeRadius;
                const targetRadius = wrapper.objectRadius;

                wrapper.updateRadius();
                wrapper.object.radius = startRadius;

                const scaleStart = wrapper.object.scale; // should always be 1
                const scaleEnd = (targetRadius / startRadius) * scaleStart;
                const scaleChange = scaleEnd - scaleStart;

                radiusEase.on(EasingEvents.EASING_UPDATE, (sender, progress) => {
                    const body = physicalData.body;
                    const scale = scaleStart + (scaleChange * progress);
                    let physicsScale = (startSafeRadius * scale) / body.circleRadius;

                    if (isNew) {
                        const radiusBefore = wrapper.objectSafeRadius;
                        wrapper.object.radius = startRadius * scale;
                        const radiusAfter = wrapper.objectSafeRadius;
                        physicsScale = radiusAfter / radiusBefore;
                    } else {
                        wrapper.object.scale = scale;
                    }

                    Body.scale(body, physicsScale, physicsScale);

                    if (physicalData.isKing) {
                        const kingScale = isNew ? wrapper.objectSafeRadius / this.mAttractorRadius : (startSafeRadius * scale) / this.mAttractor.circleRadius;
                        Body.scale(this.mAttractor, kingScale, kingScale);
                        this.mAttractorRadius = isNew ? wrapper.objectSafeRadius : this.mAttractor.circleRadius;
                    }
                });

                radiusEase.on([EasingEvents.EASING_END, EasingEvents.EASING_STOP], () => {
                    wrapper.object.scale = scaleStart;
                    wrapper.object.radius = targetRadius;

                    const body = physicalData.body;
                    const physicsScale = wrapper.objectSafeRadius / body.circleRadius;

                    Body.scale(body, physicsScale, physicsScale);

                    if (physicalData.isKing) {
                        const kingScale = wrapper.objectSafeRadius / this.mAttractorRadius;
                        Body.scale(this.mAttractor, kingScale, kingScale);
                        this.mAttractorRadius = wrapper.objectSafeRadius;
                    }
                });

                radiusEase.start();
                this.mAnimations.push(radiusEase);
            } else {
                const radiusBefore = wrapper.safeRadius;
                wrapper.updateRadius();
                const radiusAfter = wrapper.safeRadius;
                const physicsScale = radiusAfter / radiusBefore;
                Body.scale(physicalData.body, physicsScale, physicsScale);
            }

            if (!king || wrapper.radius > king.radius) {
                king = wrapper;
            }

            wrapper.updatePosition();

            physicalData.isKing = false;
        });

        baseRadius = Math.sqrt(baseRadius);
        newObjects.sort((a, b) => a.safeRadius - b.safeRadius);

        /* position all the new personas */
        const doublePI = Math.PI * 10;
        const nextLayer = [];
        let usedAngle = 0;
        let nextRadiusOffset = 0;

        if (!baseRadius) {
            const wrapper = newObjects.pop();
            const physicalData = this.mPhysicalPersonaMap.get(wrapper.id);
            const body = physicalData.body;

            wrapper.object.position.set(centerX, centerY);
            Body.translate(body, {
                x: (centerX - body.position.x),
                y: (centerY - body.position.y),
            });

            baseRadius = wrapper.safeRadius;
        }

        while (newObjects.length) {
            const wrapper = newObjects.pop();
            const radius = wrapper.safeRadius;
            const personaAngle = this._calculateObjectAngle(radius, baseRadius);
            if (usedAngle + personaAngle > doublePI) {
                const angleStep = doublePI / nextLayer.length;
                let currentAngle = Math.random() * doublePI;
                nextLayer.forEach(w => { // eslint-disable-line no-loop-func
                    this._positionPersona(w, currentAngle, w === king ? baseRadius : baseRadius * this.mInsertionMultiplier, centerX, centerY);
                    w.updatePosition();
                    currentAngle += angleStep;
                });

                baseRadius += nextRadiusOffset * 2;
                nextRadiusOffset = 0;
                usedAngle = 0;
                nextLayer.length = 0;
            }

            nextRadiusOffset = Math.max(nextRadiusOffset, radius);
            usedAngle += personaAngle;
            nextLayer.push(wrapper);
        }

        if (nextLayer.length) {
            const angleStep = doublePI / nextLayer.length;
            let currentAngle = Math.random() * doublePI;
            nextLayer.forEach(w => {
                this._positionPersona(w, currentAngle, w === king ? baseRadius : baseRadius * this.mInsertionMultiplier, centerX, centerY);
                w.updatePosition();
                currentAngle += angleStep;
            });
        }

        if (king !== this.mKing) {
            if (this.mKing) {
                /* if there's a new king, process the old king */
                const oldKingData = this.mPhysicalPersonaMap.get(this.mKing.id);
                const oldKingBody = oldKingData.body;
                Body.translate(oldKingBody, {
                    x: (this.mKing.object.position.x - oldKingBody.position.x),
                    y: (this.mKing.object.position.y - oldKingBody.position.y),
                });

                World.add(this.mWorld, oldKingBody);
                this.mKing.release();
            }
            this.mKing = king.retain();
        }

        /* process the king */
        if (this.mKing.position.x !== centerX || this.mKing.position.y !== centerY) {
            if (animated) {
                const sourceX = this.mKing.position.x;
                const sourceY = this.mKing.position.y;
                const targetX = centerX;
                const targetY = centerY;
                const positionChangeX = targetX - sourceX;
                const positionChangeY = targetY - sourceY;

                this.mKing.object.position.set(sourceX, sourceY);

                const kingEasing = Easing.instance(this.reviContext, {
                    type: EasingTypes.Back.EaseIn,
                    duration: 400,
                    overshoot: 3,
                });

                kingEasing.on(EasingEvents.EASING_UPDATE, (sender, progress) => {
                    king.object.position.set(sourceX + positionChangeX * progress, sourceY + positionChangeY * progress);
                });

                kingEasing.on([EasingEvents.EASING_END, EasingEvents.EASING_STOP], () => {
                    king.object.position.set(targetX, targetY);
                    king.updatePosition();
                });

                kingEasing.start();

                this.mAnimations.push(kingEasing);
            } else {
                this.mKing.updatePosition();
            }
        }

        const kingData = this.mPhysicalPersonaMap.get(this.mKing.id);
        const kingBody = kingData.body;
        const scale = this.mKing.objectSafeRadius / this.mAttractorRadius;

        this.mAttractorRadius = this.mKing.objectSafeRadius;
        Body.scale(this.mAttractor, scale, scale);

        kingData.isKing = true;
        Body.translate(this.mAttractor, {
            x: (this.mKing.objectPosition.x - this.mAttractor.position.x),
            y: (this.mKing.objectPosition.y - this.mAttractor.position.y),
        });

        Body.translate(kingBody, {
            x: (this.mKing.objectPosition.x - kingBody.position.x),
            y: (this.mKing.objectPosition.y - kingBody.position.y),
        });

        World.remove(this.mWorld, kingBody);

        /* if this shouldn't be animated, advance the physics engine to avoid large animations */
        if (!animated) {
            for (let i = 0; i < 120; ++i) {
                Engine.update(this.mEngine, 16.66);
            }
        }
    }

    /**
     * Called every tick, before this object is drawn.
     *
     * @method update
     * @param {Number} delta - The delta time since the last update.
     */
    update(delta) {
        if (this.mKing) {
            Body.translate(this.mAttractor, {
                x: (this.mKing.objectPosition.x - this.mAttractor.position.x),
                y: (this.mKing.objectPosition.y - this.mAttractor.position.y),
            });
        }

        /* advance the physics engine */
        Engine.update(this.mEngine, delta);

        /* position personas according to their physical position */
        const motionThreshold = Math.pow(0.5, 2);
        this.mChildren.forEach(persona => {
            const physicalData = this.mPhysicalPersonaMap.get(persona.id);
            if (!physicalData.isKing) {
                const body = physicalData.body;
                const distanceSQ = Math.pow(body.position.x - persona.position.x, 2) + Math.pow(body.position.y - persona.position.y, 2);
                if (distanceSQ > motionThreshold) {
                    persona.position.set(body.position.x, body.position.y);
                }
            }
        });

        super.update(delta);
    }

    /**
     * Returns the persona scale, modified if this layout type requires it.
     *
     * @method personaScale
     * @param {Number} dataScale - The initial scale of the persona.
     * @returns {Number}
     */
    personaScale(dataScale) {
        const scalingPower = 3;
        const scalingThreshold = 0.6;
        const scalingReference = Math.pow(scalingThreshold, 1 / scalingPower);
        return Math.pow(dataScale, scalingPower) < scalingThreshold ? (dataScale / scalingReference) * scalingThreshold : Math.pow(dataScale, scalingPower);
    }

    /**
     * Calculates the angle that a given object would take to fit in an orbit of the given radius.
     *
     * @method _calculateObjectAngle
     * @param { Number } objectRadius - The radius of the object for which to calculate the angle.
     * @param { Number } centerRadius - Center radius of the orbit.
     * @returns {Number}
     * @private
     */
    _calculateObjectAngle(objectRadius, centerRadius) {
        if (objectRadius > centerRadius) {
            return Math.PI * 2;
        }
        return Math.asin(objectRadius / centerRadius) * 2;
    }

    /**
     * Positions the specified persona using the angle and base coordinates provided.
     *
     * @method _positionPersona
     * @param {LayoutObject} wrapper - The persona to position.
     * @param {Number} angle - The angle, from the center, at which the persona should be positioned.
     * @param {Number} radius - The radius, from the center, at which the persona should be positioned,
     * @param {Number} baseX - The X coordinate of the center of the layout.
     * @param {Number} baseY - The Y coordinate of the center of the layout.
     * @private
     */
    _positionPersona(wrapper, angle, radius, baseX, baseY) {
        const physicalData = this.mPhysicalPersonaMap.get(wrapper.id);
        const body = physicalData.body;
        const r = radius + wrapper.safeRadius;
        const angX = Math.cos(angle);
        const angY = Math.sin(angle);
        const x = baseX + angX * r;
        const y = baseY + angY * r;

        wrapper.object.position.set(x, y);
        Body.translate(body, {
            x: (x - body.position.x),
            y: (y - body.position.y),
        });

        Body.setVelocity(body, { x: -angX * this.mInsertionSpeed, y: -angY * this.mInsertionSpeed });
        Body.applyForce(body, body.position, { x: -angX * this.mInsertionSpeed * 0.001, y: -angY * this.mInsertionSpeed * 0.001 });
    }
}

export default PhysicalLayout;

