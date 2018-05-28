'use strict'
import webpack from 'webpack'
import path from 'path'

let inProduction = process.env.NODE_ENV === 'production' || process.argv.indexOf('-p') !== -1

export default {
  entry: {
    main: ['./src/script/main'],
    admin: ['./src/script/admin'],
    popout: ['./src/script/popout'],
    livestream: ['./src/script/livestream']
  },
  output: {
    path: __dirname,
    filename: './build/script/[name].js',
    chunkFilename: './build/script/[id].js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        options: {
          presets: [
            ['@babel/preset-env', {
              targets: {
                browsers: ['last 2 versions']
              }
            }]
          ]
        }
      },
      { test: /\.coffee$/, loader: 'coffee-loader', exclude: /node_modules/ },
      { test: /\.mustache$/, loader: 'mustache-loader', exclude: /node_modules/ }
    ],
    noParse: [
      /node_modules\/hls\.js/
    ]
  },

  resolve: {
    extensions: ['.coffee', '.js', '.json', '.mustache'],
    modules: [path.join(__dirname, '/src/script'), 'node_modules'],

    alias: {
      'underscore': 'lodash'
    }
  },

  plugins: [
    new webpack.ProvidePlugin({
      // Detect and inject
      $: 'jquery',
      Backbone: 'backbone',
      _: 'underscore',
      Marionette: 'backbone.marionette'
    })
  ],

  devtool: 'inline-source-map',
  mode: inProduction ? 'production' : 'development',
  target: 'web'
}
