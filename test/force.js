var assert = require('assert');
var should = require('should');
var Reqr = require('../reqr');

var Def = function (on, to) {
  return function (key) {
    on.__defineGetter__(key, function () {
      to[key] = true;
    });
  };
};


describe('force', function () {

  describe('basic', function () {
    var out = {};
    var obj = {};
    var def = Def(obj, out);
    var keys = ['foo', 'bar', 'baz'];

    keys.map(def);

    it('before: not set', function () {
      keys.forEach(function (key) {
        should.equal(out[key], undefined);
      });
    });

    it('apply force', function () {
      assert.doesNotThrow(function () {
        Reqr.force(obj);
      });
    });

    it('after: all evaluated', function () {
      keys.forEach(function (key) {
        should.equal(out[key], true);
      });
    });
  });
});
