## 使用方法
```
const webpackHashExcludePlugin = require('webpack-hash-exclude-plugin')
new webpackHashExcludePlugin({
  excludeJs: ['styles', 'vendor', 'index'], //chunkname, default: []
  excludeCss: ['styles'], //chunkname, default: []
  cancelHtmlHash: true //取消html模版里面的chunkhash default: true
})
```