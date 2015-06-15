

'use strict';

var ipc = require('ipc');
var ejs = require('ejs');
var fs = require('fs');

var headerDiv = document.getElementById('header');
var suitesUl = document.getElementById('suites');

var header = compileTemplate('./partial/header.ejs');
var suite = compileTemplate('./partial/suite.ejs');

ipc.on('mocha-start', function MochaStart (e) { $(headerDiv).append(header(e)); updateHeader(e); });
ipc.on('mocha-suite', function MochaSuite (e) { $(e.parent ? '#' + e.parent.uuid + ' > .children' : suitesUl).append(suite(e)); });
ipc.on('mocha-suite-end', function MochaSuiteEnd (e) { updateSuite(e, 'suite end'); });
ipc.on('mocha-test-end', function MochaTestEnd (e) { updateSuite(e.parent, 'test end'); updateTest(e); });
ipc.on('mocha-hook-end', function MochaHookEnd (e) { updateSuite(e.parent, 'hook end'); updateTest(e); });
ipc.on('mocha-pending', function MochaPending (e) { updateSuite(e.parent, 'pending'); updateTest(e); });
ipc.on('mocha-pass', function MochaPass (e) { updateSuite(e.parent, 'pass'); updateTest(e); });
ipc.on('mocha-fail', function MochaFail (e) { updateSuite(e.parent, 'fail'); updateTest(e); });
ipc.on('mocha-end', function MochaEnd (e) { updateHeader(e); });

function updateHeader (data) {
  $('#passes-value').html(data.passes);
  $('#failures-value').html(data.failures);
  $('#pending-value').html(data.pending);
  $('#skipped-value').html(data.skipped || 0);
  $('#duration-value').html(data.duration);
}

function updateTest (data) {
  $('.test.duration-value', '#' + data.uuid).html(data.duration);

  // update the icon based upon the status.
  var icon = data.fail ? 'remove' : data.pass ? 'ok' : 'pause';
  $('.test.result-value', '#' + data.uuid)
    .find('.glyphicon')
    .removeClass('glyphicon-refresh spinning')
    .addClass('glyphicon-' + icon);

  if (data.err) {
    $('#' + data.uuid).addClass('list-group-item-danger');
    $('.error-message', '#' + data.uuid).html(data.err.message);
    $('.error-stack', '#' + data.uuid).html(data.err.stack);
  }
}

function updateSuite (data, type) {
  $('.suite.duration-value', '#' + data.uuid).text(data.duration);
  $('.suite.passing-value', '#' + data.uuid).text(data.passes);
  $('.suite.failing-value', '#' + data.uuid).text(data.failures);
  $('.suite.pending-value', '#' + data.uuid).text(data.pending);

  if (type === 'suite end') {
    // update glyphicon for the entire suite
    var icon = data.failures === 0 && data.pending === 0 ? 'ok'
      : data.failures > 0 ? 'remove'
      : data.pending > 0 ? 'pause' : 'reload';

    $('.suite-status', '#' + data.uuid)
      .find('.glyphicon')
      .removeClass('glyphicon-refresh spinning')
      .addClass('glyphicon-' + icon);

    // update glyphicon for each test still spinning (set to pause)
    $('.glyphicon.spinning', '#' + data.uuid)
      .removeClass('glyphicon-refresh spinning')
      .addClass('glyphicon-pause');

    // if the afterAll hook went into error, update with error.
  }

  if (data.failures > 0) {
    $('#' + data.uuid).removeClass('panel-default').addClass('panel-danger');
  }
}

function compileTemplate(path) {
  return ejs.compile(fs.readFileSync(require.resolve(path)).toString());
}
