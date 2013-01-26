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

asyncTest("真偽評価で偽と評価される値を返してもちゃんと処理される", function () {
    var p = new Ten.Promise(function (suc) {
        suc(0);
    });

    p.then(function (val) {
        equal(val, 0);
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
        return new Ten.Promise(function (s) {
            setTimeout(function () {
                s(120);
            }, 200);
        });
    }).then(function (val) {
        equal(val, 120);
        return "文字列を返す";
    }).then(function (val) {
        equal(val, "文字列を返す");
        QUnit.start();
    });
});
