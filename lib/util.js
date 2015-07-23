/**
 * Utilities.
 * @file lib/util
 */
'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('lodash');

/**
 * Retrieves the current project directory from atom.
 * @returns {string} current project directory.
 */
module.exports.getProjectDirectory = function () {
  return atom.project.getPaths()[0];
};

/**
 * Retrieves the path to the mocha opts file (based on atom options)
 * @returns {string} path to mocha.opts.
 */
module.exports.getTestDirectory = function () {
  return path.join(exports.getProjectDirectory(), atom.config.get('mocha-runner.test-directory'));
};

/**
 * Retrieve mocha options from the mocha.opts file.
 * Any options that can be passed to the mocha constructor are under 'opts'
 * Others require extra work (@see ./mocha/bin), these have been reimplemented.
 * @returns {{
 *  directory: string,
 *  opts: object,
 *  requires: array,
 *  compilers: array,
 *  recursive: boolean,
 *  noExit: boolean,
 *  sort: boolean
 * }} options from mocha.opts
 */
module.exports.getMochaOpts = function () {

  var contents = '';
  var args = {

    // command lines args that can be mapped to option recognized by Mocha
    '-A': 'asyncOnly', '--async-only': 'asyncOnly',
    '-b': 'bail', '--bail': 'bail',
    '-g': 'grep', '--grep': 'grep',
    '-i': 'invert', '--invert': 'invert',
    '-s': 'slow', '--slow': 'slow',
    '-t': 'timeout', '--timeout': 'timeout',
    '-u': 'ui', '--ui': 'ui',
    '--globals': 'globals',
    '--inline-diffs': 'inlineDiffs',

    // opposites - constructor args passed as opposites via command line
    '--check-leaks': 'checkLeaks',
    '--no-timeouts': 'noTimeouts',

    // command line args - things that need to run external to mocha constructor
    '--compilers': 'compilers',
    '-r': 'require', '--require': 'require',
    '-S': 'sort', '--sort': 'sort',
    '--recursive': 'recursive',
    '--no-exit': 'noExit'

    // unsupported options - may add these later, kind of incompatible.
    // '-w': 'watch', '--watch': 'watch'
    // '--watch-extensions': 'watchExtensions'
    // '-g': 'growl', '--growl': 'growl'
  };

  // these values we can take right out of the command line args.
  var constructorArgs = [
    'asyncOnly',
    'bail',
    'grep',
    'invert',
    'slow',
    'timeout',
    'ui',
    'globals',
    'inlineDiffs',
    'ignoreLeaks',
    'enableTimeouts'
  ];

  var paths = [];
  var testDirectory = exports.getTestDirectory();

  try { contents = fs.readFileSync(path.join(testDirectory, 'mocha.opts')).toString(); }
  catch (e) { /*ENOENT*/ }

  var opts = contents
    .trim()
    .split(/\n/)
    .reduce(function (ret, item) {
      var opt = item.split(' ');
      var optName = opt[0];
      var optValue = opt[1] || true;
      if (!args[optName]) { paths.push(optName); return ret; }
      ret.push({'name': args[optName], 'value': optValue});
      return ret;
    }, []);

  var requires = _(opts)
    .filter({'name': 'require'})
    .pluck('value')
    .value();

  var compilers = _(opts)
    .filter({'name': 'compilers'})
    .pluck('value')
    .map(function (c) {
      var s = c.split(':');
      return {'ext': s[0], 'mod': s[1]};
    })
    .value();

  var construct = _(opts)
    .filter(function (opt) {
      return constructorArgs.indexOf(opt.name) > -1;
    })
    .transform(function (result, value) {
      result[value.name] = value.value;
    }, {})
    .assign({
      'enableTimeouts': !_(opts).any({'name': 'noTimeouts'}),
      'ignoreLeaks': !_(opts).any({'name': 'checkLeaks'})
    })
    .value();

  return {
    'paths': paths,
    'directory': testDirectory,
    'opts': construct,
    'requires': requires,
    'compilers': compilers,
    'recursive': _.any(opts, {'name': 'recursive'}),
    'noExit': _.any(opts, {'name': 'noExit'}),
    'sort': _.any(opts, {'name': 'sort'})
  };
};
