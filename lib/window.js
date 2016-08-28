
'use strict';

var remote = require('electron').remote;
var CompositeDisposable = require('atom').CompositeDisposable;

var Window = module.exports = function Window (runner, ready) {
  var self = this;
  var BrowserWindow = remote.BrowserWindow;

  this.subscriptions = new CompositeDisposable();

  // open up a new browser window pointing at runner.html
  this.window = new BrowserWindow({
    'width': '500px',
    'show': false
  });
  this.window.setMenuBarVisibility(false);
  this.window.webContents.loadUrl('file://' + require.resolve('../window/index.html'));

  // when it closes, dispose of everything.
  this.window.on('closed', function () {
    self.subscriptions.dispose();
    self.window = null;
  });

  // when it has loaded, wire up events listening to mocha's events.
  this.window.webContents.on('did-finish-load', function () {

    self.subscriptions.add(runner.on('mocha', function (e) {
      self.window.webContents.send('mocha', e)
    }))

    if (ready()) {
      self.window.show();
    }
    else {
      self.dispose();
    }
  });

};

Window.prototype.dispose = function () {
  this.subscriptions.dispose();
  if (this.window) { this.window.destroy(); }
};
