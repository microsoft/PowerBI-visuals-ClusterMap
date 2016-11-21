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
const DOCUMENT_REQUEST_COUNT = 5000;

export default class ClusterMap implements IVisual {

    private static LOAD_MORE_PERSONAS_STEP = 5;
    private static MAX_PERSONAS_DEFAULT = 20;
    private static MAX_PROPERTIES_DEFAULT = 5;
    private static GAUGE_DEFAULT_COLOR = '#41455e';
    private static SELECTED_GAUGE_DEFAULT_COLOR = '#00bad3';

    /**
     * Default formatting settings
     */
    private static DEFAULT_SETTINGS = {
        presentation: {
            layout: 'cola',
            imageBlur: false,
            initialCount: ClusterMap.MAX_PERSONAS_DEFAULT,
            loadMoreCount: ClusterMap.LOAD_MORE_PERSONAS_STEP,
            normalColor: { solid: { color: ClusterMap.GAUGE_DEFAULT_COLOR } },
            selectedColor: { solid: { color: ClusterMap.SELECTED_GAUGE_DEFAULT_COLOR } }
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
    private hasBuckets:boolean;
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
                    const oldGaugeColor = this.settings.presentation.normalColor.solid.color;
                    $.extend(true, this.settings, newObjects);
                    this.settings.presentation.initialCount = Math.max(this.settings.presentation.initialCount, 1);
                    this.settings.dataLoading.maxDataRows = Math.max(this.settings.dataLoading.maxDataRows, 1);

                    const maxPersonasChanged = (this.maxPersonas !== this.settings.presentation.initialCount);
                    this.maxPersonas = this.settings.presentation.initialCount;

                    const normalColorChanged = (oldGaugeColor !== this.settings.presentation.normalColor.solid.color);

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

                        /* the update was triggered by a change in the settings, retrun if the max number of personas or the gauge color didn't change */
                        if (!maxPersonasChanged && !normalColorChanged) {
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
                                displayTotalCountLabel: false,
                                displayLabelsAtOneCount: false,
                                renderSubSelectionBackground: false
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
                    this.personas.subSelectPersonas(this.subSelectionData, false);
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
                    this.personas.subSelectPersonas(null, false);
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
            const referenceBucketColIndex = _.findIndex(metadata.columns, c => {
                return c.roles['ReferenceBucket'];
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
            this.hasBuckets = (referenceBucketColIndex >= 0);

            if (highlights && this.personas) {
                const subSelectionData: IPersonasSubSelection = {};
                const rows = referencesDv.rows;
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

                            if (!subSelectionData[personaId]) {
                                this._addSubselectionInfo(subSelectionData, personaId, [highlight]);
                            } else {
                                const oldData = subSelectionData[personaId];
                                const counts = oldData.bars.map(bar => bar.count);
                                counts.push(highlight);
                                this._addSubselectionInfo(subSelectionData, personaId, counts);
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
                    const memoIndex = _.findIndex(memo, m => m.id === personaId);
                    if (memoIndex < 0) {
                        memo.push({
                            id: personaId,
                            count: count,
                            selection: SQExprBuilder.equal(idColumnMetadata.expr, SQExprBuilder.typedConstant(personaId, idColumnMetadata.type))
                        });
                    } else {
                        memo[memoIndex].count += count;
                    }

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
            }, []);


            // retrieve the top X personas, ordered by count.
            const sortedPersonas = personaCounts.sort((a, b) => b.count - a.count);
            let entityRefs:any[] = [];

            const personaInfos:any[] = [];
            let otherPersonaInfo:any = {
                'count': 0,
                'metadata': {
                    'selection': null,
                    'personaIds': []
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
                        let refId:string = (rawRefId !== undefined && rawRefId !== null) ? rawRefId.toString() : null;
                        if (refId) {
                            if (this.hasBuckets) {
                                refId += '_' + row[referenceBucketColIndex];
                            }

                            if (!entityRefs.some(entityRef => entityRef.id === refId)) {
                                let name = rawRefId.toString();
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
                                    'isPrimary': false,
                                    'color': 'rgba(0,186,211,0)'
                                });
                            }

                            const rawCount: string = row[referenceCountColIndex].toString();
                            let count: number = parseInt(rawCount, 10);
                            count = isNaN(count) ? 0 : count;
                            properties[propertyIndex].count += count;

                            if (countFormatter) {
                                properties[propertyIndex].formattedCount = countFormatter.format(properties[propertyIndex].count);
                            }
                        }
                    }
                });

                /* if this persona's index is within the limits of personas to load, process its info */
                if (i < this.maxPersonas) {
                    /* sort the properties */
                    //properties = properties.sort((pa, pb) => pb.count - pa.count); // properties are already sorted due to uncertainty.
                    /* color the properties */
                    this._colorProperties(properties);
                    /* make sure we don't have more properties than the max allowed */
                    //properties = properties.slice(0, this.maxProperties);
                    /* set the first property (biggest one) as the primary property */
                    if (properties.length) {
                        properties[0].isPrimary = true;
                    }

                    /* create the persona info */
                    const info:any = {
                        'id': personaId,
                        'properties': properties,
                        'imageUrl': null,
                        'totalCount': personaValue.count,
                        'selection': [powerbi.data.createDataViewScopeIdentity(personaValue.selection)]
                    };

                    /* save the persona info */
                    /* save only if properties length > 0*/
                    if (info.properties.length > 0) {
                        personaInfos.push(info);
                    }

                } else if (this.showOther) { /* else if we the "other" persona is enabled, add the info to it */
                    otherPersonaInfo.count += personaValue.count;
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

    private _addSubselectionInfo(subSelection, personaId, counts) {
        const colorCount = counts.length <= 3 ? 3 : counts.length;
        const palette = this._colorInterpolation(this.settings.presentation.selectedColor.solid.color, colorCount, true);
        subSelection[personaId] = {
            computePercentages: true,
            bars: counts.map((count, i) => {
                const rgb = palette[i];
                return {
                    color: 'rgb(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ')',
                    count: count
                }
            })
        };
    }

    private _handleOnSelectPersona(selection) {
        this.ignoreSelectionNextUpdate = !!this.subSelectionData;
        const selectionId = selection.id;
        let persona = this.personas.findPersona(selectionId);

        if (selection.selected) {
            const subSelection:any = {};

            if (selectionId === Personas.OTHER_PERSONA_DEFAULT_ID) {
                if (this.otherPersona && this.data.aggregates.other) {
                    const selectArgs: any = {
                        data: this.data.aggregates.other.metadata.selection.map((identity: any) => ({ data: [identity] }))
                    };
                    this.host.onSelect(selectArgs);
                    persona = this.otherPersona;
                    this._addSubselectionInfo(subSelection, selectionId, [persona.data.totalCount]);
                }
            } else {
                const personaInfo = this.data.aggregates.personas[selectionId];
                if (personaInfo && personaInfo.selection) {
                    const selectArgs: any = {
                        data: personaInfo.selection.map((identity:any) => ({data: [identity]}))
                    };
                    this.host.onSelect(selectArgs);

                    this._addSubselectionInfo(subSelection, selectionId, persona.data.properties.map(property => property.count));

                    if (this.hasLinks) {
                        const links = this.personas.mSortedData.original.aggregates.links;
                        links.forEach(link => {
                            if (link.source === selectionId) {
                                this._addSubselectionInfo(subSelection, link.target, [0]);
                            } else if (link.target === selectionId) {
                                this._addSubselectionInfo(subSelection, link.source, [0]);
                            }
                        });
                    }
                }
            }

            this.personas.subSelectPersonas(subSelection, false);
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

    private _RGBToHSL(rgb) {
        const r = rgb.r / 255;
        const g = rgb.g / 255;
        const b = rgb.b / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);

        let h;
        let s;
        let l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        }
        else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return {
            h: h,
            s: s,
            l: l
        };

    }

    private _HSLToRGB(hsl){
        const h = hsl.h;
        const s = hsl.s;
        const l = hsl.l;
        let r, g, b;

        if (s == 0) {
            r = g = b = l; // achromatic
        } else {
            var hue2rgb = function hue2rgb(p, q, t) {
                if(t < 0) t += 1;
                if(t > 1) t -= 1;
                if(t < 1/6) return p + (q - p) * 6 * t;
                if(t < 1/2) return q;
                if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    private _colorInterpolation(color, iterations, isSelection) {
        /* convert the color to rgb */
        const rgb = {
            r: parseInt(color.substr(1, 2), 16),
            g: parseInt(color.substr(3, 2), 16),
            b: parseInt(color.substr(5, 2), 16)
        };

        /* and then to hsl */
        const hsl = this._RGBToHSL(rgb);

        /* initial and final S and L values */
        let iS, fS, iL, fL;
        if (isSelection) {
            iS = hsl.s;
            fS = 1;

            iL = Math.min(hsl.l, 0.5);
            fL = 0.9;
        } else {
            iS = 0.25;
            fS = 0.25;

            iL = 0.3;
            fL = 0.9;
        }

        const stepS = (fS - iS) / (iterations - 1 || 1);
        const stepL = (fL - iL) / (iterations - 1 || 1);

        /* compute the color palette */
        const palette = [];
        for (let i = 0; i < iterations; ++i) {
            palette.push(this._HSLToRGB({
                h: hsl.h,
                s: iS + (stepS * i),
                l: iL + (stepL * i)
            }));
        }

        return palette;
    }

    private _colorProperties(properties) {
        if (this.hasBuckets) {
            const colorCount = properties.length <= 3 ? 3 : properties.length;
            const palette = this._colorInterpolation(this.settings.presentation.normalColor.solid.color, colorCount, false);

            for (let i = 0, n = properties.length; i < n; ++i) {
                const rgb = palette[i];
                properties[i].color = 'rgb(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ')';
            }
        }
    }
}
