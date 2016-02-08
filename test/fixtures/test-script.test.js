'use strict';

var assert = require('chai').assert;

describe.skip('skipped test', function () {
  it('shouldnt be run!', function () {
    assert.equal(true, true);
  });
});

describe('completely working', function () {
  it('should have one test', function () {
    assert.equal(true, true);
  });
});

describe('before hook fails', function () {

  before(function (done) {
    setTimeout(function () {
      done(new Error('aw snap'));
    }, 500);
  });

  it('should not be executed', function () {
    assert.equal(true, true);
  });

});

describe('nested describes', function () {
  describe('nested describe 1', function () {
    it('should have one test', function () {
      assert.equal(true, true);
    });
  });

  describe('nested describe 2', function () {
    it('should have one test', function () {
      assert.equal(true, true);
    });
  });

  it('should have one test', function () {
    assert.equal(true, true);
  });

});

describe('nested describe failure', function () {
  describe('nested describe 1', function () {
    it('should have a failing test', function () {
      assert.equal('life', 'easy');
    });
  });

  describe('nested describe 2', function () {
    it('should have one test', function () {
      assert.equal(true, true);
    });
  });

  it('should have one test', function () {
    assert.equal(true, true);
  });

});

describe('after hook fails', function () {
  after(function () {
    throw new Error('aw snap');
  });

  it('should be executed', function () {
    assert.equal(true, true);
  });

});

describe('a test', function () {

  it('should have a failing test', function () {
    assert.equal('life', 'easy');
  });

  it('should have one test', function () {
    assert.equal(true, true);
  });
});

describe('another suite', function () {

  it('should have a failing test', function () {
    assert.equal('life', 'easy');
  });

  it('should have one test', function () {
    assert.equal(true, true);
  });

  it('this one is a little slow...', function (done) {
    setTimeout(function () {
      assert.equal(true, true);
      done();
    }, 1800);
  });

  it('this one times out...', function (done) {
    setTimeout(function () {
      assert.equal(true, true);
      done();
    }, 5000);

  });
});
