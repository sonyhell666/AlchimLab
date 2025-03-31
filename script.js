document.addEventListener('DOMContentLoaded', () => {
    // Инициализация Telegram Web App
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    // --- Получаем ссылки на элементы DOM ---
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
    const inviteFriendBtn = document.getElementById('invite-friend-btn'); // Сама переменная не меняется
    const bubblesContainer = document.getElementById('bubbles-container');
    const perSecondDisplayDiv = document.getElementById('per-second-display');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsPanel = document.getElementById('settings-panel');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    const languageOptionsContainer = settingsPanel ? settingsPanel.querySelector('.language-options') : null;
    const shopBtn = document.getElementById('shop-btn');

    // --- Игровые переменные (состояние) ---
    let essence = 0;
    let essencePerClick = 1;
    let essencePerSecond = 0;
    let gems = 0;
    const GEM_AWARD_CHANCE = 0.03;
    const GEMS_PER_AWARD = 1;
    let currentLanguage = 'ru'; // Язык по умолчанию
    let userName = tg.initDataUnsafe?.user?.first_name || null;

    // --- Переменные для защиты от автокликера ---
    let lastClickTime = 0;
    const MIN_CLICK_INTERVAL = 67;
    const MAX_WARNINGS = 3;
    let warningCount = 0;
    let isBlocked = false;

    // --- Переменные для динамического уровня жидкости ---
    let visualLiquidLevel = 10;
    const LIQUID_MIN_LEVEL = 10;
    const LIQUID_MAX_LEVEL = 95;
    const LIQUID_INCREASE_PER_CLICK = 1.0;
    const LIQUID_DECAY_RATE = 0.15;
    const LIQUID_UPDATE_INTERVAL = 100;
    const IDLE_TIMEOUT = 500;
    let lastInteractionTime = 0;

    // --- Объект с переводами ---
    const translations = {
        greetingBase: { ru: "Лаборатория", en: "Laboratory" },
        perSec: { ru: "в сек", en: "/ sec" },
        upgradesButton: { ru: "Улучшения", en: "Upgrades" },
        // ИЗМЕНЕНО: Ключ и текст для кнопки "Пригласить друзей"
        inviteFriendsButton: { ru: "Пригласить друзей", en: "Invite Friends" },
        upgradesTitle: { ru: "Улучшения", en: "Upgrades" },
        settingsTitle: { ru: "Настройки", en: "Settings" },
        languageTitle: { ru: "Язык", en: "Language" },
        buyButton: { ru: "Купить", en: "Buy" },
        requirementPrefix: { ru: "Нужно", en: "Need" },
        requirementInfoPrefix: { ru: "Требуется", en: "Requires" },
        // --- Добавленные ключи для ошибок/уведомлений ---
        tooFastClick: { ru: "Слишком быстро!", en: "Clicking too fast!" },
        autoclickerBlocked: { ru: "Автокликер обнаружен! Клики заблокированы.", en: "Autoclicker detected! Clicking blocked." },
        actionBlocked: { ru: "Действие заблокировано.", en: "Action blocked." },
        needMoreEssence: { ru: "Нужно больше эссенции!", en: "Need more essence!" },
        invalidCostError: { ru: "Ошибка: Неверная стоимость улучшения!", en: "Error: Invalid upgrade cost!" },
        notEnoughEssence: { ru: "Недостаточно эссенции!", en: "Not enough essence!" },
        loadErrorStartNew: { ru: "Ошибка загрузки прогресса. Начинаем новую игру.", en: "Failed to load progress. Starting new game." },
        loadError: { ru: "Ошибка загрузки прогресса!", en: "Error loading progress!" },
        readError: { ru: "Ошибка чтения данных сохранения!", en: "Error reading save data!" },
        saveCritError: { ru: "Критическая ошибка сохранения!", en: "Critical save error!" },
        welcomeReferral: { ru: "Добро пожаловать! Ваш пригласитель получит бонус.", en: "Welcome! Your inviter gets a bonus." },
        referralRegErrorBot: { ru: "Не удалось зарегистрировать приглашение (ошибка бота).", en: "Could not register invite (bot error)." },
        referralRegErrorFunc: { ru: "Не удалось зарегистрировать приглашение (функция недоступна).", en: "Could not register invite (feature unavailable)." },
        bonusCheckError: { ru: "Ошибка проверки бонуса!", en: "Bonus check error!" },
        bonusAlreadyClaimed: { ru: "Бонус уже получен.", en: "Bonus already claimed." },
        bonusReasonFriend: { ru: "за приглашенного друга!", en: "for invited friend!" },
        bonusAddError: { ru: "Ошибка добавления бонуса!", en: "Bonus add error!" },
        inviteLinkError: { ru: "Не удалось создать ссылку-приглашение.", en: "Failed to create invite link." },
        // ИЗМЕНЕНО: Текст для шаринга остался тем же, но убедись, что он подходит
        shareText: { ru: 'Присоединяйся к моей Алхимической Лаборатории в Telegram! 🧪⚗️ Кликай и создавай эликсиры!', en: 'Join my Alchemy Lab in Telegram! 🧪⚗️ Click and create elixirs!' },
        comingSoon: { ru: "Скоро...", en: "Coming Soon..." },
        // --- Названия и описания улучшений ---
        upgrade_click1_name: { ru: "Улучшенный рецепт", en: "Improved Recipe" },
        upgrade_click1_desc: { ru: "+1 к клику", en: "+1 per click" },
        upgrade_auto1_name: { ru: "Гомункул-Помощник", en: "Homunculus Helper" },
        upgrade_auto1_desc: { ru: "+1 в секунду", en: "+1 per second" },
        upgrade_click2_name: { ru: "Зачарованная ступка", en: "Enchanted Mortar" },
        upgrade_click2_desc: { ru: "+5 к клику", en: "+5 per click" },
        upgrade_auto2_name: { ru: "Пузырящийся котел", en: "Bubbling Cauldron" },
        upgrade_auto2_desc: { ru: "+4 в секунду", en: "+4 per second" },
        upgrade_click3_name: { ru: "Алембик Мастера", en: "Master's Alembic" },
        upgrade_click3_desc: { ru: "+25 к клику", en: "+25 per click" },
        upgrade_auto3_name: { ru: "Призванный Ифрит", en: "Summoned Ifrit" },
        upgrade_auto3_desc: { ru: "+20 в секунду", en: "+20 per second" },
        upgrade_auto4_name: { ru: "Сад Алхимических Растений", en: "Garden of Alchemical Plants" },
        upgrade_auto4_desc: { ru: "+50 в секунду", en: "+50 per second" },
        upgrade_click4_name: { ru: "Сила Философского Камня (осколок)", en: "Power of the Philosopher's Stone (Shard)" },
        upgrade_click4_desc: { ru: "+150 к клику", en: "+150 per click" },
        upgrade_auto5_name: { ru: "Эфирный Концентратор", en: "Aether Concentrator" },
        upgrade_auto5_desc: { ru: "+250 в секунду", en: "+250 per second" },
        upgrade_auto6_name: { ru: "Портал в мир Эссенции", en: "Portal to the Essence Realm" },
        upgrade_auto6_desc: { ru: "+1000 в секунду", en: "+1000 per second" },
        upgrade_click5_name: { ru: "Прикосновение Творца", en: "Creator's Touch" },
        upgrade_click5_desc: { ru: "+1000 к клику", en: "+1000 per click" },
        upgrade_auto7_name: { ru: "Поток Чистой Магии", en: "Flow of Pure Magic" },
        upgrade_auto7_desc: { ru: "+5000 в секунду", en: "+5000 per second" },
    };

    // --- Определения улучшений с ключами перевода ---
    const upgrades = [
        // ... (без изменений) ...
        { id: 'click1', nameKey: 'upgrade_click1_name', descKey: 'upgrade_click1_desc', baseCost: 15, costMultiplier: 1.4, type: 'click', value: 1, currentLevel: 0, requiredEssence: 0 },
        { id: 'auto1', nameKey: 'upgrade_auto1_name', descKey: 'upgrade_auto1_desc', baseCost: 60, costMultiplier: 1.6, type: 'auto', value: 1, currentLevel: 0, requiredEssence: 0 },
        { id: 'click2', nameKey: 'upgrade_click2_name', descKey: 'upgrade_click2_desc', baseCost: 300, costMultiplier: 1.5, type: 'click', value: 5, currentLevel: 0, requiredEssence: 500 },
        { id: 'auto2', nameKey: 'upgrade_auto2_name', descKey: 'upgrade_auto2_desc', baseCost: 750, costMultiplier: 1.7, type: 'auto', value: 4, currentLevel: 0, requiredEssence: 700 },
        { id: 'click3', nameKey: 'upgrade_click3_name', descKey: 'upgrade_click3_desc', baseCost: 5000, costMultiplier: 1.6, type: 'click', value: 25, currentLevel: 0, requiredEssence: 10000 },
        { id: 'auto3', nameKey: 'upgrade_auto3_name', descKey: 'upgrade_auto3_desc', baseCost: 12000, costMultiplier: 1.8, type: 'auto', value: 20, currentLevel: 0, requiredEssence: 15000 },
        { id: 'auto4', nameKey: 'upgrade_auto4_name', descKey: 'upgrade_auto4_desc', baseCost: 30000, costMultiplier: 1.9, type: 'auto', value: 50, currentLevel: 0, requiredEssence: 40000 },
        { id: 'click4', nameKey: 'upgrade_click4_name', descKey: 'upgrade_click4_desc', baseCost: 250000, costMultiplier: 1.7, type: 'click', value: 150, currentLevel: 0, requiredEssence: 500000 },
        { id: 'auto5', nameKey: 'upgrade_auto5_name', descKey: 'upgrade_auto5_desc', baseCost: 1000000, costMultiplier: 2.0, type: 'auto', value: 250, currentLevel: 0, requiredEssence: 1200000 },
        { id: 'auto6', nameKey: 'upgrade_auto6_name', descKey: 'upgrade_auto6_desc', baseCost: 5000000, costMultiplier: 2.2, type: 'auto', value: 1000, currentLevel: 0, requiredEssence: 6000000 },
        { id: 'click5', nameKey: 'upgrade_click5_name', descKey: 'upgrade_click5_desc', baseCost: 10000000, costMultiplier: 1.8, type: 'click', value: 1000, currentLevel: 0, requiredEssence: 15000000 },
        { id: 'auto7', nameKey: 'upgrade_auto7_name', descKey: 'upgrade_auto7_desc', baseCost: 50000000, costMultiplier: 2.1, type: 'auto', value: 5000, currentLevel: 0, requiredEssence: 60000000 },
    ];

    // --- Функции для пузырьков ---
    // ... (без изменений) ...
    function createBubble() { if (!bubblesContainer) return; const b = document.createElement('div'); b.classList.add('bubble'); const s = Math.random() * 8 + 6; const d = Math.random() * 2.5 + 3; const l = Math.random() * 1.5; const h = Math.random() * 90 + 5; b.style.width = `${s}px`; b.style.height = `${s}px`; b.style.left = `${h}%`; b.style.animationDuration = `${d}s`; b.style.animationDelay = `${l}s`; bubblesContainer.appendChild(b); setTimeout(() => { b.remove(); }, (d + l) * 1000 + 100); }
    setInterval(createBubble, 500);


    // --- Функция обновления визуала жидкости и пузырьков ---
    // ... (без изменений) ...
    function updateLiquidLevelVisual(percentage) { const l = Math.max(LIQUID_MIN_LEVEL, Math.min(LIQUID_MAX_LEVEL, percentage)); if (cauldronElement) { cauldronElement.style.setProperty('--liquid-level', `${l}%`); if(bubblesContainer) { bubblesContainer.style.height = `${l}%`; } } else { console.warn("Cauldron element not found for liquid update."); } }

    // --- Общая функция обновления UI ---
    // ... (без изменений) ...
    function updateDisplay() { if (essenceCountElement) essenceCountElement.textContent = formatNumber(Math.floor(essence)); if (essencePerSecondElement && perSecondDisplayDiv) { essencePerSecondElement.textContent = formatNumber(essencePerSecond); perSecondDisplayDiv.style.display = essencePerSecond > 0 ? 'block' : 'none'; } if (gemCountElement) gemCountElement.textContent = formatNumber(gems); if (upgradesPanel && !upgradesPanel.classList.contains('hidden')) renderUpgrades(); }

    // --- Функция форматирования чисел ---
    // ... (без изменений) ...
    function formatNumber(num) { if (isNaN(num) || !Number.isFinite(num)) { console.warn("formatNumber received invalid input:", num); return "ERR"; } if (num < 1000) return num.toString(); if (num < 1e6) return (num / 1e3).toFixed(1).replace('.0', '') + 'K'; if (num < 1e9) return (num / 1e6).toFixed(1).replace('.0', '') + 'M'; return (num / 1e9).toFixed(1).replace('.0', '') + 'B'; }

    // --- Функция для отображения "+N" при клике ---
    // ... (без изменений) ...
    function showClickFeedback(amount, type = 'essence') { if (isBlocked || !clickFeedbackContainer) return; const f = document.createElement('div'); f.className = 'click-feedback'; const fmt = formatNumber(amount); if (type === 'gem') { const i = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" fill="var(--gem-color)" style="vertical-align:middle;margin-left:4px;"><path d="M12 1.68l-8 8.42L12 22.32l8-8.42L12 1.68zm0 2.1l5.95 6.27L12 18.54l-5.95-6.27L12 3.78z M6.4 10.1L12 16.1l5.6-6H6.4z"/></svg>`; f.innerHTML = `+${fmt}${i}`; f.style.fontSize = '1.3em'; f.style.fontWeight = 'bold'; f.style.color = '#f0f0f0'; } else { f.textContent = `+${fmt} 🧪`; f.style.color = 'var(--accent-color)'; } const ox = Math.random() * 60 - 30; const oy = (type === 'gem') ? (Math.random() * 20 + 15) : (Math.random() * 20 - 10); f.style.left = `calc(50% + ${ox}px)`; f.style.top = `calc(50% + ${oy}px)`; clickFeedbackContainer.appendChild(f); setTimeout(() => { f.remove(); }, 950); }

    // --- Логика клика по котлу ---
    // ... (без изменений) ...
    if (cauldronElement) {
         cauldronElement.addEventListener('click', () => {
             const currentTime = Date.now();
             if (tg?.HapticFeedback) { tg.HapticFeedback.impactOccurred('light'); }

             if (isBlocked) {
                 showTemporaryNotification(translations.autoclickerBlocked?.[currentLanguage] || "Autoclicker detected! Clicking blocked.", "error");
                 return;
             }

             if (currentTime - lastClickTime >= MIN_CLICK_INTERVAL) {
                 warningCount = 0; // Reset warning count on valid click
                 lastInteractionTime = currentTime;

                 let clickAmount = essencePerClick;
                 if (Number.isFinite(clickAmount)) {
                     essence += clickAmount;
                     if (clickFeedbackContainer) showClickFeedback(clickAmount, 'essence');
                 } else {
                     console.error("Invalid essence per click value:", essencePerClick);
                 }


                 if (Math.random() < GEM_AWARD_CHANCE) {
                     gems += GEMS_PER_AWARD;
                     console.log(`Awarded ${GEMS_PER_AWARD} gem(s)! Total: ${gems}`);
                     if (clickFeedbackContainer) showClickFeedback(GEMS_PER_AWARD, 'gem');
                     if (tg?.HapticFeedback) { tg.HapticFeedback.impactOccurred('medium'); }
                 }

                 // Update liquid level
                 visualLiquidLevel += LIQUID_INCREASE_PER_CLICK;
                 visualLiquidLevel = Math.min(visualLiquidLevel, LIQUID_MAX_LEVEL); // Clamp to max
                 updateLiquidLevelVisual(visualLiquidLevel);

                 updateDisplay();

                 // Visual feedback for click
                 cauldronElement.style.transform = 'scale(0.95)';
                 setTimeout(() => { if (cauldronElement) cauldronElement.style.transform = 'scale(1)'; }, 80);

                 lastClickTime = currentTime;

             } else {
                 // Clicked too fast
                 warningCount++;
                 lastInteractionTime = currentTime; // Still update interaction time
                 console.warn(`Clicking too fast warning ${warningCount}/${MAX_WARNINGS}`);
                 showTemporaryNotification(`${translations.tooFastClick?.[currentLanguage] || "Clicking too fast!"} (${warningCount}/${MAX_WARNINGS})`, "warning");
                 if (tg?.HapticFeedback) { tg.HapticFeedback.impactOccurred('medium'); }


                 if (warningCount >= MAX_WARNINGS) {
                     isBlocked = true;
                     console.error("Autoclicker detected and blocked.");
                     showTemporaryNotification(translations.autoclickerBlocked?.[currentLanguage] || "Autoclicker detected! Clicking blocked.", "error");
                     if (tg?.HapticFeedback) { tg.HapticFeedback.notificationOccurred('error'); }
                     if (cauldronElement) cauldronElement.classList.add('blocked-cauldron'); // Add visual block
                 }
             }
         });
     } else {
         console.error("Cauldron element not found!");
     }

    // --- Логика авто-клика ---
    // ... (без изменений) ...
    setInterval(() => {
        if (!isBlocked && essencePerSecond > 0 && Number.isFinite(essencePerSecond)) {
             const essenceToAdd = essencePerSecond / 10; // Add 1/10th every 100ms
             if (Number.isFinite(essenceToAdd)) {
                 essence += essenceToAdd;
                 updateDisplay();
             } else {
                 console.warn("Calculated invalid essence per second portion.");
             }
         }
     }, 100);

    // --- Интервал для уменьшения уровня жидкости ---
    // ... (без изменений) ...
    setInterval(() => {
        const currentTime = Date.now();
        // Only decay if idle and above minimum
        if (currentTime - lastInteractionTime > IDLE_TIMEOUT && visualLiquidLevel > LIQUID_MIN_LEVEL) {
            visualLiquidLevel -= LIQUID_DECAY_RATE;
            visualLiquidLevel = Math.max(visualLiquidLevel, LIQUID_MIN_LEVEL); // Clamp to min
        }
        updateLiquidLevelVisual(visualLiquidLevel); // Update visual regardless
    }, LIQUID_UPDATE_INTERVAL);


    // --- Логика улучшений ---
    // ... (без изменений) ...
    function calculateCost(upgrade) {
        if (!upgrade || typeof upgrade.baseCost !== 'number' || typeof upgrade.costMultiplier !== 'number' || typeof upgrade.currentLevel !== 'number') {
             console.error("Invalid upgrade data for cost calculation:", upgrade);
             return Infinity; // Return Infinity to prevent purchase
        }
        return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.currentLevel));
    }

    // ... (renderUpgrades, buyUpgrade, recalculateBonuses - без изменений) ...
    function renderUpgrades() {
        if (!upgradesListElement) {
            console.error("Upgrades list element not found!");
            return;
        }
        upgradesListElement.innerHTML = ''; // Clear previous list

        // Sort upgrades, e.g., by required essence or cost
        upgrades.sort((a, b) => (a.requiredEssence || 0) - (b.requiredEssence || 0));

        if (upgrades.length === 0) {
             upgradesListElement.innerHTML = `<li><p>No upgrades defined.</p></li>`;
             return;
        }

        const currentEssenceFloored = Math.floor(essence); // Floor once for comparison

        upgrades.forEach(upgrade => {
            const cost = calculateCost(upgrade);
            if (!Number.isFinite(cost)) {
                console.error("Skipping render for upgrade with invalid cost:", upgrade.id);
                return; // Skip rendering this upgrade
            }

            const required = upgrade.requiredEssence || 0;
            const isLocked = currentEssenceFloored < required;
            const canAfford = currentEssenceFloored >= cost;

            const listItem = document.createElement('li');
            if (isLocked) {
                listItem.classList.add('locked');
            } else if (!canAfford) {
                listItem.classList.add('cannot-afford');
            }

            // Get translated texts
            const translatedName = translations[upgrade.nameKey]?.[currentLanguage] || upgrade.nameKey;
            const translatedDesc = translations[upgrade.descKey]?.[currentLanguage] || upgrade.descKey;
            const buyButtonText = translations.buyButton?.[currentLanguage] || "Buy";
            const requirementPrefix = translations.requirementPrefix?.[currentLanguage] || "Need";
            const requirementInfoPrefix = translations.requirementInfoPrefix?.[currentLanguage] || "Requires";

            let buttonText = buyButtonText;
            let isButtonDisabled = false;

            if (isLocked) {
                isButtonDisabled = true;
                 // Show requirement on the button itself for locked items
                 buttonText = `${requirementPrefix} ${formatNumber(required)} 🧪`;
            } else if (!canAfford) {
                isButtonDisabled = true;
                // Button text remains "Buy", but it's disabled
            }

            listItem.innerHTML = `
                <div class="upgrade-info">
                    <h3>${translatedName} (Lv. ${upgrade.currentLevel})</h3>
                    <p>${translatedDesc}</p>
                    <p class="upgrade-cost">Cost: ${formatNumber(cost)} 🧪</p>
                    ${isLocked ? `<p class="requirement-info">${requirementInfoPrefix}: ${formatNumber(required)} 🧪</p>` : ''}
                </div>
                <button class="buy-upgrade-btn" data-upgrade-id="${upgrade.id}">${buttonText}</button>
            `;

            const buyButton = listItem.querySelector('.buy-upgrade-btn');
            if (buyButton) {
                 buyButton.disabled = isButtonDisabled;
                 if (!isLocked) { // Only add click listener if not fundamentally locked by requirement
                     buyButton.addEventListener('click', (event) => {
                         event.stopPropagation(); // Prevent clicks bubbling up if needed
                         if (!buyButton.disabled) { // Double check disabled status
                             buyUpgrade(upgrade.id);
                         }
                     });
                 }
            }

            upgradesListElement.appendChild(listItem);
        });
    }


    function buyUpgrade(upgradeId) {
        if (isBlocked) {
            showTemporaryNotification(translations.actionBlocked?.[currentLanguage] || "Action blocked.", "error");
            return;
        }

        const upgrade = upgrades.find(up => up.id === upgradeId);
        if (!upgrade) {
            console.error("Upgrade not found:", upgradeId);
            return;
        }

        // Check requirement first
         const required = upgrade.requiredEssence || 0;
         if (Math.floor(essence) < required) {
             showTemporaryNotification(`${translations.needMoreEssence?.[currentLanguage] || "Need more essence!"} ${formatNumber(required)} 🧪`, "error");
             if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('warning');
             return;
         }


        const cost = calculateCost(upgrade);
         if (!Number.isFinite(cost)) {
             showTemporaryNotification(translations.invalidCostError?.[currentLanguage] || "Error: Invalid upgrade cost!", "error");
             return; // Prevent purchase if cost calculation failed
         }

        if (essence >= cost) {
            essence -= cost;
            upgrade.currentLevel++;
            recalculateBonuses();
            updateDisplay(); // Update numbers
            renderUpgrades(); // Re-render the upgrade list with new costs/levels
            if (tg?.HapticFeedback) { tg.HapticFeedback.impactOccurred('light'); }
        } else {
            showTemporaryNotification(translations.notEnoughEssence?.[currentLanguage] || "Not enough essence!", "error");
             if (tg?.HapticFeedback) { tg.HapticFeedback.notificationOccurred('warning'); }
        }
    }

    function recalculateBonuses() {
        essencePerClick = 1; // Start with base click value
        essencePerSecond = 0; // Start with base auto value

        upgrades.forEach(upgrade => {
            if (upgrade.currentLevel > 0 && Number.isFinite(upgrade.value) && typeof upgrade.type === 'string') {
                if (upgrade.type === 'click') {
                    essencePerClick += upgrade.value * upgrade.currentLevel;
                } else if (upgrade.type === 'auto') {
                    essencePerSecond += upgrade.value * upgrade.currentLevel;
                }
            } else if (upgrade.currentLevel > 0) {
                 // Log if an active upgrade has invalid data, but don't stop calculation
                 console.warn("Upgrade has level > 0 but invalid bonus data:", upgrade);
            }
        });

        // Sanity checks after calculation
        if (!Number.isFinite(essencePerClick) || essencePerClick < 1) {
             console.error("Recalculation resulted in invalid essencePerClick:", essencePerClick);
             essencePerClick = 1; // Reset to minimum safe value
        }
        if (!Number.isFinite(essencePerSecond) || essencePerSecond < 0) {
             console.error("Recalculation resulted in invalid essencePerSecond:", essencePerSecond);
             essencePerSecond = 0; // Reset to minimum safe value
        }

        // No need to call updateDisplay() here, it's called after buyUpgrade or loadGame
    }

    // --- Открытие/Закрытие панелей ---
    // ... (без изменений) ...
    if (openUpgradesBtn && upgradesPanel) {
        openUpgradesBtn.addEventListener('click', () => {
            renderUpgrades(); // Render/update list when opening
            upgradesPanel.classList.remove('hidden');
        });
    } else { console.error("Upgrade open button or panel not found."); }

    if (closeUpgradesBtn && upgradesPanel) {
        closeUpgradesBtn.addEventListener('click', () => {
            upgradesPanel.classList.add('hidden');
        });
    } else { console.error("Upgrade close button or panel not found."); }

    if (settingsBtn) {
        settingsBtn.addEventListener('click', openSettings);
    } else { console.error("Settings button not found."); }

    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener('click', closeSettings);
    } else { console.error("Settings close button not found."); }

    // Close settings panel if clicking outside the box
    if (settingsPanel) {
        settingsPanel.addEventListener('click', (e) => {
            if (e.target === settingsPanel) { // Check if the click was directly on the overlay
                closeSettings();
            }
        });
    }

    // --- Логика настроек ---
    // ... (без изменений) ...
    function openSettings() {
        if (settingsPanel) {
            updateActiveLangButton(); // Ensure correct button is highlighted
            settingsPanel.classList.remove('hidden');
        }
    }
    function closeSettings() {
        if (settingsPanel) {
            settingsPanel.classList.add('hidden');
        }
    }
    function setLanguage(lang) {
        if (translations.greetingBase[lang]) { // Check if language is supported
            currentLanguage = lang;
            console.log(`Language changed to: ${currentLanguage}`);
            applyTranslations(); // Update all text elements
            updateActiveLangButton(); // Update button highlight
            saveGame(); // Save the new language setting
            // If upgrades panel is open, re-render it with new translations
             if (upgradesPanel && !upgradesPanel.classList.contains('hidden')) {
                 renderUpgrades();
             }
        } else {
            console.warn(`Language "${lang}" not found in translations.`);
        }
    }

    function applyTranslations() {
        // Update user greeting
        if (userGreetingElement) {
            let greeting = translations.greetingBase[currentLanguage] || "Laboratory";
            if (userName) {
                greeting += ` ${userName}`;
            }
            userGreetingElement.textContent = greeting;
        }

        // Update all elements with data-translate attribute
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.dataset.translate;
            const translation = translations[key]?.[currentLanguage];
            if (translation) {
                // Simple text update for most elements
                element.textContent = translation;
            } else {
                 console.warn(`Translation key "${key}" for language "${currentLanguage}" not found.`);
                 // Optionally leave the original text or set a default
            }
        });
        // Explicitly update dynamic parts if needed (e.g., button text in upgrades is handled by renderUpgrades)
    }


    function updateActiveLangButton() {
        if (!languageOptionsContainer) return;
        languageOptionsContainer.querySelectorAll('.lang-btn').forEach(button => {
            button.classList.toggle('active', button.dataset.lang === currentLanguage);
        });
    }

    // Add event listener for language buttons
    if (languageOptionsContainer) {
        languageOptionsContainer.addEventListener('click', (event) => {
            if (event.target.classList.contains('lang-btn')) {
                const lang = event.target.dataset.lang;
                if (lang) {
                    setLanguage(lang);
                }
            }
        });
    } else { console.error("Language options container not found."); }

    // --- Логика реферальной системы ---
    // ... (без изменений, включая inviteFriendBtn listener) ...
    function checkReferralAndBonus() {
        const startParam = tg.initDataUnsafe?.start_param;
        const urlParams = new URLSearchParams(window.location.search);
        const claimBonusParam = urlParams.get('claimBonus');

        console.log("Start Param:", startParam, "Claim Bonus Param:", claimBonusParam);

        if (startParam && !isNaN(parseInt(startParam))) {
            // Found a potential inviter ID in start_param
            handleNewReferral(startParam);
        } else if (claimBonusParam) {
            // Found a bonus claim ID in URL parameters
            handleBonusClaim(claimBonusParam);
        }
    }

    function handleNewReferral(inviterId) {
        // Check if the user is actually new (minimal progress)
        tg.CloudStorage.getItem('gameState', (error, value) => {
            if (error) {
                 console.error("CloudStorage error checking for referral:", error);
                 // Proceed without sending data, maybe notify user?
                 return;
             }

            let isConsideredNew = true;
            if (value) {
                 try {
                     const savedState = JSON.parse(value);
                     // Define "new": less than X essence, no significant upgrades, few gems?
                     const thresholdEssence = 100; // Example threshold
                     const nonBaseUpgrades = savedState.upgrades?.some(u => u.level > 0 && u.id !== 'click1'); // Check if any non-basic upgrade bought
                     if ((savedState.essence && savedState.essence > thresholdEssence) ||
                         nonBaseUpgrades ||
                         (savedState.gems && savedState.gems > 0))
                     {
                         isConsideredNew = false;
                         console.log("Referral check: User is not considered new.");
                     } else {
                         console.log("Referral check: User is considered new (or existing with minimal progress).");
                     }
                 } catch (parseError) {
                     console.error("Error parsing gameState during referral check", parseError);
                     // Treat as potentially new if data is corrupt
                 }
             } else {
                 console.log("Referral check: No gameState found, user is new.");
             }

            if (isConsideredNew) {
                 console.log(`Processing referral: User is new or has minimal progress. Inviter ID: ${inviterId}. Sending data to bot...`);
                 // Save the game state immediately *before* sending data, might include initial state
                 saveGame();
                 // Send data to the bot about the registration
                 if (tg.sendData) {
                     const dataToSend = JSON.stringify({
                         type: 'referral_registered',
                         inviter_id: inviterId
                     });
                     try {
                         tg.sendData(dataToSend);
                         console.log("Referral registration data sent:", dataToSend);
                         showTemporaryNotification(translations.welcomeReferral?.[currentLanguage] || "Welcome! Your inviter gets a bonus.", "success");
                     } catch (sendError) {
                         console.error("Error sending referral data via tg.sendData:", sendError);
                          showTemporaryNotification(translations.referralRegErrorBot?.[currentLanguage] || "Could not register invite (bot error).", "error");
                     }
                 } else {
                     console.error("tg.sendData is not available to send referral info.");
                     showTemporaryNotification(translations.referralRegErrorFunc?.[currentLanguage] || "Could not register invite (feature unavailable).", "error");
                 }
             } else {
                 console.log("User is not new, referral registration skipped.");
             }
        });
    }


    function handleBonusClaim(referralId) {
        console.log(`Attempting to claim bonus for referral ID: ${referralId}`);
        if (!referralId || typeof referralId !== 'string' || referralId.trim() === '') {
             console.warn("Invalid referral ID for bonus claim.");
             return;
         }

        // Check if this bonus has already been claimed
        tg.CloudStorage.getItem('claimed_bonuses', (error, value) => {
             if (error) {
                 console.error("CloudStorage error getting claimed bonuses:", error);
                 showTemporaryNotification(translations.bonusCheckError?.[currentLanguage] || "Bonus check error!", "error");
                 return;
             }

            let claimedBonuses = [];
            if (value) {
                 try {
                     claimedBonuses = JSON.parse(value);
                     if (!Array.isArray(claimedBonuses)) {
                         console.warn("Claimed bonuses data is not an array, resetting.");
                         claimedBonuses = [];
                     }
                 } catch (parseError) {
                     console.error("Error parsing claimed_bonuses:", parseError);
                     claimedBonuses = []; // Reset if data is corrupt
                 }
             }

            if (claimedBonuses.includes(referralId)) {
                 console.log(`Bonus for referral ID ${referralId} has already been claimed.`);
                 showTemporaryNotification(translations.bonusAlreadyClaimed?.[currentLanguage] || "Bonus already claimed.", "warning");
             } else {
                 // Award the bonus
                 const bonusAmount = 50000; // Define bonus amount
                 if (Number.isFinite(essence)) {
                     essence += bonusAmount;
                     console.log(`Bonus claimed successfully for ${referralId}! Added ${bonusAmount} essence.`);
                     const reasonText = translations.bonusReasonFriend?.[currentLanguage] || "for invited friend!";
                     showTemporaryNotification(`+${formatNumber(bonusAmount)} 🧪 ${reasonText}`, "success");
                     updateDisplay();

                     // Add this ID to the list of claimed bonuses and save
                     claimedBonuses.push(referralId);
                     tg.CloudStorage.setItem('claimed_bonuses', JSON.stringify(claimedBonuses), (setError) => {
                         if (setError) {
                             console.error("CloudStorage error saving updated claimed bonuses:", setError);
                         } else {
                             console.log("Claimed bonuses list updated in CloudStorage.");
                             // Save the main game state as well, since essence changed
                             saveGame();
                         }
                     });
                 } else {
                      console.error("Cannot add bonus, current essence is not a valid number:", essence);
                      showTemporaryNotification(translations.bonusAddError?.[currentLanguage] || "Bonus add error!", "error");
                 }
            }

            // Clean the 'claimBonus' parameter from the URL to prevent re-claiming on refresh
             try {
                 const currentUrl = new URL(window.location);
                 currentUrl.searchParams.delete('claimBonus');
                 window.history.replaceState({}, document.title, currentUrl.toString());
                 console.log("Cleaned claimBonus URL parameter.");
             } catch (urlError) {
                 console.warn("Could not clean claimBonus URL parameter:", urlError);
             }
        });
    }


    // Invite Friend Button Logic (функциональность не меняется)
    if (inviteFriendBtn) {
        inviteFriendBtn.addEventListener('click', () => {
            if (tg?.initDataUnsafe?.user?.id) {
                const botUsername = 'AlchimLaboratory_Bot'; // Replace with your bot's username
                const appName = 'AlchimLab'; // The app name used in botfather for the Mini App link (optional but good practice)
                const userId = tg.initDataUnsafe.user.id;
                // Construct the referral link: t.me/YourBot/YourApp?start=referrer_user_id
                 const referralLink = `https://t.me/${botUsername}/${appName}?start=${userId}`; // Use appName if you set one

                // Construct the share text
                const shareText = translations.shareText?.[currentLanguage] || 'Join my Alchemy Lab in Telegram! 🧪⚗️ Click and create elixirs!';

                // Construct the Telegram share URL
                 const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`;

                // Open the share link
                tg.openTelegramLink(shareUrl);
                console.log('Generated share link:', referralLink);
                if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');

            } else {
                console.error('Cannot generate invite link: User ID or Telegram WebApp context unavailable.');
                showTemporaryNotification(translations.inviteLinkError?.[currentLanguage] || 'Failed to create invite link.', 'error');
                 if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
            }
        });
    } else { console.error("Invite friend button not found."); }


    // --- Сохранение/Загрузка ---
    // ... (без изменений) ...
    function saveGame() {
        if (!tg?.CloudStorage) {
            console.error("CloudStorage is not available for saving.");
            return; // Cannot save
        }

        // Ensure numeric values are valid before saving
         if (!Number.isFinite(essence)) {
             console.warn(`Invalid essence value (${essence}) detected during save. Resetting to 0.`);
             essence = 0;
         }
         if (!Number.isFinite(gems)) {
             console.warn(`Invalid gems value (${gems}) detected during save. Resetting to 0.`);
             gems = 0;
         }

        const gameState = {
            essence: essence,
            gems: gems,
            upgrades: upgrades.map(u => ({ id: u.id, level: u.currentLevel })),
            language: currentLanguage
            // Add any other state variables here (e.g., last online time, boost end times)
        };

        try {
            const gameStateString = JSON.stringify(gameState);
            tg.CloudStorage.setItem('gameState', gameStateString, (error) => {
                if (error) {
                    console.error("CloudStorage setItem error:", error);
                    // Maybe show a non-critical notification?
                } else {
                    // console.log("Game state saved successfully."); // Optional: uncomment for debugging
                }
            });
        } catch (stringifyError) {
             console.error("Error stringifying game state:", stringifyError);
             // This is a critical error, maybe notify the user
             showTemporaryNotification(translations.saveCritError?.[currentLanguage] || "Critical save error!", "error");
        }
    }

    function loadGame() {
        // Reset potential blocking from previous session
         isBlocked = false;
         warningCount = 0;
         if (cauldronElement) cauldronElement.classList.remove('blocked-cauldron');


        if (!tg?.CloudStorage) {
            console.error("CloudStorage is not available for loading.");
            resetGameData(); // Start fresh if storage unavailable
            applyTranslations(); // Apply default translations
            updateDisplay();
             updateLiquidLevelVisual(LIQUID_MIN_LEVEL);
            showTemporaryNotification(translations.loadErrorStartNew?.[currentLanguage] || "Failed to load progress. Starting new game.", "warning");
            return; // Cannot load
        }

        console.log("Attempting to load game state...");
        tg.CloudStorage.getItem('gameState', (error, value) => {
            let loadedSuccessfully = false;
            if (error) {
                console.error("CloudStorage getItem error:", error);
                showTemporaryNotification(translations.loadError?.[currentLanguage] || "Error loading progress!", "error");
                resetGameData(); // Reset on load error
            } else if (value) {
                console.log("Received game state data from CloudStorage:", value.length, "bytes");
                try {
                    const savedState = JSON.parse(value);

                    // Load essence, ensuring it's a valid number
                     essence = Number(savedState.essence) || 0;
                     if (!Number.isFinite(essence)) {
                         console.warn("Loaded invalid essence value, resetting to 0.");
                         essence = 0;
                     }

                    // Load gems, ensuring it's a valid number
                     gems = Number(savedState.gems) || 0;
                     if (!Number.isFinite(gems)) {
                         console.warn("Loaded invalid gems value, resetting to 0.");
                         gems = 0;
                     }


                    // Load language, falling back to 'ru' if invalid/missing
                    currentLanguage = savedState.language || 'ru';
                    if (!translations.greetingBase[currentLanguage]) { // Validate language
                        console.warn(`Loaded unsupported language "${currentLanguage}", falling back to 'ru'.`);
                        currentLanguage = 'ru';
                    }

                    // Load upgrade levels
                    if (Array.isArray(savedState.upgrades)) {
                        upgrades.forEach(upgrade => {
                            const savedUpgrade = savedState.upgrades.find(su => su.id === upgrade.id);
                            upgrade.currentLevel = (savedUpgrade && Number.isFinite(Number(savedUpgrade.level))) ? Number(savedUpgrade.level) : 0;
                            if (upgrade.currentLevel < 0) upgrade.currentLevel = 0; // Sanity check
                        });
                    } else {
                         // If no upgrades array in save, reset all levels
                         upgrades.forEach(upgrade => upgrade.currentLevel = 0);
                    }

                    recalculateBonuses(); // Calculate bonuses based on loaded levels
                    console.log("Game state loaded successfully.");
                    loadedSuccessfully = true;

                } catch (parseError) {
                    console.error("Error parsing loaded game state:", parseError);
                    showTemporaryNotification(translations.readError?.[currentLanguage] || "Error reading save data!", "error");
                    resetGameData(); // Reset if data is corrupt
                }
            } else {
                // No saved data found
                console.log("No saved game state found. Starting fresh.");
                resetGameData(); // Initialize a fresh game state
            }

            // After loading or resetting:
            checkReferralAndBonus(); // Check for referrals/bonuses regardless of load success
            applyTranslations(); // Apply loaded or default language
            updateDisplay(); // Update UI with loaded/reset values
            visualLiquidLevel = LIQUID_MIN_LEVEL; // Reset visual liquid level
            lastInteractionTime = Date.now(); // Reset idle timer
            updateLiquidLevelVisual(visualLiquidLevel);

        });
    }

    // Function to reset all game variables to default state
    // ... (без изменений) ...
    function resetGameData() {
        console.log("Resetting game data to defaults.");
        isBlocked = false;
        warningCount = 0;
        if (cauldronElement) cauldronElement.classList.remove('blocked-cauldron');

        essence = 0;
        gems = 0;
        upgrades.forEach(upgrade => upgrade.currentLevel = 0);
        currentLanguage = 'ru'; // Reset language to default
        recalculateBonuses(); // Recalculate bonuses (will be base values)
        visualLiquidLevel = LIQUID_MIN_LEVEL;
        lastInteractionTime = Date.now();
    }


    // --- Функция уведомлений ---
    // ... (без изменений) ...
    function showTemporaryNotification(message, type = "info") {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`; // Add type class (info, error, warning, success)
        notification.textContent = message;

        document.body.appendChild(notification);

        // Trigger fade-in and slide-up
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.bottom = '80px'; // Final position
        }, 10); // Short delay to allow element rendering before transition starts

        // Start fade-out and removal after a delay
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.bottom = '70px'; // Slightly slide down on fade out
            // Remove the element after the fade-out transition completes
            setTimeout(() => {
                notification.remove();
            }, 500); // Match transition duration in CSS for opacity
        }, 2500); // How long the notification stays visible
    }


    // --- Обработчик клика по кнопке Магазина ---
    // ... (без изменений) ...
    if (shopBtn) {
        shopBtn.addEventListener('click', () => {
            // Используем текст из переводов
            const message = translations.comingSoon[currentLanguage] || "Coming Soon..."; // Fallback text
            showTemporaryNotification(message, "info"); // Показываем уведомление типа 'info'
             if (tg?.HapticFeedback) {
                 tg.HapticFeedback.impactOccurred('light'); // Легкая вибрация при клике
             }
        });
    } else {
        console.error("Shop button element not found!"); // Log error if button isn't found
    }


    // --- Первоначальная инициализация ---
    loadGame(); // Load saved state or initialize new game


    // --- Автосохранение и обработчики событий ---
    // ... (без изменений) ...
    const autoSaveInterval = setInterval(saveGame, 15000); // Save every 15 seconds

    // Save before the user leaves the page/app
    window.addEventListener('beforeunload', saveGame);

    // Save when the app becomes hidden (e.g., user switches tabs/apps)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            saveGame();
        }
    });

    // Save when the Telegram viewport changes state (e.g., resizing)
    if (tg?.onEvent) {
        tg.onEvent('viewportChanged', (event) => {
            // Save when viewport stabilizes after changes
             if (event.isStateStable) {
                 saveGame();
            }
        });
    }


}); // Конец DOMContentLoaded