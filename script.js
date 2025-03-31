document.addEventListener('DOMContentLoaded', () => {
    // Инициализация Telegram Web App
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    // Получаем ссылки на элементы DOM
    const essenceCountElement = document.getElementById('essence-count');
    const essencePerSecondElement = document.getElementById('essence-per-second');
    // --- НОВЫЙ ЭЛЕМЕНТ ---
    const gemCountElement = document.getElementById('gem-count'); // Элемент для кристаллов
    // --- ---
    const cauldronElement = document.getElementById('cauldron');
    const clickFeedbackContainer = document.getElementById('click-feedback-container');
    const openUpgradesBtn = document.getElementById('open-upgrades-btn');
    const closeUpgradesBtn = document.getElementById('close-upgrades-btn');
    const upgradesPanel = document.getElementById('upgrades-panel');
    const upgradesListElement = document.getElementById('upgrades-list');
    const userGreetingElement = document.getElementById('user-greeting');
    const inviteFriendBtn = document.getElementById('invite-friend-btn');
    const bubblesContainer = document.getElementById('bubbles-container');
    const perSecondDisplayDiv = document.getElementById('per-second-display'); // Весь блок /сек

    // Игровые переменные (состояние)
    let essence = 0;
    let essencePerClick = 1;
    let essencePerSecond = 0;
    // --- НОВЫЕ ПЕРЕМЕННЫЕ ---
    let gems = 0; // Новая валюта - Кристаллы
    const GEM_AWARD_CHANCE = 0.03; // 3% шанс получить кристалл за клик
    const GEMS_PER_AWARD = 1;      // Количество кристаллов за успешный шанс
    // --- ---

    // Переменные для защиты от автокликера
    let lastClickTime = 0;
    const MIN_CLICK_INTERVAL = 67; // ~15 clicks per second max allowed
    const MAX_WARNINGS = 3;
    let warningCount = 0;
    let isBlocked = false;

    // Отображение имени пользователя
    if (tg.initDataUnsafe?.user?.first_name) {
        userGreetingElement.textContent = `Лаборатория ${tg.initDataUnsafe.user.first_name}`;
    }

    // Определения улучшений (остаются без изменений)
    const upgrades = [
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

    // === Функции для пузырьков и жидкости (остаются без изменений) ===
    function createBubble() {
        if (!bubblesContainer) return;
        const bubble = document.createElement('div');
        bubble.classList.add('bubble');
        const size = Math.random() * 8 + 6;
        const duration = Math.random() * 2.5 + 3;
        const delay = Math.random() * 1.5;
        const horizontalPosition = Math.random() * 90 + 5;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${horizontalPosition}%`;
        bubble.style.animationDuration = `${duration}s`;
        bubble.style.animationDelay = `${delay}s`;
        bubblesContainer.appendChild(bubble);
        setTimeout(() => { bubble.remove(); }, (duration + delay) * 1000 + 100);
    }

    function updateLiquidLevel(percentage) {
        const level = Math.max(0, Math.min(100, percentage));
        if (cauldronElement) {
            cauldronElement.style.setProperty('--liquid-level', `${level}%`);
        } else {
            console.warn("Cauldron element not found when trying to update liquid level.");
        }
    }

    // Запускаем генерацию пузырьков
    setInterval(createBubble, 500);

    // --- ИЗМЕНЕНО: Функции обновления UI (теперь одна общая) ---
    function updateDisplay() {
        // Обновление эссенции
        if (essenceCountElement) {
            essenceCountElement.textContent = formatNumber(Math.floor(essence));
        }
        // Обновление эссенции в секунду
        if (essencePerSecondElement && perSecondDisplayDiv) {
             essencePerSecondElement.textContent = formatNumber(essencePerSecond);
             // Скрываем блок "/сек", если доход равен 0
             perSecondDisplayDiv.style.display = essencePerSecond > 0 ? 'block' : 'none';
        }
        // --- НОВОЕ: Обновление кристаллов ---
        if (gemCountElement) {
            gemCountElement.textContent = formatNumber(gems);
        }
        // --- ---

        // Обновление уровня жидкости
        const maxEssenceForFullLiquid = 50000; // Можно вынести в константу
        const currentLiquidLevel = Math.min(100, (essence / maxEssenceForFullLiquid) * 90 + 10);
        updateLiquidLevel(currentLiquidLevel);

        // Обновление состояния кнопок улучшений (можно вызывать реже, но здесь проще)
        if (!upgradesPanel.classList.contains('hidden')) {
            renderUpgrades();
        }
    }

    // Функция форматирования чисел (остается без изменений)
    function formatNumber(num) {
        if (isNaN(num) || !Number.isFinite(num)) { console.warn("formatNumber received invalid input:", num); return "ERR"; }
        if (num < 1000) return num.toString();
        if (num < 1000000) return (num / 1000).toFixed(1).replace('.0', '') + 'K';
        if (num < 1000000000) return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
        return (num / 1000000000).toFixed(1).replace('.0', '') + 'B';
    }

    // --- Логика клика по котлу (с добавлением шанса на кристалл) ---
    if (cauldronElement) {
        cauldronElement.addEventListener('click', () => {
            if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
            if (isBlocked) { showTemporaryNotification("Автокликер обнаружен! Возможность кликать заблокирована.", "error"); return; }

            const currentTime = Date.now();
            if (currentTime - lastClickTime >= MIN_CLICK_INTERVAL) {
                warningCount = 0; // Сбрасываем счетчик предупреждений при нормальном клике

                // 1. Добавляем эссенцию за клик
                if (Number.isFinite(essencePerClick)) {
                    essence += essencePerClick;
                    if (clickFeedbackContainer) showClickFeedback(`+${formatNumber(essencePerClick)}`, 'essence'); // Передаем тип фидбека
                } else { console.error("Invalid essencePerClick value:", essencePerClick); }

                // --- НОВОЕ: Проверка шанса получения кристалла ---
                if (Math.random() < GEM_AWARD_CHANCE) {
                    gems += GEMS_PER_AWARD;
                    console.log(`Получен кристалл! Всего: ${gems}`); // Для отладки
                    if (clickFeedbackContainer) showClickFeedback(`+${formatNumber(GEMS_PER_AWARD)} 💎`, 'gem'); // Визуальный фидбек для кристалла
                     // Дополнительная вибрация для редкого события
                     if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
                }
                // --- ---

                // 3. Обновляем отображение ВСЕГО (эссенции, кристаллов, жидкости)
                updateDisplay();

                // 4. Анимация клика
                cauldronElement.style.transform = 'scale(0.95)';
                setTimeout(() => { cauldronElement.style.transform = 'scale(1)'; }, 80);

                lastClickTime = currentTime; // Обновляем время последнего *успешного* клика
            } else {
                // Логика предупреждения об автокликере (остается без изменений)
                warningCount++;
                console.warn(`Autoclicker warning ${warningCount}/${MAX_WARNINGS}`);
                showTemporaryNotification(`Слишком частый клик! Предупреждение ${warningCount}/${MAX_WARNINGS}`, "warning");
                if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
                if (warningCount >= MAX_WARNINGS) {
                    isBlocked = true;
                    console.error("Player blocked due to suspected autoclicker.");
                    showTemporaryNotification("Автокликер обнаружен! Возможность кликать заблокирована.", "error");
                    if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
                    if(cauldronElement) { cauldronElement.classList.add('blocked-cauldron'); cauldronElement.style.cursor = 'not-allowed'; }
                }
                 // Не обновляем lastClickTime при слишком частом клике
            }
        });
    } else { console.error("Cauldron element not found!"); }

    // --- ИЗМЕНЕНО: Функция для отображения "+N" при клике (добавлен тип) ---
    function showClickFeedback(text, type = 'essence') { // type может быть 'essence' или 'gem'
        if (isBlocked || !clickFeedbackContainer) return;

        const feedback = document.createElement('div');
        feedback.className = 'click-feedback'; // Общий класс
        feedback.textContent = text;

        // Стилизация в зависимости от типа
        if (type === 'gem') {
            feedback.style.color = '#f1c40f'; // Золотой для кристаллов
            feedback.style.fontSize = '1.3em'; // Чуть крупнее
            feedback.style.fontWeight = 'bold';
        } else {
            feedback.style.color = 'var(--accent-color)'; // Стандартный цвет для эссенции
        }

        const offsetX = Math.random() * 60 - 30; // Горизонтальное смещение (-30px до +30px)
        // Вертикальное смещение: для кристаллов чуть ниже и правее, чтобы не перекрывать
        const offsetY = (type === 'gem') ? (Math.random() * 20 + 15) : (Math.random() * 20 - 10);

        feedback.style.left = `calc(50% + ${offsetX}px)`;
        feedback.style.top = `calc(50% + ${offsetY}px)`;

        clickFeedbackContainer.appendChild(feedback);
        setTimeout(() => { feedback.remove(); }, 950); // Время жизни элемента
    }


    // --- Логика авто-клика (пассивный доход) - БЕЗ ИЗМЕНЕНИЙ, КРИСТАЛЛЫ НЕ ТРОГАЕТ ---
    setInterval(() => {
        if (!isBlocked && essencePerSecond > 0 && Number.isFinite(essencePerSecond)) {
            const essenceToAdd = essencePerSecond / 10;
            if (Number.isFinite(essenceToAdd)) {
                essence += essenceToAdd;
                // --- НЕТ ЛОГИКИ ДОБАВЛЕНИЯ КРИСТАЛЛОВ ЗДЕСЬ ---
                updateDisplay(); // Обновляем ВСЕ отображение (включая кристаллы, но их значение не меняется)
            } else { console.warn("Skipping auto-click: essenceToAdd resulted in invalid number", essenceToAdd); }
        }
    }, 100);

    // --- Логика улучшений (остается без изменений) ---
    function calculateCost(upgrade) {
        if (!upgrade || typeof upgrade.baseCost !== 'number' || typeof upgrade.costMultiplier !== 'number' || typeof upgrade.currentLevel !== 'number') { console.error("Invalid upgrade data in calculateCost:", upgrade); return Infinity; }
        return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.currentLevel));
    }

    function renderUpgrades() {
        if (!upgradesListElement) { console.error("Upgrades list element not found!"); return; }
        upgradesListElement.innerHTML = '';
        upgrades.sort((a, b) => (a.requiredEssence || 0) - (b.requiredEssence || 0));
        if (upgrades.length === 0) { upgradesListElement.innerHTML = '<li><p>Улучшения не определены.</p></li>'; return; }
        upgrades.forEach(upgrade => {
            const cost = calculateCost(upgrade);
            if (!Number.isFinite(cost)) { console.error("Skipping render for upgrade with invalid cost:", upgrade.id); return; }
            const requirement = upgrade.requiredEssence || 0;
            const currentEssenceFloored = Math.floor(essence); // Используем округленное значение для сравнений
            const isLocked = currentEssenceFloored < requirement;
            const canAfford = currentEssenceFloored >= cost;
            const li = document.createElement('li');

            if (isLocked) li.classList.add('locked');
            else if (!canAfford) li.classList.add('cannot-afford'); // Добавлен класс

            let buttonText = 'Купить';
            let buttonDisabled = false; // Используем булево значение

            if (isLocked) {
                buttonDisabled = true;
                buttonText = `Нужно ${formatNumber(requirement)} 🧪`;
            } else if (!canAfford) {
                buttonDisabled = true;
                // buttonText остается 'Купить'
            }

            li.innerHTML = `
                <div class="upgrade-info">
                    <h3>${upgrade.name} (Ур. ${upgrade.currentLevel})</h3>
                    <p>${upgrade.description}</p>
                    <p class="upgrade-cost">Стоимость: ${formatNumber(cost)} 🧪</p>
                    ${isLocked ? `<p class="requirement-info">Требуется: ${formatNumber(requirement)} 🧪</p>` : ''}
                </div>
                <button class="buy-upgrade-btn" data-upgrade-id="${upgrade.id}">
                    ${buttonText}
                </button>
            `;
            const buyButton = li.querySelector('.buy-upgrade-btn');
            if (buyButton) {
                buyButton.disabled = buttonDisabled; // Устанавливаем свойство disabled
                if (!isLocked) { // Добавляем обработчик только если не заблокировано по требованию
                     buyButton.addEventListener('click', () => { if (!buyButton.disabled) { buyUpgrade(upgrade.id); } });
                }
            }
            upgradesListElement.appendChild(li);
        });
    }


    function buyUpgrade(upgradeId) {
        if (isBlocked) { showTemporaryNotification("Действие заблокировано из-за подозрений.", "error"); return; }
        const upgrade = upgrades.find(u => u.id === upgradeId);
        if (!upgrade) { console.error("Upgrade not found:", upgradeId); return; }
        const requirement = upgrade.requiredEssence || 0;
        if (Math.floor(essence) < requirement) { showTemporaryNotification(`Сначала накопите ${formatNumber(requirement)} эссенции!`, "error"); return; }
        const cost = calculateCost(upgrade);
        if (!Number.isFinite(cost)) { showTemporaryNotification("Ошибка: неверная стоимость улучшения!", "error"); return; }
        if (essence >= cost) {
            essence -= cost;
            upgrade.currentLevel++;
            recalculateBonuses();
            updateDisplay(); // Обновит все, включая состояние кнопок через renderUpgrades
            // renderUpgrades(); // УЖЕ ВЫЗЫВАЕТСЯ ВНУТРИ updateDisplay, если панель открыта
            if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
        } else {
            showTemporaryNotification("Недостаточно эссенции!", "error");
            if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('warning');
        }
    }

    function recalculateBonuses() {
        essencePerClick = 1; essencePerSecond = 0;
        upgrades.forEach(upgrade => {
            if (upgrade.currentLevel > 0 && Number.isFinite(upgrade.value) && typeof upgrade.type === 'string') {
                if (upgrade.type === 'click') essencePerClick += upgrade.value * upgrade.currentLevel;
                else if (upgrade.type === 'auto') essencePerSecond += upgrade.value * upgrade.currentLevel;
            } else if (upgrade.currentLevel > 0) { console.warn("Invalid upgrade data in recalculateBonuses for active upgrade:", upgrade); }
        });
        if (!Number.isFinite(essencePerClick)) { console.error("recalculateBonuses resulted in invalid essencePerClick"); essencePerClick = 1; }
        if (!Number.isFinite(essencePerSecond)) { console.error("recalculateBonuses resulted in invalid essencePerSecond"); essencePerSecond = 0; }
        // Обновление текста дохода в секунду происходит в updateDisplay()
    }

    // Открытие/Закрытие панели улучшений
    if (openUpgradesBtn && upgradesPanel) {
        openUpgradesBtn.addEventListener('click', () => {
             renderUpgrades(); // Рендерим при открытии
             upgradesPanel.classList.remove('hidden');
         });
    } else { console.error("Open upgrades button or panel not found!"); }
    if (closeUpgradesBtn && upgradesPanel) {
        closeUpgradesBtn.addEventListener('click', () => { upgradesPanel.classList.add('hidden'); });
    } else { console.error("Close upgrades button or panel not found!"); }

    // --- БЛОК: Логика реферальной системы (остается без изменений) ---
    function checkReferralAndBonus() { /* ... код без изменений ... */ }
    function handleNewReferral(inviterId) { /* ... код без изменений ... */ }
    function handleBonusClaim(referralId) { /* ... код без изменений ... */ }
    if (inviteFriendBtn) { inviteFriendBtn.addEventListener('click', () => { /* ... код без изменений ... */ }); }
    else { console.error("Invite friend button not found!"); }

    // --- ИЗМЕНЕНО: Сохранение/Загрузка через CloudStorage (добавлены gems) ---
    function saveGame() {
        if (!tg || !tg.CloudStorage) { console.error("CloudStorage unavailable for saving."); return; }
        if (!Number.isFinite(essence)) { console.error("Invalid essence value:", essence); essence = 0; }
        // --- НОВОЕ: Добавляем gems в сохранение ---
        if (!Number.isFinite(gems)) { console.error("Invalid gems value:", gems); gems = 0; }

        const gameState = {
            essence: essence,
            gems: gems, // Сохраняем кристаллы
            upgrades: upgrades.map(u => ({ id: u.id, level: u.currentLevel }))
        };
        // --- ---
        try {
            const gameStateString = JSON.stringify(gameState);
            tg.CloudStorage.setItem('gameState', gameStateString, (error) => {
                if (error) console.error("CloudStorage save error:", error);
                // else console.log("Game saved."); // Можно раскомментировать для отладки
            });
        }
        catch (e) { console.error("Error stringifying game state:", e); showTemporaryNotification("Критическая ошибка сохранения!", "error"); }
    }

    function loadGame() {
        isBlocked = false; warningCount = 0;
        if(cauldronElement) { cauldronElement.classList.remove('blocked-cauldron'); cauldronElement.style.cursor = 'pointer'; }
        if (!tg || !tg.CloudStorage) { console.error("CloudStorage unavailable for loading."); resetGameData(); updateDisplay(); showTemporaryNotification("Не удалось загрузить прогресс. Начинаем новую игру.", "warning"); return; }

        console.log("Loading from CloudStorage...");
        tg.CloudStorage.getItem('gameState', (error, value) => {
            let loadedSuccessfully = false;
            if (error) { console.error("CloudStorage load error:", error); showTemporaryNotification("Ошибка загрузки прогресса!", "error"); resetGameData(); }
            else if (value) {
                console.log("Data received:", value.length + " bytes");
                try {
                    const gameState = JSON.parse(value);
                    // Загрузка эссенции
                    essence = Number(gameState.essence) || 0; if (!Number.isFinite(essence)) essence = 0;
                    // --- НОВОЕ: Загрузка кристаллов ---
                    gems = Number(gameState.gems) || 0; if (!Number.isFinite(gems)) gems = 0;
                    // --- ---
                    // Загрузка улучшений
                    upgrades.forEach(upgrade => {
                        const saved = gameState.upgrades?.find(su => su.id === upgrade.id);
                        upgrade.currentLevel = (saved && Number.isFinite(Number(saved.level))) ? Number(saved.level) : 0;
                    });
                    recalculateBonuses();
                    console.log("Game loaded successfully.");
                    loadedSuccessfully = true;
                } catch (e) { console.error("Error parsing loaded data:", e); showTemporaryNotification("Ошибка чтения данных!", "error"); resetGameData(); }
            } else {
                 console.log("No save data found.");
                 resetGameData();
             }

            checkReferralAndBonus(); // Проверяем реф. параметры после загрузки/сброса
            updateDisplay(); // Обновляем ВСЕ отображение (включая уровень жидкости и кристаллы)
        });
    }

    // --- ИЗМЕНЕНО: Сброс данных (добавлен сброс gems) ---
    function resetGameData() {
        isBlocked = false; warningCount = 0;
        if(cauldronElement) { cauldronElement.classList.remove('blocked-cauldron'); cauldronElement.style.cursor = 'pointer'; }
        essence = 0;
        gems = 0; // Сбрасываем кристаллы
        upgrades.forEach(u => u.currentLevel = 0);
        recalculateBonuses();
        console.log("Game data reset.");
        updateLiquidLevel(10); // Устанавливаем минимальный базовый уровень жидкости
        // updateDisplay() будет вызван после в loadGame
    }

    // --- Функция для временных уведомлений (остается без изменений) ---
    function showTemporaryNotification(message, type = "info") {
         const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => {
             notification.style.opacity = '1';
             notification.style.bottom = '80px';
         }, 10);
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.bottom = '70px';
            setTimeout(() => { notification.remove(); }, 500);
        }, 2500);
    }

    // --- Первоначальная инициализация ---
    loadGame(); // Загружаем игру (вызовет updateDisplay)

    // --- Автосохранение и обработчики событий видимости/закрытия (остаются без изменений) ---
    setInterval(saveGame, 15000);
    window.addEventListener('beforeunload', saveGame);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveGame(); });
    if (tg && tg.onEvent) { tg.onEvent('viewportChanged', (event) => { if (!event.isStateStable) saveGame(); }); }

}); // Конец DOMContentLoaded