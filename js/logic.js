/** 基準単位は g・mL・個。異なる種類の単位は比較しない。 */
const UNITS = {
    g: { base: 'g', factor: 1, type: 'weight' },
    kg: { base: 'g', factor: 1000, type: 'weight' },
    ml: { base: 'mL', factor: 1, type: 'volume' },
    L: { base: 'mL', factor: 1000, type: 'volume' },
    ko: { base: '個', factor: 1, type: 'count' }
};

// 全角数字・小数点も受け付ける。途中まで有効な文字列を数値化しない。
function parseDecimal(value) {
    const text = String(value).normalize('NFKC').trim();
    if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) return null;
    const number = Number(text);
    return Number.isFinite(number) && number <= Number.MAX_SAFE_INTEGER ? number : null;
}

function normalize(amount, unit) {
    const info = UNITS[unit];
    if (!info) return null;
    return { amount: amount * info.factor, unit: info.base, type: info.type };
}

function calculateUnitPrice(price, amount, unit) {
    if (!Number.isFinite(price) || price < 0 || price > Number.MAX_SAFE_INTEGER ||
        !Number.isFinite(amount) || amount <= 0 || amount > Number.MAX_SAFE_INTEGER) return null;
    const normalized = normalize(amount, unit);
    if (!normalized || !Number.isFinite(normalized.amount) || normalized.amount <= 0) return null;
    const result = price / normalized.amount;
    // オーバーフロー・アンダーフローを無料や有効な単価として扱わない。
    return Number.isFinite(result) && (price === 0 || result > 0) ? result : null;
}

function compareProducts(productA, productB) {
    const unitPriceA = calculateUnitPrice(productA.price, productA.amount, productA.unit);
    const unitPriceB = calculateUnitPrice(productB.price, productB.amount, productB.unit);
    if (unitPriceA === null || unitPriceB === null) return { error: 'Invalid input' };
    if (UNITS[productA.unit].type !== UNITS[productB.unit].type) return { error: 'Unit type mismatch' };
    // 同じ単価の浮動小数点誤差だけを許容する。
    const equal = Math.abs(unitPriceA - unitPriceB) <= Number.EPSILON * 4 * Math.max(unitPriceA, unitPriceB);
    const better = equal ? 'EQUAL' : unitPriceA < unitPriceB ? 'A' : 'B';
    const high = Math.max(unitPriceA, unitPriceB);
    return {
        better,
        diffPercent: equal ? 0 : ((high - Math.min(unitPriceA, unitPriceB)) / high) * 100,
        unitPriceA, unitPriceB, baseUnit: UNITS[productA.unit].base
    };
}

/** 既存仕様：値引き額の1円未満を切り捨てる。 */
function calculateDiscount(price, percent) {
    if (!Number.isFinite(price) || price < 0 || price > Number.MAX_SAFE_INTEGER ||
        !Number.isFinite(percent) || percent < 0 || percent > 100) return null;
    const saved = Math.floor(price * (percent / 100));
    return { finalPrice: price - saved, saved };
}
