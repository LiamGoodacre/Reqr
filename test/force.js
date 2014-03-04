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

/** These tests involve defining getters at both the top-level
  * and one-level deep in an object structure.
  */
describe('force', function () {

  [
    //  Only top-level attributes should be realised when recur is false.
    {
      name: 'flat',
      config: { recur: false },
      //  Only the outer ones should be realised
      inner: undefined
    },

    //  All nested attributes should be realised when recur is true.
    {
      name: 'nested',
      config: { recur: true },
      //  Both should be realised
      inner: true
    }
  ].forEach(function (test) {

    describe(test.name, function () {
      var out = { outer: {}, inner: {} };

      var obj = Reqr.Tree();
      var sub = Reqr.Tree();
      var keys = ['foo', 'bar', 'baz'];

      keys.map(Def(obj, out.outer));
      keys.map(Def(sub, out.inner));

      obj.sub = sub;

      it('before: not set', function () {
        keys.forEach(function (key) {
          //  Neither should yet be realised
          should.equal(out.inner[key], undefined);
          should.equal(out.outer[key], undefined);
        });
      });

      it('apply force', function () {
        assert.doesNotThrow(function () {
          Reqr.force(obj, test.config);
        });
      });

      it('after: expected realised', function () {
        keys.forEach(function (key) {
          should.equal(out.inner[key], test.inner);
          should.equal(out.outer[key], true);
        });
      });
    });
  });
});