const webpack = require('webpack');
const path = require('path');
const ENTRY = './src/VisualMain.ts';

module.exports = {
    entry: ENTRY,
    devtool: 'eval',
    resolve: {
        extensions: ['', '.webpack.js', '.web.js', '.js', '.ts']
    },
    module: {
        loaders: [
            {
              test: new RegExp(ENTRY),
              loader: path.join(__dirname, 'bin', 'pbiPluginLoader'),
            },
            {
                test: /\.ts?$/,
                loader: 'ts-loader',
            },
        ]
    },
    externals: [
        {
            jquery: "jQuery",
            "lodash": "_"
        },
    ]
}
