'use strict';


module.exports = {
  'config': {
    'test-directory': {
      'title': 'Test Directory',
      'description': 'Loads mocha.opts and tests from this directory',
      'type': 'string',
      'default': 'test'
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
        if (!self.runner.run()) {
          self.runner.dispose();
          return false;
        }
        return true;
      });

    }));
  },
  'deactivate': function () {
    this.window.dispose();
    this.subscriptions.dispose();
    this.runner.dispose();
  }
};
