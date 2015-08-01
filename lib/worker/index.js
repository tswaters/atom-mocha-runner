/*eslint no-process-exit:0 */
/**
 * @description worker for mocha process
 * @file lib/worker/index.js
 */

'use strict';
var vm = require('vm');
var path = require('path');
var loophole = require('loophole');
var Mocha = require('mocha');
var MochaUtils = require('mocha').utils;

// if something bad happens, handle it here and send it back to parent process.
// otherwise the process dies without any indication - ensure processs exits as
// well. console.error is useless here because this is a separate process from
// the one the debugger may be attached to.

process.on('uncaughtException', function (e) {
  process.send({
    'message': 'error',
    'data': {
      'message': e.message,
      'code': e.code,
      'stack': e.stack
    }
  });
  process.exit(1);
});

Object.defineProperty(global, 'console', {
  'get': function () {
    return {
      'log': function () { process.send({'message': 'console:log', 'data': [].slice.call(arguments) }); },
      'warn': function () { process.send({'message': 'console:warn', 'data': [].slice.slice.call(arguments) }); },
      'error': function () { process.send({'message': 'console:error', 'data': [].slice.slice.call(arguments) }); }
    };
  }
});

// when receiving a message, start the mocha process.
// the message includes project directory, options and the test directory.
// instantiate mocha, set up options not available via constructor & run it.

process.on('message', function (data) {
  var projectDir = data.projectDir;
  var mochaOpts = data.mochaOpts;

  mochaOpts.opts.reporter = require('./reporter');

  var mocha = new Mocha(mochaOpts.opts);

  var ext = ['js'];

  // load any requires
  mochaOpts.requires.forEach(function (req) {
    require(req);
  });

  // load any compilers, add extensions for lookup.
  mochaOpts.compilers.forEach(function (compiler) {
    require(compiler.mod);
    ext.push(compiler.ext);
  });

  // set up the environment to work properly in an atom context.
  process.chdir(projectDir);
  global.Function = loophole.Function;
  global.eval = function (source) {
    return vm.runInThisContext(source);
  };

  // add files to mocha
  var files = [];

  mochaOpts.paths.forEach(function (p) {
    files = files.concat(MochaUtils.lookupFiles(p, ext, mochaOpts.recursive));
  });

  files = files.map(function (p) {
    return path.resolve(p);
  });

  // are we sorting?
  if (mochaOpts.sort) {
    files.sort();
  }

  files.forEach(function (file) {
    mocha.addFile(file);
  });


  // run the tests - noExit defers exit until exit is fired.
  var runner = mocha.run(mochaOpts.noExit ? exitLater : process.exit);

  function exitLater (code) {
    process.on('exit', function () { process.exit(code); });
  }

  // could come in handy?
  process.on('SIGINT', function () { runner.abort(); });

});
