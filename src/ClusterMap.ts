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
import VisualConstructorOptions = powerbi.extensibility.v110.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.VisualUpdateOptions;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import IVisualHost = powerbi.extensibility.v110.IVisualHost;
import IVisualHostServices = powerbi.IVisualHostServices;
import DataView = powerbi.DataView;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import SQExprBuilder = powerbi.data.SQExprBuilder;

import * as $ from 'jquery';
import * as _ from 'lodash';

import { Personas, PersonaEvents, BreadcrumbEvents, LayoutEvents } from '../lib/@uncharted/personas/src/Personas.js';

export default class ClusterMap implements IVisual {

    /**
     * Default number of personas to load when paginating.
     *
     * @type {number}
     * @private
     */
    private static LOAD_MORE_PERSONAS_STEP: number = 5;

    /**
     * Default maximum number of personas to load.
     *
     * @type {number}
     * @private
     */
    private static MAX_PERSONAS_DEFAULT: number = 20;

    /**
     * Default color for the persona gauge bars.
     *
     * @type {string}
     * @private
     */
    private static GAUGE_DEFAULT_COLOR: string = '#41455e';

    /**
     * Default color for the selected state of the persona gauge bars.
     *
     * @type {string}
     * @private
     */
    private static SELECTED_GAUGE_DEFAULT_COLOR: string = '#00bad3';

    /**
     * Default Cluster Map Settings.
     *
     * @type {IClusterMapSettings}
     * @private
     */
    private static DEFAULT_SETTINGS: any = {
        presentation: {
            layout: 'cola',
            //imageBlur: false,
            initialCount: ClusterMap.MAX_PERSONAS_DEFAULT,
            loadMoreCount: ClusterMap.LOAD_MORE_PERSONAS_STEP,
            normalColor: { solid: { color: ClusterMap.GAUGE_DEFAULT_COLOR } },
            selectedColor: { solid: { color: ClusterMap.SELECTED_GAUGE_DEFAULT_COLOR } }
        },
        dataLoading: {
            maxDataRows: 20000
        },
    };

    private settings: any = $.extend(true, {}, ClusterMap.DEFAULT_SETTINGS);

    private element: any;
    private host: IVisualHost;
    private hostServices: IVisualHostServices;
    private selectionManager: ISelectionManager;

    private personas: any = null;
    private data: any = null;
    private dataLayerStack: Array<any> = [];
    private buckets: Array<string> = [];

    /**
     * The maximum number of personas to load.
     *
     * @type {number}
     * @private
     */
    private maxPersonas: number = this.settings.presentation.initialCount;

    /**
     * Whether this visual has links between personas.
     *
     * @type {boolean}
     * @private
     */
    private hasLinks: boolean;

    /**
     * The data view as received by this visual in the `update` function.
     *
     * @type {DataView}
     * @private
     */
    private dataView: DataView;

    /**
     * Whether there is more data available to be loaded by this visual.
     *
     * @type {boolean}
     * @private
     */
    private hasMoreData: boolean = false;

    /**
     * A JSON serialized version of the data used by the Personas component.
     *
     * @type {any}
     * @private
     */
    private serializedData: any = null;

    /**
     * Whether this visual has buckets to split the data.
     *
     * @type {boolean}
     * @private
     */
    private hasBuckets: boolean;

    /**
     * Sub-selection data, if any; otherwise, null.
     *
     * @type {any}
     * @private
     */
    private subSelectionData: any = null;

    /**
     * Flag used to ignore the next call to the `update` function, triggered when performing sub-selection.
     *
     * @type {boolean}
     * @private
     */
    private ignoreSelectionNextUpdate: boolean = false;

    /**
     * @constructor
     * @param {VisualConstructorOptions} options - The PowerBI options for this visual's initialization.
     */
    constructor(options: VisualConstructorOptions) {
        this.element = options.element;

        /* example to get the host (services) and selection manager using the new API */
        this.host = options.host;
        this.selectionManager = options.host.createSelectionManager();
        this.hostServices = (this.selectionManager as any).hostServices; // `hostServices` is now what we used to call `host`
    }

