'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const sass = require('node-sass');
const mkdirp = require('mkdirp');
const connect = require('connect');
const webpack = require('webpack');
const chokidar = require('chokidar');
const serveStatic = require('serve-static');
const webpackConfig = require('../webpack.config');
const pbivizJson = require('../pbiviz.json');

const config = {
    pbivizJsonPath: 'pbiviz.json',
    capabilitiesJsonPath: pbivizJson.capabilities,
    tmpDropDir: '.tmp/drop',
    sassEntry: pbivizJson.style,
    server: {
        cert: 'certs/PowerBICustomVisualTest_public.crt', 
        key: 'certs/PowerBICustomVisualTest_private.key',
        port: 8080
    }
};
const pbiResource = {
    jsFile: `${ config.tmpDropDir }/visual.js`,
    cssFile: `${ config.tmpDropDir }/visual.css`,
    pbivizJsonFile: `${ config.tmpDropDir }/pbiviz.json`,
    statusFile: `${ config.tmpDropDir }/status`,
};

const compileSass = () => {
    console.info('Building css...');
    const cssContent = sass.renderSync({ file: config.sassEntry }).css;
    fs.writeFileSync(pbiResource.cssFile, cssContent);
};

const emitPbivizJson = () => {
    console.info('Updating pbiviz.json...');
    const pbiviz = JSON.parse(fs.readFileSync(config.pbivizJsonPath));
    const capabilities = JSON.parse(fs.readFileSync(config.capabilitiesJsonPath))
    pbiviz.capabilities = capabilities;
    fs.writeFileSync(pbiResource.pbivizJsonFile, JSON.stringify(pbiviz, null, 2));
};

const updateStatus = () => {
    fs.writeFileSync(pbiResource.statusFile, Date.now().toString());
    console.info('Visual updated.');
};

const runWatchTask = (task, isSass) => {
    try {
        task();
    } catch (e) {
        isSass 
            ? console.info(`ERROR: ${e.message}\n    at ${e.file}:${e.line}:${e.column}`)
            : console.info(`ERROR: ${e.message}`);
    }
};

const startWatchers = () => {
    // watch script change and re-compile
    const compiler = webpack(Object.assign({ output: { filename: pbiResource.jsFile }}, webpackConfig));
    compiler.watch({}, (err, stats) => {
        let log = stats.toString({
            chunks: false,
            color: true
        });
        log = log.split('\n\n').filter(msg => msg.indexOf('node_module') === -1 ).join('\n\n');
        console.info(log);
    });

    // watch for pbiviz.json or capabilities.json change
    chokidar
        .watch([config.pbivizJsonPath, config.capabilitiesJsonPath])
        .on('change', path => runWatchTask(emitPbivizJson));

    // watch for sass file changes
    chokidar
        .watch(['**/*.scss', '**/*.sass'])
        .on('change', path => runWatchTask(compileSass, true));

    // watch pbi resource change and update status to trigger debug visual update
    chokidar
        .watch([pbiResource.jsFile, pbiResource.cssFile, pbiResource.pbivizJsonFile])
        .on('change', path => runWatchTask(updateStatus));
};

const startServer = () => {
    const options = {
        key: fs.readFileSync(config.server.key),
        cert: fs.readFileSync(config.server.cert)
    };
    const app = connect();
    app.use((req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        next();
    });
    app.use('/assets', serveStatic(config.tmpDropDir));

    https.createServer(options, app).listen(config.server.port, (err) => {
        console.info('Server listening on port ', config.server.port + '.');
    });
};

const start = () => {
    mkdirp.sync(config.tmpDropDir);
    compileSass();
    emitPbivizJson();
    updateStatus();
    startWatchers();
    startServer();
};

start();
