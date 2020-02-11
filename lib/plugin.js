const HtmlWebpackPlugin = require('html-webpack-plugin');

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

    apply(compiler) {
        // Remove the hash from asset file names
        compiler.hooks.emit.tapAsync('emit', (compilation, callback) => {
            this.removeAssetsHash(compilation, callback);
        });
        // Replace the hash value of the html static resource
        if (this.options.removeHtmlHash) {
            compiler.hooks.compilation.tap('WebpackHashExclude', (compilation) => {
                HtmlWebpackPlugin.getHooks(compilation).alterAssetTags.tapAsync('WebpackHashExclude', (data, callback) => this.renameAssetTags(data, callback));
            });
        }
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

    renameAssetTags(data, callback) {
        data.assetTags.scripts.map((assetTag, callback) => {
            for (let chunkName of this.options.excludeCss) {
                if (assetTag.attributes.src.search(regex(chunkName, 'js')) > -1) {
                    assetTag.attributes.src = assetTag.attributes.src.replace(regex(chunkName, 'js'), '$1$2$3');
                }
            }
        });
        data.assetTags.styles.map((assetTag, callback) => {
            for (let chunkName of this.options.excludeCss) {
                if (assetTag.attributes.href.search(regex(chunkName, 'css')) > -1) {
                    assetTag.attributes.href = assetTag.attributes.href.replace(regex(chunkName, 'css'), '$1$2$3');
                }
            }
        });

        callback(null, data);
    }
}

module.exports = WebpackHashExcludePlugin;
