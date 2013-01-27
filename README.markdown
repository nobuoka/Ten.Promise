Ten.Promise
==============================

コンパイル

$ node ../typescript/bin/tsc \
       src/Ten/Promise.header_for_promise_aplus_tests.ts \
       src/Ten/Promise.ts src/Ten/Promise.footer_for_node.ts \
       src/Ten/Promise.footer_for_test_of_jsdeferred.ts \
       --out Ten.Promise.js
