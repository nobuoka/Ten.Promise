/**
 * Ten.Promise 0.1.0
 * The MIT License ( http://opensource.org/licenses/MIT )
 * Copyright (c) 2013 nobuoka
 */

var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Ten;
(function (Ten) {
    "use strict";
    function isPromise(v) {
        return !!(v && typeof v.then === "function");
    }
    function createCancelError() {
        var err = new Error("Canceled");
        err.name = "Canceled";
        return err;
    }
    ;
    ;
    var queueTaskToEventLoop;
    (function () {
        if(typeof process === "object" && typeof process.nextTick === "function") {
            queueTaskToEventLoop = function (t) {
                process.nextTick(t);
            };
        } else if(typeof setImmediate === "function") {
            queueTaskToEventLoop = function (t) {
                setImmediate(t);
            };
        } else if(typeof MessageChannel !== "undefined") {
            queueTaskToEventLoop = function (t) {
                var ch = new MessageChannel();
                ch.port1.onmessage = function () {
                    ch.port1.onmessage = null;
                    ch = null;
                    t();
                };
                ch.port2.postMessage(0);
            };
        } else if(typeof window === "object" && typeof window.postMessage === "function" && typeof window.addEventListener === "function") {
            queueTaskToEventLoop = function (t) {
                window.addEventListener("message", function onMessage(evt) {
                    window.removeEventListener("message", onMessage, false);
                    t();
                }, false);
                window.postMessage("triger of function call", "*");
            };
        } else if(typeof window === "object" && typeof window.postMessage !== "undefined" && typeof window.attachEvent !== "undefined") {
            queueTaskToEventLoop = function (t) {
                var onMessage = function (evt) {
                    window.detachEvent("onmessage", onMessage);
                    t();
                };
                window.attachEvent("onmessage", onMessage);
                window.postMessage("triger of function call", "*");
            };
        } else if(typeof setTimeout !== "undefined") {
            queueTaskToEventLoop = function (t) {
                setTimeout(t, 0);
            };
        } else {
            queueTaskToEventLoop = function (t) {
                throw new Error("queueTaskToEventLoop method not implemented");
            };
        }
    })();
    var BasePromise = (function () {
        function BasePromise() {
            this.__stat = BasePromise._STAT_EMPTY;
            this.__callbacks = [];
        }
        BasePromise._STAT_EMPTY = 1;
        BasePromise._STAT_WAIT = 2;
        BasePromise._STAT_FULFIL = 4;
        BasePromise._STAT_ERROR = 8;
        BasePromise._BITS_UNFULFILLED_STAT = 3;
        BasePromise.prototype.then = function (s, e, p) {
            var prom = new BasePromise();
            prom.__parentPromise = this;
            var callbackObj = {
                s: s,
                e: e,
                p: p,
                prom: prom
            };
            if(this.__isUnfulfilled()) {
                this.__callbacks.push(callbackObj);
            } else {
                var that = this;
                queueTaskToEventLoop(function () {
                    that.__handleCallbacks([
                        callbackObj
                    ]);
                });
            }
            return prom;
        };
        BasePromise.prototype.cancel = function () {
            var cancelTargetProm;
            if(this.__stat === BasePromise._STAT_EMPTY) {
                var cancelTargetProm = this.__parentPromise;
            } else if(this.__stat === BasePromise._STAT_WAIT) {
                var cancelTargetProm = this.__val;
            }
            if(cancelTargetProm && typeof cancelTargetProm.cancel === "function") {
                cancelTargetProm.cancel();
            }
            if(this.__stat !== BasePromise._STAT_WAIT) {
                this._putError(createCancelError());
            }
        };
        BasePromise.prototype.__callbackAll = function () {
            this.__handleCallbacks(this.__callbacks);
        };
        BasePromise.prototype.__handleCallbacks = function (callbackObjs) {
            var retVals = [];
            var cc = callbackObjs.slice(0).reverse();
            while(cc.length > 0) {
                var c = cc.pop();
                var v = this.__callCallbackFunction(c);
                var p;
                if(p = c.prom) {
                    v.prom = p;
                    retVals.push(v);
                }
            }
            while(retVals.length > 0) {
                var v = retVals.pop();
                v.errorOccur ? v.prom._putError(v.value) : v.prom._putValOrProm(v.value);
            }
        };
        BasePromise.prototype.__callCallbackFunction = function (callbackObj) {
            var retVal;
            var errOccur = false;
            try  {
                var c = callbackObj[this.__callbackTypeName];
                if(typeof c !== "function") {
                    retVal = this.__val;
                    errOccur = (this.__stat === BasePromise._STAT_ERROR);
                } else {
                    retVal = c.call(null, this.__val);
                }
            } catch (err) {
                errOccur = true;
                retVal = err;
            }
            return {
                errorOccur: errOccur,
                value: retVal,
                prom: void 0
            };
        };
        BasePromise.prototype.__callProgressCallbacks = function (val) {
            var cc = this.__callbacks.slice(0).reverse();
            while(cc.length > 0) {
                var c = cc.pop();
                var progressCallbackFunction = c.p;
                if(progressCallbackFunction) {
                    try  {
                        progressCallbackFunction(val);
                    } catch (err) {
                    }
                }
            }
        };
        BasePromise.prototype.__isUnfulfilled = function () {
            return ((this.__stat & BasePromise._BITS_UNFULFILLED_STAT) !== 0);
        };
        BasePromise.prototype.__setValue = function (val) {
            this.__stat = BasePromise._STAT_FULFIL;
            this.__val = val;
            this.__callbackTypeName = "s";
            this.__callbackAll();
        };
        BasePromise.prototype.__setError = function (err) {
            this.__stat = BasePromise._STAT_ERROR;
            this.__val = err;
            this.__callbackTypeName = "e";
            this.__callbackAll();
        };
        BasePromise.prototype.__waitFor = function (prom) {
            this.__stat = BasePromise._STAT_WAIT;
            this.__val = prom;
            var that = this;
            prom.then(function onSuccess(val) {
                that._putValue(val);
            }, function onError(err) {
                that._putError(err);
            });
        };
        BasePromise.prototype._putValOrProm = function (v) {
            if(!this.__isUnfulfilled()) {
                return;
            }
            isPromise(v) ? this.__waitFor(v) : this.__setValue(v);
        };
        BasePromise.prototype._putValue = function (v) {
            if(!this.__isUnfulfilled()) {
                return;
            }
            this.__setValue(v);
        };
        BasePromise.prototype._putError = function (e) {
            if(!this.__isUnfulfilled()) {
                return;
            }
            this.__setError(e);
        };
        BasePromise.prototype._progress = function (v) {
            if(!this.__isUnfulfilled()) {
                return;
            }
            this.__callProgressCallbacks(v);
        };
        return BasePromise;
    })();
    Ten.BasePromise = BasePromise;    
    var Promise = (function (_super) {
        __extends(Promise, _super);
        function Promise(init, onCancel) {
                _super.call(this);
            this.__onCancel = onCancel;
            var that = this;
            var s = function (v) {
                that._putValOrProm(v);
            };
            var e = function (v) {
                that._putError(v);
            };
            var p = function (v) {
                that._progress(v);
            };
            try  {
                init(s, e, p);
            } catch (err) {
                e(err);
            }
        }
        Promise.prototype.cancel = function () {
            if(typeof this.__onCancel === "function") {
                try  {
                    this.__onCancel();
                } catch (err) {
                }
            }
            _super.prototype.cancel.call(this);
        };
        return Promise;
    })(BasePromise);
    Ten.Promise = Promise;    
})(Ten || (Ten = {}));
