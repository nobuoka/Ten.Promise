// commands
var CMD = {
    TSC: process.env.TSC || "tsc",
    APLUS_TESTS: process.env.APLUS_TESTS || "promises-aplus-tests",
}

task("default", ["build:normal"]);

namespace("test", function () {
  task("promises_aplus", ["build:for_node", "test/adapter_for_promises_aplus_tests.js"], function () {
      var cmd = CMD.APLUS_TESTS + " test/adapter_for_promises_aplus_tests.js";
      jake.exec(cmd, function () {
          console.log("pass promises-aplus-tests!!");
          complete();
      }, {printStdout: false});
  });
});

namespace("build", function () {
  task("normal", ["js/Ten.Promise.js"]);
  task("for_node", ["js/Ten.Promise.for_node.js"]);
});

directory("js");

function _execCompileCmd(cmd, successMsg) {
    jake.exec(cmd, function () {
        console.log(successMsg);
        complete();
    }, {printStdout: true});
}

file("js/Ten.Promise.js", ["js"], function () {
    var cmd =
        [ CMD.TSC,
          "src/Ten/Promise.ts",
          "--out js/Ten.Promise.js",
        ].join(" ");
    _execCompileCmd(cmd, "js/Ten.Promise.js built!");
}, {async: true});

file("js/Ten.Promise.for_node.js", ["js"], function () {
    var cmd =
        [ CMD.TSC,
          "src/Ten/Promise.ts",
          "src/Ten/Promise.footer_for_node.ts",
          "--out js/Ten.Promise.for_node.js",
        ].join(" ");
    _execCompileCmd(cmd, "js/Ten.Promise.for_node.js built!");
}, {async: true});
