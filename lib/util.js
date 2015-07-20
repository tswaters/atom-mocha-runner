/**
 * Utilities for directories.
 * @file lib/directory
 */
'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var escape = require('escape-regexp');

module.exports.getProjectDirectory = function () {
  return atom.project.getPaths()[0];
};

module.exports.getWorkingDirectory = function () {
  var testPath = atom.config.get('mocha-runner.test-directory');
  var directory = exports.getProjectDirectory();
  return path.join(directory, testPath);
};

module.exports.getDirectoryRegExp = function () {
  var dir = exports.getWorkingDirectory();
  return escape(dir);
};

module.exports.getMochaOpts = function (directory) {
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
};
