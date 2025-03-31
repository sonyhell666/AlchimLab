document.addEventListener('DOMContentLoaded', () => {
    // Инициализация Telegram Web App
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    // Получаем ссылки на элементы DOM
    const essenceCountElement = document.getElementById('essence-count');
    const essencePerSecondElement = document.getElementById('essence-per-second');
    const gemCountElement = document.getElementById('gem-count');
    const cauldronElement = document.getElementById('cauldron');
    const clickFeedbackContainer = document.getElementById('click-feedback-container');
    const openUpgradesBtn = document.getElementById('open-upgrades-btn');
    const closeUpgradesBtn = document.getElementById('close-upgrades-btn');
    const upgradesPanel = document.getElementById('upgrades-panel');
    const upgradesListElement = document.getElementById('upgrades-list');
    const userGreetingElement = document.getElementById('user-greeting');
    const inviteFriendBtn = document.getElementById('invite-friend-btn');
    const bubblesContainer = document.getElementById('bubbles-container');
    const perSecondDisplayDiv = document.getElementById('per-second-display');

    // Игровые переменные (состояние)
    let essence = 0;
    let essencePerClick = 1;
    let essencePerSecond = 0;
    let gems = 0;
    const GEM_AWARD_CHANCE = 0.03;
    const GEMS_PER_AWARD = 1;

    // Переменные для защиты от автокликера
    let lastClickTime = 0;
    const MIN_CLICK_INTERVAL = 67;
    const MAX_WARNINGS = 3;
    let warningCount = 0;
    let isBlocked = false;

    // --- НОВЫЕ: Переменные для динамического уровня жидкости ---
    let visualLiquidLevel = 10; // Начальный/минимальный визуальный уровень (%)
    const LIQUID_MIN_LEVEL = 10; // Минимальный уровень (%)
    const LIQUID_MAX_LEVEL = 95; // Максимальный уровень (%)
    const LIQUID_INCREASE_PER_CLICK = 1.0; // На сколько % поднимать за клик
    const LIQUID_DECAY_RATE = 0.15; // На сколько % уменьшать за интервал бездействия
    const LIQUID_UPDATE_INTERVAL = 100; // Как часто обновлять/уменьшать уровень (ms)
    const IDLE_TIMEOUT = 500; // Время без кликов для начала уменьшения (ms)
    let lastInteractionTime = 0; // Время последнего клика для отслеживания бездействия
    // --- ---

    // Отображение имени пользователя
    if (tg.initDataUnsafe?.user?.first_name) {
        userGreetingElement.textContent = `Лаборатория ${tg.initDataUnsafe.user.first_name}`;
    }

    // Определения улучшений (без изменений)
    const upgrades = [ /* ... ваш список улучшений ... */
        { id: 'click1', name: 'Улучшенный рецепт', description: '+1 к клику', baseCost: 15, costMultiplier: 1.4, type: 'click', value: 1, currentLevel: 0, requiredEssence: 0 },
        { id: 'auto1', name: 'Гомункул-Помощник', description: '+1 в секунду', baseCost: 60, costMultiplier: 1.6, type: 'auto', value: 1, currentLevel: 0, requiredEssence: 0 },
        { id: 'click2', name: 'Зачарованная ступка', description: '+5 к клику', baseCost: 300, costMultiplier: 1.5, type: 'click', value: 5, currentLevel: 0, requiredEssence: 500 },
        { id: 'auto2', name: 'Пузырящийся котел', description: '+4 в секунду', baseCost: 750, costMultiplier: 1.7, type: 'auto', value: 4, currentLevel: 0, requiredEssence: 700 },
        { id: 'click3', name: 'Алембик Мастера', description: '+25 к клику', baseCost: 5000, costMultiplier: 1.6, type: 'click', value: 25, currentLevel: 0, requiredEssence: 10000 },
        { id: 'auto3', name: 'Призванный Ифрит', description: '+20 в секунду', baseCost: 12000, costMultiplier: 1.8, type: 'auto', value: 20, currentLevel: 0, requiredEssence: 15000 },
        { id: 'auto4', name: 'Сад Алхимических Растений', description: '+50 в секунду', baseCost: 30000, costMultiplier: 1.9, type: 'auto', value: 50, currentLevel: 0, requiredEssence: 40000 },
        { id: 'click4', name: 'Сила Философского Камня (осколок)', description: '+150 к клику', baseCost: 250000, costMultiplier: 1.7, type: 'click', value: 150, currentLevel: 0, requiredEssence: 500000 },
        { id: 'auto5', name: 'Эфирный Концентратор', description: '+250 в секунду', baseCost: 1000000, costMultiplier: 2.0, type: 'auto', value: 250, currentLevel: 0, requiredEssence: 1200000 },
        { id: 'auto6', name: 'Портал в мир Эссенции', description: '+1000 в секунду', baseCost: 5000000, costMultiplier: 2.2, type: 'auto', value: 1000, currentLevel: 0, requiredEssence: 6000000 },
        { id: 'click5', name: 'Прикосновение Творца', description: '+1000 к клику', baseCost: 10000000, costMultiplier: 1.8, type: 'click', value: 1000, currentLevel: 0, requiredEssence: 15000000 },
        { id: 'auto7', name: 'Поток Чистой Магии', description: '+5000 в секунду', baseCost: 50000000, costMultiplier: 2.1, type: 'auto', value: 5000, currentLevel: 0, requiredEssence: 60000000 },
    ];

    // Функции для пузырьков (без изменений)
    function createBubble() { /* ... */ }
    setInterval(createBubble, 500);

    // --- ИЗМЕНЕНО: Функция ТОЛЬКО для обновления CSS переменной уровня жидкости ---
    function updateLiquidLevelVisual(percentage) {
        const level = Math.max(LIQUID_MIN_LEVEL, Math.min(LIQUID_MAX_LEVEL, percentage));
        if (cauldronElement) {
            // Устанавливаем CSS-переменную
            cauldronElement.style.setProperty('--liquid-level', `${level}%`);
             // Обновляем и высоту контейнера пузырьков
             if(bubblesContainer) {
                 bubblesContainer.style.height = `${level}%`;
             }
        } else {
            console.warn("Cauldron element not found when trying to update liquid level.");
        }
    }

    // --- ИЗМЕНЕНО: Общая функция обновления UI (НЕ трогает уровень жидкости) ---
    function updateDisplay() {
        // Обновление эссенции
        if (essenceCountElement) {
            essenceCountElement.textContent = formatNumber(Math.floor(essence));
        }
        // Обновление эссенции в секунду и видимости блока
        if (essencePerSecondElement && perSecondDisplayDiv) {
             essencePerSecondElement.textContent = formatNumber(essencePerSecond);
             perSecondDisplayDiv.style.display = essencePerSecond > 0 ? 'block' : 'none';
        }
        // Обновление кристаллов
        if (gemCountElement) {
            gemCountElement.textContent = formatNumber(gems);
        }
        // Обновление состояния кнопок улучшений (если панель открыта)
        if (upgradesPanel && !upgradesPanel.classList.contains('hidden')) {
            renderUpgrades();
        }
        // Уровень жидкости теперь обновляется отдельным интервалом
    }

    // Функция форматирования чисел (без изменений)
    function formatNumber(num) { /* ... */ }

    // Функция для отображения "+N" при клике (без изменений)
    function showClickFeedback(amount, type = 'essence') { /* ... */ }


    // --- ИЗМЕНЕНО: Логика клика по котлу ---
    if (cauldronElement) {
        cauldronElement.addEventListener('click', () => {
            const currentTime = Date.now(); // Получаем время клика

            if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
            if (isBlocked) { showTemporaryNotification("Автокликер обнаружен! Возможность кликать заблокирована.", "error"); return; }

            if (currentTime - lastClickTime >= MIN_CLICK_INTERVAL) {
                warningCount = 0;
                lastInteractionTime = currentTime; // Обновляем время последнего ВЗАИМОДЕЙСТВИЯ

                // 1. Добавляем эссенцию за клик
                let clickAmount = essencePerClick;
                if (Number.isFinite(clickAmount)) {
                    essence += clickAmount;
                    if (clickFeedbackContainer) showClickFeedback(clickAmount, 'essence');
                } else { console.error("Invalid essencePerClick value:", essencePerClick); }

                // 2. Проверяем шанс получения кристалла
                if (Math.random() < GEM_AWARD_CHANCE) {
                    gems += GEMS_PER_AWARD;
                    console.log(`Получен кристалл! Всего: ${gems}`);
                    if (clickFeedbackContainer) showClickFeedback(GEMS_PER_AWARD, 'gem');
                    if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
                }

                // --- НОВОЕ: Увеличиваем ВИЗУАЛЬНЫЙ уровень жидкости ---
                visualLiquidLevel += LIQUID_INCREASE_PER_CLICK;
                visualLiquidLevel = Math.min(visualLiquidLevel, LIQUID_MAX_LEVEL); // Ограничиваем сверху
                // Немедленно обновляем визуал для отзывчивости, хотя интервал тоже обновит
                updateLiquidLevelVisual(visualLiquidLevel);
                // --- ---

                // 3. Обновляем ТОЛЬКО текстовое отображение валют
                updateDisplay(); // НЕ обновляет жидкость

                // 4. Анимация клика
                cauldronElement.style.transform = 'scale(0.95)';
                setTimeout(() => { cauldronElement.style.transform = 'scale(1)'; }, 80);

                lastClickTime = currentTime; // Обновляем время последнего УСПЕШНОГО клика для анти-чита
            } else {
                // Логика предупреждения об автокликере
                warningCount++;
                lastInteractionTime = currentTime; // Все равно считаем взаимодействием
                console.warn(`Autoclicker warning ${warningCount}/${MAX_WARNINGS}`);
                showTemporaryNotification(`Слишком частый клик! Предупреждение ${warningCount}/${MAX_WARNINGS}`, "warning");
                if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
                if (warningCount >= MAX_WARNINGS) {
                    isBlocked = true;
                    console.error("Player blocked due to suspected autoclicker.");
                    showTemporaryNotification("Автокликер обнаружен! Возможность кликать заблокирована.", "error");
                    if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
                    if(cauldronElement) { cauldronElement.classList.add('blocked-cauldron'); }
                }
            }
        });
    } else { console.error("Cauldron element not found!"); }


    // --- ИЗМЕНЕНО: Логика авто-клика (пассивный доход) - НЕ трогает визуал жидкости ---
    setInterval(() => {
        if (!isBlocked && essencePerSecond > 0 && Number.isFinite(essencePerSecond)) {
            const essenceToAdd = essencePerSecond / 10; // Т.к. интервал 100ms
            if (Number.isFinite(essenceToAdd)) {
                essence += essenceToAdd;
                updateDisplay(); // Обновляем ТОЛЬКО цифры
            } else { console.warn("Skipping auto-click: essenceToAdd resulted in invalid number", essenceToAdd); }
        }
    }, 100);

    // --- НОВЫЙ: Интервал для уменьшения и обновления визуального уровня жидкости ---
    setInterval(() => {
        const currentTime = Date.now();
        // Уменьшаем уровень, если прошло достаточно времени с последнего клика
        if (currentTime - lastInteractionTime > IDLE_TIMEOUT && visualLiquidLevel > LIQUID_MIN_LEVEL) {
            visualLiquidLevel -= LIQUID_DECAY_RATE;
            visualLiquidLevel = Math.max(visualLiquidLevel, LIQUID_MIN_LEVEL); // Ограничиваем снизу
        }
        // Обновляем CSS переменную в любом случае (даже если не уменьшали)
        updateLiquidLevelVisual(visualLiquidLevel);
    }, LIQUID_UPDATE_INTERVAL);
    // --- ---

    // Логика улучшений (без изменений)
    function calculateCost(upgrade) { /* ... */ }
    function renderUpgrades() { /* ... */ }
    function buyUpgrade(upgradeId) { /* ... */ }
    function recalculateBonuses() { /* ... */ }

    // Открытие/Закрытие панели улучшений (без изменений)
    // ...

    // Логика реферальной системы (без изменений)
    function checkReferralAndBonus() { /* ... */ }
    function handleNewReferral(inviterId) { /* ... */ }
    function handleBonusClaim(referralId) { /* ... */ }
    // ...

    // Сохранение/Загрузка через CloudStorage (без изменений по сравнению с прошлой версией)
    function saveGame() { /* ... */ }
    function loadGame() {
        // ... (код загрузки essence, gems, upgrades)
        tg.CloudStorage.getItem('gameState', (error, value) => {
            // ... (обработка ошибок и парсинг)
            if (loadedSuccessfully) {
                // ... (установка essence, gems, upgrades.currentLevel)
                recalculateBonuses();
                console.log("Game loaded successfully.");
            } else {
                 console.log("No save data found or error parsing.");
                 resetGameData(); // Сбросит и visualLiquidLevel
            }
            checkReferralAndBonus();
            updateDisplay(); // Обновляем цифры
             // --- НОВОЕ: Устанавливаем начальный визуальный уровень ПОСЛЕ загрузки/сброса ---
             visualLiquidLevel = LIQUID_MIN_LEVEL; // Начинаем с минимума
             lastInteractionTime = Date.now(); // Сбрасываем таймер бездействия
             updateLiquidLevelVisual(visualLiquidLevel); // Обновляем визуал
             // --- ---
        });
    }

    // --- ИЗМЕНЕНО: Сброс данных ---
    function resetGameData() {
        isBlocked = false; warningCount = 0;
        if(cauldronElement) { cauldronElement.classList.remove('blocked-cauldron'); }
        essence = 0;
        gems = 0;
        upgrades.forEach(u => u.currentLevel = 0);
        recalculateBonuses();
        visualLiquidLevel = LIQUID_MIN_LEVEL; // Сбрасываем и визуальный уровень
        lastInteractionTime = Date.now(); // Сбрасываем таймер
        console.log("Game data reset.");
        // updateDisplay() и updateLiquidLevelVisual() будут вызваны в loadGame
    }

    // Функция для временных уведомлений (без изменений)
    function showTemporaryNotification(message, type = "info") { /* ... */ }

    // Первоначальная инициализация
    loadGame(); // Загружаем игру

    // Автосохранение и обработчики событий видимости/закрытия (без изменений)
    // ...

}); // Конец DOMContentLoaded