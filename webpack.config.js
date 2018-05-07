const webpack = require('webpack');
const path = require('path');
const ENTRY = './src/ClusterMap.ts';
const regex = path.normalize(ENTRY).replace(/\\/g, '\\\\').replace(/\./g, '\\.');

const UTILS = [
    'babel-polyfill',
    './node_modules/globalize/lib/cultures/globalize.culture.en-US.js',
    './node_modules/powerbi-visuals-utils-typeutils/lib/index.js',
    './node_modules/powerbi-visuals-utils-dataviewutils/lib/index.js',
    './node_modules/powerbi-visuals-utils-formattingutils/lib/index.js'
];

module.exports = {
    entry: UTILS.concat(ENTRY),
    devtool: 'eval',
    module: {
        loaders: [
            {
                test: new RegExp(regex),
                loader: path.join(__dirname, 'bin', 'pbiPluginLoader'),
            },
            {
                test: /\bpowerbi\b.*?\butils\b.*?\bindex\.js\b/,
                loader: 'string-replace-loader',
                query: {
                    multiple: [
                        { search: 'var powerbi;', replace: 'var powerbi = window.powerbi;' },
                        { search: 'var Globalize = Globalize || window["Globalize"];', replace: 'var Globalize = require(\'globalize\');' },
                    ]
                }
            },
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
    externals: [
        {
            jquery: 'jQuery',
            lodash: '_'
        },
    ],
};
