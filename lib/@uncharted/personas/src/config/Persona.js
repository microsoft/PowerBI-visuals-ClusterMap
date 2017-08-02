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

const PersonaConfig = {
    backgroundColor: '#333333',
    radiusOverlap: 1, // used to grow/shrink the radius/thickness of circles and strokes to mitigate artifacts created by canvas' anti-aliasing.

    selectedBorder: 4,
    selectedBorderColor: '#2ab3e4',

    unselectedBorder: 2,
    unselectedBorderColor: '#CEC3B8',

    gaugeThickness: 8,
    gaugeBackgroundColor: '#F6F1EE',
    gaugePadding: 1,
    gaugeMarkerThickness: 2,
    gaugeMarkerSpill: 5,
    gaugeMarkerColor: '#2f2f2f',
    gaugeBarPadding: 3,
    gaugeBarCaps: 'butt',

    avatarBorder: 2,
    avatarBorderColor: '#FFFFFF',
    avatarSubImagePosition: 0.7,

    labelWidthSpill: 10,
    labelScaleFontSizes: true,
    labelScaleBasePersonaRadius: 125,
    labelVerticalPosition: '50%',
    labelCountDisplayMode: 'totalCount', // Available: 'none', 'propertyCount', 'totalCount', 'propertyCount/totalCount'
    labelPropertyCountIndex: 0,
    labelNameAndCountsPadding: 4,
    labelMinFontSize: 12,
    labelMaxFontSize: 40,

    labelNameFont: 'default',
    labelNameFontSize: 18,
    labelNameMaxLines: 2,
    labelNameColor: '#FFFFFF',
    labelNameBackgroundColor: 'rgba(33,33,33,0.7)',
    labelNameBackgroundPadding: 6,
    labelNameShadow: false,
    labelNameShadowColor: '#000000',
    labelNameShadowBlur: 2,
    labelNameShadowOffsetX: 0,
    labelNameShadowOffsetY: 0,

    labelCountFont: 'default',
    labelCountFontSize: 30,
    labelCountColor: '#FFFFFF',
    labelCountShadow: true,
    labelCountShadowColor: '#000000',
    labelCountShadowBlur: 4,
    labelCountShadowOffsetX: 0,
    labelCountShadowOffsetY: 0,

    labelTotalCountFont: 'default',
    labelTotalCountFontSize: 16,
    labelTotalCountColor: '#FFFFFF',
    labelTotalCountShadow: true,
    labelTotalCountShadowColor: '#000000',
    labelTotalCountShadowBlur: 4,
    labelTotalCountShadowOffsetX: 0,
    labelTotalCountShadowOffsetY: 0,
};

export default PersonaConfig;
