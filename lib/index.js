var FS = require('fs')
var Path = require('path')
var FK = require('FK')

var identity = FK(function (v) { return v; }, 1);

/** Extend an object with a set of properties.
  * @type: (Object, Object) -> Object
  * @curried
  */
var extend = FK(function (dest, src) {
  Object.keys(src).forEach(function (key) {
    var val = src[key];
    dest[key] = (val === undefined) ? dest[key] : val;
  });

  return dest;
}, 2);

/** Merges using `extend` without mutating either of the objects.
  * @type (Object, Object) -> Object
  * @curried
  */
var merge = FK(function (base, ext) {
  return [base, ext].reduce(function (acc, obj) {
    return extend(acc, obj);
  }, {});
}, 2);

/** True if an object has 0 keys.
  * @type: Object -> Boolean
  */
var isEmpty = function (obj) {
  return Object.keys(obj).length === 0;
};

/** String.replace
  * @type: (RegExp | String, String, String) -> String
  * @curried
  */
var replace = FK(function (pattern, replacement, str) {
  return str.replace(pattern, replacement);
}, 3);

/** Generates a Reqr api interface.
  * @param fn :: (Config, a) -> b -- implementation
  * @param defConfig :: Config -- default configuration
  * @param prepare :: (c -> a) -- prepare the input
  * @param input :: c
  * @param config :: Config
  * @returns: b
  */
var genAPI = FK(function (fn, defConfig, prepare) {
  return function (input, config) {
    return fn(merge(defConfig, config || {}), prepare(input));
  };
}, 3);

/** The type of structure we get from scan, load, dir, etc... */
function Tree() {}
var tree = function (data) { return extend(new Tree(), data || {}); };
tree.type = Tree;


var emptyObj = FK(function () { return {}; }, 1);
var constant = FK(function (a) { return a; }, 2);
var orThis = FK(function (b, a) { return a || b(); }, 2);
var orObject = orThis(emptyObj);
var jsReg = /\.js$/;


module.exports = function (Parent) {
  var Reqr = { Tree: tree };


  var scanConfig = {
    //: Boolean,
    recur: false,

    //: True | (String -> Boolean) | RegExp,
    filter: jsReg,

    //: String -> String
    alias: replace(jsReg, ''),

    //: String -> String
    aliasDir: identity,

    //: Boolean
    cull: true
  };

  var runFilter = FK(function (filter, input) {
    return filter instanceof Function ? !!filter(input)
         : filter instanceof RegExp ? !!input.match(filter)
         : true;
  }, 2);

  var addTo = function (store, value) {
    return store ? [].concat(store).concat([value]) : value;
  };

  //  scan(path: String, ScanConfig)
  var scan = FK(function (config) {
    return function recur(_path, parent) {
      var filter = runFilter(config.filter);
      var path = Path.resolve(parent || Parent.dir, _path || '.');

      var files = FS.readdirSync(path);

      return tree(files.reduce(function (acc, file) {
        if (Path.join(path, file) === Parent.file) return acc;

        var resolved = Path.resolve(path, file);
        var isDir = FS.statSync(resolved).isDirectory();
        var aliaser = isDir ? config.aliasDir : config.alias;
        var alias = (aliaser instanceof Function) ? aliaser(file) : file;

        var node = isDir ? (
          config.recur ? recur('.', resolved) : null
        ) : resolved;

        if (node && (isDir ? !config.cull || !isEmpty(node) : filter(file))) {
          acc[alias] = addTo(acc[alias], node);
        }

        return acc;
      }, {}));
    };
  }, 1);

  Reqr.scan = genAPI(scan, scanConfig, orObject);


  var forceConfig = {
    //: Boolean
    recur: true
  };

  //  force(struct: Object, ForceConfig)
  var force = FK(function (config) {
    return function recur(obj) {
      Object.keys(obj).forEach(function (key) {
        var val = obj[key];
        if (config.recur && val instanceof Tree) recur(val);
      });

      return obj;
    };
  }, 1);

  Reqr.force = genAPI(force, forceConfig, orObject);


  var loadConfig = {
    //: Boolean,
    lazy: false,

    //: * -> *
    transform: identity,

    //: (Modlet, Modlet) -> Modlet
    choose: constant
  };

  var modlet = function (path) {
    return { path: path, module: require(path) };
  };

  var include = FK(function (config, path) {
    var cache = null;
    return function () {
      if (!cache) {
        var filePath = [].concat(path).map(modlet).reduce(
          function (a, b) { return config.choose(a, b); }
        ).path

        cache = [config.transform(require(filePath))];
      }

      return cache[0];
    };
  }, 2);

  var assignLoad = function (config, obj, key, path) {
    obj.__defineGetter__(key, include(config, path));
    return obj;
  };

  //  load(Tree, LoadConfig)
  var load = FK(function (config) {
    return function recur(store) {

      var out = Object.keys(store).reduce(function (acc, key) {
        var val = store[key];

        if (val instanceof Tree) acc[key] = recur(val);
        else if (typeof val === 'string' || val instanceof Array) {
          assignLoad(config, acc, key, val);
        }
        return acc;
      }, tree());

      return config.lazy ? out
        : force({ recur: config.recur }, out);
    };
  }, 1);

  Reqr.load = genAPI(load, loadConfig, orThis(tree));


  var dirConfig = merge(loadConfig, scanConfig);

  //  dir(path: String, DirConfig)
  var dir = function (config, path) {
    return load(config, scan(config, path));
  };

  Reqr.dir = genAPI(dir, dirConfig, orThis(constant('.')));


  Reqr.replace = replace;

  return Reqr;
};