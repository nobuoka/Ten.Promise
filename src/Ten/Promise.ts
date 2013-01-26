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
            function setValImpl (val) {
                that.__stat = STAT_FULFILLED;
                that.__sucVal = val;
                that.__notifySuccess();
            }
            if (valOrPromise && typeof valOrPromise.then === "function") {
                var p = <AbstractPromise>valOrPromise;
                this.__stat = STAT_WAITING;
                this.__promiseVal = p;
                p.then(function (val) {
                    setValImpl(val);
                }, function onError(err) {
                    that._setError(err);
                });
            } else {
                var val = <any>valOrPromise;
                setValImpl(val);
            }
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
            if (!onSuccess) onSuccess = ((val) => val);
            if (!onError) onError = ((val) => Promise.wrapError(val));
            this.__registerListener({ s: onSuccess, e: onError });
        }
        then(onSuccess: (val) => any, onError: (val) => any): AbstractPromise {
            var p = new SimplePromise();
            p._setParentPromise(this);
            if (!onSuccess) onSuccess = ((val) => val);
            if (!onError) onError = ((val) => Promise.wrapError(val));
            this.__registerListener({ s: onSuccess, e: onError, promise: p });
            return p;
        }
        private __registerListener(listener: PromiseListener) {
            if (this.__stat === STAT_FULFILLED) {
                this.__notifyListenerOfSuccess(listener, this.__sucVal);
            } else if (this.__stat === STAT_FAILED) {
                this.__notifyListenerOfFailure(listener, this.__errVal);
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

        static wrapError(errorValue): AbstractPromise {
            return new ErrorPromise(errorValue);
        }
    }
}
