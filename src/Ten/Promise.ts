module Ten {
    interface PromiseListener {
        promise?: AbstractPromise;
        s: (val) => any;
        e: (val) => any;
    }
    var STAT_EMPTY     = 0;
    var STAT_FULFILLED = 1;
    var STAT_FAILED    = 2;
    var STAT_WAITING   = 4;
    export class AbstractPromise {
        private __stat = STAT_EMPTY;
        private __sucVal;
        private __errVal;
        private __promiseVal;
        private __parentPromise;
        private __listeners: PromiseListener[];
        constructor () {
            this.__listeners = [];
        }
        _setParentPromise(promise) {
            this.__parentPromise = promise;
        }
        _setValue(valOrPromise) {
            var that = this;
            if (valOrPromise && typeof valOrPromise.then === "function") {
                var p = <AbstractPromise>valOrPromise;
                this.__stat = STAT_WAITING;
                this.__promiseVal = p;
                p.then(function (val) {
                    that._fulfill(val);
                }, function onError(err) {
                    that._setError(err);
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
        done(onSuccess: (val) => any, onError: (val) => any): void {
            this.__registerListener(onSuccess, onError);
        }
        then(onSuccess: (val) => any, onError: (val) => any): AbstractPromise {
            var p = new SimplePromise();
            p._setParentPromise(this);
            this.__registerListener(onSuccess, onError, p);
            return p;
        }
        private __registerListener(onSuccess, onError, promise?) {
            if (typeof onSuccess !== "function") onSuccess = ((val) => val);
            if (typeof onError !== "function") onError = ((val) => Promise.wrapError(val));
            var listener: PromiseListener = { s: onSuccess, e: onError, promise: promise };

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
    }
    class SimplePromise extends AbstractPromise {}
    class ErrorPromise extends AbstractPromise {
        constructor(errorValue) {
            super();
            this._setError(errorValue);
        }
    }
    export class Promise extends AbstractPromise {
        private __onCancel;
        private __thisValue;
        constructor(init, onCancel?) {
            super();
            this.__thisValue = {};
            this.__onCancel = onCancel;
            var that = this;
            function comp(val) {
                that._setValue(val);
            }
            function err(val) {
                that._setError(val);
            }
            try {
                init.call(this.__thisValue, comp, err);
            } catch (err) {
                // ここどうしよう
            }
        }
        cancel() {
            if (this.__onCancel) this.__onCancel.call(this.__thisValue);
            this._setError({ description: "Canceled" });
        }

        static callInCaseAlreadyCompleted(caller) {
            //setTimeout(caller, 4);
            caller();
        }
        static wrap(value): AbstractPromise {
            var p = new SimplePromise();
            p._fulfill(value);
            return p;
        }
        static wrapError(errorValue): AbstractPromise {
            return new ErrorPromise(errorValue);
        }
    }
}
