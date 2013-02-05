// commands
var CMD = {
    TSC: process.env.TSC || "tsc",
    APLUS_TESTS: process.env.APLUS_TESTS || "promises-aplus-tests",
    MOCHA: process.env.MOCHA || "mocha",
}

desc("default task: build Ten.Promise.js (build:normal)");
task("default", ["build:normal"]);

namespace("test", function () {
  desc("run all tests");
  task("all", ["test:promises_aplus", "test:with_mocha"]);
  desc("run Promises/A+ tests");
  task("promises_aplus", ["build:for_node", "test/adapter_for_promises_aplus_tests.js"], function () {
      var cmd = CMD.APLUS_TESTS + " test/adapter_for_promises_aplus_tests.js";
      jake.exec(cmd, function () {
          console.log("pass promises-aplus-tests!!");
          complete();
      }, {printStdout: false});
  });

  desc("run internal tests with mocha");
  task("with_mocha", ["build:for_node", "build:test_with_mocha"], function () {
      var cmd = CMD.MOCHA + " --ui qunit -R tap test/with_mocha/tests.js";
      jake.exec(cmd, function () {
          console.log("pass tests with mocha");
          complete();
      }, {printStdout: true, printErrout: true});
  });
});

namespace("build", function () {
  desc("build Ten.Promise.js");
  task("normal", ["built/Ten.Promise.js"]);
  desc("build Ten.Promise.for_node.js");
  task("for_node", ["built/Ten.Promise.for_node.js"]);

  desc("build js for internal tests with mocha");
  task("test_with_mocha", ["test/with_mocha/tests.js"]);

  desc("build js for internal tests with qunit");
  task("test_with_qunit", ["build:normal", "test/with_qunit/tests.js"]);
});

directory("built");

function _execCompileCmd(cmd, successMsg) {
    jake.exec(cmd, function () {
        console.log(successMsg);
        complete();
    }, {printStdout: true});
}

var SRC = {
    MAIN: "src/Ten/Promise.ts",
    F_NODE: "src/Ten/Promise.footer_for_node.ts",
};

// Ten.Promise.js
(function () {
var targetFilePath = "built/Ten.Promise.js";
file(targetFilePath, ["built", SRC.MAIN], function () {
    var cmd =
        [ CMD.TSC,
          SRC.MAIN,
          "--out " + targetFilePath,
        ].join(" ");
    _execCompileCmd(cmd, targetFilePath + " built!");
}, {async: true});
}).call(this);

// Ten.Promise.js for Node
(function () {
var targetFilePath = "built/Ten.Promise.for_node.js";
file(targetFilePath, ["built", SRC.MAIN, SRC.F_NODE], function () {
    var cmd =
        [ CMD.TSC,
          SRC.MAIN, SRC.F_NODE,
          "--out " + targetFilePath,
        ].join(" ");
    _execCompileCmd(cmd, targetFilePath + " built!");
}, {async: true});
}).call(this);


var SRC_TEST = {
    ADAPT_I: "test/src/adapter-interface.ts",
    ADAPT_MOCHA: "test/src/adapter-mocha.ts",
    ADAPT_QUNIT: "test/src/adapter-qunit.ts",
    TESTS: [
        "test/src/test-promise-base.ts",
        "test/src/test-promise.ts",
    ]
};

directory("test/with_mocha");
directory("test/with_qunit");

(function () {
var targetFilePath = "test/with_mocha/tests.js";
var srcFilePaths = [ SRC_TEST.ADAPT_I, SRC_TEST.ADAPT_MOCHA ].concat(SRC_TEST.TESTS);
file(targetFilePath, ["test/with_mocha"].concat(srcFilePaths), function () {
    var cmd = [].
        concat([ CMD.TSC ]).
        concat(  srcFilePaths ).
        concat([ "--out " + targetFilePath ]).
        join(" ");
    _execCompileCmd(cmd, targetFilePath + " built!");
}, {async: true});
}).call(this);

(function () {
var targetFilePath = "test/with_qunit/tests.js";
var srcFilePaths = [ SRC_TEST.ADAPT_I, SRC_TEST.ADAPT_QUNIT ].concat(SRC_TEST.TESTS);
file(targetFilePath, ["test/with_qunit"].concat(srcFilePaths), function () {
    var cmd = [].
        concat([ CMD.TSC ]).
        concat(  srcFilePaths ).
        concat([ "--out " + targetFilePath ]).
        join(" ");
    _execCompileCmd(cmd, targetFilePath + " built!");
}, {async: true});
}).call(this);
