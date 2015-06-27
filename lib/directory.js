/**
 * Utilities for directories.
 * @file lib/directory
 */
'use strict';

var path = require('path');
var escape = require('escape-regexp');

module.exports.getWorkingDirectory = function () {
  var testPath = atom.config.get('mocha-runner.test-directory');
  var directory = atom.project.getPaths()[0];
  return path.join(directory, testPath);
 };

module.exports.getDirectoryRegExp = function () {
  var dir = exports.getWorkingDirectory();
  return new RegExp(escape(dir), 'g');
};
