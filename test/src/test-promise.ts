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

t.testAsync("If promise has multiple callback functions, the promise call all callback functions before fulfill child promises", function (done) {
    var pOrder = [];

    var initWithSuccess;
    var p = new Promise(function (s, e) {
        initWithSuccess = s;
    });

    var p1 = p.then(function (val) { pOrder.push(1) });
    var p2 = p.then(function (val) { pOrder.push(2) });
    var p3 = p.then(function (val) { pOrder.push(3) });

    var p1_1 = p1.then(function (val) { pOrder.push(7) });
    var p1_2 = p1.then(function (val) { pOrder.push(8) });
    var p2_1 = p2.then(function (val) { pOrder.push(6) });
    var p3_1 = p3.then(function (val) { pOrder.push(4) });

    var p1_1_1 = p1_1.then(function (val) { pOrder.push(9) });
    var p3_1_1 = p3_1.then(function (val) { pOrder.push(5) });

    initWithSuccess(100);

    new Promise(function (s, e) {
        s("END");
    }).then(function (val) {
        t.deepEqual(pOrder, [1,2,3,4,5,6,7,8,9]);
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

t.testAsync("When `cancel` method is called, the promise cancel its parent promise", function (done) {
    var pOrder = [];

    function checkCancellation(p, testId) {
        p.then(null, function onError(err) {
            t.ok(typeof err === "object");
            t.strictEqual(err.name, "Canceled");
            pOrder.push(testId);
        });
    }

    var p = new Promise(function (s,e) {
    });
    var p2 = p.then(function () {});
    var p3 = p.then(function () {});
    var p4 = p.then(function () {});

    p4.cancel();

    checkCancellation(p, 1);
    checkCancellation(p2, 2);
    checkCancellation(p3, 3);
    checkCancellation(p4, 4);

    new Promise(function (s,e) {
        s("END");
    }).then(function (val) {
        t.deepEqual(pOrder, [1,2,3,4]);
        done();
    }, dontCall);
});

t.testAsync("Promise which passed promise by parent promise during process of cancellation, it change into waiting state", function (done) {
    var pOrder = [];

    var p = new Promise(function (s,e) {
    });
    var p2 = p.then(null, function onError(err) {
        t.ok(typeof err === "object");
        t.strictEqual(err.name, "Canceled");
        pOrder.push(1);
        return 100;
    });
    var initP3InternalPromWithSuccess;
    var p3 = p2.then(function (val) {
        t.strictEqual(val, 100);
        pOrder.push(2);
        return new Promise(function (s,e) {
            initP3InternalPromWithSuccess = s;
        });
    }, function onError(err) {
        pOrder.push("err"); // must not be here
    });
    var p4 = p3.then(function (val) {
        t.strictEqual(val, 250);
        pOrder.push(5);
    }, function onError (err) {
        pOrder.push("err"); // must not be here
    });
    p4.then(function (val) {
        pOrder.push("err"); // must not be here
    }, function onError (err) {
        t.ok(typeof err === "object");
        t.strictEqual(err.name, "Canceled");
        pOrder.push(3);
    });

    p4.cancel();

    // p3 is waiting state
    pOrder.push(4);
    initP3InternalPromWithSuccess(250);
    pOrder.push(6);

    new Promise(function (s,e) {
        s("END");
    }).then(function (val) {
        t.deepEqual(pOrder, [1,2,3,4,5,6]);
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

// ---- tests of progress callback ----

t.testAsync("call progress callback when `p` function is called", function (done) {
    var pOrder = [];

    var progressFunction;
    var p = new Promise(function (s,e,p) {
        progressFunction = p;
    });

    // there is no callback function
    progressFunction(1);

    // one callback functions
    p.then(null,null,function onProgress(val) {
        pOrder.push("p1:" + val);
    });
    progressFunction(2);

    // multiple callback functions
    p.then(null,null,function onProgress(val) {
        pOrder.push("p2:" + val);
    });
    progressFunction(3);

    new Promise(function (s,e) {
        s("END");
    }).then(function (val) {
        t.deepEqual(pOrder, ["p1:2","p1:3","p2:3"]);
        done();
    }, dontCall);
});

t.testAsync("If promise is not unfulfilled, promise don't call progress callback", function (done) {
    var pOrder = [];

    var initWithSuccess;
    var progressFunction;
    var p = new Promise(function (s,e,p) {
        initWithSuccess = s;
        progressFunction = p;
    });

    initWithSuccess(20);

    // there is no callback function
    progressFunction(1);

    // one callback functions
    p.then(null,null,function onProgress(val) {
        pOrder.push("p1:" + val); // must not be here
    });
    progressFunction(2);

    // multiple callback functions
    p.then(null,null,function onProgress(val) {
        pOrder.push("p2:" + val); // must not be here
    });
    progressFunction(3);

    new Promise(function (s,e) {
        s("END");
    }).then(function (val) {
        t.deepEqual(pOrder, []);
        done();
    }, dontCall);
});

t.testAsync("Static method `is` returns `true` if the value has `then` method", function (done) {
    t.strictEqual(Promise.is(new Promise(function () {})), true,
            "Unfulfilled `Promise` object is a promise object");
    t.strictEqual(Promise.is(new Promise(function (s,e) { s(100) })), true,
            "Fulfilled `Promise` object is a promise object");
    t.strictEqual(Promise.is(new Promise(function (s,e) { e("test") })), true,
            "Rejected `Promise` object is a promise object");
    t.strictEqual(Promise.is({ then: function () { /* do nothing */ } }), true,
            "Object with `then` method is a promise object");

    t.strictEqual(Promise.is({}), false,
            "Object without `then` property is not a promise object");
    t.strictEqual(Promise.is({ then: null }), false,
            "Object with `then` property whose value is `null` is not a promise object");
    t.strictEqual(Promise.is({ then: {} }), false,
            "Object with `then` property whose value is an object is not a promise object");
    t.strictEqual(Promise.is({ then: void 0 }), false,
            "Object with `then` property whose value is `undefined` is not a promise object");
    t.strictEqual(Promise.is({ then: "not function" }), false,
            "Object with `then` property whose value is string is not a promise object");
    t.strictEqual(Promise.is("string"), false,
            "String value is not a promise object");
    t.strictEqual(Promise.is(100), false,
            "Number value is not a promise object");
    // This assertion fails with WinJS.Promise (`WinJS.Promise.is(null)` returns `null`)
    t.strictEqual(Promise.is(null), false,
            "Null value is not a promise object");
    // This assertion fails with WinJS.Promise (`WinJS.Promise.is(void 0)` returns `undefined`)
    t.strictEqual(Promise.is(void 0), false,
            "Undefined value is not a promise object");

    done();
});

t.testAsync("Static method `wrap` wraps a specified value as it is", function (done) {
    var pOrder = [];
    Promise.wrap(100).then(function (val) {
        t.strictEqual(val, 100);
        pOrder.push(1);
    });
    Promise.wrap(null).then(function (val) {
        t.strictEqual(val, null);
        pOrder.push(2);
    });
    Promise.wrap(void 0).then(function (val) {
        t.strictEqual(val, void 0);
        pOrder.push(3);
    });
    var obj = { test: "good" };
    Promise.wrap(obj).then(function (val) {
        t.strictEqual(val, obj);
        pOrder.push(4);
    });

    // these two assertions fail with WinJS.Promise... I don't know which spec is good
    var pseudoPromObj = { then: function (s) { s(200) } };
    Promise.wrap(pseudoPromObj).then(function (val) {
        t.strictEqual(val, pseudoPromObj,
                "Although specified value is a promise-like object, the value is just wrapped");
        pOrder.push(5);
    });
    var promObj = new Promise(function (s) { s(300) });
    Promise.wrap(promObj).then(function (val) {
        t.strictEqual(val, promObj,
                "Although specified value is a `Promise` object, the value is just wrapped");
        pOrder.push(6);
    });

    Promise.wrap(0).then(function (val) {
        t.deepEqual(pOrder, [1,2,3,4,5,6]);
        done();
    });
});

t.testAsync("Static method `wrapError` returns a rejected promise whose rejected reason is specified value", function (done) {
    var pOrder = [];
    Promise.wrapError(100).then(null, function onError(val) {
        t.strictEqual(val, 100);
        pOrder.push(1);
    });
    Promise.wrapError(null).then(null, function onError(val) {
        t.strictEqual(val, null);
        pOrder.push(2);
    });
    Promise.wrapError(void 0).then(null, function onError(val) {
        t.strictEqual(val, void 0);
        pOrder.push(3);
    });
    var obj = { test: "good" };
    Promise.wrapError(obj).then(null, function onError(val) {
        t.strictEqual(val, obj);
        pOrder.push(4);
    });

    // these two assertions fail with WinJS.Promise... I don't know which spec is good
    var pseudoPromObj = { then: function (s) { s(200) } };
    Promise.wrapError(pseudoPromObj).then(null, function onError(val) {
        t.strictEqual(val, pseudoPromObj,
                "Although specified value is a promise-like object, the value is just wrapped as rejected reason");
        pOrder.push(5);
    });
    var promObj = new Promise(function (s) { s(300) });
    Promise.wrapError(promObj).then(null, function onError(val) {
        t.strictEqual(val, promObj,
                "Although specified value is a `Promise` object, the value is just wrapped as rejected reason");
        pOrder.push(6);
    });

    Promise.wrap(0).then(function (val) {
        t.deepEqual(pOrder, [1,2,3,4,5,6]);
        done();
    });
});

t.testAsync("Static method `as` returns a promise fulfilled with specified value if it is not a promise, or itself otherwise", function (done) {
    var pOrder = [];
    Promise.as(100).then(function (val) {
        t.strictEqual(val, 100);
        pOrder.push(1);
    });
    Promise.as(null).then(function (val) {
        t.strictEqual(val, null);
        pOrder.push(2);
    });
    Promise.as(void 0).then(function (val) {
        t.strictEqual(val, void 0);
        pOrder.push(3);
    });
    var obj = { test: "good" };
    Promise.as(obj).then(function (val) {
        t.strictEqual(val, obj);
        pOrder.push(4);
    });

    var pseudoPromObj = { then: function (s) { s(200) } };
    t.strictEqual(Promise.as(pseudoPromObj), pseudoPromObj,
        "If specified value is a promise-like object, `as` method returns itself");
    var promObj = new Promise(function (s) { s(300) });
    t.strictEqual(Promise.as(promObj), promObj,
        "If specified value is a `Promise` object, `as` method returns itself");

    Promise.wrap(0).then(function (val) {
        t.deepEqual(pOrder, [1,2,3,4]);
        done();
    });
});

t.testAsync("Static method `any`", function (done) {
    var pOrder = [];

    Promise.wrap(null).

    // wait for not promise values
    then(function () {
        return Promise.any([1,2]).then(function (val) {
            t.deepEqual(val, { key: "0", value: 1 });
            pOrder.push(1);
        });
    }).

    // wait for fulfilled promise
    then(function () {
        var p1 = Promise.wrap("fulfilled");
        return Promise.any([p1]).then(function (val) {
            t.deepEqual(val, { key: "0", value: p1 });
            pOrder.push(2);
        });
    }).

    // wait for rejected promise
    then(function () {
        var p1 = Promise.wrapError("rejected1");
        return Promise.any([p1]).then(null, function (val) {
            t.deepEqual(val, { key: "0", value: p1 });
            pOrder.push(3);
        });
    }).

    // wait for unfulfilled promise
    then(function () {
        var f1;
        var p1 = new Promise(function (f) { f1 = f });
        var f2;
        var p2 = new Promise(function (f) { f2 = f });
        var p = Promise.any([p1,p2]).then(function (val) {
            t.deepEqual(val, { key: "1", value: p2 });
            pOrder.push(5);
        });
        Promise.wrap(null).then(function () {
            pOrder.push(4);
            f2("ok");
        });
        return p;
    }).

    then(function () {
        t.deepEqual(pOrder, [1,2,3,4,5]);
        done();
    }, function onRejected(err) {
        t.ok(false, err);
        done();
    });
});

t.testAsync("Cancellation of `any`", function (done) {
    var pOrder = [];
    var testsPromises = [];

    Promise.wrap(null).

    // wait for unfulfilled promise
    then(function () {
        var p1 = new Promise(function (f) {}, function onCanceled() { pOrder.push(2) });
        var p2 = new Promise(function (f) {}, function onCanceled() { pOrder.push(3) });
        var p = Promise.any([p1,p2]).then(null, function onRejected(reason) {
            t.strictEqual(reason.name, "Canceled");
            pOrder.push(4);
        });
        Promise.wrap(null).then(function () {
            pOrder.push(1);
            p.cancel();
        });
        return p;
    }).

    // wait for unfulfilled promise
    then(function () {
        var p1 = new Promise(function (f) {}, function onCanceled() { pOrder.push(6) });
        var p2 = new Promise(function (f) {}, function onCanceled() { pOrder.push(7) });
        var p = Promise.any([p1,p2,200,null]).then(null, function onRejected(reason) {
            t.strictEqual(reason.name, "Canceled");
            pOrder.push(8);
        });
        pOrder.push(5);
        p.cancel();
        return p;
    }).

    then(function () {
        t.deepEqual(pOrder, [1,2,3,4,5,6,7,8]);
        done();
    }, function onRejected(err) {
        t.ok(false, err);
        done();
    });
});


t.testAsync("Static method `waitAll` waits for each of specified promises to be fulfilled/rejected", function (done) {
    var pOrder = [];
    var testsPromises = [];

    // wait for nothing
    (function () {
        var vals = [];
        var p = Promise.waitAll(vals);
        var testP = p.then(function (val) {
            t.strictEqual(val, vals,
                "a promise returned by `Promise.waitAll(vals)` is fulfilled with `vals`");
            t.deepEqual(vals, [], "contents of `vals` are not changed");
            pOrder.push(1);
        });
        testsPromises.push(testP);
    }).call(this);

    // wait for only one fulfilled promise
    (function () {
        var p1 = Promise.wrap(100);
        var vals = [p1];
        var p = Promise.waitAll(vals);
        var testP = p.then(function (val) {
            t.strictEqual(val, vals,
                "a promise returned by `Promise.waitAll(vals)` is fulfilled with `vals`");
            t.deepEqual(vals, [p1], "contents of `vals` are not changed");
            pOrder.push(2);
        });
        testsPromises.push(testP);
    }).call(this);

    // wait for only one rejected promise
    (function () {
        var p1 = Promise.wrapError("error");
        var vals = [p1];
        var p = Promise.waitAll(vals);
        var testP = p.then(function (val) {
            t.strictEqual(val, vals,
                "a promise returned by `Promise.waitAll(vals)` is fulfilled with `vals`");
            t.deepEqual(vals, [p1], "contents of `vals` are not changed");
            pOrder.push(3);
        });
        testsPromises.push(testP);
    }).call(this);

    // wait for unfulfilled promises
    (function () {
        var pOrder1 = [];

        var f1;
        var p1 = new Promise(function (f) { f1 = f });
        p1.then(function (v) { pOrder1.push(1) });
        var r2;
        var p2 = new Promise(function (f,r) { r2 = r });
        p2.then(null, function onRejected(v) { pOrder1.push(2) });
        var f3;
        var p3 = new Promise(function (f) { f3 = f });
        p3.then(function (v) { pOrder1.push(3) });
        var r4;
        var p4 = new Promise(function (f,r) { r4 = r });
        p4.then(null, function onRejected(v) { pOrder1.push(4) });

        var vals = [p1,p2,p3,p4,"not promise",null];
        var p = Promise.waitAll(vals);
        var testP = p.then(function (val) {
            t.strictEqual(val, vals,
                "a promise returned by `Promise.waitAll(vals)` is fulfilled with `vals`");
            t.deepEqual(vals, [p1,p2,p3,p4,"not promise",null],
                "contents of `vals` are not changed");
            t.deepEqual(pOrder1, [1,2,3,4]);
            pOrder.push(4);
        });
        testsPromises.push(testP);

        f1("ok");
        r2("ok");
        p2.then(null, function onRejected() {
            f3("ok");
        }).then(function () {
            r4("ok");
        });
    }).call(this);

    Promise.waitAll(testsPromises).then(function () {
        t.deepEqual(pOrder, [1,2,3,4]);
        done();
    });
});

t.testAsync("Cancellation of `waitAll`", function (done) {
    var pOrder = [];

    var f1;
    var p1 = new Promise(function (f) { f1 = f });
    var waitP = Promise.waitAll([p1]);
    var waitP2 = waitP.then(null, function (reason) {
        t.strictEqual(reason.name, "Canceled");
        pOrder.push(1);
    });
    var p2 = p1.then(function () {
        pOrder.push(2);
    }, function onRejected(reason) {
        t.ok(false, "This promise is not canceled even when the promise waiting this promise is cancelled");
        pOrder.push("not be here");
    });

    waitP.cancel();
    waitP2.then(function () {
        f1("do");
    });

    var testsPromises = [waitP, p2];

    Promise.waitAll(testsPromises).then(function () {
        t.deepEqual(pOrder, [1,2]);
        done();
    });
});

t.testAsync("Static method `join`", function (done) {
    var pOrder = [];
    var testsPromises = [];

    // wait for nothing
    (function () {
        var vals1 = [];
        var vals2 = {};
        var testP1 = Promise.join(vals1).then(function (val) {
            t.deepEqual(val, []);
            pOrder.push(1);
        });
        var testP2 = Promise.join(vals2).then(function (val) {
            t.deepEqual(val, {});
            pOrder.push(2);
        });
        testsPromises.push(testP1);
        testsPromises.push(testP2);
    }).call(this);

    // wait for only one fulfilled promise
    (function () {
        var p1 = Promise.wrap(100);
        var vals = [p1];
        var p = Promise.join(vals);
        var testP = p.then(function (val) {
            t.deepEqual(val, [100]);
            pOrder.push(3);
        });
        testsPromises.push(testP);
    }).call(this);

    // wait for only one rejected promise
    (function () {
        var p1 = Promise.wrapError("error");
        var vals = [p1];
        var p = Promise.join(vals);
        var testP = p.then(function () {
            pOrder.push("NG");
            t.ok(false, "not be here");
        }, function onRejected(reason) {
            // The promise returned `Promise.join(vals)` will be rejected in
            // case there is at least one rejected promise on vals' property
            t.deepEqual(Object.keys(reason), ["0"]);
            t.deepEqual(reason[0], "error");
            pOrder.push(4);
        });
        testsPromises.push(testP);
    }).call(this);

    // wait for unfulfilled promises (all success)
    (function () {
        var pOrder1 = [];

        var f1;
        var p1 = new Promise(function (f) { f1 = f });
        p1.then(function (v) { pOrder1.push(1) });
        var f2;
        var p2 = new Promise(function (f) { f2 = f });
        p2.then(function (v) { pOrder1.push(2) });
        var f3;
        var p3 = new Promise(function (f) { f3 = f });
        p3.then(function (v) { pOrder1.push(3) });

        var vals = [p1,p2,p3,"not promise",null];
        var p = Promise.join(vals);
        var testP = p.then(function (val) {
            t.strictEqual(val[0], 100);
            t.strictEqual(val[1], null);
            t.strictEqual(val[2], "success");
            t.deepEqual(pOrder1, [2,1,3]);
            pOrder.push(5);
        });
        testsPromises.push(testP);

        f2(null);
        f1(100);
        p2.then(function () {
            f3("success");
        });
    }).call(this);

    // wait for unfulfilled promises (some rejected)
    (function () {
        var pOrder1 = [];

        var f1;
        var p1 = new Promise(function (f) { f1 = f });
        p1.then(function (v) { pOrder1.push(1) });
        var r2;
        var p2 = new Promise(function (f,r) { r2 = r });
        p2.then(null, function onRejected(v) { pOrder1.push(2) });
        var f3;
        var p3 = new Promise(function (f) { f3 = f });
        p3.then(function (v) { pOrder1.push(3) });
        var r4;
        var p4 = new Promise(function (f,r) { r4 = r });
        p4.then(null, function onRejected(v) { pOrder1.push(4) });

        var vals = [p1,p2,p3,p4,"not promise",null];
        var p = Promise.join(vals);
        var testP = p.then(function () {
            pOrder.push("NG");
            t.ok(false, "not be here");
        }, function onRejected(val) {
            t.deepEqual(Object.keys(val), ["1","3"],
                "`val` has properties whose values are rejected promises");
            t.strictEqual(val[1], "rejected reason");
            t.strictEqual(val[3], null);
            t.deepEqual(pOrder1, [2,1,3,4]);
            pOrder.push(6);
        });
        testsPromises.push(testP);

        r2("rejected reason");
        f1(100);
        p2.then(null, function onRejected() {
            f3("success");
        }).then(function () {
            r4(null);
        });
    }).call(this);

    Promise.waitAll(testsPromises).then(function () {
        t.deepEqual(pOrder, [1,2,3,4,5,6]);
        done();
    });
});

t.testAsync("Cancellation of `join`", function (done) {
    var pOrder = [];
    var testsPromises = [];

    // If there is no rejected promise, cancelled `Promise.join` is rejected
    // with Canceled Error.
    (function () {
        var p1 = new Promise(function () {});
        var waitP = Promise.join([p1]);
        var waitP2 = waitP.then(null, function (reason) {
            t.strictEqual(reason.name, "Canceled");
            pOrder.push(1);
        });
        var p2 = p1.then(function () {
            t.ok(false, "This promise is not canceled even when the promise waiting this promise is cancelled");
            pOrder.push("not be here");
        }, function onRejected(reason) {
            t.strictEqual(reason.name, "Canceled");
            pOrder.push(2);
        });

        waitP.cancel();
        testsPromises.push(waitP2);
    }).call(this);

    // If there are at least one rejected promise, cancelled `Promise.join` is rejected
    // with all rejected promises.
    (function () {
        var p1 = new Promise(function () {});
        var r2;
        var p2 = new Promise(function (f,r) { r2 = r });
        var waitP = Promise.join([p1,p2]);
        var waitP2 = waitP.then(null, function (reason) {
            t.deepEqual(Object.keys(reason).sort(), ["0","1"]);
            t.strictEqual(reason[0].name, "Canceled");
            t.strictEqual(reason[1], "rejected2");
            pOrder.push(3);
        });
        var p3 = p1.then(function () {
            t.ok(false, "This promise is not canceled even when the promise waiting this promise is cancelled");
            pOrder.push("not be here");
        }, function onRejected(reason) {
            t.strictEqual(reason.name, "Canceled");
            pOrder.push(4);
        });

        r2("rejected2");
        waitP.cancel();
        testsPromises.push(waitP2);
        testsPromises.push(p3);
    }).call(this);

    Promise.waitAll(testsPromises).then(function () {
        t.deepEqual(pOrder, [1,2,3,4]);
        done();
    });
});
}).call(this);
