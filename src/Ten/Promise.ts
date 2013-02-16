
module Ten {
    "use strict";

    export interface IPromise {
        then(s?,e?,p?): IPromise;
    }

    function isPromise(v) {
        return !!(v && typeof v.then === "function");
    }

    function createCancelError() {
        var err = new Error("Canceled");
        err.name = "Canceled";
        return err;
    }

    interface IPromiseCallback {
        prom: IPromise;
        s: (val: any) => any;
        e: (val: any) => any;
        p: (val: any) => void;
    };
    interface IPromiseCallbackReturn {
        errorOccur: bool;
        value: any;
        prom: BasePromise;
    };

    declare var process;
    declare var setImmediate;
    declare var setTimeout;
    declare var MessageChannel;
    interface ITaskFunction {
        (): void;
    }
    var queueTaskToEventLoop: {(task: ITaskFunction): void;};
    (function () {
        if (typeof process === "object" && typeof process.nextTick === "function") {
            // for Node
            queueTaskToEventLoop = function (t: ITaskFunction) { process.nextTick(t) };
        } else if (typeof setImmediate === "function") {
            queueTaskToEventLoop = function (t: ITaskFunction) { setImmediate(t) };
        } else if (typeof MessageChannel !== "undefined") {
            queueTaskToEventLoop = function (t: ITaskFunction) {
                var ch = new MessageChannel();
                ch.port1.onmessage = function() {
                    ch.port1.onmessage = null; ch = null;
                    t();
                };
                ch.port2.postMessage(0);
            };
        } else if (typeof window === "object" && typeof window.postMessage === "function"
                   && typeof window.addEventListener === "function") {
            queueTaskToEventLoop = function (t: ITaskFunction) {
                window.addEventListener("message", function onMessage(evt) {
                    window.removeEventListener("message", onMessage, false);
                    t();
                }, false);
                window.postMessage("triger of function call", "*");
            };
        } else if (typeof window === "object" && typeof window.postMessage !== "undefined"
                   && typeof window.attachEvent !== "undefined") {
                   // Each `typeof setTimeout` and `typeof attachEvent` may be not "function" but "object"
                   // in old IEs
            queueTaskToEventLoop = function (t: ITaskFunction) {
                var onMessage = function (evt) {
                    window.detachEvent("onmessage", onMessage);
                    t();
                }
                window.attachEvent("onmessage", onMessage);
                window.postMessage("triger of function call", "*");
            };
        } else if (typeof setTimeout !== "undefined") {
                   // `typeof setTimeout` may be not "function" but "object" in old IEs
            queueTaskToEventLoop = function (t: ITaskFunction) { setTimeout(t, 0) };
        } else {
            queueTaskToEventLoop = function (t: ITaskFunction) {
                throw new Error("queueTaskToEventLoop method not implemented");
            };
        }
    })();

    export class BasePromise implements IPromise {
        static _STAT_EMPTY  = 1;
        static _STAT_WAIT   = 2;
        static _STAT_FULFIL = 4;
        static _STAT_ERROR  = 8;
        // bits mask for empty state or waiting state
        static _BITS_UNFULFILLED_STAT = 3; // === (1 | 2)

        private __stat: number;
        private __callbacks: IPromiseCallback[];
        private __val: any;
        private __callbackTypeName: string;
        private __parentPromise: BasePromise;

        constructor() {
            this.__stat = BasePromise._STAT_EMPTY;
            this.__callbacks = [];
        }

        then(s?,e?,p?): IPromise {
            // create callback obj
            var prom = new BasePromise();
            prom.__parentPromise = this;
            var callbackObj: IPromiseCallback = {
                s: s,
                e: e,
                p: p,
                prom: prom,
            };
            if (this.__isUnfulfilled()) {
                this.__callbacks.push(callbackObj);
            } else {
                var that = this;
                queueTaskToEventLoop(function () { that.__handleCallbacks([callbackObj]) });
            }
            return prom;
        }

        cancel() {
            var cancelTargetProm;
            if (this.__stat === BasePromise._STAT_EMPTY) {
                var cancelTargetProm = this.__parentPromise;
            } else if(this.__stat === BasePromise._STAT_WAIT) {
                var cancelTargetProm = this.__val;
            }
            if (cancelTargetProm && typeof cancelTargetProm.cancel === "function") {
                cancelTargetProm.cancel();
            }
            if (this.__stat !== BasePromise._STAT_WAIT) this._putError(createCancelError());
        }

