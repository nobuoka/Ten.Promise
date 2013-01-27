declare var exports;
exports.fulfilled = function (val) {
    return Ten.Promise.wrap(val);
};
exports.rejected = function (reason) {
    return Ten.Promise.wrapError(reason);
};
exports.pending = function () {
    var _s;
    var _e;
    var _p;
    return {
        promise: new Ten.Promise(function (s,e,p) {
            _s = s;
            _e = e;
            _p = p;
        }, function onCancel() {
        }),
        fulfill: function (value) { _s(value) },
        reject: function (reason) { _e(reason) },
    };
};
