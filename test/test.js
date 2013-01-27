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
        QUnit.start();
    });
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
        equal(err.name, "Canceled");
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
        equal(err.name, "Canceled");
        return new Ten.Promise(function (s,e) {
            setTimeout(function () { e(120) }, 200);
        });
    }).
    then(null, null). // 貫通する
    then(null, function onError(err) {
        equal(err.name, "Canceled");
    });
    p2.done(function () { QUnit.start() });
    p2.cancel();
    p2.cancel();
});

asyncTest("Promise ではないが then メソッドをもっているオブジェクトを返した場合", function () {
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

asyncTest("Progress", function () {
    var p = new Ten.Promise(function (s,e,p) {
        var count = 0;
        setInterval(function () {
            ++count;
            if (count < 5) {
                p(count);
            } else {
                s(count);
            }
        }, 50);
    });
    var progVal = [];
    p.then(function (val) {
        equal(val, 5);
    }, null, function onProgress(val) {
        progVal.push(val);
    }).done(function () {
        deepEqual(progVal, [1,2,3,4]);
    });

    p = Ten.Promise.wrap(0).then(function () {
        return new Ten.Promise(function (s,e,p) {
            var count = 0;
            setInterval(function () {
                ++count;
                if (count < 5) {
                    p(-count);
                } else {
                    s(-count);
                }
            }, 50);
        });
    })
    progVal2 = [];
    p.then(function (val) {
        equal(val, -5);
    }, null, function onProgress(val) {
        progVal2.push(val);
    }).done(function () {
        deepEqual(progVal2, [-1,-2,-3,-4]);
        QUnit.start();
    });
});

test("Promise.is", function () {
    var p = Ten.Promise.wrap(0);
    ok(Ten.Promise.is(p));
    ok(Ten.Promise.is({ then: function () {} }));

    ok(!Ten.Promise.is(null));
    ok(!Ten.Promise.is(undefined));
    ok(!Ten.Promise.is(5));
    ok(!Ten.Promise.is({}));
    ok(!Ten.Promise.is({ then: null }));
});

asyncTest("`then` method of already fulfilled Promise", function () {
    var flag = true;
    var p = Ten.Promise.wrap(0);
    p.then(function () {
        ok(flag);
        QUnit.start();
    });
    flag = true;
});

asyncTest("Promise.as", function () {
    Ten.Promise.wrap(0).
    then(function () {
        return Ten.Promise.as(0);
    }).
    then(function (val) {
        equal(val, 0);
    }).
    then(function () {
        return Ten.Promise.as(Ten.Promise.wrap(10));
    }).
    then(function (val) {
        equal(val, 10);
    }).
    done(function () {
        QUnit.start();
    });
});

asyncTest("Promise.waitAll", 2, function () {
    var progvals = [];
    Ten.Promise.waitAll([
        new Ten.Promise(function (s,e,p) { setTimeout(function () { s("a") }, 20) }),
        new Ten.Promise(function (s,e,p) { setTimeout(function () { s("b") }, 30) }),
        new Ten.Promise(function (s,e,p) { setTimeout(function () { s("c") }, 40) })
    ]).then(function () {
        ok("ok");
    }, null, function onProgress (dat) {
        progvals.push([ dat.key, dat.value ]);
    }).done(function () {
        deepEqual(progvals, [["0","a"], ["1","b"], ["2","c"]]);
        QUnit.start();
    });
});

asyncTest("Promise.waitAll - waiting not promise values", 2, function () {
    var progvals2 = [];
    Ten.Promise.waitAll([
        null,
        100,
        {}
    ]).then(function () {
        ok("ok");
    }, null, function onProgress (dat) {
        progvals2.push([ dat.key, dat.value ]);
    }).done(function () {
        deepEqual(progvals2, []);
        QUnit.start();
    });
});

asyncTest("Promise.waitAll - waiting fulfilled promise values", 1, function () {
    var values = [
        Ten.Promise.wrap(100),
        Ten.Promise.wrap(200)
    ];
    Ten.Promise.waitAll(values).
    then(function (v) {
        deepEqual(v, values);
    }, function (err) {
        ok(false, "エラーコールバックは呼び出されない");
    }).
    done(function () {
        QUnit.start();
    });
});

asyncTest("Promise.join", 1, function () {
    var values = [
        Ten.Promise.wrap(100),
        Ten.Promise.wrap(200),
        300,
        new Ten.Promise(function (c) { setTimeout(function () { c(400) }, 4) })
    ];
    Ten.Promise.join(values).
    then(function (v) {
        deepEqual(v, [100,200,300,400]);
    }, function (err) {
        ok(false, "エラーコールバックは呼び出されない");
    }).
    done(function () {
        QUnit.start();
    });
});

asyncTest("Promise.join - with error", 1, function () {
    var values = [
        Ten.Promise.wrapError("error!?"),
        Ten.Promise.wrap(200),
        300,
        new Ten.Promise(function (c,e) { setTimeout(function () { e("bad news") }, 4) })
    ];
    Ten.Promise.join(values).
    then(null, function (err) {
        deepEqual(err, {0: "error!?", 3: "bad news"});
    }).
    done(function () {
        QUnit.start();
    });
});

asyncTest("Promise.join - with cancel", 1, function () {
    var values = [
        Ten.Promise.wrap(100),
        Ten.Promise.wrap(200),
        300,
        new Ten.Promise(function (c,e) { setTimeout(function () { e("bad news") }, 4) })
    ];
    var p = Ten.Promise.join(values).
    then(null, function (err) {
        console.dir(err);
        equal(err.name, "Canceled");
    });
    p.done(function () {
        QUnit.start();
    });
    p.cancel();
});

asyncTest("", function () {
    Ten.Promise.JSDeferredInterface.next(function () { throw "Error"; }).
    error(function (e) {
        equal(e, "Error", "Errorback called");
        return e;
    }).
    next(function (e) {
        equal(e, "Error", "Errorback called");
        throw "Error2";
    }).
    next(function (e) {
        ok(false, "Must not be called!!");
    }).
    error(function (e) {
        equal(e, "Error2", "Errorback called");
        QUnit.start();
    });
});

asyncTest("Canceling Test:", function () {
    Ten.Promise.JSDeferredInterface.next(function () {
        return Ten.Promise.JSDeferredInterface.next(function () {
            //msg("Calceling... No more tests below...");
            ok(true, "Done");
            this.cancel();
        }).
        next(function () {
            ok(false, "Must not be called!! calceled");
        }).error(function () {
            QUnit.start();
        });
    });
});