        private __callbackAll() {
            this.__handleCallbacks(this.__callbacks);
        }
        private __handleCallbacks(callbackObjs: IPromiseCallback[]) {
            var retVals: IPromiseCallbackReturn[] = [];
            var cc = callbackObjs.slice(0).reverse();
            while (cc.length > 0) {
                var c = cc.pop();
                var v = this.__callCallbackFunction(c);
                var p;
                if (p = c.prom) {
                    v.prom = p;
                    retVals.push(v);
                }
            }
            while (retVals.length > 0) {
                var v = retVals.pop();
                v.errorOccur ? v.prom._putError(v.value) : v.prom._putValOrProm(v.value);
            }
        }
        private __callCallbackFunction(callbackObj: IPromiseCallback): IPromiseCallbackReturn {
            var retVal;
            var errOccur = false;
            try {
                var c = callbackObj[this.__callbackTypeName];
                if (typeof c !== "function") {
                    retVal = this.__val;
                    errOccur = (this.__stat === BasePromise._STAT_ERROR);
                } else {
                    retVal = c.call(null, this.__val);
                }
            } catch (err) {
                errOccur = true;
                retVal = err;
            }
            return { errorOccur: errOccur, value: retVal, prom: void 0 };
        }

        private __callProgressCallbacks(val) {
            var cc = this.__callbacks.slice(0).reverse();
            while (cc.length > 0) {
                var c = cc.pop();
                var progressCallbackFunction = c.p;
                if (progressCallbackFunction) {
                    try {
                        progressCallbackFunction(val);
                    } catch (err) {} // catch and stop
                }
            }
        }

        private __isUnfulfilled() { // true when empty state or waiting state
            return ((this.__stat & BasePromise._BITS_UNFULFILLED_STAT) !== 0);
        }

        private __setValue(val) {
            this.__stat = BasePromise._STAT_FULFIL;
            this.__val = val;
            this.__callbackTypeName = "s";
            this.__callbackAll();
        }

        private __setError(err) {
            this.__stat = BasePromise._STAT_ERROR;
            this.__val = err;
            this.__callbackTypeName = "e";
            this.__callbackAll();
        }

        private __waitFor(prom: IPromise) {
            this.__stat = BasePromise._STAT_WAIT;
            this.__val = prom;
            var that = this;
            prom.then(
                function onSuccess(val) { that._putValue(val) },
                function onError(err) { that._putError(err) });
        }

        _putValOrProm(v) {
            if (!this.__isUnfulfilled()) return;
            isPromise(v) ? this.__waitFor(<IPromise>v) : this.__setValue(v);
        }

        _putValue(v) {
            if (!this.__isUnfulfilled()) return;
            this.__setValue(v);
        }

        _putError(e) {
            if (!this.__isUnfulfilled()) return;
            this.__setError(e);
        }

        _progress(v) {
            if (!this.__isUnfulfilled()) return;
            this.__callProgressCallbacks(v);
        }
    }

    interface IPromiseInit {
        (s?: (val) => void, e?: (val) => void, p?: (val) => void): void;
    }
    export class Promise extends BasePromise {
        private __onCancel;
        constructor(init: IPromiseInit, onCancel?: ITaskFunction) {
            super();
            this.__onCancel = onCancel;
            var that = this;
            var s = function (v) { that._putValOrProm(v) };
            var e = function (v) { that._putError(v) };
            var p = function (v) { that._progress(v) };
            try {
                init(s,e,p);
            } catch (err) {
                e(err);
            }
        }
        cancel() {
            if (typeof this.__onCancel === "function") {
                try {
                    this.__onCancel();
                } catch (err) {} // catch and stop here
            }
            super.cancel();
        }

        /**
         * Determines whether a value fulfills the promise contract.
         */
        static is = isPromise;

        static wrap(val) {
            var p = new BasePromise();
            p._putValue(val);
            return p;
        }

        static wrapError(reason) {
            var p = new BasePromise();
            p._putError(reason);
            return p;
        }
    }
}
