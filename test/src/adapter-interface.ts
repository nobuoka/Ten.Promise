interface ITestFunction {(): void;}
interface IAsyncTestFunction {(done: () => void): void;}

interface ITestAdapter {
    module(mod: string);
    test(desc: string, testFunc: ITestFunction);
    testAsync(desc: string, testFunc: IAsyncTestFunction);

    equal(actual, expected, message?: string);
    notEqual(actual, expected, message?: string);
    deepEqual(actual, expected, message?: string);
    notDeepEqual(actual, expected, message?: string);
    strictEqual(actual, expected, message?: string);
    notStrictEqual(actual, expected, message?: string);
    ok(value, message?: string);
    throws(block: {(): void;}, validator?: {(ex): bool;}, message?: string );
}
