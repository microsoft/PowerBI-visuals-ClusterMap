"use strict";

const fs = require('fs');
const zip = require('node-zip')();
const path = require('path');
const sass = require('node-sass');
const mkdirp = require('mkdirp');
const webpack = require("webpack");
const MemoryFS = require("memory-fs");
const pbivizJson = require('../pbiviz.json');
const packageJson = require('../package.json');
const capabilities = require(path.join('..', pbivizJson.capabilities));
const webpackConfig = require('../webpack.config');

const buildPackageJson = {
    version: packageJson.version,
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

const compileSass = () => {
    const cssContent = sass.renderSync({ file: pbivizJson.style }).css.toString();
    return cssContent;
};

const compileScripts = (callback) => {
    const fs = new MemoryFS();
    const compiler = webpack(Object.assign({ output: { filename: 'visual.js', path: '/' }}, webpackConfig));
    compiler.outputFileSystem = fs;
    compiler.run((err, stats) => {
        if (err) throw err;
        let log = stats.toString({
            color: true
        });
        log = log.split('\n\n').filter(msg => msg.indexOf('node_module') === -1 ).join('\n\n');
        const fileContent = fs.readFileSync("/visual.js").toString(); 
        console.info(log);
        callback(err, fileContent);
    });

};

const buildPackage = () => {
    mkdirp.sync(path.parse(pbivizJson.output).dir);

    const cssContent = compileSass();
    const icon = fs.readFileSync(pbivizJson.assets.icon);
    const iconType = pbivizJson.assets.icon.indexOf('.svg') >= 0 ? 'svg+xml' : 'png';
    const iconBase64 = `data:image/${iconType};base64,` + icon.toString('base64');

    compileScripts((err, result) => {
        if (err) throw err;
        const jsContent = result;
        pbivizJson.capabilities = capabilities;
        pbivizJson.content = {
            js: jsContent,
            css: cssContent,
            iconBase64: iconBase64
        };
        zip.file('package.json', JSON.stringify(buildPackageJson, null, 2));
        zip.file(`resources/${pbivizJson.visual.guid}.pbiviz.json`, JSON.stringify(pbivizJson, null, 2));
        fs.writeFileSync(pbivizJson.output, zip.generate({ base64:false,compression:'DEFLATE' }), 'binary');
    });
};

buildPackage();
