# Webpack Hash Exclude Plugin

A simple Webpack plugin originally written by huangzhongzhen that allows excluding certain file names from having the
hash added.

## Using

```
const webpackHashExcludePlugin = require('webpack-hash-exclude-plugin')
new webpackHashExcludePlugin({
  excludeJs: ['styles', 'vendor', 'index'], //chunkname, default: []
  excludeCss: ['styles'], //chunkname, default: []
  cancelHtmlHash: true // Cancel chunkhash in html template default: true
})
```
