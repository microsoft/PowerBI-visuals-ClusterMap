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
        },
        createDataViewScopeIdentity: function () {

        }
    }
};

import * as $ from 'jquery';
import * as sinon from 'sinon';
import { expect } from 'chai';
import ClusterMap from './ClusterMap';
import VisualInitOptions = powerbi.VisualInitOptions;
import VisualUpdateOptions = powerbi.VisualUpdateOptions;
import VisualConstructorOptions = powerbi.extensibility.v110.VisualConstructorOptions;
import mockDataView from './test_data/mockdataview';
import * as _ from 'lodash';


describe('The ClusterMap Component', function () {
    let clusterMap;
    let dataView;

    before(function() {
        const element = $('<div></div>');
        const dummyHost = {
            createSelectionManager: () => ({ hostServices: 'hostService' } as any),
        };
        clusterMap = new ClusterMap(<VisualConstructorOptions>{ element: element[0], host: dummyHost });
    });

    beforeEach(() => {
        dataView = _.cloneDeep(mockDataView);
    });

    function populateData(data, highlights = null) {
        //dataView.categorical.categories = dataView.categorical.categories.map(function (category, index) {
        //    return new wrapCtor(category, data && data[index]);
        //});
        //
        //if (highlights) {
        //    dataView.categorical.values[0].highlights = highlights;
        //}
    }

    it('exists', function () {
        expect(ClusterMap).to.be.ok;
        expect(clusterMap).to.be.ok;
    });

    it('converts normal data', function () {
        const converted = clusterMap.converter(dataView);
        expect(converted.aggregates).to.be.ok;
        expect(converted.aggregates.personas).to.be.ok;
        expect(_.size(converted.aggregates.personas)).to.equal(10);
        _.forEach(converted.aggregates.personas, function (value, key) {
            expect(value.id).to.equal(key);
            expect(value.properties).to.be.ok;
            expect(value.properties.length).to.equal(1);
            expect(value.selection).to.be.ok;
            expect(value.selection.length).to.equal(1);
            expect(value.totalCount).to.be.above(0);
        });
        expect(converted.aggregates.links).to.be.ok;
        expect(converted.aggregates.links.length).to.equal(0);
        expect(converted.aggregates.other).to.be.ok;
        expect(converted.entityRefs).to.be.ok;
        expect(_.size(converted.entityRefs)).to.equal(10);
        _.forEach(converted.entityRefs, function (value, key) {
            expect(value.id).to.equal(key);
            expect(value.imageUrl).to.be.ok;
            expect(value.imageUrl.length).to.equal(0);
            expect(value.name).to.be.ok;
        });
    });

    it('converts data with highlights', function () {
        //populateData(
        //    values.explodingPhones,
        //    values.highlights
        //);
    });});
