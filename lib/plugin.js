require('require-safe')('html-webpack-plugin');

// Create a regular expression to search for a file by chunk name & extension, including associated source maps
function regex(chunkName, fileExt) {
    return new RegExp(`^(?:\\/\\w+\\/|)(${chunkName})(?:.*)(\\.${fileExt})(\\.map|)$`);
}

class WebpackHashExcludePlugin {
    options;
    changes = {};

    constructor(options) {
        this.options = Object.assign({
            excludeJs: [],
            excludeCss: [],
            removeHtmlHash: true,
        }, options);
    }

    removeAssetsHash(compilation, callback) {
        const matchingChunks = compilation.chunks
            .filter((chunk) => this.options.excludeJs.indexOf(chunk.name) > -1 || this.options.excludeCss.indexOf(chunk.name) > -1);
        matchingChunks.forEach((chunk) => {
            if (this.options.excludeJs.indexOf(chunk.name) > -1) {
                this.renameChunkFiles(chunk, 'js');
            }
            if (this.options.excludeCss.indexOf(chunk.name) > -1) {
                this.renameChunkFiles(chunk, 'css');
            }
        });
        // compilation.assets & compilation.assetsInfo
        for (let [oldFileName, newFileName] of Object.entries(this.changes)) {
            compilation.assets[newFileName] = compilation.assets[oldFileName];
            delete compilation.assets[oldFileName];

            compilation.assetsInfo.set(newFileName, compilation.assetsInfo.get(oldFileName));
            compilation.assetsInfo.delete(oldFileName);
        }
        callback();
    }

    renameChunkFiles(chunk, assetType) {
        chunk.files.forEach((fileName, index) => {
            const newFileName = fileName.replace(regex(chunk.name, assetType), '$1$2$3');
            if (newFileName !== fileName) {
                this.changes[fileName] = newFileName;
                chunk.files[index] = newFileName;
            }
        });
    }

    removeHtmlHash(compilation, callback) {
        const chunksMapCallback = (chunk) => {
            const chunkName = chunk.names[0];
            const getIndex = (item) => item.attributes.href.indexOf(chunkName) > -1;
            let index;

            if (this.options.excludeJs.indexOf(chunkName) > -1) {
                index = compilation.body.findIndex(getIndex);
                if (index > -1) {
                    compilation.body[index].attributes.src = compilation.body[index].attributes.src.replace(regex(chunkName, 'js'), '$1$2$3');
                }
            }
            if (this.options.excludeCss.indexOf(chunkName) > -1) {
                index = compilation.head.findIndex(getIndex);
                if (index > -1) {
                    compilation.head[index].attributes.href = compilation.head[index].attributes.href.replace(regex(chunkName, 'css'), '$1$2$3');
                }
            }
        };
        compilation.chunks.map(chunksMapCallback);
        callback();
    }

    apply(compiler) {
        // Remove the hash from asset file names
        compiler.hooks.emit.tapAsync('emit', (compilation, callback) => {
            this.removeAssetsHash(compilation, callback);
        });
        // Remove the hash value of the corresponding chunk resource file
        compiler.hooks.thisCompilation.tap('thisCompilation', compilation => {
            const requireEnsure = (source) => {
                source.replace('__webpack_require__.p', `'${compilation.options.output.publicPath}'`)
            };
            compilation.mainTemplate.hooks.requireEnsure.tap('requireEnsure', requireEnsure);
        });
        // Replace the hash value of the html static resource
        if (this.options.removeHtmlHash) {
            compiler.hooks.compilation.tap('compilation', (compilation) => {
                compilation.hooks.htmlWebpackPluginAlterAssetTags.tapAsync('compilation', (compilation, callback) => {
                    this.removeHtmlHash(compilation, callback);
                });
            });
        }
    }
}

module.exports = WebpackHashExcludePlugin;
