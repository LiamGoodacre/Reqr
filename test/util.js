var should = require('should');
var U = require('../lib/util');


describe('util', function () {

  it('identity', function () {
    U.identity(42).should.eql(42);
    var f = function (a) { return a * 10 };
    U.identity(f, 6).should.eql(60);
    U.identity(f)(6).should.eql(60);
  });

  it('extend', function () {
    var dest = { keep: 'keep', change: 'old' };
    var src = { change: 'new', extra: 'extra' };
    var out = U.extend(dest, src);
    out.should.eql(dest);
    out.should.eql({ keep: 'keep', change: 'new', extra: 'extra' });
  });

  it('merge', function () {
    var dest = { keep: 'keep', change: 'old' };
    var src = { change: 'new', extra: 'extra' };
    var out = U.merge(dest, src);
    dest.should.eql({ keep: 'keep', change: 'old' });
    out.should.eql({ keep: 'keep', change: 'new', extra: 'extra' });
  });

  it('isEmpty', function () {
    U.isEmpty({}).should.be.true;
    U.isEmpty({ a: 'a' }).should.be.false;
  });

  it('replace', function () {
    U.replace(/a/g, '_', 'bacada').should.eql('b_c_d_');
  });

  it('compose', function () {
    var f = function (a) { return a * 10; }
    var g = function (a) { return a + 1; }
    U.compose(f, g, 5).should.eql(60);
    U.compose(f, g)(5).should.eql(60);
  });

  it('seq', function () {
    var f = function (a) { return a * 10; }
    var g = function (a) { return a + 1; }
    U.seq([f, g], 5).should.eql(60);
    U.seq([f, g])(5).should.eql(60);
  });

  it('emptyObject', function () {
    U.emptyObj().should.eql({});
  });

  it('constant', function () {
    U.constant(1, 2).should.eql(1);
    U.constant(1)(2).should.eql(1);
    U.constant(1)().should.eql(1);
  });

  it('orThis', function () {
    U.orThis(function () { return 'Foo' }, 'Bar').should.eql('Bar');
    U.orThis(function () { return 'Foo' }, null).should.eql('Foo');
  });

  it('orObject', function () {
    U.orObject({ foo: 'bar' }).should.eql({ foo: 'bar' });
    U.orObject(null).should.eql({});
  });

  it('jsExt', function () {
    'script.js'.match(U.jsExt).should.not.eql(null);
    should.equal('data.json'.match(U.jsExt), null);
    should.equal('nothing'.match(U.jsExt), null);
  });

  it('matchExt', function () {
    'script.js'.match(U.matchExt).should.not.eql(null);
    'data.json'.match(U.matchExt).should.not.eql(null);
    should.equal('nothing'.match(U.matchExt), null);
  });

  it('case conversions', function () {
    var file = 'index component_version:6.5.4 script.js';

    var expected =  {
      camel: 'indexComponentVersion654ScriptJs',
      camelNo: 'indexComponentVersion654Script',
      proper: 'IndexComponentVersion654ScriptJs',
      properNo: 'IndexComponentVersion654Script',
      snake: 'index_component_version_6_5_4_script_js',
      snakeNo: 'index_component_version_6_5_4_script',
      hyphenated: 'index-component-version-6-5-4-script-js',
      hyphenatedNo: 'index-component-version-6-5-4-script'
    };

    var outcome = {
      camel: U.camelCase(file),
      camelNo: U.camelCaseNoExt(file),

      proper: U.properCase(file),
      properNo: U.properCaseNoExt(file),

      snake: U.snakeCase(file),
      snakeNo: U.snakeCaseNoExt(file),

      hyphenated: U.hypenatedCase(file),
      hyphenatedNo: U.hypenatedCaseNoExt(file)
    };

    should.deepEqual(outcome, expected);
  });
});