t.test("`Ten.BasePromise` constructor creates object which has `then` method", function () {
    var p = new Ten.BasePromise();
    t.equal(typeof p.then, "function", "`Ten.BasePromise` object has `then` method");
});
