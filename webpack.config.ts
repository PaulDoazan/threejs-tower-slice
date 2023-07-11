import * as path from 'path'
const HtmlWebpackPlugin = require('html-webpack-plugin');

export default {
    mode: 'development',
    entry: './src/game.ts',
    devServer: {
        port: 9000,
        static: {
            serveIndex: true,
            directory: __dirname
        }
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.css$/i,
                use: [
                    'style-loader',
                    'css-loader'
                ],
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/i,
                type: 'asset/resource',
            },
        ]
    },
    watchOptions: {
        ignored: /node_modules/
    },
    plugins: [
        // Make an index.html from the template
        new HtmlWebpackPlugin({
            template: './index.html',
            hash: true,
            minify: false
        })
    ]
}