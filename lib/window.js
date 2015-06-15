
'use strict';

var remote = require('remote');
var CompositeDisposable = require('atom').CompositeDisposable;

var Window = module.exports = function Window (runner, ready) {
  var self = this;
  var BrowserWindow = remote.require('browser-window');

  this.subscriptions = new CompositeDisposable();

  // open up a new browser window pointing at runner.html
  this.window = new BrowserWindow({
    'width': '500px'
  });
  this.window.setMenuBarVisibility(false);
  this.window.loadUrl('file://' + require.resolve('../window/index.html'));

  // when it closes, dispose of everything.
  this.window.on('closed', function() {
    self.subscriptions.dispose();
    self.window = null;
  });

  // when it has loaded, wire up events listening to mocha's events.
  this.window.webContents.on('did-finish-load', function() {
    self.subscriptions.add(runner.on('mocha-start', function(e) { self.window.webContents.send('mocha-start', e); }));
    self.subscriptions.add(runner.on('mocha-suite', function(e) { self.window.webContents.send('mocha-suite', e); }));
    self.subscriptions.add(runner.on('mocha-suite-end', function(e) { self.window.webContents.send('mocha-suite-end', e); }));
    self.subscriptions.add(runner.on('mocha-test-end', function(e) { self.window.webContents.send('mocha-test-end', e); }));
    self.subscriptions.add(runner.on('mocha-hook-end', function(e) { self.window.webContents.send('mocha-hook-end', e); }));
    self.subscriptions.add(runner.on('mocha-pending', function(e) { self.window.webContents.send('mocha-pending', e); }));
    self.subscriptions.add(runner.on('mocha-pass', function(e) { self.window.webContents.send('mocha-pass', e); }));
    self.subscriptions.add(runner.on('mocha-fail', function(e) { self.window.webContents.send('mocha-fail', e); }));
    self.subscriptions.add(runner.on('mocha-end', function(e) { self.window.webContents.send('mocha-end', e); }));
    ready();
  });

};

Window.prototype.dispose = function () {
  this.subscriptions.dispose();
  if (this.window) { this.window.destroy(); }
};
