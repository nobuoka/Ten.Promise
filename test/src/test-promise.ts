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

}).call(this);
