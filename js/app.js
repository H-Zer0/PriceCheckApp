const byId = id => document.getElementById(id);
const products = Object.fromEntries(['a', 'b'].map(key => [key, {
    card: byId(`product-${key}`), price: byId(`price-${key}`), amount: byId(`amount-${key}`),
    unit: byId(`unit-${key}`), display: byId(`unit-price-${key}`), error: byId(`error-${key}`)
}]));
const numberFormat = new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 1 });
function formatNumber(value) {
    if (value > 0 && value < 0.1) return value.toExponential(2);
    return numberFormat.format(value);
}
const touched = new WeakSet();
function validateField(field, amount = false, percent = false) {
    const value = parseDecimal(field.value);
    let error = '';
    if (field.value.trim() && (value === null || (amount && value <= 0) || (percent && value > 100))) {
        error = amount ? '内容量は0より大きい数値で入力してください。' : percent ? '割引率は0〜100で入力してください。' : '価格は0以上の数値で入力してください。';
    } else if (!field.value.trim() && touched.has(field)) {
        error = amount ? '内容量を入力してください。' : percent ? '割引率を入力してください。' : '価格を入力してください。';
    }
    // 入力途中にはエラーを急いで出さない。結果は常に検証する。
    const visible = touched.has(field) ? error : '';
    field.setAttribute('aria-invalid', String(Boolean(visible)));
    return { value: error ? null : value, error: visible };
}
function showError(element, message) {
    element.textContent = message;
    element.hidden = !message;
}
function calculate() {
    const data = {};
    for (const [key, product] of Object.entries(products)) {
        const price = validateField(product.price);
        const amount = validateField(product.amount, true);
        data[key] = { price: price.value, amount: amount.value, unit: product.unit.value };
        const unitPrice = calculateUnitPrice(price.value, amount.value, product.unit.value);
        const info = UNITS[product.unit.value];
        const basis = info.type === 'count' ? 1 : 100;
        const scaled = unitPrice === null ? null : unitPrice * basis;
        // 倍率をかけて表示できないほど大きい単価は1単位表示に戻す。
        const displayBasis = scaled !== null && !Number.isFinite(scaled) ? 1 : basis;
        product.display.textContent = `${displayBasis}${info.base}あたり：${unitPrice === null ? '—' : formatNumber(unitPrice * displayBasis)} 円`;
        product.card.classList.remove('winner');
        showError(product.error, price.error || amount.error || (price.value !== null && amount.value > 0 && unitPrice === null ? '数値が大きすぎるか、小さすぎます。' : ''));
    }
    const result = compareProducts(data.a, data.b);
    const area = document.querySelector('.result-area');
    const message = byId('result-message');
    const note = byId('result-note');
    delete area.dataset.winner;
    if (result.error) {
        message.textContent = result.error === 'Unit type mismatch' ? 'この単位の組み合わせは比較できません' : '2つの商品の価格と内容量を入力';
        note.textContent = result.error === 'Unit type mismatch' ? '重さ同士、容量同士、個数同士で比較してください。' : '入力すると、自動で比較します。';
        return;
    }
    if (result.better === 'EQUAL') {
        message.textContent = 'どちらも同じお得さです';
    } else {
        const percent = result.diffPercent < 0.1 ? '0.1%未満' : `約${numberFormat.format(result.diffPercent)}%`;
        message.textContent = `商品${result.better}が${percent}お得！`;
        products[result.better.toLowerCase()].card.classList.add('winner');
        area.dataset.winner = result.better;
    }
    note.textContent = '同じ内容量あたりの価格で比較しています。';
}
function calculateDiscountUI() {
    const price = validateField(byId('disc-price'));
    const percent = validateField(byId('disc-percent'), false, true);
    const result = calculateDiscount(price.value, percent.value);
    byId('disc-final-price').textContent = result ? formatNumber(result.finalPrice) : '—';
    byId('disc-saved').textContent = result ? formatNumber(result.saved) : '—';
    showError(byId('disc-error'), price.error || percent.error);
}
function bindFields(fields, update) {
    fields.forEach(field => {
        field.addEventListener(field.tagName === 'SELECT' ? 'change' : 'input', update);
        field.addEventListener('blur', () => { touched.add(field); update(); });
    });
}
bindFields(Object.values(products).flatMap(product => [product.price, product.amount, product.unit]), calculate);
bindFields([byId('disc-price'), byId('disc-percent')], calculateDiscountUI);

function setupReset(resetId, undoId, fields, update) {
    let previous = null;
    const undo = byId(undoId);
    byId(resetId).addEventListener('click', () => {
        if (!fields.some(field => field.value !== (field.tagName === 'SELECT' ? 'g' : ''))) return;
        previous = fields.map(field => ({ value: field.value, touched: touched.has(field) }));
        fields.forEach(field => { field.value = field.tagName === 'SELECT' ? 'g' : ''; touched.delete(field); });
        undo.hidden = false;
        update();
    });
    undo.addEventListener('click', () => {
        if (!previous) return;
        fields.forEach((field, index) => {
            field.value = previous[index].value;
            if (previous[index].touched) touched.add(field); else touched.delete(field);
        });
        undo.hidden = true;
        previous = null;
        update();
        byId(resetId).focus();
    });
}
setupReset('reset-btn', 'undo-btn', Object.values(products).flatMap(product => [product.price, product.amount, product.unit]), calculate);
setupReset('disc-reset-btn', 'disc-undo-btn', [byId('disc-price'), byId('disc-percent')], calculateDiscountUI);

const navItems = [...document.querySelectorAll('.nav-item')];
navItems.forEach(item => item.addEventListener('click', () => {
    navItems.forEach(nav => {
        const active = nav === item;
        nav.classList.toggle('active', active);
        nav.setAttribute('aria-pressed', String(active));
        byId(nav.dataset.target).hidden = !active;
    });
}));
// Enterで価格→内容量→次の商品へ。最後の項目ではキーボードを閉じる。
[[ 'price-a', 'amount-a', 'price-b', 'amount-b' ], [ 'disc-price', 'disc-percent' ]].forEach(ids => {
    ids.forEach((id, index) => byId(id).addEventListener('keydown', event => {
        if (event.key !== 'Enter' || event.isComposing) return;
        event.preventDefault();
        if (ids[index + 1]) byId(ids[index + 1]).focus(); else byId(id).blur();
    }));
});
calculate();
calculateDiscountUI();
