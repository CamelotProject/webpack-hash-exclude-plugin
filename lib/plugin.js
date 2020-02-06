require('require-safe')('html-webpack-plugin');

// Escape a string suitable for using in regex
function esc(string) {
    return string ? string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : string;
}

class WebpackHashExcludePlugin {
    options;

    constructor(options) {
        this.options = Object.assign({
            excludeJs: [],
            excludeCss: [],
            removeHtmlHash: true,
        }, options);
    }

    removeAssetsHash(compilation, callback){
        const renameChunkFiles = (compilation, index, chunkName, filename, suffix) => {
            const reg = new RegExp(`(${esc(chunkName)})(?:.*)(\.${suffix}|\.${suffix}\.map)$`);
            const newFilename = filename.replace(reg, '$1$2');
            if (newFilename === filename) return;
            compilation.chunks[index].files.splice(index, 1, newFilename);
            compilation.assets[newFilename] = compilation.assets[filename];
            delete compilation.assets[filename];


            compilation.entrypoints.get(chunkName).chunks.map((chunk) => {
                if (chunk.name === chunkName) {
                    chunk.files = chunk.files.map((file) => file.replace(reg, '$1$2'));
                }
            });
        };

        compilation.chunks.forEach((chunk) => {
            chunk.files.forEach((filename, index) => {
                if (this.options.excludeJs.indexOf(chunk.name) > -1 && filename.indexOf('js') > -1) {
                    renameChunkFiles(compilation, index, chunk.name, filename, 'js');
                }
                if (this.options.excludeCss.indexOf(chunk.name) > -1 && filename.indexOf('css') > -1) {
                    renameChunkFiles(compilation, index, chunk.name, filename, 'css');
                }
            });
        });
        callback();
    }

    removeHtmlHash(compilation, callback) {
        const chunksMapCallback = (chunk) => {
            const chunkName = chunk.names[0];
            const getIndex = (item) => item.attributes.href.indexOf(chunkName) > -1;
            let index;

            if (this.options.excludeJs.indexOf(chunkName) > -1) {
                const reg = new RegExp(`^(${esc(chunkName)})(?:.*)(\.js)$`);
                index = compilation.body.findIndex(getIndex);
                if (index > -1) {
                    compilation.body[index].attributes.src = compilation.body[index].attributes.src.replace(reg, '$1$2');
                }
            }
            if (this.options.excludeCss.indexOf(chunkName) > -1) {
                const reg = new RegExp(`^(${esc(chunkName)})(?:.*)(\.css)$`);
                index = compilation.head.findIndex(getIndex);
                if (index > -1) {
                    compilation.head[index].attributes.href = compilation.head[index].attributes.href.replace(reg, '$1$2');
                }
            }
        };
        compilation.chunks.map(chunksMapCallback);
        callback();
    }

    apply(compiler) {
        // Remove the has from asset file names
        compiler.hooks.emit.tapAsync('emit', (compilation, callback) => {
            this.removeAssetsHash(compilation, callback);
        });
        // Remove the hash value of the corresponding chunk resource file
        compiler.hooks.thisCompilation.tap('thisCompilation', compilation => {
            const requireEnsure = (source) => source.replace('__webpack_require__.p', `'${compilation.options.output.publicPath}'`);
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
