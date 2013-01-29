var Ten = require("../js/Ten.Promise.for_node.js").Ten;

exports.fulfilled = function (val) {
    var p = new Ten.BasePromise();
    p._putValue(val);
    return p;
};
exports.rejected = function (reason) {
    var p = new Ten.BasePromise();
    p._putError(reason);
    return p;
};
exports.pending = function () {
    var p = new Ten.BasePromise();
    return {
        promise: p,
        fulfill: function (value) { p._putValue(value) },
        reject: function (reason) { p._putError(reason) },
    };
};
