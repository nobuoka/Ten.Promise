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

asyncTest("エラーの処理", 5, function () {
    var p = new Ten.Promise(function (suc, err) {
        err("よくないことが起こった");
    });

    p.then(function (val) {
    }, function onError(err) {
        equal(err, "よくないことが起こった");
        return 120;
    }).
    then(function (val) {
        equal(val, 120);
        throw "error dayo";
    }).
    then(null, function onError(err) {
        equal(err, "error dayo");
        throw "error in error handler";
    }).
    then(null, function onError(err) {
        equal(err, "error in error handler");
    });

    p.then(null, function () {}).done(function () {
        p.done(null, function (err) {
            equal(err, "よくないことが起こった");
            QUnit.start();
        });
    });
});

asyncTest("エラーの非同期処理", function () {
    var p = Ten.Promise.wrapError("error");
    p.then(null, function onError(err) {
        equal(err, "error");
    });
    QUnit.start();
});

asyncTest("エラーの非同期処理", function () {
    var p = new Ten.Promise(function (suc, err) {
        setTimeout(function () {
            err("よくないことが起こった");
        }, 200);
    });

    p.then(function (val) {
    }, function onError(err) {
        equal(err, "よくないことが起こった");
        return new Ten.Promise(function (s,e) {
            setTimeout(function () { e(120) }, 200);
        });
    }).
    then(null, null). // 貫通する
    then(null, function onError(val) {
        equal(val, 120);
        QUnit.start();
    });
});

asyncTest("キャンセル", 3, function () {
    var p = new Ten.Promise(function (suc, err) {
        this.__timerId = setTimeout(function () {
            err("よくないことが起こった");
        }, 200);
    }, function onCancel() {
        ok("ここまで着てない?");
        clearTimeout(this.__timerId);
    });
    p2 = p.then(function (val) {
    }, function onError(err) {
        equal(err.description, "Canceled");
        return new Ten.Promise(function (s,e) {
            setTimeout(function () { e(120) }, 200);
        });
    }).
    then(null, null). // 貫通する
    then(null, function onError(val) {
        equal(val, 120);
    });
    p2.done(function () { QUnit.start() });
    p.cancel();
});

asyncTest("連続キャンセル", 3, function () {
    var p = new Ten.Promise(function (suc, err) {
        this.__timerId = setTimeout(function () {
            err("よくないことが起こった");
        }, 200);
    }, function onCancel() {
        ok("ここまで着てない?");
        clearTimeout(this.__timerId);
    });
    p2 = p.then(function (val) {
    }, function onError(err) {
        equal(err.description, "Canceled");
        return new Ten.Promise(function (s,e) {
            setTimeout(function () { e(120) }, 200);
        });
    }).
    then(null, null). // 貫通する
    then(null, function onError(err) {
        equal(err.description, "Canceled");
    });
    p2.done(function () { QUnit.start() });
    p2.cancel();
    p2.cancel();
});

asyncTest("", function () {
    var sentinel = {};
    var dummy = {};
    var promise1 = Ten.Promise.wrap(dummy);
    var promise2 = promise1.then(function onFulfilled() {
        return {
            then: function (f) { f(sentinel); }
        };
    });

    promise2.then(function onPromise2Fulfilled(value) {
        strictEqual(value, sentinel);
        QUnit.start();
    });
});