    /**
     * ClusterMap's visualization destroy method. Called by PowerBI.
     *
     * @method destroy
     */
    public destroy(): void {
        if (this.personas) {
            this.personas.release();
        }
    }

    /**
     * Update function called by PowerBI when the visual or its data need to be updated.
     *
     * @method update
     * @param {VisualUpdateOptions} options - Update options object as provided by PowerBI.
     */
    public update(options: VisualUpdateOptions) {
        const viewport: any = options.viewport;
        if (this.personas) {
            if (options.type & powerbi.VisualUpdateType.Resize) {
                this.personas.resize(viewport.width, viewport.height);

                if (viewport.hasOwnProperty('scale')) {
                    this.personas.deviceScale = viewport.scale * 2;
                }
            } else if (options.type & powerbi.VisualUpdateType.ResizeEnd) {
                this.personas.autoZoom();
            }
        }

        if (!(options.type & powerbi.VisualUpdateType.Data)) {
            return;
        }

        if (options.dataViews && options.dataViews.length > 0 && options.dataViews[0].table) {
            const dataView = options.dataViews[0];
            const newObjects: any = options.dataViews[0] && options.dataViews[0].metadata && options.dataViews[0].metadata.objects;
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
                    this.personas.layoutType = this.hasLinks ? this.settings.presentation.layout : 'orbital';
                    /* set the blur for the images */
                    //this.personas.enableBlur(this.settings.presentation.imageBlur);

                    /* the update was triggered by a change in the settings, retrun if the max number of personas or the gauge color didn't change */
                    if (!maxPersonasChanged && !normalColorChanged) {
                        return;
                    }
                }
            }

