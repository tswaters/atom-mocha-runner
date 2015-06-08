
'use strict';

/**
 * @file lib/runner.js
 * Main file for the runner.
 */

var fs = require('fs');
var path = require('path');

var CompositeDisposable = require('atom').CompositeDisposable;
var Emitter = require('atom').Emitter;

var _ = require('lodash');
var Mocha = require('mocha');
var utils = require('mocha').utils;
var Reporter = require('./reporter');

var Runner = module.exports = function Runner () {
  var self = this;
  this.emitter = new Emitter();
  this.reporter = new Reporter();
  this.subscriptions = new CompositeDisposable(
    this.reporter.on('mocha-start', function(e) { self.emitter.emit('mocha-start', e); }),
    this.reporter.on('mocha-suite', function(e) { self.emitter.emit('mocha-suite', e); }),
    this.reporter.on('mocha-suite-end', function(e) { self.emitter.emit('mocha-suite-end', e); }),
    this.reporter.on('mocha-test-end', function(e) { self.emitter.emit('mocha-test-end', e); }),
    this.reporter.on('mocha-hook-end', function(e) { self.emitter.emit('mocha-hook-end', e); }),
    this.reporter.on('mocha-pending', function(e) { self.emitter.emit('mocha-pending', e); }),
    this.reporter.on('mocha-pass', function(e) { self.emitter.emit('mocha-pass', e); }),
    this.reporter.on('mocha-fail', function(e) { self.emitter.emit('mocha-fail', e); }),
    this.reporter.on('mocha-end', function(e) { self.emitter.emit('mocha-end', e); })
  );
};

Runner.prototype.on = function (event, handler) {
  return this.emitter.on(event, handler);
};

Runner.prototype.dispose = function () {
  this.subscriptions.dispose();
  this.emitter.dispose();
  this.reporter.dispose();
};

Runner.prototype.run = function () {

  // grab the options from mocha.opts and global options
  var mochaOpts = getMochaOpts();
  mochaOpts.reporter = Reporter.reporter;

  // find the files we intend to run against.
  var testDir = getDirectory();
  var files = utils.lookupFiles(testDir, ['js'], mochaOpts.recursive);

  // instantiate mocha, load the files and run.
  var mocha = new Mocha(mochaOpts);
  files.forEach(function (file) { mocha.addFile(file); });

  mocha.run(function () {
    // once finished, clear out module cache so they can run again.
    files.forEach(function (file) {
      delete require.cache[file];
    });
  });

};

function getDirectory() {
  var testPath = atom.config.get('mocha-runner.test-directory');
  var directory;
  var activePane = atom.workspace.getActivePaneItem();
  if (activePane && activePane.getPath) {
    directory = atom.project.relativizePath(activePane.getPath())[0];
  }
  else {
    directory = atom.project.getPaths()[0];
  }
  return path.join(directory, testPath);
}

function getMochaOpts (directory) {
  var mochaOpts = {};
  try {
    var contents = fs.readFileSync(path.join(directory), 'mocha.opts');
    mochaOpts = contents.split('\n').map(function (option) {
      var ret = {};
      var opt = option.slice(2).split(' '); // remove '--', split by space
      if (opt.length === 2) {
        ret[opt[0]] = opt[1];
      }
      else if (opt.length === 1) {
        ret[opt[0]] = true;
      }
      return opt;
    });
  }
  catch (e) {
    // ENOENT likely
  }
  return _.merge({
    'recursive': atom.config.get('mocha-runner.recursive'),
    'interface': atom.config.get('mocha-runner.interface')
  }, mochaOpts);
}
