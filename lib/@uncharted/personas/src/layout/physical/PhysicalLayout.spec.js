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
import PhysicalLayout from './PhysicalLayout.js';
import Persona from '../../persona/Persona.js';
import PersonaConfig from '../../config/Persona.js';

describe ('/layout/physical/PhysicalLayout', () => {
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
        instance = new PhysicalLayout(500, 500);
        for (let i = 0; i < 3; i++) {
            const data = Object.assign({}, personaData);
            data.id = 'id_' + i;

            const persona = new Persona(30 + i, data, PersonaConfig);
            persona.position.set(-1000, -1000);
            instance.addPersona(persona);
        }
    });

    it ('sets/gets insertionSpeed', () => {
        expect(instance.insertionSpeed).to.be.a('number');
        const oldValue = instance.insertionSpeed;
        instance.insertionSpeed = oldValue + 10;
        expect(instance.insertionSpeed).to.not.equal(oldValue);
    });

    it ('sets/gets insertionMultiplier', () => {
        expect(instance.insertionMultiplier).to.be.a('number');
        const oldValue = instance.insertionMultiplier;
        instance.insertionMultiplier = oldValue + 10;
        expect(instance.insertionMultiplier).to.not.equal(oldValue);
    });

    it ('positions objects', () => {
        instance.positionObjects(false);
        instance.update(100);
        instance.personas.forEach(persona => {
            expect(persona.position.x).to.not.equal(-1000);
            expect(persona.position.y).to.not.equal(-1000);
        });
    });
});
