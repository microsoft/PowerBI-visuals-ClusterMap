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

/// <reference path="../node_modules/powerbi-visuals/lib/powerbi-visuals.d.ts"/>

import IVisual = powerbi.extensibility.v110.IVisual;
import IEnumType = powerbi.IEnumType;
import VisualCapabilities = powerbi.VisualCapabilities;
import VisualDataRoleKind = powerbi.VisualDataRoleKind;
import IVisualHostServices = powerbi.IVisualHostServices;
import VisualConstructorOptions = powerbi.extensibility.v110.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.VisualUpdateOptions;
import DataView = powerbi.DataView;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import DataViewCategoricalSegment = powerbi.data.segmentation.DataViewCategoricalSegment;
import SQExprBuilder = powerbi.data.SQExprBuilder;

import SelectionManager = powerbi.extensibility.ISelectionManager;
import SelectionId = powerbi.extensibility.ISelectionId;

import {IPersonasData, IPersonasOptions, IPersonasSubSelection, IPersonasVisualConfiguration} from './interfaces';

import * as $ from 'jquery';
import * as _ from 'lodash';

const Personas = require('@uncharted/personas/src/Personas');
const Persona = require('@uncharted/personas/src/personas.persona');
const PersonasGauge = require('@uncharted/personas/src/personas.persona.gauge.js');
const PersonasLabel = require('@uncharted/personas/src/personas.persona.label.js');
const Snap = require('snapsvg');
const DOCUMENT_REQUEST_COUNT = 5000;

export default class ClusterMap implements IVisual {

    private static LOAD_MORE_PERSONAS_STEP = 5;
    private static MAX_PERSONAS_DEFAULT = 20;
    private static MAX_PROPERTIES_DEFAULT = 5;

    /**
     * Default formatting settings
     */
    private static DEFAULT_SETTINGS = {
        presentation: {
            layout: 'cola',
            imageBlur: false,
            initialCount: ClusterMap.MAX_PERSONAS_DEFAULT,
            loadMoreCount: ClusterMap.LOAD_MORE_PERSONAS_STEP
        },
        dataLoading: {
            maxDataRows: 20000
        },
    };

    private element:JQuery;
    private inSandbox:boolean;
    private settings = $.extend(true, {}, ClusterMap.DEFAULT_SETTINGS);
    private host:IVisualHostServices;
    private personas:any;
    private $personas:JQuery;
    private showOther:boolean;
    private maxPersonas:number;
    private maxProperties:number;
    private selectionManager:SelectionManager;
    private data:IPersonasData;
    private otherPersona:any;
    private dataView:DataView;
    private hasLinks:boolean;
    private hasDocumentList:boolean;
    private serializedData = null;
    private subSelectionData = null;
    private ignoreSelectionNextUpdate = false;
    private hasMoreData = false;
    private lastDataviewLength: number = 0;
    private autoZoomTimerId = null;

    public static convertToLookup(data:Array<{id: string}>, assignmentFunc:Function) {
        let lookup = {};
        if (data && data.length) {
            data.forEach((d) => {
                lookup[d.id] = assignmentFunc.call(this, d);
            });
        }
        return lookup;
    }

    constructor(options:VisualConstructorOptions) {
        this.$personas = $('<svg id="personas-panel" class="personas" style="stroke: none;"></svg>');
        this.element = $(options.element).append(this.$personas);

        this.inSandbox = this.element.parents('body.visual-sandbox').length > 0;

        this.selectionManager = options.host.createSelectionManager();
        this.host = (this.selectionManager as any).hostServices;

        this.maxPersonas = ClusterMap.MAX_PERSONAS_DEFAULT;
        this.maxProperties = ClusterMap.MAX_PROPERTIES_DEFAULT;
        this.showOther = true;

        /* hack the persona gauges */
        const _personasPersona_barId = '__uniqueBarId__';
        const _personasGauge_addBar = PersonasGauge.prototype.addBar;
        PersonasGauge.prototype.addBar = function (id, progress, color) {
            _personasGauge_addBar.call(this, _personasPersona_barId, 0, '#00bad3'); // do nothing
        };

        /* hack the persona `appendGauge` and `removeAllAppendedGauges` functions */
        Persona.prototype.appendGauge = function (bars) {
            /* we should only ever get one bar here */
            this.mGauge.updateBar(_personasPersona_barId, bars[0].percent, true);
        };

        Persona.prototype.removeAllAppendedGauges = function () {
            this.mGauge.updateBar(_personasPersona_barId, 0, true);
        };
    }

