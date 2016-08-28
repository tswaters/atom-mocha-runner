

'use strict';

var ipc = require('electron').ipcRenderer;
var ejs = require('ejs');
var fs = require('fs');

var headerDiv = document.getElementById('header');
var suitesUl = document.getElementById('suites');

var header = compileTemplate('./partial/header.ejs');
var suite = compileTemplate('./partial/suite.ejs');

ipc.on('mocha', function handleMessage (event, message) {

  var data = message.data

  // when starting, initialize the header
  if (message.type === 'mocha-start') {
    $(headerDiv).append(header(data));
  }

  // when starting a new suite, create a container to house results
  // this is either an existing element (if message.parent present) or the root suites ul
  if (message.type === 'mocha-suite') {
    var parent = message.parent ? '#' + message.parent.uuid + '> .children' : suitesUl
    $(parent).append(suite(data))
  }

  // when starting/finishing or receiving stats update the header with new stats
  if ([
    'mocha-start',
    'mocha-end',
    'mocha-stats'
  ].indexOf(message.type) > -1) {
    updateHeader(data)
  }

  // when results come back for a test,
  // update the test and the parent describe block stats
  if ([
    'mocha-test-end',
    'mocha-hook-end',
    'mocha-pending',
    'mocha-pass',
    'moca-fail'
  ].indexOf(message.type) > -1) {
    updateSuite(data.parent)
    updateTest(data)
  }

  // when the suite is finished, update its header with any failures
  if (message.type === 'mocha-suite-end') {
    updateSuite(data)
    finishSuite(data)
  }

});

function updateHeader (data) {
  $('#passes-value').html(data.passes);
  $('#failures-value').html(data.failures);
  $('#pending-value').html(data.pending);
  $('#skipped-value').html(data.skipped || 0);
  $('#duration-value').html(data.duration);
  $('.panel-default.suite:has(.panel-danger)')
    .removeClass('panel-default')
    .addClass('panel-danger')
}

function updateTest (data) {
  $('.duration-value[data-uuid="' + data.uuid + '"]').html(data.duration);

  // update the icon based upon the status.
  var icon = data.fail ? 'remove' : data.pass ? 'ok' : 'pause';
  $('.result-value[data-uuid="' + data.uuid + '"]')
    .find('.glyphicon')
    .removeClass('glyphicon-refresh spinning')
    .addClass('glyphicon-' + icon);

  if (data.err) {
    $('#' + data.uuid).addClass('list-group-item-danger');
    $('.error-message[data-uuid="' + data.uuid + '"]').html(data.err.message);
    $('.error-stack[data-uuid="' + data.uuid + '"] code').html(data.err.stack);
  }
}

function updateSuite (data) {
  $('.duration-value[data-uuid="' + data.uuid + '"]').text(data.duration);
  $('.passing-value[data-uuid="' + data.uuid + '"]').text(data.passes);
  $('.failing-value[data-uuid="' + data.uuid + '"]').text(data.failures);
  $('.pending-value[data-uuid="' + data.uuid + ']').text(data.pending);
  if (data.failures > 0 || data.hooksFailed) {
    $('#' + data.uuid).removeClass('panel-default').addClass('panel-danger');
  }
}

function finishSuite (data) {
  // update glyphicon for the entire suite
  var icon = data.failures === 0 && data.pending === 0 && !data.hooksFailed ? 'ok'
    : data.failures > 0 || data.hooksFailed ? 'remove'
    : data.pending > 0 ? 'pause' : 'reload';

  $('.suite-status[data-uuid=' + data.uuid + ']')
    .find('.glyphicon')
    .removeClass('glyphicon-refresh spinning')
    .addClass('glyphicon-' + icon);

  // update glyphicon for each test still spinning (set to pause)
  $('[data-uuid=' + data.uuid + '] .glyphicon.spinning')
    .removeClass('glyphicon-refresh spinning')
    .addClass('glyphicon-pause');
}

function compileTemplate (path) {
  return ejs.compile(fs.readFileSync(require.resolve(path)).toString());
}
