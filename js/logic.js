/**
 * 単位定義と変換係数
 * 基準単位: g (重さ), ml (容量), 個 (個数)
 */
const UNITS = {
  g: { base: 'g', factor: 1, type: 'weight' },
  kg: { base: 'g', factor: 1000, type: 'weight' },
  ml: { base: 'ml', factor: 1, type: 'volume' },
  L: { base: 'ml', factor: 1000, type: 'volume' },
  ko: { base: '個', factor: 1, type: 'count', label: '個' } // 'ko' is used for internal ID, label for display if needed
};

/**
 * 内容量を基準単位に正規化する
 * @param {number} amount - 内容量
 * @param {string} unit - 単位 (g, kg, ml, L, ko)
 * @returns {object} { amount: number, unit: string, type: string }
 */
function normalize(amount, unit) {
  const unitInfo = UNITS[unit];
  if (!unitInfo) {
    throw new Error(`Unknown unit: ${unit}`);
  }
  return {
    amount: amount * unitInfo.factor,
    unit: unitInfo.base,
    type: unitInfo.type
  };
}

/**
 * 単価を計算する (価格 / 正規化された内容量)
 * @param {number} price - 価格
 * @param {number} amount - 内容量
 * @param {string} unit - 単位
 * @returns {number|null} 単価 (単位あたりの価格) または 計算不可の場合 null
 */
function calculateUnitPrice(price, amount, unit) {
  if (!price || !amount || !unit) return null;
  const normalized = normalize(amount, unit);
  if (normalized.amount === 0) return null;
  return price / normalized.amount;
}

/**
 * 2つの商品を比較する
 * @param {object} productA - { price, amount, unit }
 * @param {object} productB - { price, amount, unit }
 * @returns {object} 比較結果
 */
function compareProducts(productA, productB) {
  const unitPriceA = calculateUnitPrice(productA.price, productA.amount, productA.unit);
  const unitPriceB = calculateUnitPrice(productB.price, productB.amount, productB.unit);

  if (unitPriceA === null || unitPriceB === null) {
    return { error: 'Invalid input' };
  }

  // 単位タイプが異なる場合は比較不可 (例: g と ml)
  // ただし、簡易化のためUI側で制御する前提とし、ここでは計算できれば比較する
  // 厳密には type チェックを入れるべき
  const typeA = UNITS[productA.unit].type;
  const typeB = UNITS[productB.unit].type;
  if (typeA !== typeB) {
    return { error: 'Unit type mismatch' };
  }

  let better = null;
  let diffPercent = 0;

  if (unitPriceA < unitPriceB) {
    better = 'A';
    diffPercent = ((unitPriceB - unitPriceA) / unitPriceB) * 100;
  } else if (unitPriceB < unitPriceA) {
    better = 'B';
    diffPercent = ((unitPriceA - unitPriceB) / unitPriceA) * 100;
  } else {
    better = 'EQUAL';
    diffPercent = 0;
  }

  return {
    better,
    diffPercent: Math.round(diffPercent * 10) / 10, // 小数点第1位まで
    unitPriceA,
    unitPriceB,
    baseUnit: UNITS[productA.unit].base
  };
}

/**
 * 割引価格を計算する
 * @param {number} price - 元の価格
 * @param {number} percent - 割引率 (%)
 * @returns {object} { finalPrice: number, saved: number }
 */
function calculateDiscount(price, percent) {
  if (!price || price < 0) return null;
  if (!percent || percent < 0) return { finalPrice: price, saved: 0 };
  
  const discountAmount = Math.floor(price * (percent / 100)); // 値引き額 (切り捨て)
  const finalPrice = price - discountAmount;
  
  return {
    finalPrice,
    saved: discountAmount
  };
}
