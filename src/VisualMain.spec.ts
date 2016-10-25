import * as $ from 'jquery';
import * as sinon from 'sinon';
import { expect } from 'chai';
import VisualTemplate from './VisualMain';
import VisualInitOptions = powerbi.VisualInitOptions;
import VisualUpdateOptions = powerbi.VisualUpdateOptions;
import VisualConstructorOptions = powerbi.extensibility.v110.VisualConstructorOptions;

describe('VisualTemplate', () => {
    it('should increase the updateCount on update', () => {
        const element = $('<div></div>');
        const dummyHost = {
            createSelectionManager: () => ({ hostServices: 'hostService' } as any)
        }
        const visual = new VisualTemplate(<VisualConstructorOptions>{ element: element[0], host: dummyHost });

        visual.update(<VisualUpdateOptions>{});
        expect(element.html()).to.equal('<p class="update-count">Update count: <em>1</em><br>operationKind: <em>undefined</em></p>');

        visual.update(<VisualUpdateOptions>{});
        expect(element.html()).to.equal('<p class="update-count">Update count: <em>2</em><br>operationKind: <em>undefined</em></p>');
    });
});
