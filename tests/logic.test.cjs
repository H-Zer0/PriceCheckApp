// 外部依存なし。node標準モジュールでブラウザ用の計算関数を検査する。
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const context = vm.createContext({});
vm.runInContext(readFileSync(require('node:path').join(__dirname, '../js/logic.js'), 'utf8'), context);
const { parseDecimal, calculateUnitPrice, compareProducts, calculateDiscount } = context;
let count = 0;
function check(name, test) { test(); count++; console.log(`OK ${name}`); }
const product = (price, amount, unit = 'g') => ({ price, amount, unit });
check('100円/50g と120円/70g：Bが約14.3%お得', () => {
    const result = compareProducts(product(100, 50), product(120, 70));
    assert.equal(result.better, 'B');
    assert.ok(Math.abs(result.diffPercent - 14.28571428571429) < 1e-10);
});
check('g/kg換算で同価', () => assert.equal(compareProducts(product(100, 500), product(200, 1, 'kg')).better, 'EQUAL'));
check('mL/L換算', () => assert.equal(compareProducts(product(100, 500, 'ml'), product(300, 1, 'L')).better, 'A'));
check('重さと容量は比較不可', () => assert.equal(compareProducts(product(100, 50), product(100, 50, 'ml')).error, 'Unit type mismatch'));
check('個数の比較', () => assert.equal(compareProducts(product(100, 2, 'ko'), product(100, 4, 'ko')).better, 'B'));
check('無料と両方無料', () => {
    assert.equal(compareProducts(product(0, 1), product(1, 1)).diffPercent, 100);
    assert.equal(compareProducts(product(0, 1), product(0, 1)).better, 'EQUAL');
});
check('欠損・0量・負数・非数・無限・未知単位を拒否', () => {
    for (const args of [[null, 1, 'g'], [1, null, 'g'], [1, 0, 'g'], [-1, 1, 'g'], [1, -1, 'g'], [NaN, 1, 'g'], [Infinity, 1, 'g'], [1, 1, 'unknown'], [Number.MAX_VALUE, 1, 'g'], [1, Number.MIN_VALUE, 'g']]) assert.equal(calculateUnitPrice(...args), null);
});
check('小数と浮動小数点の同価判定', () => assert.equal(compareProducts(product(.3, .1), product(.9, .3)).better, 'EQUAL'));
check('入力文字列全体を検証・全角を正規化', () => {
    assert.equal(parseDecimal('１２３．５'), 123.5);
    assert.equal(parseDecimal('.5'), .5);
    for (const value of ['', ' ', '12abc', '-1', 'Infinity', '1e5', '1,000', '9007199254740992']) assert.equal(parseDecimal(value), null);
});
check('割引額切り捨て・0%・100%・0円', () => {
    assert.equal(calculateDiscount(999, 15).saved, 149);
    assert.equal(calculateDiscount(999, 15).finalPrice, 850);
    assert.equal(calculateDiscount(100, 0).finalPrice, 100);
    assert.equal(calculateDiscount(100, 100).finalPrice, 0);
    assert.equal(calculateDiscount(0, 20).finalPrice, 0);
});
check('割引の不正値は拒否', () => {
    for (const args of [[100, 101], [100, -1], [-1, 10], [null, 20], [100, null], [Infinity, 10], [100, NaN]]) assert.equal(calculateDiscount(...args), null);
});
console.log(`${count} checks passed`);
