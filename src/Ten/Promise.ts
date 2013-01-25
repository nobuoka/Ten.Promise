module Ten {
    export class Promise {
        private __onCancel;
        constructor(init, onCancel) {
            this.__onCancel = onCancel;
            function comp(val) {
            }
            function err(val) {
            }
            function prog(val) {
            }
            try {
                init(comp, err, prog);
            } catch (err) {
            }
        }
        cancel() {
        }
    }
}
