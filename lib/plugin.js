const _ = require('lodash');
require('require-safe')('html-webpack-plugin');

function ChunkHashExclude(options) {
    this.options = _.assign({
        excludeJs: [],
        excludeCss: [],
        publicCssPath: '',
        cancelHtmlHash: true,
    }, options);
}

ChunkHashExclude.prototype.cancelAssetsHash = (compilation, callback) => {
    compilation.chunks.forEach((chunk, i) => {
        chunk.files.forEach((filename, j) => {
            if (this.options.excludeJs.indexOf(chunk.name) > -1 && filename.indexOf('js') > -1) {
                let reg = new RegExp(`(js/)(${chunk.name})(.*)(.js|.js.map)`);
                if (filename.replace(reg, '$1$2$4') !== filename) {
                    compilation.chunks[i].files.splice(j, 1, filename.replace(reg, '$1$2$4'));
                    compilation.assets[filename.replace(reg, '$1$2$4')] = compilation.assets[filename];
                    delete compilation.assets[filename];
                }
            }
            if (filename.indexOf('css') > -1) {
                let reg = new RegExp(`(css/)(${chunk.name})(.*)(.css|.css.map)`);
                let newFilename = filename.replace(reg, '$1$2$4');
                if (this.options.excludeCss.indexOf(chunk.name) > -1) {
                    if (newFilename !== filename) {
                        compilation.chunks[i].files.splice(j, 1, newFilename);
                        compilation.assets[newFilename] = compilation.assets[filename];
                        delete compilation.assets[filename];
                    }
                }
            }
        });
    });
    callback();
};

ChunkHashExclude.prototype.cancelHtmlHash = (compilation, callback) => {
    compilation.chunks.map(chunk => {
        if (this.options.excludeJs.indexOf(chunk.names[0]) > -1) {
            let reg = new RegExp(`(js/)(${chunk.names[0]})(.*)(.js)`);
            let index = -1;
            compilation.body.some((item, i) => {
                if (item.attributes.src.indexOf(chunk.names[0]) > -1) {
                    index = i;
                    return true;
                }
                return false;
            });
            if (index > -1) compilation.body[index].attributes.src = compilation.body[index].attributes.src.replace(reg, '$1$2$4');
        }
        if (this.options.excludeCss.indexOf(chunk.names[0]) > -1) {
            let reg = new RegExp(`(css/)(${chunk.names[0]})(.*)(.css)`);
            let index = -1;
            compilation.head.some((item, i) => {
                if (item.attributes.href.indexOf(chunk.names[0]) > -1) {
                    index = i;
                    return true;
                }
                return false;
            });
            if (index > -1) compilation.head[index].attributes.href = compilation.head[index].attributes.href.replace(reg, '$1$2$4');
        }
    });
    callback();
};
// Remove the hash value of the corresponding chunk resource file in the html template
ChunkHashExclude.prototype.apply = (compiler) => {
    if (compiler.hooks) {
        if (this.options.publicCssPath) {
            compiler.hooks.thisCompilation.tap('thisCompilation', compilation => {
                compilation.mainTemplate.hooks.requireEnsure.tap('requireEnsure', (source, chunk, hash) => {
                    return source.replace('__webpack_require__.p', `'${this.options.publicCssPath}'`);
                });
            });
        }
        compiler.hooks.emit.tapAsync('emit', (compilation, callback) => {
            this.cancelAssetsHash(compilation, callback);
        });
        // Replace the hash value of the html static resource
        if (this.options.cancelHtmlHash) {
            compiler.hooks.compilation.tap('compilation', (compilation) => {
                compilation.hooks.htmlWebpackPluginAlterAssetTags.tapAsync('compilation', (compilation, callback) => {
                    this.cancelHtmlHash(compilation, callback);
                });
            });
        }
    } else {
        compiler.plugin('emit', (compilation, callback) => {
            cancelAssetsHash(compilation, callback);
        });
        if (this.options.cancelHtmlHash) {
            compiler.plugin('html-webpack-plugin-alter-asset-tags', (compilation, callback) => {
                cancelHtmlHash(compilation, callback);
            });
        }
        if (this.options.publicCssPath) {
            compiler.plugin('this-compilation', compilation => {
                compilation.mainTemplate.plugin('require-ensure', (source, chunk, hash) => {
                    return source.replace('__webpack_require__.p', `'${this.options.publicCssPath}'`);
                });
            });
        }
    }
};

module.exports = ChunkHashExclude;