    public destroy(): void {
        if (this.personas) {
            this.personas.layoutSystem.invalidate();
            this.personas.layoutSystem.removeAllObjects();
            this.personas.layoutSystem.remove();

            this.personas.unregisterEvents();
        }

        if (this.otherPersona) {
            this.otherPersona.invalidate();
            this.otherPersona = null;
        }

        if (this.autoZoomTimerId !== null) {
            clearTimeout(this.autoZoomTimerId);
            this.autoZoomTimerId = null;
        }

        this.$personas.remove();
        this.$personas = null;

        this.subSelectionData = null;
        this.serializedData = null;
        this.dataView = null;
        this.data = null;
        this.selectionManager = null;
        this.host = null;
    }

    public update(options:VisualUpdateOptions) {
        /* always set the width and height of the SVG element, solves https://msrp.visualstudio.com/Essex/_workitems?id=1870&_a=edit
         * this seems to be a browser specific bug dealing with the sizing of svg and starting drawing before the DOM has been updated
         * it seems to only appears in specific spect ratios */
        this.$personas.width(options.viewport.width);
        this.$personas.height(options.viewport.height);
        if (options.type & powerbi.VisualUpdateType.Resize && this.personas) {
            this.personas.resize();
            if (this.autoZoomTimerId !== null) {
                clearTimeout(this.autoZoomTimerId);
                this.autoZoomTimerId = null;
            }

            this.autoZoomTimerId = setTimeout(() => {
                this.autoZoomTimerId = null;
                this.personas.autoZoom();
            }, 100);
        }

        if (!(options.type & powerbi.VisualUpdateType.Data)) {
            return;
        }

        if (options.dataViews && options.dataViews.length > 0) {
            const dataView = options.dataViews[0];
            const newObjects:any = dataView && dataView.metadata && dataView.metadata.objects;
            if (newObjects) {
                /* update settings */
                if (newObjects && !_.isMatch(this.settings, newObjects)) {
                    $.extend(true, this.settings, newObjects);
                    this.settings.presentation.initialCount = Math.max(this.settings.presentation.initialCount, 1);
                    this.settings.dataLoading.maxDataRows = Math.max(this.settings.dataLoading.maxDataRows, 1);

                    const maxPersonasChanged = (this.maxPersonas !== this.settings.presentation.initialCount);
                    this.maxPersonas = this.settings.presentation.initialCount;

                    if (this.personas) {
                        /* set the layout type in personas */
                        this.personas.layoutSystemType = this.hasLinks ? this.settings.presentation.layout : 'orbital';
                        /* set the blur for the images */
                        this.personas.enableBlur(this.settings.presentation.imageBlur);

                        if (!this.inSandbox) {
                            (<JQuery>(<any>this.$personas).find('[filter^="url("]', '[FILTER^="url("]')).each((index, element)=> {
                                const currentUrl = $(element).attr('filter');
                                const filtermatch = /url\(['"]?(#[a-zA-Z0-9]+)['"]?\)/ig.exec(currentUrl);
                                const $element = $(element);
                                if (filtermatch && filtermatch.length > 1) {
                                    $element.attr('filter', 'url("' + element.ownerDocument.URL + filtermatch[1] + '")')
                                }
                            });
                        }

                        /* the update was triggered by a change in the settings, retrun if the max number of personas didn't change */
                        if (!maxPersonasChanged) {
                            return;
                        }
                    }
                }
            }
            this.updateDataView(dataView);
            if (this.personas) {
                /* set the layout type in personas */
                this.personas.layoutSystemType = this.hasLinks ? this.settings.presentation.layout : 'orbital';
                /* set the blur for the images */
                this.personas.enableBlur(this.settings.presentation.imageBlur);
            }
        }
    }

    public updateDataView(dv:DataView, append?:boolean) {

        // don't modify the source dataview, use a copy instead.
        const dataView = $.extend(true, {}, dv);

        /* if the new data is the result of `loadMoreData` merge it with the old data before updating */
        // Sandbox mode vs non-sandbox mode handles merge data differently.
        const lastMergeIndex = (<DataViewCategoricalSegment>dataView.categorical).lastMergeIndex;
        let isDataAppendedToDataview = false;

        const currentDataViewSize = dataView.categorical.categories[0].values.length;
        let loadedPreviously = false;
        if (lastMergeIndex !== undefined) {
            loadedPreviously = !!this.dataView;
        } else {
            // assume that if the dataview length <= the document request size, then its new data.
            if (currentDataViewSize > DOCUMENT_REQUEST_COUNT) {
                loadedPreviously = true;
                isDataAppendedToDataview = true;
            }
        }

        // run this only if new data is being appended to the dataview (non-sandbox mode).
        if (!isDataAppendedToDataview && this.dataView && loadedPreviously) {
            const mergedRows = this.dataView.table.rows;
            mergedRows.push.apply(mergedRows, dataView.table.rows);
            dataView.table.rows = mergedRows;

            const mergedIdentities = this.dataView.table.identity;
            mergedIdentities.push.apply(mergedIdentities, dataView.table.identity);
            dataView.table.identity = mergedIdentities;

            const highlights = (dataView.categorical &&
            dataView.categorical.values &&
            dataView.categorical.values.length &&
            dataView.categorical.values[0].highlights);
            if (highlights) {
                const oldHighlights = (this.dataView.categorical &&
                this.dataView.categorical.values &&
                this.dataView.categorical.values.length &&
                this.dataView.categorical.values[0].highlights);

                if (oldHighlights) {
                    oldHighlights.push.apply(oldHighlights, highlights);
                    dataView.categorical.values[0].highlights = oldHighlights;
                }
            }
        }

        /* save the data view */
        this.dataView = dataView;
        this.lastDataviewLength = currentDataViewSize;
        /* if more data should be loaded, load the data before processing it */
        this.hasMoreData = !!dataView.metadata.segment;
        /* if there's more data to load and the configured number of rows hasn't been reached, load more data */
        if (dataView.table.rows.length < this.settings.dataLoading.maxDataRows && this.hasMoreData) {
            this.host.loadMoreData();
            return;
        }

        /* convert the data */
        const data:any = this.converter(dataView);

        if (data) {
            this.element.show();
            let serializedData:string = JSON.stringify(data);
            if (!this.serializedData || !_.isEqual(this.serializedData, serializedData)) {
                if (!this.personas) {
                    const personasOptions:IPersonasOptions = {
                        autoGenerateIconMap: true,
                        Persona: {
                            layout: {
                                systemtype: this.hasLinks ? this.settings.presentation.layout as string : 'orbital',
                            },
                            config: {
                                transitionsDuration: 300,
                                moveEnabled: false,
                                mergeEnabled: false,
                                autoGenerateFallbackColors: false,
                                fallbackBackgroundColor: '#777777',
                                registerWindowResize: false,
                            },
                        },
                        hooks: {
                            onSelectPersona: this._handleOnSelectPersona.bind(this)
                        }
                    };

                    this.personas = new Personas(this.$personas[0], personasOptions);
                    this.personas.enableBlur(this.settings.presentation.imageBlur);
                    this.personas.mViewport.mMinScale = 0.1;
                }
                this.serializedData = serializedData;
                this.data = data;
                this.personas.loadData(this.data, append);

                this.otherPersona = this.personas.mOtherPersona;

                if (!this.inSandbox) {
                    (<JQuery>(<any>this.$personas).find('[mask^="url("]', '[MASK^="url("]')).each((index, element)=> {
                        const currentUrl = $(element).attr('mask');
                        const maskmatch = /url\(['"]?(#[a-zA-Z0-9]+)['"]?\)/ig.exec(currentUrl);
                        if (maskmatch && maskmatch.length > 1) {
                            $(element).attr('mask', 'url("' + element.ownerDocument.URL + maskmatch[1] + '")')
                        }
                    });
                    (<JQuery>(<any>this.$personas).find('[filter^="url("]', '[FILTER^="url("]')).each((index, element)=> {
                        const currentUrl = $(element).attr('filter');
                        const filtermatch = /url\(['"]?(#[a-zA-Z0-9]+)['"]?\)/ig.exec(currentUrl);
                        const $element = $(element);
                        if (filtermatch && filtermatch.length > 1) {
                            $element.attr('filter', 'url("' + element.ownerDocument.URL + filtermatch[1] + '")')
                        }
                    });
                    (<JQuery>(<any>this.$personas).find('[fill^="url("]', '[FILL^="url("]')).each((index, element)=> {
                        const currentUrl = $(element).attr('fill');
                        const fillmatch = /url\(['"]?(#[a-zA-Z0-9]+)['"]?\)/ig.exec(currentUrl);
                        if (fillmatch && fillmatch.length > 1) {
                            $(element).attr('fill', 'url("' + element.ownerDocument.URL + fillmatch[1] + '")')
                        }
                    });
                }
            }

            if (this.ignoreSelectionNextUpdate) {
                this.ignoreSelectionNextUpdate = false;
            } else {
                if (this.subSelectionData) {
                    /* convert the data to the internal format */
                    const selectionData = {};
                    for (let i = 0, n = this.subSelectionData.length; i < n; ++i) {
                        const personaData = this.subSelectionData[i];
                        selectionData[personaData.personaId] = {
                            computePercentages: true,
                            bars: [{
                                color: personaData.color,
                                count: personaData.count,
                            }],
                        };
                    }
                    this.personas.subSelectPersonasMultiGauge(selectionData, false);
                    if (!this.inSandbox) {
                        (<JQuery>(<any>this.$personas).find('[filter^="url("]', '[FILTER^="url("]')).each((index, element)=> {
                            const currentUrl = $(element).attr('filter');
                            const filtermatch = /url\(['"]?(#[a-zA-Z0-9]+)['"]?\)/ig.exec(currentUrl);
                            const $element = $(element);
                            if (filtermatch && filtermatch.length > 1) {
                                $element.attr('filter', 'url("' + element.ownerDocument.URL + filtermatch[1] + '")')
                            }
                        });
                    }
                } else {
                    this.personas.subSelectPersonasMultiGauge(null, false);
                }
            }
        } else if (this.personas) {
            this.element.hide();
            this.personas.layoutSystem.invalidate();
            this.personas.layoutSystem.removeAllObjects();
            this.serializedData = null;
            this.data = null;
        }
    }

    public converter(dataView:DataView):IPersonasData | IPersonasSubSelection[] {
        const metadata = dataView.metadata;
        const referencesDv = dataView.table;
        const highlights = (dataView.categorical &&
        dataView.categorical.values &&
        dataView.categorical.values.length &&
        dataView.categorical.values[0].highlights);

        if (referencesDv &&
            referencesDv &&
            referencesDv.columns.length > 0 &&
            referencesDv.rows.length > 0) {

            // get personas size
            const personaIdColIndex = _.findIndex(metadata.columns, c => {
                return c.roles['PersonaGroup'];
            });
            const referenceNameColIndex = _.findIndex(metadata.columns, c => {
                return c.roles['ReferenceName'];
            });
            const referenceCountColIndex = _.findIndex(metadata.columns, c => {
                return c.roles['ReferenceCount'];
            });
            const referenceDocumentsColIndex = _.findIndex(metadata.columns, c => {
                return c.roles['ReferenceDocumentID'];
            });
            const referenceImageUrlColIndices = metadata.columns.reduce((memo, column, index) => {
                if (column.roles['ReferenceImageUrl']) {
                    memo.push(index);
                }
                return memo;
            }, []);
            const referenceLinkToColIndex = _.findIndex(metadata.columns, c => {
                return c.roles['ReferenceLinkTo'];
            });
            const referenceLinkWeightColIndex = _.findIndex(metadata.columns, c => {
                return c.roles['ReferenceLinkWeight'];
            });
            if (personaIdColIndex < 0 || referenceCountColIndex < 0 || referenceNameColIndex < 0) {
                return;
            }

            this.hasLinks = (referenceLinkToColIndex >= 0);
            this.hasDocumentList = (referenceDocumentsColIndex >= 0);

            if (highlights && this.personas) {
                const subSelectionData = new Array<IPersonasSubSelection>();
                const rows = referencesDv.rows;
                const documents = [];
                highlights.forEach((highlight: number, index: number) => {
                    if (highlight !== null) {
                        const row = rows[index];
                        const rawPersonaId = row[personaIdColIndex];
                        let personaId = (rawPersonaId !== undefined && rawPersonaId !== null) ? rawPersonaId.toString() : null;

                        if (personaId) {
                            /* check if the persona is in the "Other" persona */
                            if (this.otherPersona &&
                                this.data.aggregates.other &&
                                this.data.aggregates.other.metadata &&
                                this.data.aggregates.other.metadata.personaIds.indexOf(personaId) >= 0) {
                                personaId = Personas.OTHER_PERSONA_DEFAULT_ID;
                            }
                            let personaIndex = _.findIndex(subSelectionData, data => data.personaId === personaId);
                            if (personaIndex < 0) {
                                personaIndex = subSelectionData.length;
                                subSelectionData.push({
                                    personaId: personaId,
                                    count: 0,
                                    color: '#00bad3'
                                });
                            }

                            if (this.hasDocumentList) {
                                const rawDocumentId = row[referenceDocumentsColIndex];
                                const documentId:string = (rawDocumentId !== undefined &&
                                rawDocumentId !== null) ?
                                    rawDocumentId.toString() : null;
                                if (documentId && documents.indexOf(documentId) < 0) {
                                    subSelectionData[personaIndex].count += highlight;
                                    documents.push(documentId);
                                }
                            } else {
                                subSelectionData[personaIndex].count = highlight;
                            }
                        }
                    }
                });

                this.subSelectionData = subSelectionData;
            } else {
                this.subSelectionData = null;
            }

            let links:any[] = [];
            const personaCounts = referencesDv.rows.reduce((memo, row) => {
                const rawPersonaId = row[personaIdColIndex];
                const personaId = (rawPersonaId !== undefined && rawPersonaId !== null) ? rawPersonaId.toString() : null;

                if (personaId) {
                    const rawCount: string = row[referenceCountColIndex].toString();
                    let count: number = parseInt(rawCount, 10);
                    count = isNaN(count) ? 0 : count;

                    const idColumnMetadata = (metadata.columns[personaIdColIndex] as any);
                    const memoIndex = _.findIndex(memo.counts, m => m.id === personaId);
                    if (memoIndex < 0) {
                        memo.counts.push({
                            id: personaId,
                            count: count,
                            selection: SQExprBuilder.equal(idColumnMetadata.expr, SQExprBuilder.typedConstant(personaId, idColumnMetadata.type))
                        });
                    } else if (this.hasDocumentList) {
                        memo.counts[memoIndex].count += count;
                    }

                    memo.totalCount += count;

                    /* hijack the loop here to generate the links if needed, that way we have all links! */
                    if (referenceLinkToColIndex >= 0) {
                        const rawTargetId = row[referenceLinkToColIndex];
                        const targetId = (rawTargetId !== undefined && rawTargetId !== null) ? rawTargetId.toString() : null;
                        if (targetId && targetId !== personaId && !links.some(link => (
                            (link.source === personaId || link.target === personaId) &&
                            (link.source === targetId || link.target === targetId)))) {
                            const linkInfo:any = {
                                source: personaId,
                                target: targetId
                            };

                            if (referenceLinkWeightColIndex >= 0) {
                                const rawLinkWeight: string = row[referenceLinkWeightColIndex].toString();
                                let linkWeight: number = parseFloat(rawLinkWeight);
                                if (!isNaN(linkWeight)) {
                                    linkInfo.weight = linkWeight;
                                }
                            }

                            links.push(linkInfo);
                        }
                    }
                }

                return memo;
            }, {counts: [], totalCount: 0});


            // retrieve the top X personas, ordered by count.
            const sortedPersonas = personaCounts.counts.sort((a, b) => b.count - a.count);
            let entityRefs:any[] = [];

            const personaInfos:any[] = [];
            let otherPersonaInfo:any = {
                'count': 0,
                'metadata': {
                    'selection': null,
                    'personaIds': [],
                    'documents': []
                }
            };

            const viz:any = powerbi.visuals;
            const labelFormat = metadata.columns[referenceNameColIndex].format;
            const countFormat = metadata.columns[referenceCountColIndex].format;
            const defaultFormatter = labelFormat ? viz.valueFormatter.create({format: labelFormat}) : null;
            const countFormatter = countFormat ? viz.valueFormatter.create({format: countFormat}) : null;
            const smallFormatter = viz.valueFormatter.create({format: 'O', value: 0});
            const bigFormatter = viz.valueFormatter.create({format: 'O', value: 1e6});

            sortedPersonas.forEach((personaValue, i) => {
                const personaId = personaValue.id;

                /* information fields to extract */
                const documents:Array<string> = [];
                let properties:Array<any> = [];

                /* iterate through all the rows */
                referencesDv.rows.forEach((row, rowIndex) => {
                    const rawOtherPersonaId = row[personaIdColIndex];
                    const otherPersonaId = (rawOtherPersonaId !== undefined &&
                    rawOtherPersonaId !== null) ?
                        rawOtherPersonaId.toString() : null;
                    /* only process rows that belong to this persona */
                    if (otherPersonaId === personaId) {
                        /* extract the entity ref info */
                        const rawRefId = row[referenceNameColIndex];
                        const refId:string = (rawRefId !== undefined && rawRefId !== null) ? rawRefId.toString() : null;
                        if (refId) {
                            if (!entityRefs.some(entityRef => entityRef.id === refId)) {
                                let name = refId;
                                if (defaultFormatter) {
                                    name = defaultFormatter.format(rawRefId);
                                } else if (rawRefId instanceof Date) {
                                    name = rawRefId.toDateString();
                                } else if (typeof(rawRefId) === 'number') {
                                    if (rawRefId < 1e6 && rawRefId > -1e6) {
                                        name = smallFormatter.format(rawRefId);
                                    } else {
                                        name = bigFormatter.format(rawRefId);
                                    }
                                } else {
                                    name = this._decodeText(name);
                                }
                                entityRefs.push({
                                    'id': refId,
                                    'name': name,
                                    'imageUrl': referenceImageUrlColIndices.reduce((memo, imageIndex) => {
                                        const pattern = new RegExp('^(https?)://[^\s/$.?#].[^\s]*', 'i');
                                        const rawImageURL = row[imageIndex];
                                        const imageURL = (rawImageURL !== undefined &&
                                        rawImageURL !== null) ?
                                            rawImageURL.toString() : null;
                                        if (imageURL && pattern.test(imageURL)) {
                                            memo.push(imageURL);
                                        }
                                        return memo;
                                    }, [])
                                });
                            }

                            /* extract the property info */
                            let propertyIndex:number = _.findIndex(properties, p => p.entityRefId === refId);
                            if (propertyIndex < 0) {
                                propertyIndex = properties.length;
                                properties.push({
                                    'entityRefId': refId,
                                    'count': 0,
                                    'formattedCount': null,
                                    'isPrimary': false
                                });
                            }

                            /* if the data contains document info, process it */
                            if (this.hasDocumentList) {
                                const rawDocumentId = row[referenceDocumentsColIndex];
                                const documentId:string = (rawDocumentId !== undefined &&
                                rawDocumentId !== null) ?
                                    rawDocumentId.toString() : null;
                                if (documentId) {
                                    const documentIndex:number = _.findIndex(documents, d => d === documentId);
                                    if (documentIndex < 0) {
                                        documents.push(documentId);
                                        /* update the property count */
                                        const rawCount: string = row[referenceCountColIndex].toString();
                                        let count: number = parseInt(rawCount, 10);
                                        count = isNaN(count) ? 0 : count;
                                        properties[propertyIndex].count += count;
                                    }
                                }
                            } else {
                                const rawCount: string = row[referenceCountColIndex].toString();
                                let count: number = parseInt(rawCount, 10);
                                count = isNaN(count) ? 0 : count;
                                properties[propertyIndex].count = count;
                            }

                            if (countFormatter) {
                                properties[propertyIndex].formattedCount = countFormatter.format(properties[propertyIndex].count);
                            }
                        }
                    }
                });

                /* if this persona's index is within the limits of personas to load, process its info */
                if (i < this.maxPersonas) {
                    /* sort the properties */
                    properties = properties.sort((pa, pb) => pb.count - pa.count);
                    /* make sure we don't have more properties than the max allowed */
                    properties = properties.slice(0, this.maxProperties);
                    /* set the first property (biggest one) as the primary property */
                    if (properties.length) {
                        properties[0].isPrimary = true;
                    }

                    /* create the persona info */
                    const info:any = {
                        'id': personaId,
                        'properties': properties,
                        'documents': documents,
                        'imageUrl': null,
                        'totalCount': this.hasDocumentList ? documents.length : personaValue.count,
                        'selection': [powerbi.data.createDataViewScopeIdentity(personaValue.selection)]
                    };

                    /* save the persona info */
                    /* save only if properties length > 0*/
                    if (info.properties.length > 0) {
                        personaInfos.push(info);
                    }

                } else if (this.showOther) { /* else if we the "other" persona is enabled, add the info to it */
                    otherPersonaInfo.count += personaValue.count;
                    otherPersonaInfo.metadata.documents.push.apply(otherPersonaInfo.metadata.documents, documents);
                    otherPersonaInfo.metadata.personaIds.push(personaId);
                    if (personaValue.selection) {
                        if (otherPersonaInfo.metadata.selection) {
                            otherPersonaInfo.metadata.selection = SQExprBuilder.or(otherPersonaInfo.metadata.selection, personaValue.selection)
                        } else {
                            otherPersonaInfo.metadata.selection = personaValue.selection;
                        }
                    }
                }
            });

            if (otherPersonaInfo.metadata.selection) {
                otherPersonaInfo.metadata.selection = [powerbi.data.createDataViewScopeIdentity(otherPersonaInfo.metadata.selection)];
            }

            const returnValue:any = {
                entityRefs: ClusterMap.convertToLookup.call(this, entityRefs, (d) => d),
                aggregates: {
                    personas: ClusterMap.convertToLookup.call(this, personaInfos, (d) => d),
                    links: links,
                    other: otherPersonaInfo
                }
            };

            return returnValue as any;
        }
    }

    /**
     * Enumerates the instances for the objects that appear in the power bi panel
     */
    public enumerateObjectInstances(options:EnumerateVisualObjectInstancesOptions):VisualObjectInstance[] {
        let instances:VisualObjectInstance[] = [{
            selector: null,
            objectName: options.objectName,
            properties: {}
        }];
        $.extend(true, instances[0].properties, this.settings[options.objectName]);
        return instances;
    }

    private _decodeText(text:string):string {
        const txt = document.createElement('textarea');
        txt.innerHTML = text;
        return txt.value;
    }

    private _addSubselectionInfo(subSelection, personaId, count) {
        subSelection[personaId] = {
            computePercentages: true,
            bars: [{
                color: '#00bad3',
                count: count
            }]
        };
    }

    private _handleOnSelectPersona(selection) {
        this.ignoreSelectionNextUpdate = !!this.subSelectionData;

        if (selection.selected) {
            const selectionId = selection.id;
            let persona = this.personas.findPersona(selectionId);
            const subSelection:any = {};

            if (selectionId === Personas.OTHER_PERSONA_DEFAULT_ID) {
                if (this.otherPersona && this.data.aggregates.other) {
                    const selectArgs: any = {
                        data: this.data.aggregates.other.metadata.selection.map((identity: any) => ({ data: [identity] }))
                    };
                    this.host.onSelect(selectArgs);
                    persona = this.otherPersona;
                    this._addSubselectionInfo(subSelection, selectionId, persona.data.totalCount);
                }
            } else {
                const personaInfo = this.data.aggregates.personas[selectionId];
                if (personaInfo && personaInfo.selection) {
                    const selectArgs: any = {
                        data: personaInfo.selection.map((identity:any) => ({data: [identity]}))
                    };
                    this.host.onSelect(selectArgs);

                    this._addSubselectionInfo(subSelection, selectionId, persona.data.totalCount);

                    if (this.hasDocumentList) {
                        const selectionDocuments = persona.data.documents;
                        this.personas.layoutSystem.forEach(object => {
                            if (object.personaId && object !== persona) {
                                const otherDocuments = object.data.documents;
                                let sharedDocuments = selectionDocuments.reduce((count, doc) => {
                                    if (otherDocuments.indexOf(doc) >= 0) {
                                        count += 1;
                                    }
                                    return count;
                                }, 0);

                                if (sharedDocuments) {
                                    this._addSubselectionInfo(subSelection, object.personaId, sharedDocuments);
                                }
                            }
                        });
                    } else if (this.hasLinks) {
                        const links = this.personas.mSortedData.original.aggregates.links;
                        links.forEach(link => {
                            if (link.source === selectionId) {
                                this._addSubselectionInfo(subSelection, link.target, 0);
                            } else if (link.target === selectionId) {
                                this._addSubselectionInfo(subSelection, link.source, 0);
                            }
                        });
                    }
                }
            }

            this.personas.subSelectPersonasMultiGauge(subSelection, false);
            if (!this.inSandbox) {
                (<JQuery>(<any>this.$personas).find('[filter^="url("]', '[FILTER^="url("]')).each((index, element)=> {
                    const currentUrl = $(element).attr('filter');
                    const filtermatch = /url\(['"]?(#[a-zA-Z0-9]+)['"]?\)/ig.exec(currentUrl);
                    const $element = $(element);
                    if (filtermatch && filtermatch.length > 1) {
                        $element.attr('filter', 'url("' + element.ownerDocument.URL + filtermatch[1] + '")')
                    }
                });
            }
            persona.isSelected = true;
        } else {
            this.selectionManager.clear();
        }
    }
}
