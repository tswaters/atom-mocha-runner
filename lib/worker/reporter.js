'use strict';

var _ = require('lodash');
var uuid = require('node-uuid');
var beautify = require('js-beautify').js_beautify;
var Highlight = require('highlight.js');
var Base = require('mocha/lib/reporters/base');

Highlight.configure({'useBR': true, 'languages': ['javascript']});

/**
 * Allows listening to events from the mocha reporter
 * @param {*} runner mocha runner.
 */
module.exports = function (runner) {
  Base.call(this, runner);

  // emit events from mocha passing along relevent arguments
  runner.on('start', function () {
    process.send({'message': 'mocha-start', 'data': this.stats});
  });

  runner.on('suite', function (suite) {
    if (suite.root) { return; }
    suite = cleanSuite(suite, true);
    process.send({'message': 'mocha-suite', 'data': suite});
    process.send({'message': 'mocha-stats', 'data': this.stats});
  });

  runner.on('suite end', function (suite) {
    if (suite.root) { return; }
    suite = cleanSuite(suite);
    process.send({'message': 'mocha-suite-end', 'data': suite});
    process.send({'message': 'mocha-stats', 'data': this.stats});
  });

  runner.on('test end', function (test) {
    test = cleanTest(test);
    process.send({'message': 'mocha-test-end', 'data': test});
    process.send({'message': 'mocha-stats', 'data': this.stats});
  });

  runner.on('hook end', function (hook) {
    hook = cleanTest(hook);
    process.send({'message': 'mocha-hook-end', 'data': hook});
    process.send({'message': 'mocha-stats', 'data': this.stats});
  });

  runner.on('pass', function (test) {
    test = cleanTest(test);
    process.send({'message': 'mocha-pass', 'data': test});
    process.send({'message': 'mocha-stats', 'data': this.stats});
  });

  runner.on('fail', function (test) {
    test = cleanTest(test);
    process.send({'message': 'mocha-fail', 'data': test});
    process.send({'message': 'mocha-stats', 'data': this.stats});
  });

  runner.on('end', function () {
    process.send({'message': 'mocha-end', 'data': this.stats});
  });
};

/**
 * Clean a suite to only return information we're interested in.
 * @param {Suite} suite data to work against
 * @param {boolean} includeTests whether to include tests - need to avoid circular references
 * @returns {*} cleaned suite.
 */
function cleanSuite (suite, includeTests) {
  if (!suite.uuid) { suite.uuid = uuid.v4(); }
  var hooks = _.union(
    suite._beforeAll,
    suite._beforeEach,
    suite._afterEach,
    suite._afterAll
  );
  var passingTests = _.where(suite.tests, {'state': 'passed'});
  var failingTests = _.where(suite.tests, {'state': 'failed'});
  var failingHooks = _.where(hooks, {'state': 'failed'});
  var cleaned = {
    'uuid': suite.uuid,
    'title': suite.title,
    'fullFile': suite.file || '',
    'file': suite.file && suite.parent.root ? suite.file : '',
    'passes': passingTests.length,
    'failures': failingTests.length,
    'pending': suite.tests.length - passingTests.length - failingTests.length,
    'hooksFailed': failingHooks.length > 0,
    'duration': _.sum(hooks, 'duration') + _.sum(suite.tests, 'duration')
  };

  if (!suite.parent.root) {
    cleaned.parent = cleanSuite(suite.parent);
  }

  if (includeTests) {
    var tests = [];
    Array.prototype.push.apply(tests, _.map(suite._beforeAll, cleanTest));
    Array.prototype.push.apply(tests, _.map(suite._beforeEach, cleanTest));
    Array.prototype.push.apply(tests, _.map(suite.tests, cleanTest));
    Array.prototype.push.apply(tests, _.map(suite._afterEach, cleanTest));
    Array.prototype.push.apply(tests, _.map(suite._afterAll, cleanTest));
    cleaned.tests = tests;
  }
  return cleaned;
}

/**
 * Clean a test or hook to only return information we're interested in.
 * @param {Test|Hook} test data to work against
 * @returns {*} cleaned test.
 */
function cleanTest (test) {
  if (!test.uuid) { test.uuid = uuid.v4(); }
  var code = '';
  var err = test.err ? _.pick(test.err, ['name', 'message', 'stack']) : null;
  if (test.fn) {
    code = beautify(test.fn.toString(), {'indent_size': 2});
    code = Highlight.highlightAuto(code).value;
    code = Highlight.fixMarkup(code);
  }

  if (err && err.stack) {
    err.stack = Highlight.fixMarkup(Highlight.highlightAuto(err.stack).value);
  }

  var cleaned = {
    'uuid': test.uuid,
    'title': test.title,
    'fullTitle': test.fullTitle(),
    'timedOut': test.timedOut,
    'duration': test.duration || 0,
    'state': test.state,
    'speed': test.speed,
    'pass': test.state === 'passed',
    'fail': test.state === 'failed',
    'pending': test.pending,
    'code': code,
    'err': err,
    'isRoot': test.parent.root,
    'parent': cleanSuite(test.parent)
  };

  cleaned.skipped = !cleaned.pass && !cleaned.fail && !cleaned.pending;

  return cleaned;
}
