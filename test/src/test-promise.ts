(function () {

t.module("`Ten.Promise` object");

var Promise = Ten.Promise;

function dontCall() { t.ok(false, "Don't call it") }

t.testAsync("call success callback when initialized with success synchronously", function (done) {
    var pOrder = [];

    function initPromiseWithSuccessSync(testId, testVal) {
        new Promise(function (s,e) {
            s(testVal);
        }).then(function (val) {
            t.strictEqual(val, testVal);
            pOrder.push(testId);
        }, dontCall);
    }

    initPromiseWithSuccessSync(1, 100);
    initPromiseWithSuccessSync(2, false);
    initPromiseWithSuccessSync(3, "文字列");
    initPromiseWithSuccessSync(4, void 0);
    initPromiseWithSuccessSync(5, {});

    new Promise(function (s,e) {
        s("END");
    }).then(function (val) {
        t.deepEqual(pOrder, [1,2,3,4,5]);
        done();
    }, dontCall);
});

t.testAsync("call success callback with raw value when initialized with promise-wrapped value", function (done) {
    var pOrder = [];

    new Promise(function (s, e) {
        s(new Promise(function (s, e) {
            s(10);
        }));
    }).then(function (val) {
        t.strictEqual(val, 10);
        pOrder.push(1);
    });

    new Promise(function (s, e) {
        s("END");
    }).then(function (val) {
        t.deepEqual(pOrder, [1]);
        done();
    }, dontCall);
});

t.testAsync("call error callback when initialized with error synchronously", function (done) {
    var pOrder = [];

    function initPromiseWithErrorSync(testId, testVal, msg?: string) {
        new Promise(function (s,e) {
            e(testVal);
        }).then(dontCall, function onError(err) {
            t.strictEqual(err, testVal);
            pOrder.push(testId);
        });
    }

    initPromiseWithErrorSync(1, 100);
    initPromiseWithErrorSync(2, false);
    initPromiseWithErrorSync(3, "文字列");
    initPromiseWithErrorSync(4, void 0);
    initPromiseWithErrorSync(5, {});
    initPromiseWithErrorSync(6, new Promise(function (s, e) { s(10) }),
                "`Promise` object as error value");

    new Promise(function (s,e) {
        s("END");
    }).then(function (val) {
        t.deepEqual(pOrder, [1,2,3,4,5,6]);
        done();
    }, dontCall);
});

t.testAsync("call error callback in case exception is thrown in promise initializing function", function (done) {
    var pOrder = [];

    new Promise(function (s, e) {
        throw "error in promise initializer";
    }).then(dontCall, function onError(err) {
        t.strictEqual(err, "error in promise initializer",
            "error callback receives a value thrown in promise initializing function");
        pOrder.push(1);
    });

    var p = new Promise(function (s, e) { s(10) });
    new Promise(function (s, e) {
        throw p;
    }).then(dontCall, function onError(err) {
        t.strictEqual(err, p,
            "error callback receives a value thrown in promise initializing function (even if it is `Promise` object)");
        pOrder.push(2);
    });

    new Promise(function (s, e) {
        s("END");
    }).then(function (val) {
        t.deepEqual(pOrder, [1,2]);
        done();
    }, dontCall);
});

// ---- tests of restriction on initializing ----

t.testAsync("Promise which value has been already set on cannot receive another value", function (done) {
    var pOrder = [];

    var initWithSuccess;
    var initWithError;
    var p = new Promise(function (s,e) {
        initWithSuccess = s;
        initWithError = e;
    });

    p.then(function (val) {
        t.strictEqual(val, 100);
        pOrder.push(1);
    }, function onError(err) {
        pOrder.push("err");
        t.ok(false, "must not be here");
    });
    initWithSuccess(100);
    // p has been already fulfilled
    initWithSuccess(200); // this must not affect
    initWithError("bad"); // this must not affect
    p.then(function (val) {
        t.strictEqual(val, 100);
        pOrder.push(2);
    }, function onError(err) {
        pOrder.push("err");
        t.ok(false, "must not be here");
    });

    new Promise(function (s,e) {
        s("END");
    }).then(function (val) {
        t.deepEqual(pOrder, [1,2]);
        done();
    }, dontCall);
});

t.testAsync("Promise which error value has been already set on cannot receive another value", function (done) {
    var pOrder = [];

    var initWithSuccess;
    var initWithError;
    var p = new Promise(function (s,e) {
        initWithSuccess = s;
        initWithError = e;
    });

    p.then(function (val) {
        pOrder.push("err");
        t.ok(false, "must not be here");
    }, function onError(err) {
        t.strictEqual(err, 100);
        pOrder.push(1);
    });
    initWithError(100);
    // p has been already fulfilled (with error)
    initWithSuccess(200); // this must not affect
    initWithError("bad"); // this must not affect
    p.then(function (val) {
        pOrder.push("err");
        t.ok(false, "must not be here");
    }, function onError(err) {
        t.strictEqual(err, 100);
        pOrder.push(2);
    });

    new Promise(function (s,e) {
        s("END");
    }).then(function (val) {
        t.deepEqual(pOrder, [1,2]);
        done();
    }, dontCall);
});

// I don't this this is the best specification, but WinJS.Promise is implemented as pass this test
t.testAsync("Promise which waits for another promise internally can receive another value", function (done) {
    var pOrder = [];

    var initWithSuccess;
    var initWithError;
    var p = new Promise(function (s,e) {
        initWithSuccess = s;
        initWithError = e;
    });

    var initInternalPromise;
    var internalProm = new Promise(function (s,e) {
        initInternalPromise = s;
    });
    p.then(function (val) {
        t.strictEqual(val, 200);
        pOrder.push(1);
    }, function onError(err) {
        pOrder.push("err");
        t.ok(false, "must not be here");
    });
    initWithSuccess(internalProm);
    // p is waiting for internal promise
    initWithSuccess(200);
    initWithError("bad value"); // this must not affect
    // fulfill internal promise
    initInternalPromise("good value"); // this must not affect
    p.then(function (val) {
        t.strictEqual(val, 200);
        pOrder.push(2);
    }, function onError(err) {
        pOrder.push("err");
        t.ok(false, "must not be here");
    });

    new Promise(function (s,e) {
        s("END");
    }).then(function (val) {
        t.deepEqual(pOrder, [1,2]);
        done();
    }, dontCall);
});

// I don't this this is the best specification, but WinJS.Promise is implemented as pass this test
t.testAsync("Promise which waits for another promise internally can wait for another promise internally", function (done) {
    var pOrder = [];

    var initWithSuccess;
    var initWithError;
    var p = new Promise(function (s,e) {
        initWithSuccess = s;
        initWithError = e;
    });

    var initInternalPromise1;
    var internalProm1 = new Promise(function (s,e) {
        initInternalPromise1 = s;
    });
    var initInternalPromise2;
    var internalProm2 = new Promise(function (s,e) {
        initInternalPromise2 = s;
    });
    var initInternalPromise3;
    var internalProm3 = new Promise(function (s,e) {
        initInternalPromise3 = s;
    });

    p.then(function (val) {
        pOrder.push(1);
        t.strictEqual(val, "good value");
        pOrder.push(2);
    }, function onError(err) {
        pOrder.push("err");
        t.ok(false, "must not be here");
    });
    // wait for multiple promises internally
    initWithSuccess(internalProm1);
    initWithSuccess(internalProm2);
    initWithSuccess(internalProm3);
    // fulfill internal promises
    initInternalPromise2("good value");
    initInternalPromise3("another value"); // this must not affect
    initInternalPromise1("another value"); // this must not affect
    p.then(function (val) {
        pOrder.push(3);
        t.strictEqual(val, "good value");
        pOrder.push(4);
    }, function onError(err) {
        pOrder.push("err");
        t.ok(false, "must not be here");
    });

    new Promise(function (s,e) {
        s("END");
    }).then(function (val) {
        t.deepEqual(pOrder, [1,2,3,4]);
        done();
    }, dontCall);
});

// ---- tests of cancellation ----

t.testAsync("be able to be cancelled if it is unfulfilled", function (done) {
    var pOrder = [];

    var p = new Promise(function (s,e) { });

    p.then(function () {
        pOrder.push("err"); // must not be here
    }, function onError(err) {
        pOrder.push(2);
        t.ok(typeof err === "object");
        t.strictEqual(err.name, "Canceled",
                "value of `name` property of thrown `Error` object when cancelled is \"Canceled\"");
        pOrder.push(3);
    });
    // p is unfulfilled
    pOrder.push(1);
    p.cancel();
    pOrder.push(4);

    new Promise(function (s,e) {
        s("END");
    }).then(function (val) {
        t.deepEqual(pOrder, [1,2,3,4]);
        done();
    }, dontCall);
});

t.testAsync("be not able to be cancelled if it is not unfulfilled", function (done) {
    var pOrder = [];

    var initWithSuccess;
    var p = new Promise(function (s,e) {
        initWithSuccess = s;
    });
    initWithSuccess(100);

    // p is fulfilled
    pOrder.push(1);
    p.cancel();
    pOrder.push(2);

    p.then(function (val) {
        pOrder.push(3);
        t.strictEqual(val, 100);
        pOrder.push(4);
    }, function onError(err) {
        pOrder.push("err"); // must not be here
    });

    new Promise(function (s,e) {
        s("END");
    }).then(function (val) {
        t.deepEqual(pOrder, [1,2,3,4]);
        done();
    }, dontCall);
});

t.testAsync("cancel only last internal promise if waiting multiple promises internally", function (done) {
    var pOrder = [];

    var initWithSuccess;
    var p = new Promise(function (s,e) {
        initWithSuccess = s;
    });

    // wait for multiple promises
    initWithSuccess(new Promise(function () { }, function onCancel() {
        pOrder.push(1);
    }));
    initWithSuccess(new Promise(function () { }, function onCancel() {
        pOrder.push(2);
    }));
    initWithSuccess(new Promise(function () { }, function onCancel() {
        pOrder.push(3);
    }));

    p.cancel();

    new Promise(function (s,e) {
        s("END");
    }).then(function (val) {
        t.deepEqual(pOrder, [3], "only one internal promise is cancelled");
        done();
    }, dontCall);
});

t.testAsync("If error is thrown from `onCancel` function while processing cancellation, the error is caught and is stopped there", function (done) {
    var pOrder = [];

    var p = new Promise(function (s,e) {
    }, function onCancel() {
        throw "error in `onCancel`";
    });

    // p is fulfilled
    pOrder.push(1);
    p.cancel();
    pOrder.push(2);

    p.then(function (val) {
        pOrder.push("err"); // must not be here
    }, function onError(err) {
        pOrder.push(3);
        t.ok(typeof err === "object");
        t.strictEqual(err.name, "Canceled",
                "value of `name` property of thrown `Error` object when cancelled is \"Canceled\"");
        pOrder.push(4);
    });

    new Promise(function (s,e) {
        s("END");
    }).then(function (val) {
        t.deepEqual(pOrder, [1,2,3,4]);
        done();
    }, dontCall);
});

t.testAsync("If promise is fulfilled during cancellation process, fulfilled value is valid", function (done) {
    var pOrder = [];

    var initWithSuccess;
    var p = new Promise(function (s,e) {
        initWithSuccess = s;
    }, function onCancel() {
        initWithSuccess(300);
    });

    p.cancel();

    p.then(function (val) {
        pOrder.push(1);
        t.strictEqual(val, 300);
        pOrder.push(2);
    });

    new Promise(function (s,e) {
        s("END");
    }).then(function (val) {
        t.deepEqual(pOrder, [1,2]);
        done();
    }, dontCall);
});

t.testAsync("If promise receive error during cancellation process, error value is valid", function (done) {
    var pOrder = [];

    var initWithError;
    var p = new Promise(function (s,e) {
        initWithError = e;
    }, function onCancel() {
        initWithError(400);
    });

    p.cancel();

    p.then(null, function onError(err) {
        pOrder.push(1);
        t.strictEqual(err, 400);
        pOrder.push(2);
    });

    new Promise(function (s,e) {
        s("END");
    }).then(function (val) {
        t.deepEqual(pOrder, [1,2]);
        done();
    }, dontCall);
});

// ---- test of timing ----

t.testAsync("invoke promise initializing function immediately", function (done) {
    var pOrder = [];

    pOrder.push(1);
    new Promise(function (s, e) {
        pOrder.push(2);
        s(null);
    });
    pOrder.push(3);

    new Promise(function (s, e) {
        s("END");
    }).then(function (val) {
        t.deepEqual(pOrder, [1, 2, 3]);
        done();
    }, dontCall);
});

t.testAsync("call callback function immediately promise is initialized", function (done) {
    var pOrder = [];

    pOrder.push(1);
    var initWithSuccess;
    var p = new Promise(function (s,e) {
        pOrder.push(2);
        initWithSuccess = s;
    });
    p.then(function () {
        pOrder.push(4);
    });
    pOrder.push(3);
    initWithSuccess("good");
    pOrder.push(5);

    new Promise(function (s,e) {
        s("END");
    }).then(function (val) {
        t.deepEqual(pOrder, [1,2,3,4,5]);
        done();
    }, dontCall);
});

t.testAsync("call callback function immediately promise is initialized (with error)", function (done) {
    var pOrder = [];

    pOrder.push(1);
    var initWithError;
    var p = new Promise(function (s,e) {
        pOrder.push(2);
        initWithError = e;
    });
    p.then(null, function onError() {
        pOrder.push(4);
    });
    pOrder.push(3);
    initWithError("error");
    pOrder.push(5);

    new Promise(function (s,e) {
        s("END");
    }).then(function (val) {
        t.deepEqual(pOrder, [1,2,3,4,5]);
        done();
    }, dontCall);
});

}).call(this);
