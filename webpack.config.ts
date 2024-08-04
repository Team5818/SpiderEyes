import path from "path";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {Configuration as DevConfiguration} from "webpack-dev-server";
import {Configuration, ProgressPlugin, EnvironmentPlugin} from "webpack";
import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import merge from "webpack-merge";
import FaviconsWebpackPlugin from "favicons-webpack-plugin";
import ESLintWebpackPlugin from "eslint-webpack-plugin";
import corejsJson from "core-js/package.json";
import ourJson from "./package.json";
import {BundleAnalyzerPlugin} from "webpack-bundle-analyzer";

interface KnownEnv {
    WEBPACK_SERVE: boolean
}

const options: (env: KnownEnv) => Configuration = (env) => {
    const format = env.WEBPACK_SERVE ? '[name]' : '[name]-[contenthash]';
    const common: Configuration = {
        entry: './src/main.ts',
        output: {
            filename: `${format}.js`,
            path: path.resolve(__dirname, 'dist'),
            assetModuleFilename: `${format}[ext][query]`,
            clean: true,
        },
        plugins: [
            new EnvironmentPlugin({
                'APP_VERSION': ourJson.version,
            }),
            new HtmlWebpackPlugin({
                title: "Spider Eyes | Team 5818",
            }),
            new FaviconsWebpackPlugin({
                logo: "./src/img/logo.png",
                mode: "webapp",
                favicons: {
                    pixel_art: true,
                    icons: {
                        favicons: true,
                        android: false,
                        appleIcon: false,
                        appleStartup: false,
                        yandex: false,
                        windows: false,
                    },
                },
            }),
            new MiniCssExtractPlugin({
                filename: `${format}.css`,
            }),
            new ForkTsCheckerWebpackPlugin({
                typescript: {
                    diagnosticOptions: {
                        semantic: true,
                    },
                },
            }),
            new ESLintWebpackPlugin({
                extensions: ['ts', 'tsx'],
                exclude: ['node_modules'],
            }),
            new ProgressPlugin(),
        ],
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
        },
        module: {
            rules: [
                {
                    test: /\.s[ca]ss$/i,
                    use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
                },
                {
                    test: /\.(png|svg|jpg|jpeg|gif)$/i,
                    type: 'asset/resource',
                },
                {
                    test: /\.tsx?$/,
                    use: [
                        {
                            loader: 'babel-loader',
                            options: {
                                presets: [
                                    [
                                        '@babel/preset-env',
                                        {
                                            bugfixes: true,
                                            debug: true,
                                            useBuiltIns: 'usage',
                                            corejs: corejsJson.version,
                                            shippedProposals: true,
                                        },
                                    ],
                                ],
                            },
                        },
                        {
                            loader: 'ts-loader',
                            options: {
                                transpileOnly: true,
                            },
                        },
                    ],
                    exclude: /node_modules/,
                },
            ],
        },
        optimization: {
            runtimeChunk: "single",
            splitChunks: {
                chunks: "all",
                cacheGroups: {
                    react: {
                        test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
                        name: 'react',
                        chunks: 'all',
                    },
                    reactstrap: {
                        test: /[\\/]node_modules[\\/](reactstrap.*)[\\/]/,
                        name: 'reactstrap',
                        chunks: 'all',
                    },
                },
            },
        },
        performance: {
            maxEntrypointSize: 512000,
        },
    };
    if (env.WEBPACK_SERVE) {
        return merge(common, {
            mode: 'development',
            devtool: 'source-map',
            devServer: {
                static: './dist',
                port: 9323,
            },
        });
    } else {
        return merge(common, {
            plugins: [
                new BundleAnalyzerPlugin({
                    analyzerMode: "static",
                    openAnalyzer: false,
                }),
            ],
            devtool: 'source-map',
            mode: 'production',
            optimization: {
                removeAvailableModules: true,
            },
        });
    }
};

export default options;
