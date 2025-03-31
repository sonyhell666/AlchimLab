document.addEventListener('DOMContentLoaded', () => {
    // Инициализация Telegram Web App
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    // Получаем ссылки на элементы DOM
    const essenceCountElement = document.getElementById('essence-count');
    const essencePerSecondElement = document.getElementById('essence-per-second');
    const gemCountElement = document.getElementById('gem-count'); // Элемент для кристаллов
    const cauldronElement = document.getElementById('cauldron');
    const clickFeedbackContainer = document.getElementById('click-feedback-container');
    const openUpgradesBtn = document.getElementById('open-upgrades-btn');
    const closeUpgradesBtn = document.getElementById('close-upgrades-btn');
    const upgradesPanel = document.getElementById('upgrades-panel');
    const upgradesListElement = document.getElementById('upgrades-list');
    const userGreetingElement = document.getElementById('user-greeting');
    const inviteFriendBtn = document.getElementById('invite-friend-btn');
    const bubblesContainer = document.getElementById('bubbles-container'); // Ссылка на контейнер пузырьков
    const perSecondDisplayDiv = document.getElementById('per-second-display'); // Весь блок "в сек"

    // Игровые переменные (состояние)
    let essence = 0;
    let essencePerClick = 1;
    let essencePerSecond = 0;
    let gems = 0; // Новая валюта - Кристаллы
    const GEM_AWARD_CHANCE = 0.03; // 3% шанс получить кристалл за клик
    const GEMS_PER_AWARD = 1;      // Количество кристаллов за успешный шанс

    // Переменные для защиты от автокликера
    let lastClickTime = 0;
    const MIN_CLICK_INTERVAL = 67; // ~15 clicks per second max allowed
    const MAX_WARNINGS = 3;
    let warningCount = 0;
    let isBlocked = false;

    // Переменные для динамического уровня жидкости
    let visualLiquidLevel = 10; // Начальный/минимальный визуальный уровень (%)
    const LIQUID_MIN_LEVEL = 10; // Минимальный уровень (%)
    const LIQUID_MAX_LEVEL = 95; // Максимальный уровень (%)
    const LIQUID_INCREASE_PER_CLICK = 1.0; // На сколько % поднимать за клик
    const LIQUID_DECAY_RATE = 0.15; // На сколько % уменьшать за интервал бездействия
    const LIQUID_UPDATE_INTERVAL = 100; // Как часто обновлять/уменьшать уровень (ms)
    const IDLE_TIMEOUT = 500; // Время без кликов для начала уменьшения (ms)
    let lastInteractionTime = 0; // Время последнего клика для отслеживания бездействия

    // Отображение имени пользователя
    if (tg.initDataUnsafe?.user?.first_name) {
        userGreetingElement.textContent = `Лаборатория ${tg.initDataUnsafe.user.first_name}`;
    }

    // Определения улучшений
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

    // Функции для пузырьков
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
        // Удаляем пузырек после завершения анимации (+ небольшой запас)
        setTimeout(() => { bubble.remove(); }, (duration + delay) * 1000 + 100);
    }
    // Запускаем генерацию пузырьков (не зависит от уровня жидкости напрямую)
    setInterval(createBubble, 500); // Частота появления пузырьков

    // --- Обновленная функция обновления ВИЗУАЛА жидкости и пузырьков ---
    function updateLiquidLevelVisual(percentage) {
        const level = Math.max(LIQUID_MIN_LEVEL, Math.min(LIQUID_MAX_LEVEL, percentage));
        if (cauldronElement) {
            // Устанавливаем CSS-переменную для ::before (жидкость)
            cauldronElement.style.setProperty('--liquid-level', `${level}%`);
             // Обновляем высоту контейнера пузырьков
             if(bubblesContainer) {
                 bubblesContainer.style.height = `${level}%`;
             }
        } else {
            console.warn("Cauldron element not found when trying to update liquid level.");
        }
    }

    // Общая функция обновления UI (только цифры и кнопки)
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
    }

    // Функция форматирования чисел
    function formatNumber(num) {
        if (isNaN(num) || !Number.isFinite(num)) { console.warn("formatNumber received invalid input:", num); return "ERR"; }
        if (num < 1000) return num.toString();
        if (num < 1000000) return (num / 1000).toFixed(1).replace('.0', '') + 'K';
        if (num < 1000000000) return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
        return (num / 1000000000).toFixed(1).replace('.0', '') + 'B';
    }

    // Функция для отображения "+N" при клике
    function showClickFeedback(amount, type = 'essence') {
        if (isBlocked || !clickFeedbackContainer) return;

        const feedback = document.createElement('div');
        feedback.className = 'click-feedback';

        const formattedAmount = formatNumber(amount);

        if (type === 'gem') {
            const gemSvgIcon = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" fill="var(--gem-color)" style="vertical-align: middle; margin-left: 4px;">
                    <path d="M12 1.68l-8 8.42L12 22.32l8-8.42L12 1.68zm0 2.1l5.95 6.27L12 18.54l-5.95-6.27L12 3.78z M6.4 10.1L12 16.1l5.6-6H6.4z"/>
                </svg>`;
            feedback.innerHTML = `+${formattedAmount}${gemSvgIcon}`;
            feedback.style.fontSize = '1.3em';
            feedback.style.fontWeight = 'bold';
            feedback.style.color = '#f0f0f0';

        } else {
            feedback.textContent = `+${formattedAmount} 🧪`;
            feedback.style.color = 'var(--accent-color)';
        }

        const offsetX = Math.random() * 60 - 30;
        const offsetY = (type === 'gem') ? (Math.random() * 20 + 15) : (Math.random() * 20 - 10);
        feedback.style.left = `calc(50% + ${offsetX}px)`;
        feedback.style.top = `calc(50% + ${offsetY}px)`;

        clickFeedbackContainer.appendChild(feedback);
        setTimeout(() => { feedback.remove(); }, 950);
    }

    // --- Обновленная Логика клика по котлу ---
    if (cauldronElement) {
        cauldronElement.addEventListener('click', () => {
            const currentTime = Date.now();

            if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
            if (isBlocked) { showTemporaryNotification("Автокликер обнаружен! Возможность кликать заблокирована.", "error"); return; }

            if (currentTime - lastClickTime >= MIN_CLICK_INTERVAL) {
                warningCount = 0;
                lastInteractionTime = currentTime; // Обновляем время последнего взаимодействия

                // 1. Добавляем эссенцию
                let clickAmount = essencePerClick;
                if (Number.isFinite(clickAmount)) {
                    essence += clickAmount;
                    if (clickFeedbackContainer) showClickFeedback(clickAmount, 'essence');
                } else { console.error("Invalid essencePerClick value:", essencePerClick); }

                // 2. Шанс на кристалл
                if (Math.random() < GEM_AWARD_CHANCE) {
                    gems += GEMS_PER_AWARD;
                    console.log(`Получен кристалл! Всего: ${gems}`);
                    if (clickFeedbackContainer) showClickFeedback(GEMS_PER_AWARD, 'gem');
                    if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
                }

                // 3. Увеличиваем ВИЗУАЛЬНЫЙ уровень жидкости
                visualLiquidLevel += LIQUID_INCREASE_PER_CLICK;
                visualLiquidLevel = Math.min(visualLiquidLevel, LIQUID_MAX_LEVEL);
                updateLiquidLevelVisual(visualLiquidLevel); // Обновляем визуал жидкости/пузырьков

                // 4. Обновляем ТОЛЬКО текстовое отображение валют
                updateDisplay();

                // --- Анимация клика закомментирована/удалена ---
                // cauldronElement.style.transform = 'scale(0.95)';
                // setTimeout(() => { cauldronElement.style.transform = 'scale(1)'; }, 80);
                // --- ---

                lastClickTime = currentTime; // Обновляем время для анти-чита
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

    // Логика авто-клика (пассивный доход)
    setInterval(() => {
        if (!isBlocked && essencePerSecond > 0 && Number.isFinite(essencePerSecond)) {
            const essenceToAdd = essencePerSecond / 10;
            if (Number.isFinite(essenceToAdd)) {
                essence += essenceToAdd;
                updateDisplay(); // Обновляем ТОЛЬКО цифры
            } else { console.warn("Skipping auto-click: essenceToAdd resulted in invalid number", essenceToAdd); }
        }
    }, 100);

    // --- Интервал для уменьшения и обновления визуального уровня жидкости ---
    setInterval(() => {
        const currentTime = Date.now();
        // Уменьшаем уровень, если прошло достаточно времени с последнего клика
        if (currentTime - lastInteractionTime > IDLE_TIMEOUT && visualLiquidLevel > LIQUID_MIN_LEVEL) {
            visualLiquidLevel -= LIQUID_DECAY_RATE;
            visualLiquidLevel = Math.max(visualLiquidLevel, LIQUID_MIN_LEVEL); // Ограничиваем снизу
        }
        // Обновляем CSS переменную и высоту контейнера пузырьков
        updateLiquidLevelVisual(visualLiquidLevel);
    }, LIQUID_UPDATE_INTERVAL);

    // Логика улучшений
    function calculateCost(upgrade) {
        if (!upgrade || typeof upgrade.baseCost !== 'number' || typeof upgrade.costMultiplier !== 'number' || typeof upgrade.currentLevel !== 'number') { console.error("Invalid upgrade data in calculateCost:", upgrade); return Infinity; }
        return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.currentLevel));
    }

    function renderUpgrades() {
        if (!upgradesListElement) { console.error("Upgrades list element not found!"); return; }
        upgradesListElement.innerHTML = '';
        upgrades.sort((a, b) => (a.requiredEssence || 0) - (b.requiredEssence || 0));
        if (upgrades.length === 0) { upgradesListElement.innerHTML = '<li><p>Улучшения не определены.</p></li>'; return; }

        const currentEssenceFloored = Math.floor(essence);

        upgrades.forEach(upgrade => {
            const cost = calculateCost(upgrade);
            if (!Number.isFinite(cost)) { console.error("Skipping render for upgrade with invalid cost:", upgrade.id); return; }
            const requirement = upgrade.requiredEssence || 0;
            const isLocked = currentEssenceFloored < requirement;
            const canAfford = currentEssenceFloored >= cost;
            const li = document.createElement('li');

            if (isLocked) li.classList.add('locked');
            else if (!canAfford) li.classList.add('cannot-afford');

            let buttonText = 'Купить';
            let buttonDisabled = false;

            if (isLocked) {
                buttonDisabled = true;
                buttonText = `Нужно ${formatNumber(requirement)} 🧪`;
            } else if (!canAfford) {
                buttonDisabled = true;
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
                buyButton.disabled = buttonDisabled;
                if (!isLocked) {
                     buyButton.addEventListener('click', (e) => {
                         e.stopPropagation();
                         if (!buyButton.disabled) { buyUpgrade(upgrade.id); }
                     });
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
            updateDisplay(); // Обновит и кнопки через renderUpgrades, если панель открыта
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
        // Текст дохода в сек обновляется в updateDisplay
    }

    // Открытие/Закрытие панели улучшений
    if (openUpgradesBtn && upgradesPanel) {
        openUpgradesBtn.addEventListener('click', () => {
             renderUpgrades();
             upgradesPanel.classList.remove('hidden');
         });
    } else { console.error("Open upgrades button or panel not found!"); }
    if (closeUpgradesBtn && upgradesPanel) {
        closeUpgradesBtn.addEventListener('click', () => { upgradesPanel.classList.add('hidden'); });
    } else { console.error("Close upgrades button or panel not found!"); }

    // Логика реферальной системы
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
             if (value) { try { const savedState = JSON.parse(value); if ((savedState.essence && savedState.essence > 0) || (savedState.upgrades && savedState.upgrades.some(u => u.level > 0)) || (savedState.gems && savedState.gems > 0) ) { isTrulyNew = false; console.log("Player has existing progress, not considered new for referral."); } } catch(e) { console.error("Error parsing gameState for referral check", e); } } else { console.log("No gameState found, player is likely new."); }
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
            else { const bonusAmount = 50000; if (Number.isFinite(essence)) { essence += bonusAmount; console.log(`Claimed bonus ${referralId}! Added ${bonusAmount} essence.`); showTemporaryNotification(`+${formatNumber(bonusAmount)} 🧪 за приглашенного друга!`, "success"); updateDisplay(); claimedBonuses.push(referralId); tg.CloudStorage.setItem('claimed_bonuses', JSON.stringify(claimedBonuses), (setError) => { if (setError) console.error("Error saving updated claimed_bonuses:", setError); else { console.log("Claimed bonuses updated."); saveGame(); } }); } else { console.error("Cannot add bonus, current essence is invalid:", essence); showTemporaryNotification("Ошибка начисления бонуса!", "error"); } }
             try { const url = new URL(window.location); url.searchParams.delete('claimBonus'); window.history.replaceState({}, document.title, url.toString()); } catch(e) { console.warn("Could not clean URL params", e); }
        });
    }

    // Логика кнопки "Друзья"
    if (inviteFriendBtn) {
        inviteFriendBtn.addEventListener('click', () => {
            if (tg && tg.initDataUnsafe?.user?.id) { const botUsername = 'AlchimLaboratory_Bot'; const appName = 'AlchimLab'; const userId = tg.initDataUnsafe.user.id; const shareUrl = `https://t.me/${botUsername}/${appName}?start=${userId}`; const shareText = 'Заходи в мою Алхимическую Лабораторию в Telegram! 🧪⚗️ Кликай и создавай эликсиры!'; tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`); console.log('Предложено поделиться реферальной ссылкой:', shareUrl); }
            else { console.error('Cannot get user ID or Telegram API access for sharing.'); showTemporaryNotification('Не удалось создать ссылку для приглашения.', 'error'); }
        });
    } else { console.error("Invite friend button not found!"); }

    // Сохранение/Загрузка через CloudStorage
    function saveGame() {
        if (!tg || !tg.CloudStorage) { console.error("CloudStorage unavailable for saving."); return; }
        if (!Number.isFinite(essence)) { console.error("Invalid essence value:", essence); essence = 0; }
        if (!Number.isFinite(gems)) { console.error("Invalid gems value:", gems); gems = 0; }

        const gameState = {
            essence: essence,
            gems: gems, // Сохраняем кристаллы
            upgrades: upgrades.map(u => ({ id: u.id, level: u.currentLevel }))
            // visualLiquidLevel сохранять не нужно, он всегда начинается с минимума
        };
        try {
            const gameStateString = JSON.stringify(gameState);
            tg.CloudStorage.setItem('gameState', gameStateString, (error) => {
                if (error) console.error("CloudStorage save error:", error);
            });
        }
        catch (e) { console.error("Error stringifying game state:", e); showTemporaryNotification("Критическая ошибка сохранения!", "error"); }
    }

    function loadGame() {
        isBlocked = false; warningCount = 0;
        if(cauldronElement) { cauldronElement.classList.remove('blocked-cauldron'); }
        if (!tg || !tg.CloudStorage) { console.error("CloudStorage unavailable for loading."); resetGameData(); updateDisplay(); updateLiquidLevelVisual(LIQUID_MIN_LEVEL); showTemporaryNotification("Не удалось загрузить прогресс. Начинаем новую игру.", "warning"); return; }

        console.log("Loading from CloudStorage...");
        tg.CloudStorage.getItem('gameState', (error, value) => {
            let loadedSuccessfully = false;
            if (error) { console.error("CloudStorage load error:", error); showTemporaryNotification("Ошибка загрузки прогресса!", "error"); resetGameData(); }
            else if (value) {
                console.log("Data received:", value.length + " bytes");
                try {
                    const gameState = JSON.parse(value);
                    essence = Number(gameState.essence) || 0; if (!Number.isFinite(essence)) essence = 0;
                    gems = Number(gameState.gems) || 0; // Загружаем кристаллы
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

            checkReferralAndBonus();
            updateDisplay(); // Обновляем цифры
            // Устанавливаем начальный визуальный уровень ПОСЛЕ загрузки/сброса
            visualLiquidLevel = LIQUID_MIN_LEVEL;
            lastInteractionTime = Date.now();
            updateLiquidLevelVisual(visualLiquidLevel); // Обновляем визуал
        });
    }

    // Сброс данных
    function resetGameData() {
        isBlocked = false; warningCount = 0;
        if(cauldronElement) { cauldronElement.classList.remove('blocked-cauldron'); }
        essence = 0;
        gems = 0; // Сбрасываем кристаллы
        upgrades.forEach(u => u.currentLevel = 0);
        recalculateBonuses();
        visualLiquidLevel = LIQUID_MIN_LEVEL; // Сбрасываем и визуальный уровень
        lastInteractionTime = Date.now(); // Сбрасываем таймер
        console.log("Game data reset.");
    }

    // Функция для временных уведомлений
    function showTemporaryNotification(message, type = "info") {
         const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => {
             notification.style.opacity = '1';
             notification.style.bottom = '80px'; // Позиция при показе
         }, 10);
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.bottom = '70px'; // Возвращаем для анимации исчезновения
            setTimeout(() => { notification.remove(); }, 500); // Удаляем после анимации
        }, 2500);
    }

    // Первоначальная инициализация
    loadGame(); // Загружаем игру

    // Автосохранение и обработчики событий видимости/закрытия
    setInterval(saveGame, 15000); // Каждые 15 секунд
    window.addEventListener('beforeunload', saveGame);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveGame(); });
    if (tg && tg.onEvent) { tg.onEvent('viewportChanged', (event) => { if (!event.isStateStable) saveGame(); }); }

}); // Конец DOMContentLoaded