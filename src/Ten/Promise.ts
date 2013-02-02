
module Ten {
    "use strict";

    export interface IPromise {
        then(s,e): IPromise;
    }

    function isPromise(v) {
        return !!(v && typeof v.then === "function");
    }

    interface IPromiseCallback {
        prom: IPromise;
        s: (val: any) => any;
        e: (val: any) => any;
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
        } else if (typeof MessageChannel === "function") {
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
        } else if (typeof setTimeout === "function") {
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

        constructor() {
            this.__stat = BasePromise._STAT_EMPTY;
            this.__callbacks = [];
        }

        then(s,e): IPromise {
            // create callback obj
            var prom = new BasePromise();
            var callbackObj = {
                s: s,
                e: e,
                prom: prom,
            };
            if (this.__isUnfulfilled()) {
                this.__callbacks.push(callbackObj);
            } else {
                var that = this;
                queueTaskToEventLoop(function () { that.__handleCallback(callbackObj) });
            }
            return prom;
        }

        private __callbackAll() {
            var cc = this.__callbacks.reverse();
            while (cc.length > 0) {
                var c = cc.pop();
                this.__handleCallback(c);
            }
        }
        private __handleCallback(callbackObj: IPromiseCallback) {
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
            var p;
            if (p = callbackObj.prom) {
                errOccur ? p._putError(retVal) : p._putValOrProm(retVal);
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
                function onSuccess(val) { that.__setValue(val) },
                function onError(err) { that.__setError(err) });
        }

        _putValOrProm(v) {
            if (this.__stat !== BasePromise._STAT_EMPTY) return;
            isPromise(v) ? this.__waitFor(<IPromise>v) : this.__setValue(v);
        }

        _putValue(v) {
            if (this.__stat !== BasePromise._STAT_EMPTY) return;
            this.__setValue(v);
        }

        _putError(e) {
            if (this.__stat !== BasePromise._STAT_EMPTY) return;
            this.__setError(e);
        }
    }

    interface IPromiseInit {
        (s: (val) => void, e: (val) => void): void;
    }
    export class Promise extends BasePromise {
        constructor(init: IPromiseInit) {
            super();
            var that = this;
            var s = function (v) { that._putValOrProm(v) };
            var e = function (v) { that._putError(v) };
            try {
                init(s,e);
            } catch (err) {
                e(err);
            }
        }
    }
}
