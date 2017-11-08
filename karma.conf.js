'use strict';

const webpackConfig = require('./webpack.config');
const isTddMode = process.argv.indexOf("--tdd") > -1;
const webpack = require('webpack');

module.exports = function(config) {
    config.set({
        basePath: '',
        frameworks: ['mocha', 'sinon-chai'],
        files: [
            'src/**/*.spec.ts'
        ],
        exclude: [
        ],
        preprocessors: {
            'src/**/*.spec.ts': ['webpack', 'sourcemap']
        },
        webpack: {
            module: {
                loaders: [
                    {
                        test: /\.ts?$/,
                        loaders: [{
                            loader: 'babel-loader',
                            options: {
                                presets: [
                                    ['latest', {es2015: {modules: false}}],
                                ],
                            },
                        }, 'ts-loader'],
                    },
                    {
                        test: /\.js?$/,
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                [ 'latest', { es2015: { modules: false } } ],
                            ],
                        },
                    },
                ]
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
                test: /\.(ts|js)($|\?)/i // process .js and .ts files only
              })
            ]
        },
        webpackMiddleware: {
            // suppress webpack errors
            stats: 'none'
        },
        reporters: ['progress'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        browsers: isTddMode ? ['Chrome'] : [ 'PhantomJS' ],
        singleRun: !isTddMode,
        concurrency: Infinity
    })
}
