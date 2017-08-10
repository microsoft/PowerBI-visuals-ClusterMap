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
import Layout from './Layout.js';
import Persona from '../persona/Persona.js';
import PersonaConfig from '../config/Persona.js';

describe ('/layout/Layout', () => {
    const firstPersonas = [];
    const secondPersonas = [];
    const personaData = {
        id: 'test',
        scalingFactor: 1,
        totalCount: 111,
        label: 'test',
        properties: [
            {
                count: 37,
                color: '#d26502'
            },
            {
                count: 20,
                color: '#f0ab21'
            },
            {
                count: 15,
                color: '#35364e'
            }
        ],
        images: [
            'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
        ],
        links: [
            {
                target: 'other_test',
                strength: 0.9,
            },
        ],
    };

    let instance = null;

    before(() => {
        instance = new Layout(10, 10);

        for (let i = 0; i < 3; i++) {
            const data = Object.assign({}, personaData);
            data.id = 'id_' + i;

            firstPersonas.push(new Persona(30, data, PersonaConfig));
            secondPersonas.push(new Persona(30, data, PersonaConfig));
        }
    });

    it ('gets personas', () => {
        expect(instance.personas).to.be.an('array');
    });

    it ('gets newObjects', () => {
        expect(instance.newObjects).to.be.an('array');
    });

    it ('gets animations', () => {
        expect(instance.animations).to.be.an('array');
    });

    it ('adds personas', () => {
        expect(instance.personas.length).to.equal(0);
        firstPersonas.forEach(persona => instance.addPersona(persona));
        expect(instance.personas.length).to.equal(firstPersonas.length);
        for (let i = 0, n = instance.personas.length; i < n; ++i) {
            expect(instance.personas[i].object).to.equal(firstPersonas[i]);
        }
    });

    it ('removes personas', () => {
        const personaToRemove = firstPersonas[Math.floor(firstPersonas.length * 0.5)];
        expect(instance.personas.length).to.equal(firstPersonas.length);
        instance.removePersona(personaToRemove);
        expect(instance.personas.findIndex(wrapper => wrapper.object === personaToRemove)).to.equal(-1);
    });

    it ('clears new objects', () => {
        expect(instance.newObjects.length).to.equal(firstPersonas.length - 1);
        instance.clearNewObjects();
        expect(instance.newObjects.length).to.equal(0);
    });

    it ('tracks new objects', () => {
        secondPersonas.forEach(persona => instance.addPersona(persona));
        expect(instance.newObjects.length).to.equal(secondPersonas.length);
        for (let i = 0, n = instance.newObjects.length; i < n; ++i) {
            expect(instance.newObjects[i].object).to.equal(secondPersonas[i]);
        }
    });

    it ('removes all personas', () => {
        expect(instance.personas.length).to.equal(firstPersonas.length + secondPersonas.length - 1);
        instance.removeAllPersonas();
        expect(instance.personas.length).to.equal(0);
    });

    it ('cancels animations', done => {
        instance.animations.push({
            retainCount: 1,
            stop: done,
        });
        instance.cancelAnimations();
    });

    it ('implements personaScale', () => {
        expect(instance.personaScale(0.5)).to.equal(0.5);
    });

    it ('throws errors on unimplmented methods', done => {
        try {
            instance.positionObjects();
        } catch (e) {
            done();
        }
    });
});
