module Ten {
    interface PromiseListener {
        promise?: AbstractPromise;
        s: (val) => any;
    }
    export class AbstractPromise {
        private __sucVal;
        private __listeners: PromiseListener[];
        constructor () {
            this.__listeners = [];
        }
        private __notifySuccess() {
            var val = this.__sucVal;
            var listeners = this.__listeners;
            while (listeners.length > 0) {
                var listener = listeners.shift();
                this.__notifyListenerOfSuccess(listener, val);
            }
        }
        _setValue(valOrPromise) {
            var that = this;
            function setValImpl (val) {
                that.__sucVal = val;
                that.__notifySuccess();
            }
            if (valOrPromise instanceof AbstractPromise) {
                var p = <AbstractPromise>valOrPromise;
                // 本来は done メソッドを使いたい
                p.then(function (val) {
                    setValImpl(val);
                });
            } else {
                var val = <any>valOrPromise;
                setValImpl(val);
            }
        }
        cancel() {
        }
        private __notifyListenerOfSuccess(listener: PromiseListener, value: any) {
            // value or Promise, or exception
            var callbackRes;
            try {
                callbackRes = listener.s(this.__sucVal);
            } catch (err) {
                callbackRes = err;
            }
            // 普通の値だったら
            listener.promise._setValue(callbackRes);
        }
        private __registerListener(listener: PromiseListener) {
            if (this.__sucVal) {
                this.__notifyListenerOfSuccess(listener, this.__sucVal);
            } else {
                this.__listeners.push(listener);
            }
        }
        then(onSuccess: (val) => any): AbstractPromise {
            var p = new SimplePromise();
            this.__registerListener({ s: onSuccess, promise: p });
            return p;
        }
    }
    class SimplePromise extends AbstractPromise {}
    export class Promise extends AbstractPromise {
        private __onCancel;
        constructor(init, onCancel) {
            super();
            this.__onCancel = onCancel;
            var that = this;
            function comp(val) {
                that._setValue(val);
            }
            try {
                init(comp);
            } catch (err) {
                // ここどうしよう
            }
        }
    }
}