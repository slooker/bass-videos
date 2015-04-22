var webpack = require('webpack');

module.exports = {
    resolve: {
        modulesDirectories: ['node_modules'],
        extensions: ['', '.js', '.jsx']
    },
    context: __dirname + '/src',
    entry: {
        app: './app.js'
    },
    output: {
        path: __dirname + '/public/build',
        filename: '/app.js'
    },
    plugins: [
        new webpack.ProvidePlugin({
            React: 'react',
            Router: 'react-router'
        })
    ],
    module: {
        loaders: [
            { test: /\.js$/, loader: 'jsx-loader?insertPragma=React.DOM&harmony' }
        ]
    }
};
