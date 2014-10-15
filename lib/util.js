var Util = exports;
var FK = require('fk');


/** The identity function.
  * @type: a -> a
  * @curried
  */
Util.identity = FK(function (v) { return v; }, 1);

/** Extend an object with a set of properties.
  * @type: (Object, Object) -> Object
  * @curried
  */
Util.extend = FK(function (dest, src) {
  Object.keys(src).forEach(function (key) {
    var val = src[key];
    dest[key] = (val === undefined) ? dest[key] : val;
  });

  return dest;
}, 2);

/** Merges using `extend` without mutating either of the objects.
  * @type: (Object, Object) -> Object
  * @curried
  */
Util.merge = FK(function (base, ext) {
  return [base, ext].reduce(function (acc, obj, all) {
    return Util.extend(acc, obj);
  }, {});
}, 2);

/** True if an object has 0 keys.
  * @type: Object -> Boolean
  */
Util.isEmpty = function (obj) {
  return Object.keys(obj).length === 0;
};

/** String.replace
  * @type: (RegExp | String, String, String) -> String
  * @curried
  */
Util.replace = FK(function (pattern, replacement, str) {
  return str.replace(pattern, replacement);
}, 3);

/** Function composition:
  *   compose f g v = f (g v)
  * 
  * @type: (b -> c, a -> b, a) -> c
  */
Util.compose = FK(function (f, g, v) {
  return f(g(v));
}, 3);

/** Function composition:
  *   seq [f, g, h] v = f (g (h v))
  * 
  * @type ([a -> a], a) -> a
  */
Util.seq = FK(function (fs) {
  return fs.reduce(function (a, b) {
    return Util.compose(a, b);
  }, Util.identity);
}, 1);

/** Creates a new empty object
  * @type: () -> Object
  */
Util.emptyObj = FK(function () { return {}; }, 1);

/** The constant function.
  * @type: (a, b) -> a
  */
Util.constant = FK(function (a, b) { return a; }, 2);

/** Return a value if truthy, else the result of executing a function.
  * @type (() -> b, b) -> b
  */
Util.orThis = FK(function (b, a) { return a || b(); }, 2);

/** When given an object, act as the identity function.  When given null
  * return the empty object.
  * 
  * @type: (Null | Object) -> Object
  */
Util.orObject = Util.orThis(Util.emptyObj);

/** Match a `.js` extention
  * @type: RegExp
  */
Util.jsExt = /\.js$/;

/** Match any proper filename extention.
  * @type: RegExp
  */
Util.matchExt = /\.\w+$/;

/** Remove any proper extention
  * @type: String -> String
  */
Util.noExt = Util.replace(Util.matchExt, '');

/** Convert a string to camel case.
  * @type: String -> String
  */
Util.camelCase = Util.replace(/^[\W_]*|[\W_]+(\w?)/g, function (m, a) {
  return (a || '').toUpperCase();
});

/** Remove any proper extention and convert to camel case.
  * @type: String -> String
  */
Util.camelCaseNoExt = Util.seq([ Util.camelCase, Util.noExt ]);

/** Convert a string to proper case.
  * @type: String -> String
  */
Util.properCase = Util.replace(/^[\W_]*(\w)|[\W_]+(\w?)/g, function (m, a, b) {
  return (a || b || '').toUpperCase();
});

/** Remove any proper extention and convert to proper case.
  * @type: String -> String
  */
Util.properCaseNoExt = Util.seq([ Util.properCase, Util.noExt ]);

/** Convert a string to snake case.
  * @type: String -> String
  */
Util.snakeCase = Util.replace(/^[\W_]*|[\W_]+(\w?)/g, function (m, a) {
  return a ? '_' + a : '';
});

/** Remove any proper extention and convert to snake case.
  * @type: String -> String
  */
Util.snakeCaseNoExt = Util.seq([ Util.snakeCase, Util.noExt ]);

/** Convert a string to hypenated case.
  * @type: String -> String
  */
Util.hypenatedCase = Util.replace(/^[\W_]*|[\W_]+(\w?)/g, function (m, a) {
  return a ? '-' + a : '';
});

/** Remove any proper extention and convert to hypenated case.
  * @type: String -> String
  */
Util.hypenatedCaseNoExt = Util.seq([ Util.hypenatedCase, Util.noExt ]);
