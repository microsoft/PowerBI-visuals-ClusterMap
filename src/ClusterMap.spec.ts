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

// fake powerbi functions
window['powerbi'] = {
    DataViewObjects: {
        getValue: () => undefined,
    },
    visuals: {
        valueFormatter: {
            create: (obj) => ({ format: (value) => obj.format + value }),
        },
        utility: {
        }
    },
    extensibility: {
        visualApiVersions: [],
    },
    data: {
        SQExprBuilder: {
            equal: function () {},
            typedConstant: function () {},
            or: function () {},
        }
    },
    VisualUpdateType: {
        Data: 1,
    }
};

import * as $ from 'jquery';
global['$'] = global['jQuery'] = $;
import ClusterMap from './ClusterMap';

describe('ClusterMap Visual', () => {
    let visual;

    beforeAll(function () {
        const element = $('<div></div>');
        const parent = $('<div></div>');
        parent.append(element);
        const dummyHost = {
            createSelectionManager: () => ({
                hostServices: 'hostService',
                registerOnSelectCallback: () => {}
            }),
        };
        visual = new ClusterMap(<any>{
            element: element[0],
            host: dummyHost,
        });
    });

    it('exists', () => {
        expect(ClusterMap).toBeTruthy();
        expect(visual).toBeTruthy();
    });

    it('update', () => {
        const options = {};
        visual.update(options);
    });

    it('enumerateObjectInstances', () => {
        const options = {
            objectName: 'presentation',
        };
        const instances = visual.enumerateObjectInstances(options);
        expect(instances).toBeTruthy();
        expect(instances.length).toBe(1);
        const instanceProperties = instances[0].properties;
        expect(instanceProperties.layout).toBe('cola');
        expect(instanceProperties.initialCount).toBe(20);
        expect(instanceProperties.imageCount).toBe(4);
        expect(instanceProperties.loadMoreCount).toBe(5);
        expect(instanceProperties.normalColor.solid.color).toBe('#41455e');
        expect(instanceProperties.selectedColor.solid.color).toBe('#00bad3');
        expect(instanceProperties.showNameLabels).toBe(true);
    });

    it('destroy', () => {
        visual.destroy();
    });
});
