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

var Defaults = {
    hooks: {
        onSelectPersona: null,
        onHoverPersona: null,
        onMergePersona: null,
        onSelectionCleared: null,
        onZoomUpdateFromUser: null,
        onClickEmptySpace: null,
    },
};

module.exports = Defaults;

module.exports.Persona = {
    classes: {
        container: 'prsnas_container',
        persona: 'prsnas_persona',
        content: 'prsnas_main',
        name: 'prsnas_name',
        namecontainer: 'prsnas_namecontainer',
        count: 'prsnas_count',
        totalcount: 'prsnas_totalcount',
        counttext: 'prsnas_counttext',
        seedcount: 'seed_count',
        seedname: 'seed_value',
        unselectable: 'unselectable',
        zoomcontrols: 'prsnas_zoom_controls',
        zoomcontrolslabel: 'control_label',
    },
    layout: {
        systemtype: 'cola',
        textpadding: 2,
        progressHeight: 9,
        minSize: 130,
        maxSize: 250,
        selectedBorder: 8,
    },
    pie: {
        baseColor: '#F6F1EE',
        defaultColor: '#9EC731',
        minimumDisplayRatio: 0.025,
    },
    events: {
        select: '[Persona::PersonaSelect]',
        deselectAll: '[Persona::PersonaDeselectAll]',
        hover: '[Persona::PersonaHover]',
        enableBlur: '[Persona::PersonaEnableBlur]',
        repel: '[Persona::PersonaRepel]',
        dragStarted: '[Persona::PersonaDragStarted]',
        dragMoved: '[Persona::PersonaDragged]',
        dragEnded: '[Persona::PersonaDragEnded]',
        merged: '[Persona::PersonaMerged]',
        expandSeed: '[Persona::expandSeed]',
        closeSeed: '[Persona::closeSeed]',
        zoomUpdateFromUser: '[Persona::zoomUpdateFromUser]',
    },
    config: {
        animationsDurationBase: 100,
        transitionsDuration: 500,
        moveEnabled: false,
        mergeEnabled: true,
        mergeOverlapRatio: 0.3,
        mergeScaleRatio: 1.05,
        drawOrbits: true,
        seedAnimationDurationBase: 400,
        autoGenerateFallbackColors: true,
        autoColorClampMin: 40,
        autoColorClampMax: 220,
        fallbackBackgroundColor: '#444444',
        subSelectEffectEnabled: true,
        subSelectEffectCompatibilityMode: true,
        registerWindowResize: true,
        displayTotalCountLabel: true,
        displayLabelsAtOneCount: true,
        renderSubSelectionBackground: true,
        renderGaugeSeparators: false,
        gaugeSeparatorWidth: 0.003,
    },
};
