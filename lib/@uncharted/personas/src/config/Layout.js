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

export const LayoutConfig = {
    zoomControlsPosition: 'top-right', // available options: 'top-left', 'top-right', 'bottom-left', 'bottom-right'
    zoomControlsPadding: 10,
    zoomControlsButtonSize: 24,
    zoomControlsBackgroundColor: '#ffffff',
    zoomControlsBorderSize: 1,
    zoomControlsBorderColor: '#cccccc',
    zoomControlsFontSize: 16,
    zoomControlsFontColor: '#222222',
    zoomControlsFontShadow: false,
    zoomControlsFontShadowColor: '#000000',
    zoomControlsFontShadowBlur: 2,
    zoomControlsFontShadowOffsetX: 0,
    zoomControlsFontShadowOffsetY: 0,

    viewportDragThreshold: 8,
    viewportMaxZoomMultiplier: 2,
    viewportMinZoomMultiplier: 0.3,
    viewportZoomInOutMultiplier: 0.3,
    viewportZoomScrollMultiplier: 0.001,
    viewportDelayedRedraw: true,
    viewportBackground: false,
    viewportBackgroundColor: '#F2F2F2',
    viewportDelayedRedrawTime: 300,
    viewportAnimatedZoomDuration: 300, // milliseconds

    layoutType: 'cola',
    layoutAuraFillEnabled: false,
    layoutAuraFillColor: '#FEFEFE',
    layoutOrbitalPadding: 10,
    layoutPersonaMinRadius: 65,
    layoutPersonaMaxRadius: 250,
    layoutRepulsionScaleMultiplier: 0.2,
    layoutContractionScaleMultiplier: 0.2,
    layoutRepulsionAnimationDuration: 400,
    layoutContractionAnimationDuration: 400,
    layoutPositionAnimationDuration: 300,

    subLayoutMinDistanceFromMain: 20,
    subLayoutMaxDistanceFromMain: 300,
    subLayoutEntryAnimationDuration: 500,
};

export default LayoutConfig;
