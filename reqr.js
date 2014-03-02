delete require.cache[__filename];

module.exports = require('./lib')({
  file: module.parent.filename,
  dir: require('path').dirname(module.parent.filename)
});