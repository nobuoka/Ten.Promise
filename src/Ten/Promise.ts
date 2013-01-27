module Ten {
    "use strict";

    var CANCELED_NAME = "Canceled";
    var CANCELED_MSG = "Canceled";
    function createCancelEvent() {
        var e = new Error(CANCELED_MSG);
        e.name = CANCELED_NAME;
        return e;
    }

    interface PromiseListener {
        promise?: AbstractPromise;
        s: (val) => any;
        e: (val) => any;
        p: (val) => void;
    }
    var STAT_EMPTY     = 0;
    var STAT_FULFILLED = 1;
    var STAT_FAILED    = 2;
    var STAT_WAITING   = 4;
    export class AbstractPromise {
        private __stat;//= STAT_EMPTY;
        private __sucVal;
        private __errVal;
        private __promiseVal;
        private __parentPromise;
        private __listeners: PromiseListener[];
        constructor () {
            if (!(this instanceof AbstractPromise)) return null;
            this.__stat = STAT_EMPTY;
            this.__listeners = [];
        }
        _setParentPromise(promise) {
            this.__parentPromise = promise;
        }
        _setValue(valOrPromise) {
            var that = this;
            if (Promise.is(valOrPromise)) {
                var p = <AbstractPromise>valOrPromise;
                this.__stat = STAT_WAITING;
                this.__promiseVal = p;
                p.then(function (val) {
                    that._fulfill(val);
                }, function onError(err) {
                    that._setError(err);
                }, function onProgress(val) {
                    that._notifyProgress(val);
                });
            } else {
                var val = <any>valOrPromise;
                this._fulfill(val);
            }
        }
        _fulfill(value) {
            this.__stat = STAT_FULFILLED;
            this.__sucVal = value;
            this.__notifySuccess();
        }
        _setError(errorValue) {
            this.__stat = STAT_FAILED;
            this.__errVal = errorValue;
            this.__notifyFailure();
        }
        cancel() {
            if (this.__stat === STAT_EMPTY) {
                if (this.__parentPromise) this.__parentPromise.cancel();
            } else if (this.__stat === STAT_WAITING) {
                this.__promiseVal.cancel();
            }
        }
        done(onSuccess: (val) => any, onError: (val) => any, onProgress: (val) => void): void {
            this.__registerListener(onSuccess, onError, onProgress);
        }
        then(onSuccess?: (val) => any, onError?: (val) => any, onProgress?: (val) => void): AbstractPromise {
            var p = new SimplePromise();
            p._setParentPromise(this);
            this.__registerListener(onSuccess, onError, onProgress, p);
            return p;
        }
        private __registerListener(onSuccess, onError, onProgress, promise?) {
            if (typeof onSuccess !== "function") onSuccess = ((val) => val);
            if (typeof onError !== "function") onError = ((val) => Promise.wrapError(val));
            if (typeof onProgress !== "function") onProgress = function () {};
            var listener: PromiseListener = { s: onSuccess, e: onError, p: onProgress, promise: promise };

            if (this.__stat === STAT_FULFILLED) {
                var that = this;
                Promise.callInCaseAlreadyCompleted(function () { that.__notifyListenerOfSuccess(listener, that.__sucVal) });
            } else if (this.__stat === STAT_FAILED) {
                var that = this;
                Promise.callInCaseAlreadyCompleted(function () { that.__notifyListenerOfFailure(listener, that.__errVal) });
            } else {
                this.__listeners.push(listener);
            }
        }
        private __notifySuccess() {
            var val = this.__sucVal;
            var listeners = this.__listeners;
            while (listeners.length > 0) {
                var listener = listeners.shift();
                this.__notifyListenerOfSuccess(listener, val);
            }
        }
        private __notifyListenerOfSuccess(listener: PromiseListener, value: any) {
            // value or Promise, or exception
            var callbackRes;
            try {
                callbackRes = listener.s(value);
            } catch (err) {
                callbackRes = Promise.wrapError(err);
            }
            if (listener.promise) listener.promise._setValue(callbackRes);
        }
        private __notifyFailure() {
            var val = this.__errVal;
            var listeners = this.__listeners;
            while (listeners.length > 0) {
                var listener = listeners.shift();
                this.__notifyListenerOfFailure(listener, val);
            }
        }
        private __notifyListenerOfFailure(listener: PromiseListener, error: any) {
            // value or Promise, or exception
            var callbackRes;
            try {
                callbackRes = listener.e(error);
            } catch (err) {
                callbackRes = Promise.wrapError(err);
            }
            if (listener.promise) listener.promise._setValue(callbackRes);
        }
        _notifyProgress(val) {
            var listeners = this.__listeners;
            for (var i = 0, len = listeners.length; i < len; ++i) {
                var listener = listeners[i];
                try {
                    listener.p(val);
                } catch (err) {
                    // do nothing
                }
            }
        }
    }
    class SimplePromise extends AbstractPromise {}
    export class Promise extends AbstractPromise {
        private __onCancel;
        private __thisValue;
        constructor(init, onCancel?) {
            super();
            this.__thisValue = {};
            this.__onCancel = onCancel;
            var that = this;
            function comp(val) { that._setValue(val) }
            function err(val)  { that._setError(val) }
            function prog(val) { that._notifyProgress(val) }
            try {
                init.call(this.__thisValue, comp, err, prog);
            } catch (err) {
                // ここどうしよう
            }
        }
        cancel() {
            if (this.__onCancel) this.__onCancel.call(this.__thisValue);
            this._setError(createCancelEvent());
        }

        static is(value) {
            return (value && typeof value.then === "function");
        }
        static callInCaseAlreadyCompleted: {(caller: any): void;} = null;
        static as(value) {
            return (Promise.is(value) ? value : Promise.wrap(value));
        }
        static wrap(value): AbstractPromise {
            var p = new SimplePromise();
            p._fulfill(value);
            return p;
        }
        static wrapError(errorValue): AbstractPromise {
            var p = new SimplePromise();
            p._setError(errorValue);
            return p;
        }

        static waitAll(values) {
            return new Promise(
                function (complete, error, progress) {
                    var count = 0;
                    function onCompleted(name, val, isError) {
                        count--;
                        var obj = { done: true, key: name, isError: isError, error: void 0, value: void 0 };
                        isError ? obj.error = val : obj.value = val;
                        progress(obj);
                        if (count === 0) complete(values);
                    }
                    for (var name in values) {
                        var val = values[name];
                        if (Promise.is(val)) {
                            count++;
                            (function (name, promise) {
                                promise.then(function (val) {
                                    onCompleted(name, val, false);
                                }, function onError(err) {
                                    onCompleted(name, err, true);
                                });
                            })(name, val);
                        }
                    }
                    if (count === 0) complete(values);
                }
            );
        }
        // similer to WinJS.Promise.join, but has some differences
        static join(values) {
            var numErrors = 0;
            var numCanceled = 0;
            var errors = {};
            var fulfilleds = {};
            var p = Promise.waitAll(values).then(function (values) {
                if (numErrors === 0) { // all success
                    for (var name in fulfilleds) values[name] = fulfilleds[name];
                    return values;
                } else if (numErrors - numCanceled === 0) {
                    // no error (except canceled) and al least one canceled
                    throw createCancelEvent();
                } else {
                    // at least one error (except canceled)
                    throw errors;
                }
            }, function (err) {
                var e = new Error("unexpected error: see `detail` property of this object");
                e["detail"] = err;
                throw e;
            }, function (dat) {
                if (!dat.isError) {
                    fulfilleds[dat.key] = dat.value;
                } else {
                    numErrors++;
                    if (dat.error && dat.error.name === CANCELED_NAME) numCanceled++;
                    errors[dat.key] = dat.error;
                }
            });
            var origCancel = p.cancel;
            p.cancel = function () {
                for (var name in values) {
                    var v = values[name];
                    if (Promise.is(v)) v.cancel();
                }
            };
            return p;
        }
    }
}

