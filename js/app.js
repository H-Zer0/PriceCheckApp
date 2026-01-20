// Logic functions are now global from logic.js

// DOM Elements
const inputs = {
    a: {
        card: document.getElementById('product-a'),
        price: document.getElementById('price-a'),
        amount: document.getElementById('amount-a'),
        unit: document.getElementById('unit-a'),
        unitPrice: document.getElementById('unit-price-a'),
        badge: document.getElementById('badge-a')
    },
    b: {
        card: document.getElementById('product-b'),
        price: document.getElementById('price-b'),
        amount: document.getElementById('amount-b'),
        unit: document.getElementById('unit-b'),
        unitPrice: document.getElementById('unit-price-b'),
        badge: document.getElementById('badge-b')
    }
};

const resultArea = {
    container: document.getElementById('result-area'),
    message: document.getElementById('result-message'),
    resetBtn: document.getElementById('reset-btn')
};

// State
let state = {
    a: { price: 0, amount: 0, unit: 'g' },
    b: { price: 0, amount: 0, unit: 'g' }
};

/**
 * UIの更新
 */
function updateUI(comparisonResult) {
    // 1. Reset styles
    inputs.a.card.classList.remove('winner');
    inputs.b.card.classList.remove('winner');

    // 2. Unit Prices
    const updateUnitPrice = (inputObj, val, unit) => {
        if (val === null || isNaN(val) || !isFinite(val)) {
            inputObj.unitPrice.textContent = '---';
            const baseUnitEl = inputObj.unitPrice.parentNode.querySelector('.base-unit');
            if (baseUnitEl) baseUnitEl.textContent = unit === 'ko' ? '個' : (unit === 'ml' || unit === 'L' ? 'ml' : 'g');
        } else {
            let formatted = val;
            if (val < 1) {
                formatted = val.toPrecision(3);
            } else {
                formatted = val.toFixed(2);
            }
            inputObj.unitPrice.textContent = formatted;

            const baseUnit = (inputObj.unit.value === 'ml' || inputObj.unit.value === 'L') ? 'ml' : (inputObj.unit.value === 'ko' ? '個' : 'g');
            const baseUnitEl = inputObj.unitPrice.parentNode.querySelector('.base-unit');
            if (baseUnitEl) baseUnitEl.textContent = baseUnit;
        }
    };

    updateUnitPrice(inputs.a, comparisonResult.unitPriceA, inputs.a.unit.value);
    updateUnitPrice(inputs.b, comparisonResult.unitPriceB, inputs.b.unit.value);

    // 3. Result Message & Winner
    if (comparisonResult.error) {
        if (comparisonResult.error === 'Unit type mismatch') {
            resultArea.message.textContent = '単位の種類が違います';
            resultArea.message.style.color = '#ff5555';
        } else {
            // 入力途中など
            resultArea.message.textContent = '値を入力してください';
            resultArea.message.style.color = 'var(--text-primary)';
        }
        return;
    }

    resultArea.message.style.color = 'var(--text-primary)';

    if (comparisonResult.better === 'A') {
        inputs.a.card.classList.add('winner');
        resultArea.message.innerHTML = `<strong>商品A</strong> の方が <strong>約${comparisonResult.diffPercent}%</strong> お得！`;
    } else if (comparisonResult.better === 'B') {
        inputs.b.card.classList.add('winner');
        resultArea.message.innerHTML = `<strong>商品B</strong> の方が <strong>約${comparisonResult.diffPercent}%</strong> お得！`;
    } else if (comparisonResult.better === 'EQUAL') {
        resultArea.message.textContent = 'どちらも同じ単価です';
    }
}

/**
 * 計算実行
 */
function calculate() {
    // 値の取得
    const getData = (key) => ({
        price: parseFloat(inputs[key].price.value),
        amount: parseFloat(inputs[key].amount.value),
        unit: inputs[key].unit.value
    });

    state.a = getData('a');
    state.b = getData('b');

    // 計算
    const result = compareProducts(state.a, state.b);
    updateUI(result);
}

/**
 * イベントリスナー設定
 */
function setupEventListeners() {
    const events = ['input', 'change'];

    // A inputs
    [inputs.a.price, inputs.a.amount, inputs.a.unit].forEach(el => {
        events.forEach(evt => el.addEventListener(evt, calculate));
    });

    // B inputs
    [inputs.b.price, inputs.b.amount, inputs.b.unit].forEach(el => {
        events.forEach(evt => el.addEventListener(evt, calculate));
    });

    // Reset button
    resultArea.resetBtn.addEventListener('click', () => {
        inputs.a.price.value = '';
        inputs.a.amount.value = '';
        inputs.a.unit.value = 'g';

        inputs.b.price.value = '';
        inputs.b.amount.value = '';
        inputs.b.unit.value = 'g';

        calculate(); // Recalculate to reset UI

        // Visual Reset
        inputs.a.card.classList.remove('winner');
        inputs.b.card.classList.remove('winner');

        inputs.a.price.focus();
    });
}

// Initialize
setupEventListeners();

/**
 * 割引計算機能
 */
const discountInputs = {
    price: document.getElementById('disc-price'),
    customPercent: document.getElementById('disc-percent'),
    resultPrice: document.getElementById('disc-final-price'),
    savedAmount: document.getElementById('disc-saved'),
    resetBtn: document.getElementById('disc-reset-btn')
};

function calculateDiscountUI() {
    const price = parseFloat(discountInputs.price.value);
    const percent = parseFloat(discountInputs.customPercent.value);

    const result = calculateDiscount(price, percent);

    if (result) {
        discountInputs.resultPrice.textContent = result.finalPrice.toLocaleString();
        discountInputs.savedAmount.textContent = result.saved.toLocaleString();
    } else {
        discountInputs.resultPrice.textContent = '---';
        discountInputs.savedAmount.textContent = '---';
    }
}

function setupDiscountListeners() {
    // Inputs
    ['input', 'change'].forEach(evt => {
        discountInputs.price.addEventListener(evt, calculateDiscountUI);
        discountInputs.customPercent.addEventListener(evt, calculateDiscountUI);
    });

    // Reset
    discountInputs.resetBtn.addEventListener('click', () => {
        discountInputs.price.value = '';
        discountInputs.customPercent.value = '';
        calculateDiscountUI();
    });
}

/**
 * タブナビゲーション
 */
function setupTabNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent anchor jump
            const targetId = item.dataset.target;

            // Update Nav
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Update Views
            views.forEach(view => {
                if (view.id === targetId) {
                    view.style.display = 'block';
                    // Trigger reflow/animation if needed
                    view.classList.add('active');
                } else {
                    view.style.display = 'none';
                    view.classList.remove('active');
                }
            });
        });
    });
}

// Init New Features
setupDiscountListeners();
setupTabNavigation();
