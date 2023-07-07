import * as path from 'path'

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
        publicPath: '/dist/'
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
                use: ['style-loader', 'css-loader'],
            },
        ]
    },
    watchOptions: {
        ignored: /node_modules/
    }
}