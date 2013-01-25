module("Ten.Promise");

test("Ten.Promise の普通の使い方", function () {
    var p = new Ten.Promise();
    ok(p, "値がある");
});