declare var process;
declare var setImmediate;
declare var MessageChannel;
(function setupCallbackFunction() {
    "use strict";
    if (typeof process === "object" && typeof process.nextTick === "function") {
        // for Node
        Ten.Promise.callInCaseAlreadyCompleted = function (c) { process.nextTick(c) };
    } else if (typeof setImmediate === "function") {
        Ten.Promise.callInCaseAlreadyCompleted = function (c) { setImmediate(c) };
    } else if (typeof MessageChannel === "function") {
        Ten.Promise.callInCaseAlreadyCompleted = function (c) {
            var ch = new MessageChannel();
            ch.port1.onmessage = function() {
                ch.port1.onmessage = null; ch = null;
                c();
            };
            ch.port2.postMessage(0);
        };
    } else if (typeof window === "object" && typeof window.postMessage === "function"
               && typeof window.addEventListener === "function") {
        Ten.Promise.callInCaseAlreadyCompleted = function (c) {
            window.addEventListener("message", function onMessage(evt) {
                window.removeEventListener("message", onMessage, false);
                c();
            }, false);
            window.postMessage("triger of function call", "*");
        };
    } else {
        // fallback (it can't pass test...)
        Ten.Promise.callInCaseAlreadyCompleted = function (c) {
            throw new Error("Ten.Promise.callInCaseAlreadyCompleted method not implemented");
        };
    }
}).call(this);
