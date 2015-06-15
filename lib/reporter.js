'use strict';

var _ = require('lodash');
var uuid = require('node-uuid');
var Highlight = require('highlight.js');
var Emitter = require('atom').Emitter;
var Base = require('mocha/lib/reporters/base');
var reporterInstance;
var DirectoryUtil = require('./directory');

Highlight.configure({'useBR': true, 'languages': ['javascript']});

/**
 * Reporter interface.
 * Allows us to add events to listen to while providing a reporter for mocha.
 * @constructor
 */
var Reporter = module.exports = function () {
  this.emitter = new Emitter();
  reporterInstance = this;
};

/**
 * Attach event handler.
 * @param {string} event event name
 * @param {function} handler function to run.
 * @returns {Disposable} a disposable.
 */
Reporter.prototype.on = function (event, handler) {
  return this.emitter.on(event, handler);
};

/**
 * Dispose all the things!
 */
Reporter.prototype.dispose = function () {
  this.emitter.dispose();
};

/**
 * Expose a reporter function that mocha can hook into.
 * @param {*} runner runner instance.
 */
module.exports.reporter = function (runner) {
  var self = reporterInstance;
  Base.call(this, runner);

  // emit events from mocha passing along relevent arguments
  runner.on('start', function() {
    self.emitter.emit('mocha-start', this.stats);
  });

  runner.on('suite', function (suite) {
    if (suite.root) { return; }
    suite = cleanSuite(suite, true);
    self.emitter.emit('mocha-suite', suite);
    self.emitter.emit('mocha-stats', this.stats);
  });

  runner.on('suite end', function (suite) {
    if (suite.root) { return; }
    suite = cleanSuite(suite);
    self.emitter.emit('mocha-suite-end', suite);
    self.emitter.emit('mocha-stats', this.stats);
  });

  runner.on('test end', function(test) {
    test = cleanTest(test);
    self.emitter.emit('mocha-test-end', test);
    self.emitter.emit('mocha-stats', this.stats);
  });

  runner.on('hook end', function (hook) {
    hook = cleanTest(hook);
    self.emitter.emit('mocha-hook-end', hook);
    self.emitter.emit('mocha-stats', this.stats);
  });

  runner.on('pass', function(test) {
    test = cleanTest(test);
    self.emitter.emit('mocha-pass', test);
    self.emitter.emit('mocha-stats', this.stats);
  });

  runner.on('fail', function(test) {
    test = cleanTest(test);
    self.emitter.emit('mocha-fail', test);
    self.emitter.emit('mocha-stats', this.stats);
  });

  runner.on('end', function() {
    console.log(this);
    self.emitter.emit('mocha-end', this.stats);
  });
};

/**
 * Perform some cleaning on the code.
 * @param {string} str code to clean.
 * @returns {string} cleaned code.
 */
function cleanCode (str) {
  str = str
    .replace(/\r\n?|[\n\u2028\u2029]/g, '\n').replace(/^\uFEFF/, '')
    .replace(/^function *\(.*\) *{|\(.*\) *=> *{?/, '')
    .replace(/\s+\}$/, '');
  var spaces = str.match(/^\n?( *)/)[1].length,
      tabs = str.match(/^\n?(\t*)/)[1].length,
      re = new RegExp('^\n?' + (tabs ? '\t' : ' ') + '{' + (tabs ? tabs : spaces) + '}', 'gm');
  str = str.replace(re, '');
  str = str.replace(/^\s+|\s+$/g, '');
  return str;
}

/**
 * Clean a suite to only return information we're interested in.
 * @param {Suite} suite data to work against
 * @param {boolean} includeTests whether to include tests - need to avoid circular references
 * @returns {*} cleaned suite.
 */
function cleanSuite (suite, includeTests) {
  if (!suite.uuid) { suite.uuid = uuid.v4(); }
  var passingTests = _.where(suite.tests, {'state': 'passed'});
  var failingTests = _.where(suite.tests, {'state': 'failed'});
  var pendingTests = suite.tests.length - passingTests.length - failingTests.length;
  var cleaned = {
    'uuid': suite.uuid,
    'title': suite.title,
    'fullFile': suite.file || '',
    'file': suite.file && suite.parent.root ? suite.file.replace(DirectoryUtil.getDirectoryRegExp(), '') : '',
    'passes': passingTests.length,
    'failures': failingTests.length,
    'pending': pendingTests,
    'duration':
      _.sum(suite._beforeAll, 'duration') +
      _.sum(suite._beforeEach, 'duration') +
      _.sum(suite.tests, 'duration') +
      _.sum(suite._afterEach, 'duration') +
      _.sum(suite._afterAll, 'duration')
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
    code = cleanCode(test.fn.toString());
    code = Highlight.fixMarkup(Highlight.highlightAuto(code).value);
  }

  if (err && err.stack) {
    var stack = err.stack.replace(DirectoryUtil.getDirectoryRegExp(), '');
    err.stack = Highlight.fixMarkup(Highlight.highlightAuto(stack).value);
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
