
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
};

Runner.prototype.on = function (event, handler) {
  return this.emitter.on(event, handler);
};

Runner.prototype.dispose = function () {
  this.emitter.dispose();
};

Runner.prototype.run = function () {
  var self = this;
  var child = cp.fork(path.join(__dirname, 'worker.js'));
  child.on('message', function (m) {
    if (m.message && m.data) {
      self.emitter.emit(m.message, m.data);
    }
  });
  child.send({
    'mochaOpts': Utils.getMochaOpts(),
    'testDir': Utils.getWorkingDirectory(),
    'projectDir': Utils.getProjectDirectory(),
    'directoryRegExp': Utils.getDirectoryRegExp()
  });
};
