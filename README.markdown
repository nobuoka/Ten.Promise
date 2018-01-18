<a href="http://promises-aplus.github.com/promises-spec"><img src="http://promises-aplus.github.com/promises-spec/assets/logo-small.png" align="right" /></a>

Ten.Promise
==============================

Promises/A+ implementation

For library users
------------------------------

See: [Ten.Promise — Promises/A+ library](http://ten-promise.vividcode.info/)

Requirements
------------------------------

To build Ten.Promise, following tools are needed:

* Build tool: [jake](https://npmjs.org/package/jake)
* TypeScript Compiler: [tsc](http://www.typescriptlang.org/#Download)

If you run tests, following commands are needed:

* Promises/A+ tests: [promises-aplus-tests](https://npmjs.org/package/promises-aplus-tests)
* Mocha: [mocha](http://mochajs.org/)

Build and Test
------------------------------

Jake, the build tool for Node.js is used.

To build, execute:

````
$ jake
````

To run all tests available on command line interface:

````
$ jake test:all
````

To see all tasks:

````
$ jake --tasks
````

### Options

You can pass several environment variables to let jake use another command name as follows.

````
$ jake TSC="node ../typescript/bin/tsc"
```

In this example, jake use `node ../typescript/bin/tsc` command instead of `tsc` command.

Here is list of environment variables which you can use.

* TSC: command of TypeScript compiler (default value is `tsc`)
* APLUS_TESTS: command of Promises/A+ tests (default value is `promises-apluts-tests`)
* MOCHA: mocha command (default value is `mocha`)

License
------------------------------

This software is published under The MIT License.
