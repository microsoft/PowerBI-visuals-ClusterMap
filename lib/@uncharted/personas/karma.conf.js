'use strict';

const isTddMode = process.argv.indexOf("--tdd") > -1;
const webpackConfig = require('./webpack.config');
const webpack = require('webpack');

module.exports = function(config) {
    config.set({
        basePath: '',
        frameworks: ['mocha', 'sinon-chai'],
        files: [
            'node_modules/babel-polyfill/dist/polyfill.min.js',
            'src/**/*.spec.js'
        ],
        exclude: [
        ],
        preprocessors: {
            'src/**/*.spec.js': ['webpack', 'sourcemap']
        },
        webpackMiddleware: {
            stats: 'errors-only',
        },
        webpack: {
            module: {
                rules: [
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
            resolve: webpackConfig.resolve,
            externals: [
                {
                    sinon: "sinon",
                    chai: "chai"
                },
            ],
            plugins: [
                new webpack.SourceMapDevToolPlugin({
                    filename: null, // if no value is provided the sourcemap is inlined
                    test: /\.(js)($|\?)/i // process .js files only
                }),
            ]
        },
        reporters: ['mocha', 'coverage', 'bamboo'],
        coverageReporter: {
            reporters: [
                {type: 'text'},
                {type: 'text-summary'},
                {type: 'clover', subdir: '.', file: 'clover.xml'},
                {type: 'html', subdir: '.'},
            ]

        },
        bambooReporter: {
            filename: 'bamboo/mocha.json'
        },
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        browsers: isTddMode ? ['Chrome'] : [ 'PhantomJS' ],
        singleRun: !isTddMode,
        concurrency: Infinity
    });
};
