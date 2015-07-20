/**
 * Utilities for directories.
 * @file lib/directory
 */
'use strict';

var path = require('path');
var escape = require('escape-regexp');

module.exports.getProjectDirectory = function () {
  return atom.project.getPaths()[0];
}

module.exports.getWorkingDirectory = function () {
  var testPath = atom.config.get('mocha-runner.test-directory');
  var directory = exports.getProjectDirectory();
  return path.join(directory, testPath);
 };

module.exports.getDirectoryRegExp = function () {
  var dir = exports.getWorkingDirectory();
  return new RegExp(escape(dir), 'g');
};
