'use strict';

const path = require('path');
const webpack = require('webpack');
const JS_ENTRY = './src/Personas.js';
const JS_OUTPUT_DEV = 'uncharted.personas.js';
const JS_OUTPUT_PROD = 'uncharted.personas.min.js';
const BROWSER_OUTPUT_DEV = 'uncharted.personas.browser.js';
const BROWSER_OUTPUT_PROD = 'uncharted.personas.browser.min.js';

const isBrowser = (process.env.TARGET === 'browser');
const isProduction = (process.env.NODE_ENV === 'production');

const outputName =  isProduction ? (isBrowser ? BROWSER_OUTPUT_PROD : JS_OUTPUT_PROD) : (isBrowser ? BROWSER_OUTPUT_DEV : JS_OUTPUT_DEV);

let config = {
    stats: "errors-only",
    entry: ['babel-polyfill', JS_ENTRY],
    module: {
        rules: [
            {
                enforce: 'pre',
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'eslint-loader',
            },
            {
                test: /\.js$/,
                loader: 'babel-loader',
                options: {
                    presets: [
                        [ 'latest', { es2015: { modules: false } } ]
                    ],
                },
                exclude: /node_modules/
            },
        ],
    },
    externals: [
    ],
    plugins: [
    ],
    output: {
        filename: outputName,
        path: path.resolve(__dirname, 'dist'),
    },
};

if (isProduction) {
    config.plugins.push(
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('production'),
            },
        })
    );
} else {
    config.devtool = 'inline-source-map';

    config.plugins.push(
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('dev'),
            },
        })
    );
}

if (isBrowser) {
    config.output.library = ['Uncharted', 'Personas'];
    config.output.libraryTarget = 'window';
}


module.exports = [config];
