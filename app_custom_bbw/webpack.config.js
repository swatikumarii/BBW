'use strict';

var path = require('path');
var MiniCssExtractPlugin = require('mini-css-extract-plugin');
var CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
var RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');
var sgmfScripts = require('sgmf-scripts');

module.exports = [{
    mode: 'production',
    name: 'js',
    entry: sgmfScripts.createJsPath(),
    output: {
        path: path.resolve('./cartridges/app_custom_bbw/cartridge/static'),
        filename: '[name].js'
    },
    resolve: {
        alias: {
            jquery: path.resolve(__dirname, '../storefront-reference-architecture/node_modules/jquery'),
            bootstrap: path.resolve(__dirname, '../storefront-reference-architecture/node_modules/bootstrap'),
            lodash: path.resolve(__dirname, '../storefront-reference-architecture/node_modules/lodash'),
            cleave: path.resolve(__dirname, '../storefront-reference-architecture/node_modules/cleave.js'),
            'popper.js': path.resolve(__dirname, './node_modules/popper.js')
        }
    }
},
{
    mode: 'production',
    name: 'scss',
    entry: sgmfScripts.createScssPath(),
    output: {
        path: path.resolve('./cartridges/app_custom_bbw/cartridge/static')
    },
    plugins: [
        new RemoveEmptyScriptsPlugin(),
        new MiniCssExtractPlugin({
            filename: '[name].css',
            chunkFilename: '[name].css'
        })
    ],
    module: {
        rules: [
            {
                test: /.scss$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            esModule: false
                        }
                    },
                    {
                        loader: 'css-loader',
                        options: {
                            url: false
                        }
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                plugins: [require('autoprefixer')]
                            }
                        }
                    },
                    {
                        loader: 'sass-loader',
                        options: {
                            implementation: require('sass'),
                            sassOptions: {
                                includePaths: [
                                    path.resolve(process.cwd(), '../storefront-reference-architecture/node_modules/'),
                                    path.resolve('node_modules'),
                                    path.resolve('node_modules/flag-icon-css/sass')
                                ]
                            }
                        }
                    }
                ]
            }
        ]
    },
    optimization: {
        minimizer: ['...', new CssMinimizerPlugin()]
    }
}];