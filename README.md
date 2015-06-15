# mocha-runner package

mocha-runner is an atom test runner that runs against mocha instead of jasmine.

inspired by [jasmine runner](https://github.com/nathansobo/atom-jasmine-runner/) and [mochawesome](https://github.com/adamgruber/mochawesome/).

respects mocha.opts and loads test results (asynchronously!) in a separate window, similar to the built in atom runner.

respected mocha.opts / command line options are recognized :

- ~~grep / fgrep / invert~~ (haven't tested this)
- ~~ui~~ (haven't tested this)
- bail
- timeout
- slow
- ignoreLeaks
- fullStackTrace
- ~~useInlineDiffs~~ (this isn't implemented)
- growl (unsure, I'm on Windows.)

use the runner with ctrl-alt-o

## Configuration

the following configuration options are provided

### mocha-arguments

arguments to pass to mocha constructor (not all of those recognized by the command are recognized by the constructor)

**default**: nothing.

### test-directory

test directory to run against.

**default**: test

### recursive

whether to run recursively.

**default**: true

### interface

interface to use.

**default**: bdd

## TODO:

- [ ] write tests (!!!).
- [ ] verify other interfaces work.
- [ ] verify `require` command works.


![A screenshot of your package](https://github.com/tswaters/atom-mocha-runner/blob/master/screencast.gif)
