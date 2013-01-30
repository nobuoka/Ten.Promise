// commands
var CMD = {
    TSC: process.env.TSC || "tsc",
    APLUS_TESTS: process.env.APLUS_TESTS || "promises-aplus-tests",
}

desc("default task: build Ten.Promise.js (build:normal)");
task("default", ["build:normal"]);

namespace("test", function () {
  desc("run all tests");
  task("all", ["test:promises_aplus"]);
  desc("run Promises/A+ tests");
  task("promises_aplus", ["build:for_node", "test/adapter_for_promises_aplus_tests.js"], function () {
      var cmd = CMD.APLUS_TESTS + " test/adapter_for_promises_aplus_tests.js";
      jake.exec(cmd, function () {
          console.log("pass promises-aplus-tests!!");
          complete();
      }, {printStdout: false});
  });
});

namespace("build", function () {
  desc("build Ten.Promise.js");
  task("normal", ["js/Ten.Promise.js"]);
  desc("build Ten.Promise.for_node.js");
  task("for_node", ["js/Ten.Promise.for_node.js"]);
});

directory("js");

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
var targetFilePath = "js/Ten.Promise.js";
file(targetFilePath, ["js", SRC.MAIN], function () {
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
var targetFilePath = "js/Ten.Promise.for_node.js";
file(targetFilePath, ["js", SRC.MAIN, SRC.F_NODE], function () {
    var cmd =
        [ CMD.TSC,
          SRC.MAIN, SRC.F_NODE,
          "--out " + targetFilePath,
        ].join(" ");
    _execCompileCmd(cmd, targetFilePath + " built!");
}, {async: true});
}).call(this);
