"use strict";

const fs = require('fs');
const path = require('path');
const zip = require('node-zip')();
const fileTools = require('./fileTools');
const pbivizJson = require('../pbiviz.json');
const capabilities = require(path.join('..', pbivizJson.capabilities));

const packageJson = {
    version: pbivizJson.visual.version,
    author: pbivizJson.author,
    resources: [
        {
            resourceId: 'rId0',
            sourceType: 5,
            file: `resources/${ pbivizJson.visual.guid }.pbiviz.json`,
        }
    ],
    visual: pbivizJson.visual,
    metadata: {
        pbivizjson: {
            resourceId: 'rId0'
        }
    }
};

const sourceDir = process.argv[2];
const jsContent = fs.readFileSync(path.join(sourceDir, 'visual.js')).toString();
const cssContent = fs.readFileSync(path.join(sourceDir, 'visual.css')).toString();
const icon = fs.readFileSync(pbivizJson.assets.icon);
const iconType = pbivizJson.assets.icon.indexOf('.svg') >= 0 ? 'svg+xml' : 'png';
const iconBase64 = `data:image/${iconType};base64,` + icon.toString('base64');

pbivizJson.capabilities = capabilities;
pbivizJson.content = {
    js: jsContent,
    css: cssContent,
    iconBase64: iconBase64
};

zip.file('package.json', JSON.stringify(packageJson, null, 2));
zip.file(`resources/${pbivizJson.visual.guid}.pbiviz.json`, JSON.stringify(pbivizJson, null, 2));
fs.writeFileSync(pbivizJson.output, zip.generate({ base64:false,compression:'DEFLATE' }), 'binary');
