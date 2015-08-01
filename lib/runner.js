
'use strict';

/**
 * @file lib/runner.js
 * Main file for the runner.
 */

var path = require('path');
var cp = require('child_process');
var Utils = require('./util');
var Emitter = require('atom').Emitter;

var Runner = module.exports = function Runner () {
  this.emitter = new Emitter();
  this.on('console:log', function (args) { console.log.apply(console, args); });
  this.on('console:warn', function (args) { console.warn.apply(console, args); });
  this.on('console:error', function (args) { console.error.apply(console, args); });
};

Runner.prototype.on = function (event, handler) {
  return this.emitter.on(event, handler);
};

Runner.prototype.dispose = function () {
  this.emitter.dispose();
};

Runner.prototype.run = function () {
  var self = this;
  var child = cp.fork(path.join(__dirname, 'worker', 'index.js'));
  child.on('message', function (m) {

    // upon unhandled exceptions, create a new error with the same stack
    // for whatever reason the error details are not persisted across 'send'
    // it turns it into an object without the error's prototype reference.
    // so additional properties (stack, message) are carried over explicitly.

    if (m.message === 'error') {
      var err = new Error(m.data.message);
      err.message = m.data.message;
      err.code = m.data.code;
      err.stack = m.data.stack;
      throw err;
    }

    else if (m.message && m.data) {
      self.emitter.emit(m.message, m.data);
    }
  });

  child.send({
    'mochaOpts': Utils.getMochaOpts(),
    'projectDir': Utils.getProjectDirectory()
  });
};
