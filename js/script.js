// Курси обміну валют (оновлюється з API)
const exchangeRates = {
    USD: 1.0,
    EUR: 0.92,
    UAH: 40.5,
    GBP: 0.79,
    JPY: 149.5,
    CHF: 0.88,
    CAD: 1.36,
    AUD: 1.52,
    CNY: 7.24,
    INR: 83.1
};

// DOM елементи
const amountInput = document.getElementById('amount');
const fromCurrencySelect = document.getElementById('fromCurrency');
const toCurrencySelect = document.getElementById('toCurrency');
const resultInput = document.getElementById('result');
const exchangeRateInfo = document.getElementById('exchangeRate');
const swapBtn = document.getElementById('swapBtn');
const quickButtonsContainer = document.getElementById('quickButtons');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

// Інші популярні пари валют для швидких кнопок
const popularPairs = [
    { from: 'USD', to: 'UAH' },
    { from: 'EUR', to: 'UAH' },
    { from: 'UAH', to: 'USD' },
    { from: 'GBP', to: 'UAH' }
];

// Ініціалізація
document.addEventListener('DOMContentLoaded', () => {
    createQuickButtons();
    loadHistory();
    convertCurrency();
    setupEventListeners();
    fetchExchangeRates();
});

// Налаштування слухачів подій
function setupEventListeners() {
    amountInput.addEventListener('input', convertCurrency);
    amountInput.addEventListener('change', addToHistory);
    fromCurrencySelect.addEventListener('change', convertCurrency);
    fromCurrencySelect.addEventListener('change', addToHistory);
    toCurrencySelect.addEventListener('change', convertCurrency);
    toCurrencySelect.addEventListener('change', addToHistory);
    swapBtn.addEventListener('click', swapCurrencies);
    clearHistoryBtn.addEventListener('click', clearHistory);
}

// Конвертація валюти
function convertCurrency() {
    const amount = parseFloat(amountInput.value) || 0;
    const fromCurrency = fromCurrencySelect.value;
    const toCurrency = toCurrencySelect.value;

    if (amount < 0) {
        resultInput.value = '';
        return;
    }

    // Формула конвертації: (amount / fromRate) * toRate
    const fromRate = exchangeRates[fromCurrency];
    const toRate = exchangeRates[toCurrency];

    if (fromRate && toRate) {
        const result = (amount / fromRate) * toRate;
        resultInput.value = result.toFixed(2);

        // Оновлення інформації про курс
        const rate = toRate / fromRate;
        exchangeRateInfo.innerHTML = `
            <i class="fas fa-exchange-alt"></i> 
            1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}
        `;
    }
}

// Обмін валют
function swapCurrencies() {
    const temp = fromCurrencySelect.value;
    fromCurrencySelect.value = toCurrencySelect.value;
    toCurrencySelect.value = temp;

    convertCurrency();
}

// Створення швидких кнопок
function createQuickButtons() {
    quickButtonsContainer.innerHTML = '';
    popularPairs.forEach(pair => {
        const btn = document.createElement('button');
        btn.className = 'quick-btn';
        btn.textContent = `${pair.from} → ${pair.to}`;
        btn.addEventListener('click', () => {
            fromCurrencySelect.value = pair.from;
            toCurrencySelect.value = pair.to;
            amountInput.value = amountInput.value || '1';
            convertCurrency();
            addToHistory();
        });
        quickButtonsContainer.appendChild(btn);
    });
}

// Додавання в історію
function addToHistory() {
    const amount = parseFloat(amountInput.value) || 0;
    const fromCurrency = fromCurrencySelect.value;
    const toCurrency = toCurrencySelect.value;
    const result = parseFloat(resultInput.value) || 0;

    if (amount > 0) {
        let history = JSON.parse(localStorage.getItem('conversionHistory')) || [];

        const entry = {
            timestamp: new Date().toLocaleTimeString('uk-UA'),
            from: `${amount.toFixed(2)} ${fromCurrency}`,
            to: `${result.toFixed(2)} ${toCurrency}`
        };

        history.unshift(entry);

        // Зберігаємо тільки останні 10 записів
        if (history.length > 10) {
            history.pop();
        }

        localStorage.setItem('conversionHistory', JSON.stringify(history));
        displayHistory();
    }
}

// Відображення історії
function displayHistory() {
    const history = JSON.parse(localStorage.getItem('conversionHistory')) || [];

    if (history.length === 0) {
        historyList.innerHTML = '<p class="no-history">Історія порожня</p>';
        return;
    }

    historyList.innerHTML = history.map(entry => `
        <div class="history-item">
            <strong>${entry.from}</strong> → <strong>${entry.to}</strong>
            <br>
            <small>${entry.timestamp}</small>
        </div>
    `).join('');
}

// Завантаження історії при запуску
function loadHistory() {
    displayHistory();
}

// Очищення історії
function clearHistory() {
    if (confirm('Ви впевнені, що хочете очистити історію?')) {
        localStorage.removeItem('conversionHistory');
        displayHistory();
    }
}

// Отримання реальних курсів обміну з API
async function fetchExchangeRates() {
    try {
        // Використовуємо публічний API для курсів обміну
        // https://api.exchangerate-api.com (безкоштовний для особистого використання)
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');

        if (response.ok) {
            const data = await response.json();

            // Оновлюємо курси
            Object.keys(exchangeRates).forEach(currency => {
                if (data.rates[currency]) {
                    exchangeRates[currency] = data.rates[currency];
                }
            });

            convertCurrency();
            console.log('✓ Курси обміну оновлені з API');
        }
    } catch (error) {
        console.log('⚠ Не вдалося завантажити курси з API, використовуються попередні значення');
        console.error('Помилка:', error);
    }
}

// Периодичне оновлення курсів кожні 30 хвилин
setInterval(fetchExchangeRates, 30 * 60 * 1000);

// Обробка помилок введення
amountInput.addEventListener('invalid', (e) => {
    if (e.target.value < 0) {
        e.target.value = '';
    }
});
