var t = {
    module: QUnit.module,
    test: QUnit.test,
    testAsync: function (description, testFunc) {
        var testFuncWrapper = function () {
            testFunc(QUnit.start);
        };
        QUnit.asyncTest(description, testFuncWrapper);
    },
    equal: QUnit.equal,
    notEqual: QUnit.notEqual,
    deepEqual: QUnit.deepEqual,
    notDeepEqual: QUnit.notDeepEqual,
    strictEqual: QUnit.strictEqual,
    notStrictEqual: QUnit.notStrictEqual,
    ok: QUnit.ok,
    throws: function (func, validator, message) {
        var err;
        var errOccur = false;
        try  {
            func();
        } catch (e) {
            err = e;
            errOccur = true;
        }
        if(!errOccur) {
            QUnit.ok(false, message);
        } else {
            if(validator) {
                QUnit.ok(validator(err), message);
            } else {
                QUnit.ok(true, message);
            }
        }
    }
};
t.test("`Ten.BasePromise` constructor creates object which has `then` method", function () {
    var p = new Ten.BasePromise();
    t.equal(typeof p.then, "function", "`Ten.BasePromise` object has `then` method");
});
(function () {
    t.module("`Ten.Promise` object");
    var Promise = Ten.Promise;
    function dontCall() {
        t.ok(false, "Don't call it");
    }
    t.testAsync("call success callback when initialized with success synchronously", function (done) {
        var pOrder = [];
        function initPromiseWithSuccessSync(testId, testVal) {
            new Promise(function (s, e) {
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
        initPromiseWithSuccessSync(5, {
        });
        new Promise(function (s, e) {
            s("END");
        }).then(function (val) {
            t.deepEqual(pOrder, [
                1, 
                2, 
                3, 
                4, 
                5
            ]);
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
            t.deepEqual(pOrder, [
                1
            ]);
            done();
        }, dontCall);
    });
    t.testAsync("call error callback when initialized with error synchronously", function (done) {
        var pOrder = [];
        function initPromiseWithErrorSync(testId, testVal, msg) {
            new Promise(function (s, e) {
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
        initPromiseWithErrorSync(5, {
        });
        initPromiseWithErrorSync(6, new Promise(function (s, e) {
            s(10);
        }), "`Promise` object as error value");
        new Promise(function (s, e) {
            s("END");
        }).then(function (val) {
            t.deepEqual(pOrder, [
                1, 
                2, 
                3, 
                4, 
                5, 
                6
            ]);
            done();
        }, dontCall);
    });
    t.testAsync("call error callback in case exception is thrown in promise initializing function", function (done) {
        var pOrder = [];
        new Promise(function (s, e) {
            throw "error in promise initializer";
        }).then(dontCall, function onError(err) {
            t.strictEqual(err, "error in promise initializer", "error callback receives a value thrown in promise initializing function");
            pOrder.push(1);
        });
        var p = new Promise(function (s, e) {
            s(10);
        });
        new Promise(function (s, e) {
            throw p;
        }).then(dontCall, function onError(err) {
            t.strictEqual(err, p, "error callback receives a value thrown in promise initializing function (even if it is `Promise` object)");
            pOrder.push(2);
        });
        new Promise(function (s, e) {
            s("END");
        }).then(function (val) {
            t.deepEqual(pOrder, [
                1, 
                2
            ]);
            done();
        }, dontCall);
    });
    t.testAsync("If promise has multiple callback functions, the promise call all callback functions before fulfill child promises", function (done) {
        var pOrder = [];
        var initWithSuccess;
        var p = new Promise(function (s, e) {
            initWithSuccess = s;
        });
        var p1 = p.then(function (val) {
            pOrder.push(1);
        });
        var p2 = p.then(function (val) {
            pOrder.push(2);
        });
        var p3 = p.then(function (val) {
            pOrder.push(3);
        });
        var p1_1 = p1.then(function (val) {
            pOrder.push(7);
        });
        var p1_2 = p1.then(function (val) {
            pOrder.push(8);
        });
        var p2_1 = p2.then(function (val) {
            pOrder.push(6);
        });
        var p3_1 = p3.then(function (val) {
            pOrder.push(4);
        });
        var p1_1_1 = p1_1.then(function (val) {
            pOrder.push(9);
        });
        var p3_1_1 = p3_1.then(function (val) {
            pOrder.push(5);
        });
        initWithSuccess(100);
        new Promise(function (s, e) {
            s("END");
        }).then(function (val) {
            t.deepEqual(pOrder, [
                1, 
                2, 
                3, 
                4, 
                5, 
                6, 
                7, 
                8, 
                9
            ]);
            done();
        }, dontCall);
    });
    t.testAsync("Promise which value has been already set on cannot receive another value", function (done) {
        var pOrder = [];
        var initWithSuccess;
        var initWithError;
        var p = new Promise(function (s, e) {
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
        initWithSuccess(200);
        initWithError("bad");
        p.then(function (val) {
            t.strictEqual(val, 100);
            pOrder.push(2);
        }, function onError(err) {
            pOrder.push("err");
            t.ok(false, "must not be here");
        });
        new Promise(function (s, e) {
            s("END");
        }).then(function (val) {
            t.deepEqual(pOrder, [
                1, 
                2
            ]);
            done();
        }, dontCall);
    });
    t.testAsync("Promise which error value has been already set on cannot receive another value", function (done) {
        var pOrder = [];
        var initWithSuccess;
        var initWithError;
        var p = new Promise(function (s, e) {
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
        initWithSuccess(200);
        initWithError("bad");
        p.then(function (val) {
            pOrder.push("err");
            t.ok(false, "must not be here");
        }, function onError(err) {
            t.strictEqual(err, 100);
            pOrder.push(2);
        });
        new Promise(function (s, e) {
            s("END");
        }).then(function (val) {
            t.deepEqual(pOrder, [
                1, 
                2
            ]);
            done();
        }, dontCall);
    });
    t.testAsync("Promise which waits for another promise internally can receive another value", function (done) {
        var pOrder = [];
        var initWithSuccess;
        var initWithError;
        var p = new Promise(function (s, e) {
            initWithSuccess = s;
            initWithError = e;
        });
        var initInternalPromise;
        var internalProm = new Promise(function (s, e) {
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
        initWithSuccess(200);
        initWithError("bad value");
        initInternalPromise("good value");
        p.then(function (val) {
            t.strictEqual(val, 200);
            pOrder.push(2);
        }, function onError(err) {
            pOrder.push("err");
            t.ok(false, "must not be here");
        });
        new Promise(function (s, e) {
            s("END");
        }).then(function (val) {
            t.deepEqual(pOrder, [
                1, 
                2
            ]);
            done();
        }, dontCall);
    });
    t.testAsync("Promise which waits for another promise internally can wait for another promise internally", function (done) {
        var pOrder = [];
        var initWithSuccess;
        var initWithError;
        var p = new Promise(function (s, e) {
            initWithSuccess = s;
            initWithError = e;
        });
        var initInternalPromise1;
        var internalProm1 = new Promise(function (s, e) {
            initInternalPromise1 = s;
        });
        var initInternalPromise2;
        var internalProm2 = new Promise(function (s, e) {
            initInternalPromise2 = s;
        });
        var initInternalPromise3;
        var internalProm3 = new Promise(function (s, e) {
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
        initWithSuccess(internalProm1);
        initWithSuccess(internalProm2);
        initWithSuccess(internalProm3);
        initInternalPromise2("good value");
        initInternalPromise3("another value");
        initInternalPromise1("another value");
        p.then(function (val) {
            pOrder.push(3);
            t.strictEqual(val, "good value");
            pOrder.push(4);
        }, function onError(err) {
            pOrder.push("err");
            t.ok(false, "must not be here");
        });
        new Promise(function (s, e) {
            s("END");
        }).then(function (val) {
            t.deepEqual(pOrder, [
                1, 
                2, 
                3, 
                4
            ]);
            done();
        }, dontCall);
    });
    t.testAsync("be able to be cancelled if it is unfulfilled", function (done) {
        var pOrder = [];
        var p = new Promise(function (s, e) {
        });
        p.then(function () {
            pOrder.push("err");
        }, function onError(err) {
            pOrder.push(2);
            t.ok(typeof err === "object");
            t.strictEqual(err.name, "Canceled", "value of `name` property of thrown `Error` object when cancelled is \"Canceled\"");
            pOrder.push(3);
        });
        pOrder.push(1);
        p.cancel();
        pOrder.push(4);
        new Promise(function (s, e) {
            s("END");
        }).then(function (val) {
            t.deepEqual(pOrder, [
                1, 
                2, 
                3, 
                4
            ]);
            done();
        }, dontCall);
    });
    t.testAsync("be not able to be cancelled if it is not unfulfilled", function (done) {
        var pOrder = [];
        var initWithSuccess;
        var p = new Promise(function (s, e) {
            initWithSuccess = s;
        });
        initWithSuccess(100);
        pOrder.push(1);
        p.cancel();
        pOrder.push(2);
        p.then(function (val) {
            pOrder.push(3);
            t.strictEqual(val, 100);
            pOrder.push(4);
        }, function onError(err) {
            pOrder.push("err");
        });
        new Promise(function (s, e) {
            s("END");
        }).then(function (val) {
            t.deepEqual(pOrder, [
                1, 
                2, 
                3, 
                4
            ]);
            done();
        }, dontCall);
    });
    t.testAsync("cancel only last internal promise if waiting multiple promises internally", function (done) {
        var pOrder = [];
        var initWithSuccess;
        var p = new Promise(function (s, e) {
            initWithSuccess = s;
        });
        initWithSuccess(new Promise(function () {
        }, function onCancel() {
            pOrder.push(1);
        }));
        initWithSuccess(new Promise(function () {
        }, function onCancel() {
            pOrder.push(2);
        }));
        initWithSuccess(new Promise(function () {
        }, function onCancel() {
            pOrder.push(3);
        }));
        p.cancel();
        new Promise(function (s, e) {
            s("END");
        }).then(function (val) {
            t.deepEqual(pOrder, [
                3
            ], "only one internal promise is cancelled");
            done();
        }, dontCall);
    });
    t.testAsync("If error is thrown from `onCancel` function while processing cancellation, the error is caught and is stopped there", function (done) {
        var pOrder = [];
        var p = new Promise(function (s, e) {
        }, function onCancel() {
            throw "error in `onCancel`";
        });
        pOrder.push(1);
        p.cancel();
        pOrder.push(2);
        p.then(function (val) {
            pOrder.push("err");
        }, function onError(err) {
            pOrder.push(3);
            t.ok(typeof err === "object");
            t.strictEqual(err.name, "Canceled", "value of `name` property of thrown `Error` object when cancelled is \"Canceled\"");
            pOrder.push(4);
        });
        new Promise(function (s, e) {
            s("END");
        }).then(function (val) {
            t.deepEqual(pOrder, [
                1, 
                2, 
                3, 
                4
            ]);
            done();
        }, dontCall);
    });
    t.testAsync("If promise is fulfilled during cancellation process, fulfilled value is valid", function (done) {
        var pOrder = [];
        var initWithSuccess;
        var p = new Promise(function (s, e) {
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
        new Promise(function (s, e) {
            s("END");
        }).then(function (val) {
            t.deepEqual(pOrder, [
                1, 
                2
            ]);
            done();
        }, dontCall);
    });
    t.testAsync("If promise receive error during cancellation process, error value is valid", function (done) {
        var pOrder = [];
        var initWithError;
        var p = new Promise(function (s, e) {
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
        new Promise(function (s, e) {
            s("END");
        }).then(function (val) {
            t.deepEqual(pOrder, [
                1, 
                2
            ]);
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
        var p = new Promise(function (s, e) {
        });
        var p2 = p.then(function () {
        });
        var p3 = p.then(function () {
        });
        var p4 = p.then(function () {
        });
        p4.cancel();
        checkCancellation(p, 1);
        checkCancellation(p2, 2);
        checkCancellation(p3, 3);
        checkCancellation(p4, 4);
        new Promise(function (s, e) {
            s("END");
        }).then(function (val) {
            t.deepEqual(pOrder, [
                1, 
                2, 
                3, 
                4
            ]);
            done();
        }, dontCall);
    });
    t.testAsync("Promise which passed promise by parent promise during process of cancellation, it change into waiting state", function (done) {
        var pOrder = [];
        var p = new Promise(function (s, e) {
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
            return new Promise(function (s, e) {
                initP3InternalPromWithSuccess = s;
            });
        }, function onError(err) {
            pOrder.push("err");
        });
        var p4 = p3.then(function (val) {
            t.strictEqual(val, 250);
            pOrder.push(5);
        }, function onError(err) {
            pOrder.push("err");
        });
        p4.then(function (val) {
            pOrder.push("err");
        }, function onError(err) {
            t.ok(typeof err === "object");
            t.strictEqual(err.name, "Canceled");
            pOrder.push(3);
        });
        p4.cancel();
        pOrder.push(4);
        initP3InternalPromWithSuccess(250);
        pOrder.push(6);
        new Promise(function (s, e) {
            s("END");
        }).then(function (val) {
            t.deepEqual(pOrder, [
                1, 
                2, 
                3, 
                4, 
                5, 
                6
            ]);
            done();
        }, dontCall);
    });
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
            t.deepEqual(pOrder, [
                1, 
                2, 
                3
            ]);
            done();
        }, dontCall);
    });
    t.testAsync("call callback function immediately promise is initialized", function (done) {
        var pOrder = [];
        pOrder.push(1);
        var initWithSuccess;
        var p = new Promise(function (s, e) {
            pOrder.push(2);
            initWithSuccess = s;
        });
        p.then(function () {
            pOrder.push(4);
        });
        pOrder.push(3);
        initWithSuccess("good");
        pOrder.push(5);
        new Promise(function (s, e) {
            s("END");
        }).then(function (val) {
            t.deepEqual(pOrder, [
                1, 
                2, 
                3, 
                4, 
                5
            ]);
            done();
        }, dontCall);
    });
    t.testAsync("call callback function immediately promise is initialized (with error)", function (done) {
        var pOrder = [];
        pOrder.push(1);
        var initWithError;
        var p = new Promise(function (s, e) {
            pOrder.push(2);
            initWithError = e;
        });
        p.then(null, function onError() {
            pOrder.push(4);
        });
        pOrder.push(3);
        initWithError("error");
        pOrder.push(5);
        new Promise(function (s, e) {
            s("END");
        }).then(function (val) {
            t.deepEqual(pOrder, [
                1, 
                2, 
                3, 
                4, 
                5
            ]);
            done();
        }, dontCall);
    });
    t.testAsync("call progress callback when `p` function is called", function (done) {
        var pOrder = [];
        var progressFunction;
        var p = new Promise(function (s, e, p) {
            progressFunction = p;
        });
        progressFunction(1);
        p.then(null, null, function onProgress(val) {
            pOrder.push("p1:" + val);
        });
        progressFunction(2);
        p.then(null, null, function onProgress(val) {
            pOrder.push("p2:" + val);
        });
        progressFunction(3);
        new Promise(function (s, e) {
            s("END");
        }).then(function (val) {
            t.deepEqual(pOrder, [
                "p1:2", 
                "p1:3", 
                "p2:3"
            ]);
            done();
        }, dontCall);
    });
    t.testAsync("If promise is not unfulfilled, promise don't call progress callback", function (done) {
        var pOrder = [];
        var initWithSuccess;
        var progressFunction;
        var p = new Promise(function (s, e, p) {
            initWithSuccess = s;
            progressFunction = p;
        });
        initWithSuccess(20);
        progressFunction(1);
        p.then(null, null, function onProgress(val) {
            pOrder.push("p1:" + val);
        });
        progressFunction(2);
        p.then(null, null, function onProgress(val) {
            pOrder.push("p2:" + val);
        });
        progressFunction(3);
        new Promise(function (s, e) {
            s("END");
        }).then(function (val) {
            t.deepEqual(pOrder, []);
            done();
        }, dontCall);
    });
}).call(this);
