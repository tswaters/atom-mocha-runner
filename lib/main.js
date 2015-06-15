'use strict';


module.exports = {
  'config': {
    'mocha-arguments': {
      'type': 'string',
      'default': ''
    },
    'test-directory': {
      'type': 'string',
      'default': 'test'
    },
    'recursive': {
      'type': 'boolean',
      'default': true
    },
    'interface': {
      'type': 'string',
      'default': 'bdd',
      'enum': ['bdd', 'tdd', 'exports', 'qunit', 'require']
    }
  },
  'activate': function () {
    var self = this;
    var CompositeDisposable = require('atom').CompositeDisposable;
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.commands.add('atom-workspace', 'mocha-runner:run-specs', function () {

      // lazy load this stuff to save startup time.
      var Runner = require('./runner');
      var Window = require('./window');

      // make sure things are disposed before running again.
      if (self.runner) { self.runner.dispose(); }
      if (self.window) { self.window.dispose(); }

      self.runner = new Runner();
      self.window = new Window(self.runner, function () {
        self.runner.run();
      });

    }));
  },
  'deactivate': function () {
    this.window.dispose();
    this.subscriptions.dispose();
    this.runner.dispose();
  }
};
