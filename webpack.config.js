const webpack = require('webpack');
const path = require('path');
const ENTRY = './src/ClusterMap.ts';
const regex = path.normalize(ENTRY).replace(/\\/g, '\\\\').replace(/\./g, '\\.');

module.exports = {
    entry: ['babel-polyfill', ENTRY],
    plugins: [
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            _: 'lodash',
        }),
    ],
    devtool: 'eval',
    module: {
        loaders: [
            {
                test: new RegExp(regex),
                loader: path.join(__dirname, 'bin', 'pbiPluginLoader'),
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
};
