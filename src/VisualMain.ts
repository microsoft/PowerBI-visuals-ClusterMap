/// <reference path="../node_modules/powerbi-visuals/lib/powerbi-visuals.d.ts"/>

import IVisual = powerbi.extensibility.v110.IVisual;
import VisualConstructorOptions = powerbi.extensibility.v110.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.VisualUpdateOptions;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import IVisualHost = powerbi.extensibility.v110.IVisualHost;
import IVisualHostServices = powerbi.IVisualHostServices;

import * as $ from 'jquery';

export default class VisualTemplate implements IVisual {

    private target: any;
    private updateCount: number;

    private host: IVisualHost;
    private hostServices: IVisualHostServices;
    private selectionManager: ISelectionManager;

    /* init function for legacy api*/
    constructor(options: VisualConstructorOptions) {
        console.log('Visual init', options);
        this.target = $(options.element);
        this.updateCount = 0;

        /* example to get the host (services) and selection manager using the new API */
        this.host = options.host;
        this.selectionManager = options.host.createSelectionManager();
        this.hostServices = (this.selectionManager as any).hostServices; // `hostServices` is now what we used to call `host`
    }

    public update(options: VisualUpdateOptions) {
        console.log('Visual update', options);
        this.target.html(`<p class="update-count">Update count: <em>${(++this.updateCount)}</em><br />operationKind: <em>${options.operationKind}</em></p>`);
    }

    public destroy(): void {
        //TODO: Perform any cleanup tasks here
    }
}
