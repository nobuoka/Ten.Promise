module("Ten.Promise");

asyncTest("Ten.Promise を同期呼び出しで使う", function () {
    var p = new Ten.Promise(function (suc) {
        suc(100);
    });
    ok(p, "値がある");

    p.then(function (val) {
        equal(val, 100);
        return 120;
    }).then(function (val) {
        equal(val, 120);
        return "文字列を返す";
    }).then(function (val) {
        equal(val, "文字列を返す");
        QUnit.start();
    });
});

asyncTest("Ten.Promise を非同期呼び出しで使う", function () {
    var p = new Ten.Promise(function (suc) {
        setTimeout(function () {
            suc(100);
        }, 200);
    });
    ok(p, "値がある");

    p.then(function (val) {
        equal(val, 100);
        return 120;
    }).then(function (val) {
        equal(val, 120);
        return "文字列を返す";
    }).then(function (val) {
        equal(val, "文字列を返す");
        QUnit.start();
    });
});
