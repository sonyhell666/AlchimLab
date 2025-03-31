document.addEventListener('DOMContentLoaded', () => {
    // Инициализация Telegram Web App
    const tg = window.Telegram.WebApp;
    tg.ready(); // Сообщаем Telegram, что приложение готово
    tg.expand(); // Попытка раскрыть Mini App на весь экран

    // Получаем ссылки на элементы DOM
    const essenceCountElement = document.getElementById('essence-count');
    const essencePerSecondElement = document.getElementById('essence-per-second');
    const cauldronElement = document.getElementById('cauldron');
    const clickFeedbackContainer = document.getElementById('click-feedback-container');
    const openUpgradesBtn = document.getElementById('open-upgrades-btn');
    const closeUpgradesBtn = document.getElementById('close-upgrades-btn');
    const upgradesPanel = document.getElementById('upgrades-panel');
    const upgradesListElement = document.getElementById('upgrades-list');
    const userGreetingElement = document.getElementById('user-greeting');
    const inviteFriendBtn = document.getElementById('invite-friend-btn');
    const bubblesContainer = document.getElementById('bubbles-container');

    // Игровые переменные (состояние)
    let essence = 0;
    let essencePerClick = 1;
    let essencePerSecond = 0;

    // --- Переменные для защиты от автокликера ---
    let lastClickTime = 0;
    const MIN_CLICK_INTERVAL = 67; // ~15 clicks per second max allowed
    const MAX_WARNINGS = 3;
    let warningCount = 0;
    let isBlocked = false;

    // --- Отображение имени пользователя ---
    if (tg.initDataUnsafe?.user?.first_name) {
        userGreetingElement.textContent = `Лаборатория ${tg.initDataUnsafe.user.first_name}`;
    }

    // --- Определения улучшений ---
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

    // === Функции для пузырьков и жидкости ===
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

    // --- Функции обновления UI ---
    function updateEssenceDisplay() {
        if (essenceCountElement) {
            essenceCountElement.textContent = formatNumber(Math.floor(essence));
        }
        if (essencePerSecondElement) {
            essencePerSecondElement.textContent = formatNumber(essencePerSecond);
        }
        // === ИЗМЕНЕНИЕ ЗДЕСЬ: Обновляем уровень жидкости при обновлении эссенции ===
        // Уменьшаем значение, чтобы колба заполнялась визуально быстрее
        const maxEssenceForFullLiquid = 50000; // <<< ИЗМЕНЕНО (было 1000000)
        // Формула оставляет минимальный уровень 10% и добавляет до 90% в зависимости от прогресса
        const currentLiquidLevel = Math.min(100, (essence / maxEssenceForFullLiquid) * 90 + 10);
        updateLiquidLevel(currentLiquidLevel);
        // === КОНЕЦ ИЗМЕНЕНИЯ ===
    }

    function formatNumber(num) {
        if (isNaN(num) || !Number.isFinite(num)) { console.warn("formatNumber received invalid input:", num); return "ERR"; }
        if (num < 1000) return num.toString();
        if (num < 1000000) return (num / 1000).toFixed(1).replace('.0', '') + 'K';
        if (num < 1000000000) return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
        return (num / 1000000000).toFixed(1).replace('.0', '') + 'B';
    }

    // --- Логика клика по котлу (с защитой) ---
    if (cauldronElement) {
        cauldronElement.addEventListener('click', () => {
             if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
            if (isBlocked) { showTemporaryNotification("Автокликер обнаружен! Возможность кликать заблокирована.", "error"); return; }
            const currentTime = Date.now();
            if (currentTime - lastClickTime >= MIN_CLICK_INTERVAL) {
                warningCount = 0;
                if (Number.isFinite(essencePerClick)) {
                    essence += essencePerClick;
                    updateEssenceDisplay(); // Вызовет и обновление уровня жидкости
                    if (clickFeedbackContainer) showClickFeedback(`+${formatNumber(essencePerClick)}`);
                    cauldronElement.style.transform = 'scale(0.95)';
                    setTimeout(() => { cauldronElement.style.transform = 'scale(1)'; }, 80);
                    lastClickTime = currentTime;
                } else { console.error("Invalid essencePerClick value:", essencePerClick); }
            } else {
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
            }
        });
    } else { console.error("Cauldron element not found!"); }

    // --- Функция для отображения "+N" при клике ---
    function showClickFeedback(text) {
        if (isBlocked || !clickFeedbackContainer) return;
        const feedback = document.createElement('div');
        feedback.className = 'click-feedback';
        feedback.textContent = text;
        const offsetX = Math.random() * 40 - 20;
        const offsetY = Math.random() * 20 - 10;
        feedback.style.left = `calc(50% + ${offsetX}px)`;
        feedback.style.top = `calc(50% + ${offsetY}px)`;
        clickFeedbackContainer.appendChild(feedback);
        setTimeout(() => { feedback.remove(); }, 950);
    }

    // --- Логика авто-клика (пассивный доход) ---
    setInterval(() => {
        if (!isBlocked && essencePerSecond > 0 && Number.isFinite(essencePerSecond)) {
            const essenceToAdd = essencePerSecond / 10; // Делим на 10, т.к. интервал 100мс
            if (Number.isFinite(essenceToAdd)) {
                essence += essenceToAdd;
                updateEssenceDisplay(); // Вызовет и обновление уровня жидкости
            } else { console.warn("Skipping auto-click: essenceToAdd resulted in invalid number", essenceToAdd); }
        }
    }, 100);

    // --- Логика улучшений ---
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
            const isLocked = Math.floor(essence) < requirement;
            const canAfford = essence >= cost;
            const li = document.createElement('li');
            if (isLocked) li.classList.add('locked');
            else if (!canAfford) li.classList.add('cannot-afford'); // Можно добавить отдельный класс для стилизации
            let buttonText = 'Купить';
            let buttonDisabled = '';
            if (isLocked) { buttonDisabled = 'disabled'; buttonText = `Нужно ${formatNumber(requirement)} 🧪`; }
            else if (!canAfford) { buttonDisabled = 'disabled'; }
            li.innerHTML = `
                <div class="upgrade-info">
                    <h3>${upgrade.name} (Ур. ${upgrade.currentLevel})</h3>
                    <p>${upgrade.description}</p>
                    <p class="upgrade-cost">Стоимость: ${formatNumber(cost)} 🧪</p>
                    ${isLocked ? `<p class="requirement-info">Требуется: ${formatNumber(requirement)} 🧪</p>` : ''}
                </div>
                <button class="buy-upgrade-btn" data-upgrade-id="${upgrade.id}" ${buttonDisabled}>
                    ${buttonText}
                </button>
            `;
            const buyButton = li.querySelector('.buy-upgrade-btn');
            if (buyButton && !isLocked) {
                buyButton.addEventListener('click', () => { if (!buyButton.disabled) { buyUpgrade(upgrade.id); } });
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
            updateEssenceDisplay(); // Обновит и жидкость
            renderUpgrades();
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
        if (essencePerSecondElement) essencePerSecondElement.textContent = formatNumber(essencePerSecond);
    }

    // --- Открытие/Закрытие панели улучшений ---
    if (openUpgradesBtn && upgradesPanel) {
        openUpgradesBtn.addEventListener('click', () => { renderUpgrades(); upgradesPanel.classList.remove('hidden'); });
    } else { console.error("Open upgrades button or panel not found!"); }
    if (closeUpgradesBtn && upgradesPanel) {
        closeUpgradesBtn.addEventListener('click', () => { upgradesPanel.classList.add('hidden'); });
    } else { console.error("Close upgrades button or panel not found!"); }

    // --- БЛОК: Логика реферальной системы ---
    function checkReferralAndBonus() {
        const startParam = tg.initDataUnsafe?.start_param;
        const urlParams = new URLSearchParams(window.location.search);
        const claimBonusParam = urlParams.get('claimBonus');
        console.log("Checking URL params:", window.location.search, "Start param:", startParam);
        if (startParam && !isNaN(parseInt(startParam))) { handleNewReferral(startParam); }
        else if (claimBonusParam) { handleBonusClaim(claimBonusParam); }
    }

    function handleNewReferral(inviterId) {
        tg.CloudStorage.getItem('gameState', (error, value) => {
             if (error) { console.error("CloudStorage error checking gameState for referral:", error); return; }
             let isTrulyNew = true;
             if (value) { try { const savedState = JSON.parse(value); if ((savedState.essence && savedState.essence > 0) || (savedState.upgrades && savedState.upgrades.some(u => u.level > 0))) { isTrulyNew = false; console.log("Player has existing progress, not considered new for referral."); } } catch(e) { console.error("Error parsing gameState for referral check", e); } } else { console.log("No gameState found, player is likely new."); }
             if (isTrulyNew) { console.log(`New player confirmed! Invited by: ${inviterId}. Sending data to bot...`); saveGame(); if (tg.sendData) { const dataToSend = JSON.stringify({ type: 'referral_registered', inviter_id: inviterId }); try { tg.sendData(dataToSend); console.log("Sent referral data to bot:", dataToSend); showTemporaryNotification("Добро пожаловать! Ваш пригласитель получит бонус.", "success"); } catch (sendError) { console.error("Error sending data to bot via tg.sendData:", sendError); showTemporaryNotification("Не удалось зарегистрировать приглашение (ошибка связи с ботом).", "error"); } } else { console.error("tg.sendData is not available."); showTemporaryNotification("Не удалось зарегистрировать приглашение (функция не доступна).", "error"); } } else { console.log("Player is not new, referral bonus for inviter not triggered."); }
        });
    }

    function handleBonusClaim(referralId) {
        console.log(`Attempting to claim bonus for referral ID: ${referralId}`);
        if (!referralId || typeof referralId !== 'string' || referralId.trim() === '') { console.warn("Invalid or empty referralId received."); return; }
        tg.CloudStorage.getItem('claimed_bonuses', (error, value) => {
            if (error) { console.error("CloudStorage error getting claimed_bonuses:", error); showTemporaryNotification("Ошибка проверки бонуса!", "error"); return; }
            let claimedBonuses = [];
            if (value) { try { claimedBonuses = JSON.parse(value); if (!Array.isArray(claimedBonuses)) claimedBonuses = []; } catch(e) { console.error("Error parsing claimed_bonuses:", e); claimedBonuses = []; } }
            if (claimedBonuses.includes(referralId)) { console.log(`Bonus ${referralId} already claimed.`); showTemporaryNotification("Этот бонус уже был получен.", "warning"); }
            else { const bonusAmount = 50000; if (Number.isFinite(essence)) { essence += bonusAmount; console.log(`Claimed bonus ${referralId}! Added ${bonusAmount} essence.`); showTemporaryNotification(`+${formatNumber(bonusAmount)} 🧪 за приглашенного друга!`, "success"); updateEssenceDisplay(); claimedBonuses.push(referralId); tg.CloudStorage.setItem('claimed_bonuses', JSON.stringify(claimedBonuses), (setError) => { if (setError) console.error("Error saving updated claimed_bonuses:", setError); else { console.log("Claimed bonuses updated."); saveGame(); } }); } else { console.error("Cannot add bonus, current essence is invalid:", essence); showTemporaryNotification("Ошибка начисления бонуса!", "error"); } }
             try { const url = new URL(window.location); url.searchParams.delete('claimBonus'); window.history.replaceState({}, document.title, url.toString()); } catch(e) { console.warn("Could not clean URL params", e); }
        });
    }

    // --- Логика кнопки "Друзья" ---
    if (inviteFriendBtn) {
        inviteFriendBtn.addEventListener('click', () => {
            if (tg && tg.initDataUnsafe?.user?.id) { const botUsername = 'AlchimLaboratory_Bot'; const appName = 'AlchimLab'; const userId = tg.initDataUnsafe.user.id; const shareUrl = `https://t.me/${botUsername}/${appName}?start=${userId}`; const shareText = 'Заходи в мою Алхимическую Лабораторию в Telegram! 🧪⚗️ Кликай и создавай эликсиры!'; tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`); console.log('Предложено поделиться реферальной ссылкой:', shareUrl); }
            else { console.error('Cannot get user ID or Telegram API access for sharing.'); showTemporaryNotification('Не удалось создать ссылку для приглашения.', 'error'); }
        });
    } else { console.error("Invite friend button not found!"); }

    // --- Сохранение/Загрузка через CloudStorage ---
    function saveGame() {
        if (!tg || !tg.CloudStorage) { console.error("CloudStorage unavailable for saving."); return; }
        if (!Number.isFinite(essence)) { console.error("Invalid essence value:", essence); essence = 0; }
        const gameState = { essence: essence, upgrades: upgrades.map(u => ({ id: u.id, level: u.currentLevel })) };
        try { const gameStateString = JSON.stringify(gameState); tg.CloudStorage.setItem('gameState', gameStateString, (error) => { if (error) console.error("CloudStorage save error:", error); }); }
        catch (e) { console.error("Error stringifying game state:", e); showTemporaryNotification("Критическая ошибка сохранения!", "error"); }
    }

    function loadGame() {
        isBlocked = false; warningCount = 0;
        if(cauldronElement) { cauldronElement.classList.remove('blocked-cauldron'); cauldronElement.style.cursor = 'pointer'; }
        if (!tg || !tg.CloudStorage) { console.error("CloudStorage unavailable for loading."); resetGameData(); updateEssenceDisplay(); showTemporaryNotification("Не удалось загрузить прогресс. Начинаем новую игру.", "warning"); return; }
        console.log("Loading from CloudStorage...");
        tg.CloudStorage.getItem('gameState', (error, value) => {
            let loadedSuccessfully = false;
            if (error) { console.error("CloudStorage load error:", error); showTemporaryNotification("Ошибка загрузки прогресса!", "error"); resetGameData(); }
            else if (value) {
                console.log("Data received:", value.length + " bytes");
                try {
                    const gameState = JSON.parse(value);
                    essence = Number(gameState.essence) || 0; if (!Number.isFinite(essence)) essence = 0;
                    upgrades.forEach(upgrade => {
                        const saved = gameState.upgrades?.find(su => su.id === upgrade.id);
                        upgrade.currentLevel = (saved && Number.isFinite(Number(saved.level))) ? Number(saved.level) : 0;
                    });
                    recalculateBonuses(); console.log("Game loaded successfully."); loadedSuccessfully = true;
                } catch (e) { console.error("Error parsing loaded data:", e); showTemporaryNotification("Ошибка чтения данных!", "error"); resetGameData(); }
            } else { console.log("No save data found."); resetGameData(); }
            checkReferralAndBonus(); // Проверяем реф. параметры после загрузки/сброса
            updateEssenceDisplay(); // Обновляем UI (включая уровень жидкости)
        });
    }

    function resetGameData() {
        isBlocked = false; warningCount = 0;
        if(cauldronElement) { cauldronElement.classList.remove('blocked-cauldron'); cauldronElement.style.cursor = 'pointer'; }
        essence = 0; upgrades.forEach(u => u.currentLevel = 0);
        recalculateBonuses(); console.log("Game data reset.");
        // Сбрасываем уровень жидкости при сбросе игры
        updateLiquidLevel(10); // Устанавливаем минимальный базовый уровень
    }

    // --- Функция для временных уведомлений ---
    function showTemporaryNotification(message, type = "info") {
         const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        // Используем CSS классы для стилей вместо инлайн-стилей где возможно
        document.body.appendChild(notification);
        // Триггерим анимацию появления
        setTimeout(() => {
             notification.style.opacity = '1';
             notification.style.bottom = '80px'; // Или другое значение, если нужно поднять
         }, 10); // Небольшая задержка для срабатывания transition
        // Запускаем таймер на исчезновение
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.bottom = '70px'; // Возвращаем исходную позицию для анимации
            // Удаляем элемент из DOM после завершения анимации исчезновения
            setTimeout(() => { notification.remove(); }, 500); // Должно совпадать с transition duration
        }, 2500); // Время показа уведомления
    }

    // --- Первоначальная инициализация ---
    loadGame(); // Загружаем игру (асинхронно, вызовет updateEssenceDisplay и updateLiquidLevel)

    // --- Автосохранение и обработчики событий видимости/закрытия ---
    setInterval(saveGame, 15000); // Сохраняем каждые 15 секунд
    window.addEventListener('beforeunload', saveGame); // Сохраняем при закрытии вкладки/окна
    document.addEventListener('visibilitychange', () => { // Сохраняем при сворачивании или переключении вкладки
        if (document.visibilityState === 'hidden') {
             saveGame();
         }
     });
    if (tg && tg.onEvent) {
        // Дополнительное сохранение при изменении размера окна в Telegram
        tg.onEvent('viewportChanged', (event) => {
            if (!event.isStateStable) { // Сохраняем, когда изменение размера завершено
                 saveGame();
             }
        });
        // Попытка сохранить при закрытии Mini App (может не всегда срабатывать)
        // tg.onEvent('close', saveGame); // Этого события официально нет, но можно попробовать оставить
    }

}); // Конец DOMContentLoaded