

'use strict';
var vm = require('vm');
var loophole = require('loophole');
var Mocha = require('mocha');
var MochaUtils = require('mocha').utils;
var _ = require('lodash');

// worker for mocha process

process.on('message', function (data) {
  var projectDir = data.projectDir;
  var testDir = data.testDir;
  var mochaOpts = data.mochaOpts;

  // set up the environment to work properly in an atom context.
  var oldEval = global.eval;
  var oldFunction = global.Function;
  var oldDir = process.cwd();
  process.chdir(projectDir);
  global.Function = loophole.Function;
  global.eval = function (source) {
    return vm.runInThisContext(source);
  };

  var mocha = new Mocha(_.merge(mochaOpts, {
    'reporter': require('./reporter')({
      'directoryRegExpStr': data.directoryRegExp
    })
  }));

  // add each of the files found to mocha prior to running.
  MochaUtils.lookupFiles(testDir, ['js'], mochaOpts.recursive).forEach(function (file) {
    mocha.addFile(file);
  });

  mocha.run(function () {
    // once done, restore environment & kill the process
    global.eval = oldEval;
    global.Function = oldFunction;
    process.chdir(oldDir);
    process.kill();
  });

});
