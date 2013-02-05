declare var QUnit;
var t: ITestAdapter = {
    module: QUnit.module,
    test: QUnit.test,
    testAsync: function (description, testFunc) {
        var testFuncWrapper = function () {
            testFunc(QUnit.start);
        };
        QUnit.asyncTest(description, testFuncWrapper);
    },

    equal:    QUnit.equal,
    notEqual: QUnit.notEqual,
    deepEqual:    QUnit.deepEqual,
    notDeepEqual: QUnit.notDeepEqual,
    strictEqual:    QUnit.strictEqual,
    notStrictEqual: QUnit.notStrictEqual,
    ok: QUnit.ok,
    throws: function (func, validator?, message?) {
        var err;
        var errOccur = false;
        try { func() } catch (e) {
            err = e;
            errOccur = true;
        }
        if (!errOccur) {
            QUnit.ok(false, message);
        } else {
            if (validator) {
                QUnit.ok(validator(err), message);
            } else {
                QUnit.ok(true, message);
            }
        }
    },
};

declare var Ten;