            const append = (options.operationKind === powerbi.VisualDataChangeOperationKind.Append);
            this.updateDataView(dataView, append);
            this.initializePersonas(viewport);
            this.personas.layoutType = this.hasLinks ? this.settings.presentation.layout : 'orbital';
        }
    }

    /**
     * Updates the data view that represents the data for this visual.
     *
     * @method updateDataView
     * @param {DataView} dv - The new DataView to use for the update.
     * @param {boolean} append - Should the data in the data view be appended to any previously loaded data.
     */
    public updateDataView(dv: DataView, append?: boolean): void {

        // don't modify the source dataview, use a copy instead.
        const dataView = $.extend(true, {}, dv);

        // run this only if new data is being appended to the dataview (non-sandbox mode).
        if (this.dataView && append) {
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
        /* if more data should be loaded, load the data before processing it */
        this.hasMoreData = !!dataView.metadata.segment;
        /* if there's more data to load and the configured number of rows hasn't been reached, load more data */
        if (dataView.table.rows.length < this.settings.dataLoading.maxDataRows && this.hasMoreData) {
            this.hostServices.loadMoreData();
            return;
        }

        /* convert the data */
        const data: any = this.convert(dataView);

        if (data) {
            this.element.style.visibility = 'visible';
            let serializedData: string = JSON.stringify(data);
            if (!this.serializedData || !_.isEqual(this.serializedData, serializedData)) {
                this.serializedData = serializedData;
                this.data = data;
                if (this.personas) {
                    this.dataLayerStack.length = 0
                    this.dataLayerStack.push(this.data.rootPersonas);
                    this.personas.loadData(this.dataLayerStack[this.dataLayerStack.length - 1], false);

                    //this.otherPersona = this.personas.mOtherPersona;
                }
            }

            if (this.ignoreSelectionNextUpdate) {
                this.ignoreSelectionNextUpdate = false;
            } else if (this.personas) {
                if (this.subSelectionData) {
                    this.personas.personas.forEach(wrapper => {
                        wrapper.object.selected = false;
                        wrapper.object.setFocus(Boolean(this.subSelectionData.personas.find(p => p.id === wrapper.id)), true);
                    });
                    this.personas.highlight(this.subSelectionData, true);
                } else {
                    this.personas.personas.forEach(wrapper => {
                        wrapper.object.selected = false;
                        wrapper.object.setFocus(true, true);
                    });
                    this.personas.unhighlight(true);
                }
            }

        } else if (this.personas) {
            this.element.style.visibility = 'hidden';
            this.serializedData = null;
            this.data = null;
        }
    }

    public convert(dataView: DataView): any {
        const maxPersonas = this.maxPersonas;
        const metadata = dataView.metadata;
        const table = dataView.table;
        const highlights = (dataView.categorical &&
                            dataView.categorical.values &&
                            dataView.categorical.values.length &&
                            dataView.categorical.values[0].highlights);

        if (table && table.columns.length > 0 && table.rows.length > 0) {
            const columnIndices = {
                "ID": [],
                "Name": [],
                "Count": [],
                "Bucket": [],
                "ImageUrl": [],
                "BackgroundColor": [],
                "LinkTo": [],
                "LinkWeight": [],
                "ParentID": [],
            };

            const columnNames = Object.keys(columnIndices);
            metadata.columns.forEach((column, i) => {
                columnNames.forEach(name => {
                    if (column.roles[name]) {
                        columnIndices[name].push(i);
                    }
                });
            });

            if (!columnIndices.ID.length || !columnIndices.Name.length || !columnIndices.Count.length) {
                return null;
            }

            this.hasLinks = Boolean(columnIndices.LinkTo.length);
            this.hasBuckets = Boolean(columnIndices.Bucket.length);

            const viz: any = powerbi.visuals;
            const labelFormat = metadata.columns[columnIndices.Name[0]].format;
            const countFormat = metadata.columns[columnIndices.Count[0]].format;
            const defaultFormatter = labelFormat ? viz.valueFormatter.create({format: labelFormat}) : null;
            const countFormatter = countFormat ? viz.valueFormatter.create({format: countFormat}) : null;
            const smallFormatter = viz.valueFormatter.create({format: 'O', value: 0});
            const bigFormatter = viz.valueFormatter.create({format: 'O', value: 1e6});

            const idColumnMetadata = metadata.columns[columnIndices.ID[0]] as any;
            const personaMap = {};
            const countedEntries = {};

            this.buckets.length = 0;

            table.rows.forEach(row => {
                let ID: string;
                let rawName: any;
                let count: number;

                try {
                    ID = row[columnIndices.ID[0]].toString();
                    rawName = row[columnIndices.Name[0]];
                    count = row[columnIndices.Count[0]] as number;
                } catch(e) {
                    return;
                }

                const rawParent: any = columnIndices.ParentID.length ? row[columnIndices.ParentID[0]] : null;
                const parent: string = rawParent !== null && rawParent !== undefined ? rawParent.toString() : null;

                let name: string = rawName.toString();
                if (defaultFormatter) {
                    name = defaultFormatter.format(rawName);
                } else if (rawName instanceof Date) {
                    name = rawName.toDateString();
                } else if (typeof(rawName) === 'number') {
                    if (rawName < 1e6 && rawName > -1e6) {
                        name = smallFormatter.format(rawName);
                    } else {
                        name = bigFormatter.format(rawName);
                    }
                } else {
                    name = this._decodeText(name);
                }

                const bucketName = this.hasBuckets ? String(row[columnIndices.Bucket[0]]) : '';
                if (this.buckets.indexOf(bucketName) === -1) {
                    this.buckets.push(bucketName);
                }

                const countKey = ID + name + bucketName;

                let persona = null;
                if (personaMap[ID]) {
                    persona = personaMap[ID];
                    if (!countedEntries.hasOwnProperty(countKey)) {
                        persona.count += count;
                    }
                } else {
                    persona = {
                        id: ID,
                        label: name,
                        count: parseFloat(count.toString()),
                        properties: [],
                        images: [],
                        color: this.settings.presentation.normalColor.solid.color,
                        select: SQExprBuilder.equal(idColumnMetadata.expr, SQExprBuilder.typedConstant(row[columnIndices.ID[0]], idColumnMetadata.type)),
                        links: null,
                        parent: parent,
                    };
                    personaMap[ID] = persona;
                }

                /* build the property key */
                if (!countedEntries.hasOwnProperty(countKey)) {
                    if (this.hasBuckets || !persona.properties.length) {
                        const propertyID = this.hasBuckets ? bucketName : 'ONE';
                        const propertyIndex = persona.properties.findIndex(p => p.id === propertyID);
                        let property = null;

                        if (propertyIndex === -1) {
                            property = {
                                count: 0,
                                color: persona.color,
                                id: propertyID
                            };
                            persona.properties.push(property);
                        } else {
                            property = persona.properties[propertyIndex];
                        }

                        property.count += count;
                    } else {
                        persona.properties[0].count += count;
                    }
                    countedEntries[countKey] = count;
                }

                if (columnIndices.ImageUrl.length) {
                    columnIndices.ImageUrl.forEach(index => {
                        if (persona.images.indexOf(row[index]) < 0) {
                            persona.images.push(row[index]);
                        }
                    });
                }

                if (this.hasLinks) {
                    const linkID: string = row[columnIndices.LinkTo[0]].toString();
                    const linkStrength = columnIndices.LinkWeight.length ? row[columnIndices.LinkWeight[0]] : 0;

                    if (!persona.links) {
                        persona.links = [];
                    }

                    persona.links.push({
                        target: linkID,
                        weight: linkStrength,
                    });
                }
            });

            this.buckets.sort();

            const personaKeys = Object.keys(personaMap);

            /* find the min max -.- */
            let minSize = Number.MAX_SAFE_INTEGER;
            let maxSize = 0;

            personaKeys.sort((keyA, keyB) => personaMap[keyB].count - personaMap[keyA].count);
            personaKeys.forEach(key => {
                minSize = Math.min(minSize, personaMap[key].count);
                maxSize = Math.max(maxSize, personaMap[key].count);
            });

            const sizeRange = maxSize - minSize;

            const newData = {
                rootPersonas: {
                    personas: [],
                },
                parentedPersonas: {

                },
            };

            for (let i = 0, n = personaKeys.length; i < n && i < maxPersonas; ++i) {
                const key = personaKeys[i];
                const persona = personaMap[key];

                const properties = !this.hasBuckets ? [] : persona.properties.sort((pa, pb) => {
                    if (pa.id < pb.id) {
                        return -1;
                    }
                    if (pa.id > pb.id) {
                        return 1;
                    }
                    return 0;
                });

                properties.forEach(property => {
                    if (countFormatter) {
                        property.formattedCount = countFormatter.format(property.count);
                    }
                });

                this._colorProperties(properties);

                const scalingFactor = (persona.count - minSize) / sizeRange;
                const processedPersona: any = {
                    id: persona.id,
                    scalingFactor: isNaN(scalingFactor) ? 1 : scalingFactor,
                    totalCount: persona.count,
                    label: persona.label,
                    properties: properties,
                    images: persona.images,
                    links: persona.links,
                    select: persona.select,
                };

                if (countFormatter) {
                    processedPersona.formattedTotalCount = countFormatter.format(persona.count);
                }

                if (persona.parent === null) {
                    newData.rootPersonas.personas.push(processedPersona);
                } else {
                    let parentedData: any = newData.parentedPersonas[persona.parent];
                    if (!parentedData) {
                        parentedData = {
                            personas: [],
                        };
                        newData.parentedPersonas[persona.parent] = parentedData;
                    }
                    parentedData.personas.push(processedPersona);
                }
            }

            if (highlights && this.personas) {
                const subSelectionData: any = { personas: [] };
                const rows = table.rows;
                highlights.forEach((highlight: number, index: number) => {
                    if (highlight !== null) {
                        const row = rows[index];
                        const rawPersonaId = row[columnIndices.ID[0]];
                        let personaId = (rawPersonaId !== undefined && rawPersonaId !== null) ? rawPersonaId.toString() : null;

                        if (personaId) {
                            /* check if the persona is in the "Other" persona */
                            /* if (this.otherPersona &&
                             this.data.aggregates.other &&
                             this.data.aggregates.other.metadata &&
                             this.data.aggregates.other.metadata.personaIds.indexOf(personaId) >= 0) {
                             personaId = Personas.OTHER_PERSONA_DEFAULT_ID;

                             const newCount = subSelectionData[personaId] ? subSelectionData[personaId].bars[0].count + highlight : highlight;
                             this._addSubSelectionInfo(subSelectionData, personaId, [newCount]);
                             } else { */
                            const personaData = personaMap[personaId];
                            if (personaData) {
                                let highlightData = subSelectionData.personas.find(hd => hd.id === personaData.id);
                                if (!highlightData) {
                                    highlightData = {
                                        id: personaData.id,
                                        totalCount: personaData.count,
                                        properties: [],
                                    };

                                    personaData.properties.forEach(p => {
                                        highlightData.properties.push({
                                            id: p.id,
                                            count: 0,
                                            color: p.selectedColor || this.settings.presentation.selectedColor.solid.color,
                                        });
                                    });

                                    subSelectionData.personas.push(highlightData);
                                }

                                const bucketName = this.hasBuckets ? String(row[columnIndices.Bucket[0]]) : '';
                                const propertyID = this.hasBuckets ? bucketName : 'ONE';
                                const property = highlightData.properties.find(p => p.id === propertyID);
                                if (property) {
                                    property.count += highlight;
                                }
                            }
                        }
                    }
                });

                this.subSelectionData = subSelectionData;
            } else {
                this.subSelectionData = null;
            }

            return newData;
        }

        return null;
    }

    /**
     * Enumerates the instances for the objects that appear in the PowerBI panel.
     *
     * @method enumerateObjectInstances
     * @param {EnumerateVisualObjectInstancesOptions} options - Options object containing the objects to enumerate, as provided by PowerBI.
     * @returns {VisualObjectInstance[]}
     */
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] {
        let instances: VisualObjectInstance[] = [{
            selector: null,
            objectName: options.objectName,
            properties: {}
        }];

        $.extend(true, instances[0].properties, this.settings[options.objectName]);

        return instances;
    }

    public initializePersonas(viewport) {
        if (!this.personas) {
            const personasOptions: any = {
                general: {
                    initialDeviceScale: viewport.scale * 2,
                },
                layout: {
                    layoutType: this.hasLinks ? this.settings.presentation.layout.toString() : 'orbital',
                },
                persona: {
                    selectedBorderColor: '#000000',
                    backgroundColor: 'rgb(73,73,73)',
                }
            };

            this.personas = new Personas(this.element, personasOptions);
            //this.personas.enableBlur(this.settings.presentation.imageBlur);

            this.personas.on(PersonaEvents.PERSONA_CLICKED, sender => {
                this.ignoreSelectionNextUpdate = Boolean(this.subSelectionData);
                const shouldSelect = !sender.selected;
                this.personas.personas.forEach(wrapper => {
                    if (wrapper.object !== sender) {
                        wrapper.object.selected = false;
                        wrapper.object.setFocus(!shouldSelect, true);
                    }
                });
                sender.selected = shouldSelect;
                sender.setFocus(true, true);

                this.selectionManager.clear();
                if (shouldSelect) {
                    const personaData = this.dataLayerStack[this.dataLayerStack.length - 1].personas.find(p => p.id === sender.id);
                    const properties = [];
                    if (personaData) {
                        const selectArgs: any = {
                            data: [{data: [powerbi.data.createDataViewScopeIdentity(personaData.select)]}],
                        };
                        this.hostServices.onSelect(selectArgs);

                        const subLayerData = this.data.parentedPersonas[sender.id];
                        if (subLayerData) {
                            this.dataLayerStack.push(subLayerData);
                            this.personas.addDataLayer(sender.position.x, sender.position.y, this.dataLayerStack[this.dataLayerStack.length - 1]);
                        } else {
                            if (this.hasBuckets) {
                                personaData.properties.forEach(property => {
                                    properties.push({
                                        count: property.count / personaData.totalCount,
                                        color: property.selectedColor,
                                    });
                                });
                            } else {
                                properties.push({
                                    count: 1,
                                    color: this.settings.presentation.selectedColor.solid.color,
                                });
                            }

                            this.personas.highlight({
                                personas: [
                                    {
                                        id: sender.id,
                                        totalCount: 1,
                                        properties: properties,
                                    }
                                ]
                            });
                        }
                    }
                } else {
                    this.personas.unhighlight();
                }
            });

            this.personas.on(LayoutEvents.LAYOUT_BLANK_SPACE_CLICKED, () => {
                this.personas.personas.forEach(wrapper => {
                    wrapper.object.selected = false;
                    wrapper.object.setFocus(true, true);
                });
                this.personas.unhighlight();
                this.selectionManager.clear();
            });

            this.personas.on(BreadcrumbEvents.LAYOUT_BREADCRUMB_CLICKED, (sender, index) => {
                if (index >= 0 && this.personas.breadcrumbs.length > 1) {
                    const toRemove = this.personas.breadcrumbs.length - index - 1;
                    this.personas.removeDataLayer(toRemove);
                    this.dataLayerStack.splice(-toRemove, toRemove);
                }
            });

            if (this.data) {
                this.dataLayerStack.length = 0;
                this.dataLayerStack.push(this.data.rootPersonas);
                this.personas.loadData(this.dataLayerStack[this.dataLayerStack.length - 1], false);
                if (this.subSelectionData) {
                    this.personas.highlight(this.subSelectionData, true);
                }
            }
        }
    }

    /**
     * Removes any HTML tags from `text` and returns the result.
     *
     * @method _decodeText
     * @param {string} text - the text to decode.
     * @returns {string}
     * @private
     */
    private _decodeText(text: string): string {
        const txt: HTMLTextAreaElement = document.createElement('textarea');
        txt.innerHTML = text;
        return txt.value;
    }

    /**
     * Converts the provided RGB color to HSL space.
     *
     * @method _RGBToHSL
     * @param {{r: number, g: number, b: number}} rgb - The RGB color to convert.
     * @returns {{h: number, s: number, l: number}}
     * @private
     */
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

    /**
     * Converts the provided HSL color to RGB.
     *
     * @method _HSLToRGB
     * @param {{h: number, s: number, l: number}} hsl - The HSL color to convert.
     * @returns {{r: number, g: number, b: number}}
     * @private
     */
    private _HSLToRGB(hsl) {
        const h = hsl.h;
        const s = hsl.s;
        const l = hsl.l;
        let r, g, b;

        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            const hue2rgb = function hue2rgb(p, q, t) {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    /**
     * Interpolates the specified color to generate a palette with the specified number of iterations.
     *
     * @method _colorInterpolation
     * @param {string} color - The color to interpolate in HEX notation.
     * @param {number} iterations - The number of iteration to use while interpolating.
     * @param {boolean} isSelection - Should the oclor be treated as a selection color.
     * @returns {Array}
     * @private
     */
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

    /**
     * If the visual has data buckets, this function assigns interpolated colors to the provided Persona properties.
     *
     * @method _colorProperties
     * @param {any} properties - The properties to which colors will be assigned.
     * @private
     */
    private _colorProperties(properties) {
        if (this.hasBuckets) {
            const colorCount = this.buckets.length <= 3 ? 3 : this.buckets.length;
            const palette = this._colorInterpolation(this.settings.presentation.normalColor.solid.color, colorCount, false);
            const selectedPalette = this._colorInterpolation(this.settings.presentation.selectedColor.solid.color, colorCount, true);

            for (let i = 0, n = properties.length; i < n; ++i) {
                const index = this.buckets.indexOf(properties[i].id);
                let rgb = palette[index];
                properties[i].color = 'rgb(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ')';

                rgb = selectedPalette[index];
                properties[i].selectedColor = 'rgb(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ')';
            }
        }
    }
}
