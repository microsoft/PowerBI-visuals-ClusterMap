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
const buildOSSReport = require('./buildOSSReport.js');

const packagingWebpackConfig = {
    tslint: {
        emitErrors: true,
        failOnHint: true
    },
    output: {
        filename: 'visual.js', path: '/'
    }
};

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
    visual: Object.assign(pbivizJson.visual, { version: packageJson.version }),
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
    const regex = new RegExp("\\bpowerbi-visuals.d.ts\\b");
    const fs = new MemoryFS();
    const compiler = webpack(Object.assign(webpackConfig, packagingWebpackConfig));
    compiler.outputFileSystem = fs;
    compiler.run((err, stats) => {
        if (err) throw err;
        const jsonStats = stats.toJson(true);
        const errors = jsonStats.errors.filter(error => !regex.test(error));
        console.info('Time:', jsonStats.time);
        console.info('Hash:', jsonStats.hash);
        jsonStats.warnings.forEach(warning => console.warn('WARNING:', warning));
        errors.forEach(error => !regex.test(error) && console.error('ERROR:', error));
        if (errors.length > 0) {
            return process.exit(1);
        }
        buildOSSReport(jsonStats.modules, ossReport => {
            const fileContent = fs.readFileSync("/visual.js").toString();
            callback(err, fileContent, ossReport);
        });
    });
};

const buildPackage = () => {
    mkdirp.sync(path.parse(pbivizJson.output).dir);

    const cssContent = compileSass();
    const icon = fs.readFileSync(pbivizJson.assets.icon);
    const iconType = pbivizJson.assets.icon.indexOf('.svg') >= 0 ? 'svg+xml' : 'png';
    const iconBase64 = `data:image/${iconType};base64,` + icon.toString('base64');

    compileScripts((err, result, ossReport) => {
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

        const ossReportFile = path.join(path.dirname(pbivizJson.output), pbivizJson.visual.name + '_' + packageJson.version + '_OSS_Report.csv');
        fs.writeFileSync(ossReportFile, ossReport);
    });
};

buildPackage();
