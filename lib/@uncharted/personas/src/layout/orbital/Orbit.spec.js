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

import * as sinon from 'sinon';
import { expect } from 'chai';
import Orbit from './Orbit.js';
import Node from '../../revi/graphics/Node.js';

describe ('/layout/orbital/Orbit', () => {
    let orbit = null;
    let radius = 0;
    let subOrbit = null;
    let subOrbitRadius = 0;

    beforeEach(function () {
        radius = Math.round(Math.random() * 100) + 10;
        orbit = new Orbit(radius);
        subOrbitRadius = Math.round(radius * 0.25);
        subOrbit = new Orbit(subOrbitRadius);
    });

    it ('Repositions objects when changing the `innerRadius` property', function () {
        orbit.addObject(subOrbit);
        expect(orbit.innerRadius).equals(radius);
        orbit._positionObjects();

        /* save the sub orbit's position */
        const savedX = subOrbit.position.x;

        /* change the inner radius */
        orbit.innerRadius = radius * 2;
        expect(orbit.innerRadius).equals(radius * 2);

        /* check that the objects moved */
        expect(subOrbit.position.x).not.equals(savedX);

        /* change the inner radius back to its original value */
        orbit.innerRadius = radius;
        expect(orbit.innerRadius).equals(radius);

        /* check that the objects moved back to their original position */
        orbit._positionObjects();
        expect(subOrbit.position.x).equals(savedX);
    });

    it ('Calculates the `radius` properly', function () {
        orbit.addObject(subOrbit);
        expect(orbit.radius).equals(radius + (subOrbitRadius * 2));
    });

    it ('Calculates the `centerRadius` properly', function () {
        orbit.addObject(subOrbit);
        expect(orbit.centerRadius).equals(radius + subOrbitRadius);
    });

    it ('Repositions objects when changing the `distributeEvenly` property', function () {
        /* set the orbit to distribute objects evenly */
        orbit.distributeEvenly = true;
        orbit._positionObjects();
        expect(orbit.distributeEvenly).equals(true);

        /* add two objects to it */
        const secondSubOrbit = new Orbit(subOrbitRadius);
        orbit.addObject(subOrbit);
        orbit.addObject(secondSubOrbit);
        orbit._positionObjects();

        /* save the position of the second object */
        const savedX = secondSubOrbit.position.x;
        const savedY = secondSubOrbit.position.y;

        /* change the property */
        orbit.distributeEvenly = false;
        orbit._positionObjects();
        expect(orbit.distributeEvenly).equals(false);

        /* check that the object moved */
        expect(secondSubOrbit.position.x).not.equals(savedX);
        expect(secondSubOrbit.position.y).not.equals(savedY);

        /* change the property again */
        orbit.distributeEvenly = true;
        orbit._positionObjects();
        expect(orbit.distributeEvenly).equals(true);

        /* check that the object returned to its original location */
        expect(secondSubOrbit.position.x).equals(savedX);
        expect(secondSubOrbit.position.y).equals(savedY);
    });

    it ('Objects can be added to the orbit', function() {
        const orbitsCreated = [];
        const tangentAngle = Math.sin(Math.PI * 0.125); // 45 deg / 2
        const halfLengthRatio = Math.cos(Math.PI * 0.25); // 45 deg
        const orbitSizeStep = 64;
        let object = new Node();
        object.radius = orbitSizeStep;

        /* create 9 orbits with 8 elements each, except the center orbit which should always hold only 1 persona */
        orbit = new Orbit(0);
        orbit.addObject(object);

        while (orbitsCreated.length < 9) {
            object = new Node();
            object.radius = tangentAngle * (halfLengthRatio * orbit.innerRadius * 2); // this is an approximation
            const added = orbit.addObject(object);

            if (!added) {
                orbitsCreated.push(orbit);
                orbit = new Orbit(orbit.radius);
            }
        }

        expect(orbitsCreated.length).to.equal(9);
        expect(orbitsCreated[0].children.length).to.equal(1); // first orbit only has one persona
        for (let i = 1, n = orbitsCreated.length; i < n; ++i) {
            expect(orbitsCreated[i].children.length).to.equal(8);
            expect(orbitsCreated[i].mFilledAngle).to.be.at.least(Math.PI * 1.8 /* 90% of 360 */);
        }
    });

    it ('Can find if it contains objects', function () {
        orbit.addObject(subOrbit);
        expect(orbit.containsObject(subOrbit)).equals(true);
        expect(orbit.containsObject({})).equals(false);

        /* add an object to the sub orbit */
        let object = new Node();
        object.radius = Math.round(subOrbitRadius * 0.5);
        subOrbit.addObject(object);

        /* the function should be able to find the object recursively in sub orbits */
        expect(orbit.containsObject(object)).equals(true);
    });

    it ('Can remove objects', function () {
        /* add an object to the sub orbit */
        let object = new Node();
        object.radius = Math.round(subOrbitRadius * 0.5);
        subOrbit.addObject(object);
        expect(subOrbit.containsObject(object)).equals(true);

        /* add the sub orbit to the main orbit */
        orbit.addObject(subOrbit);
        expect(orbit.containsObject(subOrbit)).equals(true);
        expect(orbit.containsObject(object)).equals(true);

        /* remove the object from the sub orbit by calling removeObject in the main orbit */
        expect(orbit.removeObject(object)).equals(true);
        expect(subOrbit.containsObject(object)).equals(false);
        expect(orbit.containsObject(object)).equals(false);

        /* remove the sub orbit */
        expect(orbit.removeObject(subOrbit)).equals(true);
        expect(orbit.containsObject(subOrbit)).equals(false);

        /* trying to remove an object that is not in the orbit should return false */
        expect(orbit.removeObject({})).equals(false);
    });

    it ('Calculates the angle it would take to fit an object in an orbit', function () {
        var minRadius = 10;
        var maxRadius = 360;
        var currentRadius = 0;
        var currentRadiusOffset = 0;
        var minAngle = Math.PI * 0.05 ; // 5 deg
        var maxAngle = Math.PI * 0.5; // 90 deg
        var objectAngle = 0;
        var objectRadius = 0;
        var result = 0;

        /* test it 30 times */
        for (var i = 0; i < 30; ++i) {
            currentRadius = (Math.random() * (maxRadius - minRadius)) + minRadius;
            objectAngle = (Math.random() * (maxAngle - minAngle)) + minAngle;
            currentRadiusOffset = objectRadius * 1.5;

            /* same algorithm but reversed! */
            objectRadius = Math.sin(objectAngle * 0.5) * (currentRadius + currentRadiusOffset);
            result = orbit.calculateObjectAngle(objectRadius, currentRadius + currentRadiusOffset);

            /* reduce the precision of the results to avoid issues with floating point numbers inaccuracies */
            objectAngle = parseFloat(objectAngle).toPrecision(12);
            result = parseFloat(result).toPrecision(12);

            expect(result).to.equal(objectAngle);
        }
    });
});
