# mocha-runner package

mocha-runner is an atom test runner inspired by [jasmine runner](https://github.com/nathansobo/atom-jasmine-runner/) and [mochawesome](https://github.com/adamgruber/mochawesome/).

respects mocha.opts and loads test results (asynchronously!) in a separate window, similar to the built in atom package spec runner.

use the runner with ctrl-alt-o

## Configuration

configuration must be passed to the runner by using mocha.opts in the test directory.

the only configuration setting you can change is where the test directory is (default "test"). the options file will always be loaded as "mocha.opts" from this location.

while it is possible to change where mocha loads it's configuration and what options to provide it, this package needs to use sane defaults until atom implements per-project configuration settings for packages (https://github.com/atom/atom/issues/5168).

this includes any files that should be part of the test.  e.g.:

```
--slow 500
--no-timeouts
--recursive
--async-only
test/unit/**/*.test.js
```

the following options are not supported:
- watch
- watch-extensions
- growl
- node.exe command line args (everything defaults to what atom uses)

### opts

where to load mocha.opts from

**default**: test/mocha.opts

## TODO:

- [ ] write tests (the irony is not lost on me).
- [ ] support package specs... honestly, no idea where to even start :)

![A screenshot of your package](https://raw.githubusercontent.com/tswaters/atom-mocha-runner/master/screencast.gif)
