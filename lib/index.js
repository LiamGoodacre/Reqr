var FS = require('fs');
var Path = require('path');
var FK = require('fk');
var Util = require('./util');

/** Generates a Reqr api interface.
  * @param fn :: (Config, a) -> b -- implementation
  * @param defConfig :: Config -- default configuration
  * @param prepare :: (c -> a) -- prepare the input
  * @param input :: c
  * @param config :: Config
  * @returns: b
  * @curried
  */
var genAPI = FK(function (fn, defConfig, prepare) {
  return function (input, config) {
    return fn(Util.merge(defConfig, config || {}), prepare(input));
  };
}, 3);

/** The type of structure we get from scan, load, dir, etc... */
function Tree() {}
var tree = function (data) {
  return Util.extend(new Tree(), data || {});
};
tree.type = Tree;


module.exports = function (Parent) {
  var Reqr = { Tree: tree };


  //: ScanConfig =
  var scanConfig = {
    //: Boolean,
    recur: false,

    //: True | (String -> Boolean) | RegExp,
    filter: Util.jsExt,

    //: String -> String
    alias: Util.noExt,

    //: String -> String
    aliasDir: Util.identity,

    //: Boolean
    cull: true
  };

  /** Execute a filter on a given input.
    * Accepted filters are of type Function or RegExp.
    * For all other filters, return true.
    * 
    * @type: (*, *) -> Boolean
    */
  var runFilter = FK(function (filter, input) {
    return filter instanceof Function ? !!filter(input)
         : filter instanceof RegExp ? !!input.match(filter)
         : true;
  }, 2);

  /** 
    * @type: (String | [String], String) -> (String | [String])
    */
  var addTo = function (store, value) {
    return store ? [].concat(store).concat([value]) : value;
  };

  /** Given a directory path, scan the directory for files, possibly
    * recursively.  Build up a tree representing the directory structure.
    * 
    * @type: (ScanConfig, path: String) -> Tree
    */
  var scan = FK(function (config) {
    return function recur(_path, parent) {
      var filter = runFilter(config.filter);
      var path = Path.resolve(parent || Parent.dir, _path || '.');

      var files = FS.readdirSync(path);

      return tree(files.reduce(function (acc, file, index, all) {
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

  /** Build up a tree representing a directory structure.
    * @type: (path: String, ScanConfig) -> Tree
    */
  Reqr.scan = genAPI(scan, scanConfig, Util.orObject);


  //: ForceConfig =
  var forceConfig = {
    //: Boolean
    recur: true
  };

  /** Given a tree of possible lazily leaf nodes, force load all the leaves.
    * 
    * @param config :: ForceConfig
    * @param t :: Tree
    * @returns: Tree
    * @curried
    */
  var force = FK(function (config) {
    return function recur(t) {
      Object.keys(t).forEach(function (key, index, all) {
        var val = t[key];
        if (config.recur && val instanceof Tree) recur(val);
      });

      return t;
    };
  }, 1);

  /** Force evaluation of the leaves in a tree.
    * @type: (Tree, ForceConfig) -> Tree
    */
  Reqr.force = genAPI(force, forceConfig, Util.orObject);


  //: LoadConfig =
  var loadConfig = {
    //: Boolean,
    lazy: false,

    //: * -> *
    transform: Util.identity,

    //: (Modlet, Modlet) -> Modlet
    choose: Util.constant
  };

  //: String -> Modlet { path: String, module: * }
  var modlet = function (path) {
    return { path: path, module: require(path) };
  };

  /** Produce a cached version of `require` which selects which
    * file to load from a possible set of files based on a
    * configured `choose` method.
    * 
    * @type: (LoadConfig, path: String) -> () -> *
    */
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

  /** Given a LoadConfig, an object Key, a Tree, and a file path,
    * defines a leaf on the tree; that when accessed will `require`
    * the file path exactly once.
    * 
    * @type: (LoadConfig, key: String, t: Tree, path: String) -> Tree
    */
  var defineLoadLeaf = function (config, key, t, path) {
    t.__defineGetter__(key, include(config, path));
    return t;
  };

  /** Given a tree whose leaves are file paths, requier each leaf
    * possibly recursively, possibly lazily, etc.
    * 
    * @type: (Tree, LoadConfig) -> Tree
    */
  var load = FK(function (config) {
    return function recur(store) {

      var out = Object.keys(store).reduce(function (acc, key, index, all) {
        var val = store[key];

        if (val instanceof Tree) acc[key] = recur(val);
        else if (typeof val === 'string' || val instanceof Array) {
          defineLoadLeaf(config, key, acc, val);
        }
        return acc;
      }, tree());

      return config.lazy ? out
        : force({ recur: config.recur }, out);
    };
  }, 1);

  /** Given a tree whose leaves are file paths, `require` each leaf.
    * @type: (Tree, LoadConfig) -> Tree
    */
  Reqr.load = genAPI(load, loadConfig, Util.orThis(tree));


  //: DirConfig = LoadConfig + ScanConfig
  var dirConfig = Util.merge(loadConfig, scanConfig);

  /** Given config, and a path, scan the path, then load each file in the
    * resulting tree.
    * 
    * @type: (DirConfig, path: String) -> Tree
    */
  var dir = function (config, path) {
    return load(config, scan(config, path));
  };

  /** First scan, then load.
    * @type: (path: String, DirConfig) -> Tree
    */
  Reqr.dir = genAPI(dir, dirConfig, Util.orThis(Util.constant('.')));


  Reqr.Util = Util;

  return Reqr;
};