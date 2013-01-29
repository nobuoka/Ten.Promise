Ten.Promise
==============================

CommonJS Promises/A+ implementation

Requirements
------------------------------

To build Ten.Promise, following tools are needed:

* Build tool: [jake](https://npmjs.org/package/jake)
* TypeScript Compiler: [tsc](http://www.typescriptlang.org/#Download)

If you run tests, following commands are needed:

* CommonJS Promises/A+ tests: [promises-aplus-tests](https://npmjs.org/package/promises-aplus-tests)

Build and Test
------------------------------

Jake, the build tool for Node.js is used.

To build, execute:

````
$ jake -B
````

To run test for Promises/A+:

````
$ jake -B test:promises_aplus
````

### Options

You can pass several environment variables to let jake use another command name as follows.

````
$ jake TSC="node ../typescript/bin/tsc" -B test:promises_aplus
```

In this example, jake use `node ../typescript/bin/tsc` command instead of `tsc` command.

Here is list of environment variables which you can use.

* TSC: command of TypeScript compiler (default value is `tsc`)
* APLUS_TESTS: command of Promises/A+ tests (default value is `promises-apluts-tests`)
