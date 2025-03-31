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
    const inviteFriendBtn = document.getElementById('invite-friend-btn');
    const bubblesContainer = document.getElementById('bubbles-container');
    const perSecondDisplayDiv = document.getElementById('per-second-display');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsPanel = document.getElementById('settings-panel');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    const languageOptionsContainer = settingsPanel ? settingsPanel.querySelector('.language-options') : null;
    const shopBtn = document.getElementById('shop-btn');
    const shopPanel = document.getElementById('shop-panel');
    const closeShopBtn = document.getElementById('close-shop-btn');
    const skinsListElement = document.getElementById('skins-list');
    const shopGemCountElement = document.getElementById('shop-gem-count');


    // --- Игровые переменные (состояние) ---
    let essence = 0;
    let essencePerClick = 1;
    let essencePerSecond = 0;
    let gems = 0;
    let ownedSkins = ['default']; // Игрок всегда владеет скином по умолчанию
    let activeSkinId = 'default'; // Активный скин по умолчанию
    const GEM_AWARD_CHANCE = 0.03;
    const GEMS_PER_AWARD = 1;
    let currentLanguage = 'ru'; // Язык по умолчанию
    let userName = tg.initDataUnsafe?.user?.first_name || null;

    // --- Переменные для защиты от автокликера ---
    let lastClickTime = 0;
    const MIN_CLICK_INTERVAL = 67; // ~15 clicks per second max theoretical
    const MAX_WARNINGS = 3;
    let warningCount = 0;
    let isBlocked = false;

    // --- Переменные для динамического уровня жидкости ---
    let visualLiquidLevel = 10;
    const LIQUID_MIN_LEVEL = 10;
    const LIQUID_MAX_LEVEL = 95;
    const LIQUID_INCREASE_PER_CLICK = 1.0;
    const LIQUID_DECAY_RATE = 0.15; // Decay per interval when idle
    const LIQUID_UPDATE_INTERVAL = 100; // ms
    const IDLE_TIMEOUT = 500; // ms of inactivity before decay starts
    let lastInteractionTime = 0;

    // --- Объект с переводами ---
    const translations = {
        greetingBase: { ru: "Лаборатория", en: "Laboratory" },
        perSec: { ru: "в сек", en: "/ sec" },
        upgradesButton: { ru: "Улучшения", en: "Upgrades" },
        inviteFriendsButton: { ru: "Пригласить друзей", en: "Invite Friends" },
        upgradesTitle: { ru: "Улучшения", en: "Upgrades" },
        settingsTitle: { ru: "Настройки", en: "Settings" },
        languageTitle: { ru: "Язык", en: "Language" },
        buyButton: { ru: "Купить", en: "Buy" },
        requirementPrefix: { ru: "Нужно", en: "Need" },
        requirementInfoPrefix: { ru: "Требуется", en: "Requires" },
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
        shareText: { ru: 'Присоединяйся к моей Алхимической Лаборатории в Telegram! 🧪⚗️ Кликай и создавай эликсиры!', en: 'Join my Alchemy Lab in Telegram! 🧪⚗️ Click and create elixirs!' },
        // SHOP TRANSLATIONS
        shopTitle: { ru: "Магазин", en: "Shop" },
        yourGems: { ru: "Ваши кристаллы:", en: "Your Gems:" },
        selectButton: { ru: "Выбрать", en: "Select" },
        selectedButton: { ru: "Выбрано", en: "Selected" },
        notEnoughGems: { ru: "Недостаточно кристаллов!", en: "Not enough gems!" },
        skinPurchaseSuccess: { ru: "Скин куплен!", en: "Skin purchased!" },
        skinSelected: { ru: "Скин выбран!", en: "Skin selected!" },
        // SKIN NAMES
        skin_default_name: { ru: "Стандартная колба", en: "Standard Flask" },
        skin_gold_name: { ru: "Золотая колба", en: "Golden Flask" },
        skin_crystal_name: { ru: "Хрустальный сосуд", en: "Crystal Vial" },
        skin_obsidian_name: { ru: "Обсидиановая реторта", en: "Obsidian Retort" },
        // UPGRADE NAMES & DESCS (Keep existing ones)
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

    // --- Определения улучшений ---
    const upgrades = [
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

    // --- Определения скинов ---
    const availableSkins = [
        { id: 'default', nameKey: 'skin_default_name', cost: 0, cssClass: 'skin-default' },
        { id: 'gold', nameKey: 'skin_gold_name', cost: 15, cssClass: 'skin-gold' },
        { id: 'crystal', nameKey: 'skin_crystal_name', cost: 50, cssClass: 'skin-crystal' },
        { id: 'obsidian', nameKey: 'skin_obsidian_name', cost: 100, cssClass: 'skin-obsidian' },
        // Добавляйте сюда новые скины
    ];


    // --- Функции для пузырьков ---
    function createBubble() { if (!bubblesContainer) return; const b = document.createElement('div'); b.classList.add('bubble'); const s = Math.random() * 8 + 6; const d = Math.random() * 2.5 + 3; const l = Math.random() * 1.5; const h = Math.random() * 90 + 5; b.style.width = `${s}px`; b.style.height = `${s}px`; b.style.left = `${h}%`; b.style.animationDuration = `${d}s`; b.style.animationDelay = `${l}s`; bubblesContainer.appendChild(b); setTimeout(() => { b.remove(); }, (d + l) * 1000 + 100); }
    setInterval(createBubble, 500);

    // --- Функция обновления визуала жидкости и пузырьков ---
    function updateLiquidLevelVisual(percentage) {
        const l = Math.max(LIQUID_MIN_LEVEL, Math.min(LIQUID_MAX_LEVEL, percentage));
        if (cauldronElement) {
             cauldronElement.style.setProperty('--liquid-level', `${l}%`);
             // Обновляем высоту контейнера пузырьков соответственно
             if(bubblesContainer) {
                 bubblesContainer.style.height = `${l}%`;
             }
        } else { console.warn("Cauldron element not found for liquid update."); }
    }


    // --- Общая функция обновления UI ---
    function updateDisplay() {
        if (essenceCountElement) essenceCountElement.textContent = formatNumber(Math.floor(essence));
        if (essencePerSecondElement && perSecondDisplayDiv) {
            essencePerSecondElement.textContent = formatNumber(essencePerSecond);
            perSecondDisplayDiv.style.display = essencePerSecond > 0 ? 'block' : 'none';
        }
        if (gemCountElement) gemCountElement.textContent = formatNumber(gems);
        // Обновляем счетчик гемов в магазине, если он открыт
        if (shopPanel && !shopPanel.classList.contains('hidden') && shopGemCountElement) {
            shopGemCountElement.textContent = formatNumber(gems);
        }
        if (upgradesPanel && !upgradesPanel.classList.contains('hidden')) renderUpgrades();
        // Не рендерим магазин здесь постоянно, только при открытии или действии
    }

    // --- Функция форматирования чисел ---
    function formatNumber(num) {
         if (isNaN(num) || !Number.isFinite(num)) { console.warn("formatNumber received invalid input:", num); return "ERR"; }
         const abbreviations = ["", "K", "M", "B", "T", "q", "Q", "s", "S", "O", "N", "d", "U"]; // Добавьте больше по необходимости
         if (num < 1000) return num.toString();

         let i = 0;
         while (num >= 1000 && i < abbreviations.length - 1) {
             num /= 1000;
             i++;
         }
         // Оставляем один знак после запятой, если число не целое после деления
         const formattedNum = num % 1 === 0 ? num.toString() : num.toFixed(1);
         return formattedNum + abbreviations[i];
    }

    // --- Функция для отображения "+N" при клике ---
    function showClickFeedback(amount, type = 'essence') {
        if (isBlocked || !clickFeedbackContainer) return;
        const f = document.createElement('div');
        f.className = 'click-feedback';
        const fmt = formatNumber(amount);
        if (type === 'gem') {
            // Используем SVG из DOM для единообразия, если нужно
             const svgIconHtml = `<span class="gem-icon" style="display:inline-flex; vertical-align: middle; margin-left: 4px;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" fill="var(--gem-color)"><path d="M12 1.68l-8 8.42L12 22.32l8-8.42L12 1.68zm0 2.1l5.95 6.27L12 18.54l-5.95-6.27L12 3.78z M6.4 10.1L12 16.1l5.6-6H6.4z"></path></svg></span>`;
             f.innerHTML = `+${fmt}${svgIconHtml}`;
             f.style.fontSize = '1.3em';
             f.style.fontWeight = 'bold';
             f.style.color = 'var(--gem-color)'; // Красим текст в цвет гема
        } else {
             f.textContent = `+${fmt} 🧪`;
             f.style.color = 'var(--accent-color)'; // Стандартный цвет для эссенции
        }
        const ox = Math.random() * 60 - 30; // Horizontal offset
        const oy = (type === 'gem') ? (Math.random() * 20 + 15) : (Math.random() * 20 - 10); // Vertical offset (gems slightly higher)
        f.style.left = `calc(50% + ${ox}px)`;
        f.style.top = `calc(50% + ${oy}px)`;
        clickFeedbackContainer.appendChild(f);
        setTimeout(() => { f.remove(); }, 950); // Duration of fadeUp animation + small buffer
    }


    // --- Логика клика по котлу ---
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
    setInterval(() => {
        const currentTime = Date.now();
        // Only decay if idle and above minimum
        if (currentTime - lastInteractionTime > IDLE_TIMEOUT && visualLiquidLevel > LIQUID_MIN_LEVEL) {
            visualLiquidLevel -= LIQUID_DECAY_RATE;
            visualLiquidLevel = Math.max(visualLiquidLevel, LIQUID_MIN_LEVEL); // Clamp to min
        }
        // Always update visual, even if not decaying (might be clamped)
        updateLiquidLevelVisual(visualLiquidLevel);
    }, LIQUID_UPDATE_INTERVAL);


    // --- Логика улучшений ---
    function calculateCost(upgrade) {
        if (!upgrade || typeof upgrade.baseCost !== 'number' || typeof upgrade.costMultiplier !== 'number' || typeof upgrade.currentLevel !== 'number') {
             console.error("Invalid upgrade data for cost calculation:", upgrade);
             return Infinity; // Return Infinity to prevent purchase
        }
        return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.currentLevel));
    }

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
                listItem.classList.add('cannot-afford'); // Can add specific styling if needed
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
             showTemporaryNotification(`${translations.needMoreEssence?.[currentLanguage] || "Need more essence!"} ${formatNumber(required)} 🧪`, "warning"); // Use warning
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
            saveGame();       // Save after successful purchase
            if (tg?.HapticFeedback) { tg.HapticFeedback.impactOccurred('light'); }
        } else {
            showTemporaryNotification(translations.notEnoughEssence?.[currentLanguage] || "Not enough essence!", "warning"); // Use warning
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
                 console.warn("Upgrade has level > 0 but invalid bonus data:", upgrade);
            }
        });

        if (!Number.isFinite(essencePerClick) || essencePerClick < 1) {
             console.error("Recalculation resulted in invalid essencePerClick:", essencePerClick);
             essencePerClick = 1;
        }
        if (!Number.isFinite(essencePerSecond) || essencePerSecond < 0) {
             console.error("Recalculation resulted in invalid essencePerSecond:", essencePerSecond);
             essencePerSecond = 0;
        }
    }

    // --- Открытие/Закрытие панелей ---
    if (openUpgradesBtn && upgradesPanel) {
        openUpgradesBtn.addEventListener('click', () => {
            renderUpgrades();
            upgradesPanel.classList.remove('hidden');
            // Close other panels if open
            closeSettings();
            closeShop();
        });
    } else { console.error("Upgrade open button or panel not found."); }

    if (closeUpgradesBtn && upgradesPanel) {
        closeUpgradesBtn.addEventListener('click', () => {
            upgradesPanel.classList.add('hidden');
        });
    } else { console.error("Upgrade close button or panel not found."); }

    if (settingsBtn && settingsPanel) {
        settingsBtn.addEventListener('click', openSettings);
    } else { console.error("Settings button or panel not found."); }

    if (closeSettingsBtn && settingsPanel) {
        closeSettingsBtn.addEventListener('click', closeSettings);
    } else { console.error("Settings close button or panel not found."); }

    if (settingsPanel) {
        settingsPanel.addEventListener('click', (e) => {
            // Close only if clicking the background overlay, not the box inside
            if (e.target === settingsPanel) {
                closeSettings();
            }
        });
    }

    // Shop Panel
    if (shopBtn && shopPanel) {
        shopBtn.addEventListener('click', openShop);
    } else { console.error("Shop button or panel not found."); }

    if (closeShopBtn && shopPanel) {
        closeShopBtn.addEventListener('click', closeShop);
    } else { console.error("Shop close button or panel not found."); }


    // --- Логика настроек ---
    function openSettings() {
        if (settingsPanel) {
            updateActiveLangButton();
            settingsPanel.classList.remove('hidden');
            // Close other panels
            closeUpgrades();
            closeShop();
        }
    }
    function closeSettings() {
        if (settingsPanel) {
            settingsPanel.classList.add('hidden');
        }
    }
    // Helper to close upgrades panel
    function closeUpgrades() {
        if (upgradesPanel) {
            upgradesPanel.classList.add('hidden');
        }
    }

    function setLanguage(lang) {
        if (translations.greetingBase[lang]) {
            currentLanguage = lang;
            console.log(`Language changed to: ${currentLanguage}`);
            applyTranslations();
            updateActiveLangButton();
            saveGame();
             // Re-render panels if they are open
             if (upgradesPanel && !upgradesPanel.classList.contains('hidden')) {
                 renderUpgrades();
             }
             if (shopPanel && !shopPanel.classList.contains('hidden')) {
                renderSkins();
             }
        } else {
            console.warn(`Language "${lang}" not found in translations.`);
        }
    }

    function applyTranslations() {
        if (userGreetingElement) {
            let greeting = translations.greetingBase[currentLanguage] || "Laboratory";
            if (userName) {
                greeting += ` ${userName}`;
            }
            userGreetingElement.textContent = greeting;
        }

        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.dataset.translate;
            const translation = translations[key]?.[currentLanguage];
            if (translation) {
                // Handle potential HTML entities if needed in the future
                element.textContent = translation;
            } else {
                 // Keep existing text if translation not found, but log warning
                 console.warn(`Translation key "${key}" for language "${currentLanguage}" not found.`);
            }
        });
         // Special case for per-second display text node if it exists
         const perSecTextNode = perSecondDisplayDiv?.lastChild;
         if (perSecTextNode && perSecTextNode.nodeType === Node.TEXT_NODE) {
             perSecTextNode.textContent = ` ${translations.perSec?.[currentLanguage] || '/ sec'}`;
         }
    }

    function updateActiveLangButton() {
        if (!languageOptionsContainer) return;
        languageOptionsContainer.querySelectorAll('.lang-btn').forEach(button => {
            button.classList.toggle('active', button.dataset.lang === currentLanguage);
        });
    }

    if (languageOptionsContainer) {
        languageOptionsContainer.addEventListener('click', (event) => {
            if (event.target.classList.contains('lang-btn')) {
                const lang = event.target.dataset.lang;
                if (lang && lang !== currentLanguage) { // Only change if different
                    setLanguage(lang);
                }
            }
        });
    } else { console.error("Language options container not found."); }


    // --- Логика магазина ---
    function openShop() {
        if (shopPanel && shopGemCountElement) {
            shopGemCountElement.textContent = formatNumber(gems); // Update gem count on open
            renderSkins();
            shopPanel.classList.remove('hidden');
            // Close other panels
            closeUpgrades();
            closeSettings();
            if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
        }
    }

    function closeShop() {
        if (shopPanel) {
            shopPanel.classList.add('hidden');
        }
    }

    function renderSkins() {
        if (!skinsListElement) {
            console.error("Skins list element not found!");
            return;
        }
        skinsListElement.innerHTML = ''; // Clear list

        availableSkins.forEach(skin => {
            const isOwned = ownedSkins.includes(skin.id);
            const isActive = activeSkinId === skin.id;
            const canAfford = gems >= skin.cost;

            const listItem = document.createElement('li');
            listItem.dataset.skinId = skin.id;
            if (isActive) {
                listItem.classList.add('active-skin');
            }

            const translatedName = translations[skin.nameKey]?.[currentLanguage] || skin.nameKey;
            const buyButtonText = translations.buyButton?.[currentLanguage] || "Buy";
            const selectButtonText = translations.selectButton?.[currentLanguage] || "Select";
            const selectedButtonText = translations.selectedButton?.[currentLanguage] || "Selected";
            const gemIconSvg = `<span class="gem-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em"><path d="M12 1.68l-8 8.42L12 22.32l8-8.42L12 1.68zm0 2.1l5.95 6.27L12 18.54l-5.95-6.27L12 3.78z M6.4 10.1L12 16.1l5.6-6H6.4z"/></svg></span>`;

            let actionButtonHtml = '';
            if (isActive) {
                // Button is disabled but styled differently
                actionButtonHtml = `<button class="skin-action-btn selected-btn" disabled>${selectedButtonText}</button>`;
            } else if (isOwned) {
                actionButtonHtml = `<button class="skin-action-btn select-btn">${selectButtonText}</button>`;
            } else {
                // Buy button, disable if cannot afford
                actionButtonHtml = `<button class="skin-action-btn buy-btn" ${!canAfford ? 'disabled' : ''}>${buyButtonText}</button>`;
            }

            listItem.innerHTML = `
                <div class="skin-preview ${skin.cssClass || ''}"></div>
                <div class="skin-info">
                    <h3>${translatedName}</h3>
                    ${skin.cost > 0 ? `<p class="skin-cost">${gemIconSvg} ${formatNumber(skin.cost)}</p>` : ''}
                </div>
                ${actionButtonHtml}
            `;

            const actionButton = listItem.querySelector('.skin-action-btn');
            // Add listener only if the button is not the "Selected" one
            if (actionButton && !actionButton.classList.contains('selected-btn')) {
                actionButton.addEventListener('click', () => {
                     // Check disabled again just in case
                     if (!actionButton.disabled) {
                         handleSkinAction(skin.id);
                     }
                });
            }

            skinsListElement.appendChild(listItem);
        });
    }

    function handleSkinAction(skinId) {
         if (isBlocked) {
             showTemporaryNotification(translations.actionBlocked?.[currentLanguage] || "Action blocked.", "error");
             return;
         }
        const skin = availableSkins.find(s => s.id === skinId);
        if (!skin) return;

        const isOwned = ownedSkins.includes(skinId);

        if (isOwned) {
            // Only select if it's not already active
            if (activeSkinId !== skinId) {
                setActiveSkin(skinId);
            }
        } else {
            buySkin(skinId);
        }
    }

    function buySkin(skinId) {
        const skin = availableSkins.find(s => s.id === skinId);
        // Ensure skin exists and is not already owned
        if (!skin || ownedSkins.includes(skinId) || skin.cost <= 0) return;

        if (gems >= skin.cost) {
            gems -= skin.cost;
            ownedSkins.push(skinId);
            console.log(`Skin purchased: ${skinId}. Remaining gems: ${gems}`);
            showTemporaryNotification(translations.skinPurchaseSuccess?.[currentLanguage] || "Skin purchased!", "success");
            if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');

            updateDisplay(); // Update gem counts everywhere
            renderSkins();   // Re-render shop to show new state
            setActiveSkin(skinId); // Automatically select the newly bought skin
            // saveGame() will be called by setActiveSkin
        } else {
            console.log(`Not enough gems to buy skin: ${skinId}. Needed: ${skin.cost}, Have: ${gems}`);
            showTemporaryNotification(translations.notEnoughGems?.[currentLanguage] || "Not enough gems!", "warning");
            if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('warning');
        }
    }

    function setActiveSkin(skinId) {
        // Ensure skin is owned before activating
        if (!ownedSkins.includes(skinId)) {
            console.error(`Attempted to activate unowned skin: ${skinId}`);
            return;
        }

        // Only proceed if the skin is actually changing
        if (activeSkinId !== skinId) {
            activeSkinId = skinId;
            console.log(`Active skin set to: ${skinId}`);
            applyCauldronSkin();
            // Re-render shop only if it's currently visible
            if (shopPanel && !shopPanel.classList.contains('hidden')) {
                renderSkins();
            }
            saveGame(); // Save the new active skin
            showTemporaryNotification(translations.skinSelected?.[currentLanguage] || "Skin selected!", "info");
            if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
        }
    }

    function applyCauldronSkin() {
        if (!cauldronElement) return;

        const activeSkinDefinition = availableSkins.find(s => s.id === activeSkinId);
        const skinClass = activeSkinDefinition?.cssClass;

        // Remove all potential skin classes first
        availableSkins.forEach(skin => {
            if (skin.cssClass) {
                cauldronElement.classList.remove(skin.cssClass);
            }
        });

        // Add the active skin class if it exists
        if (skinClass) {
            cauldronElement.classList.add(skinClass);
            console.log(`Applied skin class: ${skinClass} to cauldron.`);
        } else {
             console.warn(`No CSS class defined for active skin ID: ${activeSkinId}. Using default appearance.`);
             // Ensure default class is added if no specific class found (optional, depends on default styling)
             if (!cauldronElement.classList.contains('skin-default')) {
                 // cauldronElement.classList.add('skin-default');
             }
        }
    }


    // --- Логика реферальной системы ---
    function checkReferralAndBonus() {
        const startParam = tg.initDataUnsafe?.start_param;
        const urlParams = new URLSearchParams(window.location.search);
        const claimBonusParam = urlParams.get('claimBonus');

        console.log("Start Param:", startParam, "Claim Bonus Param:", claimBonusParam);

        // Prioritize bonus claim if both params exist (unlikely but possible)
        if (claimBonusParam) {
            handleBonusClaim(claimBonusParam);
        } else if (startParam && !isNaN(parseInt(startParam))) {
            handleNewReferral(startParam);
        }
    }

    function handleNewReferral(inviterId) {
        tg.CloudStorage.getItem('gameState', (error, value) => {
            if (error) {
                 console.error("CloudStorage error checking for referral:", error);
                 return; // Don't proceed if we can't check game state
             }

            let isConsideredNew = true;
            if (value) {
                 try {
                     const savedState = JSON.parse(value);
                     // Define "new" user criteria (e.g., low essence, no significant upgrades)
                     const thresholdEssence = 100; // Example threshold
                     const significantUpgrades = savedState.upgrades?.some(u => u.level > 0 && u.id !== 'click1' && u.id !== 'auto1'); // Example: ignore first basic upgrades

                     if ((savedState.essence && savedState.essence > thresholdEssence) ||
                         significantUpgrades ||
                         (savedState.gems && savedState.gems > 0)) // Having gems might indicate non-new status
                     {
                         isConsideredNew = false;
                         console.log("Referral check: User is not considered new based on progress.");
                     } else {
                         console.log("Referral check: User is considered new (or existing with minimal progress).");
                     }
                 } catch (parseError) {
                     console.error("Error parsing gameState during referral check", parseError);
                     // Proceed as if new if parsing fails? Or block? Let's assume proceed.
                 }
             } else {
                 console.log("Referral check: No gameState found, user is new.");
             }

            if (isConsideredNew) {
                 console.log(`Processing referral: User is new or has minimal progress. Inviter ID: ${inviterId}. Sending data to bot...`);
                 // Maybe save game state *before* sending data?
                 // saveGame();
                 if (tg.sendData) {
                     const dataToSend = JSON.stringify({
                         type: 'referral_registered',
                         inviter_id: inviterId,
                         referred_user_id: tg.initDataUnsafe?.user?.id // Send the new user's ID too
                     });
                     try {
                         tg.sendData(dataToSend);
                         console.log("Referral registration data sent:", dataToSend);
                         showTemporaryNotification(translations.welcomeReferral?.[currentLanguage] || "Welcome! Your inviter gets a bonus.", "success");
                         // Maybe save game again *after* successful send?
                         saveGame();
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
             // Clean URL param even if invalid
             cleanBonusUrlParam();
             return;
         }

        tg.CloudStorage.getItem('claimed_bonuses', (error, value) => {
             if (error) {
                 console.error("CloudStorage error getting claimed bonuses:", error);
                 showTemporaryNotification(translations.bonusCheckError?.[currentLanguage] || "Bonus check error!", "error");
                 cleanBonusUrlParam(); // Clean URL even on error
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
                     claimedBonuses = []; // Reset on parse error
                 }
             }

            if (claimedBonuses.includes(referralId)) {
                 console.log(`Bonus for referral ID ${referralId} has already been claimed.`);
                 showTemporaryNotification(translations.bonusAlreadyClaimed?.[currentLanguage] || "Bonus already claimed.", "warning");
             } else {
                 // Define bonus amount (could be dynamic later)
                 const bonusAmount = 50000; // Example bonus essence
                 if (Number.isFinite(essence)) {
                     essence += bonusAmount;
                     console.log(`Bonus claimed successfully for ${referralId}! Added ${bonusAmount} essence.`);
                     const reasonText = translations.bonusReasonFriend?.[currentLanguage] || "for invited friend!";
                     showTemporaryNotification(`+${formatNumber(bonusAmount)} 🧪 ${reasonText}`, "success");
                     updateDisplay();

                     // Add to claimed list and save
                     claimedBonuses.push(referralId);
                     tg.CloudStorage.setItem('claimed_bonuses', JSON.stringify(claimedBonuses), (setError) => {
                         if (setError) {
                             console.error("CloudStorage error saving updated claimed bonuses:", setError);
                             // Should we revert the essence gain? Probably not, too complex.
                         } else {
                             console.log("Claimed bonuses list updated in CloudStorage.");
                             // Save the main game state too, which now includes the bonus essence
                             saveGame();
                         }
                     });
                 } else {
                      console.error("Cannot add bonus, current essence is not a valid number:", essence);
                      showTemporaryNotification(translations.bonusAddError?.[currentLanguage] || "Bonus add error!", "error");
                 }
            }
             // Clean the URL parameter after processing
             cleanBonusUrlParam();
        });
    }

    // Helper function to remove the claimBonus URL parameter
    function cleanBonusUrlParam() {
         try {
             const currentUrl = new URL(window.location);
             if (currentUrl.searchParams.has('claimBonus')) {
                 currentUrl.searchParams.delete('claimBonus');
                 // Use replaceState to avoid adding to history
                 window.history.replaceState({}, document.title, currentUrl.toString());
                 console.log("Cleaned claimBonus URL parameter.");
             }
         } catch (urlError) {
             console.warn("Could not clean claimBonus URL parameter:", urlError);
         }
    }

    // Invite Friend Button Logic
    if (inviteFriendBtn) {
        inviteFriendBtn.addEventListener('click', () => {
            if (tg?.initDataUnsafe?.user?.id) {
                // --- CONFIGURATION: Replace with your actual bot username and app name ---
                const botUsername = 'AlchimLaboratory_Bot'; // Your Bot's username WITHOUT @
                const appName = 'AlchimLab';          // The short name of your Web App as configured in BotFather
                // -----------------------------------------------------------------------

                const userId = tg.initDataUnsafe.user.id;
                // Construct the referral link using the bot's t.me link and start parameter
                 const referralLink = `https://t.me/${botUsername}/${appName}?start=${userId}`;
                // Get the translated share text
                const shareText = translations.shareText?.[currentLanguage] || 'Join my Alchemy Lab in Telegram! 🧪⚗️ Click and create elixirs!';
                // Construct the Telegram share URL
                 const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`;

                // Open the Telegram share dialog
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
    function saveGame() {
        if (!tg?.CloudStorage) {
            console.warn("CloudStorage is not available for saving.");
            return;
        }
         // Basic validation before saving
         if (!Number.isFinite(essence)) {
             console.warn(`Invalid essence value (${essence}) detected during save. Resetting to 0.`);
             essence = 0;
         }
         if (!Number.isFinite(gems)) {
             console.warn(`Invalid gems value (${gems}) detected during save. Resetting to 0.`);
             gems = 0;
         }
         if (!Array.isArray(ownedSkins) || !ownedSkins.includes('default')) {
             console.warn(`Invalid ownedSkins array detected during save. Resetting.`);
             ownedSkins = ['default'];
             if (activeSkinId !== 'default') activeSkinId = 'default'; // Reset active if owned list was bad
         }
         if (typeof activeSkinId !== 'string' || !ownedSkins.includes(activeSkinId)) {
            console.warn(`Invalid activeSkinId (${activeSkinId}) detected during save. Resetting to default.`);
            activeSkinId = 'default';
         }

        const gameState = {
            essence: essence,
            gems: gems,
            upgrades: upgrades.map(u => ({ id: u.id, level: u.currentLevel })),
            language: currentLanguage,
            ownedSkins: ownedSkins, // Сохраняем купленные скины
            activeSkinId: activeSkinId // Сохраняем активный скин
        };
        try {
            const gameStateString = JSON.stringify(gameState);
            // console.log("Saving game state:", gameStateString.length, "bytes"); // Optional: log size
            tg.CloudStorage.setItem('gameState', gameStateString, (error) => {
                if (error) {
                    console.error("CloudStorage setItem error:", error);
                    // Potentially show a non-critical save error notification?
                } else {
                    // console.log("Game state saved successfully to CloudStorage."); // Optional success log
                }
            });
        } catch (stringifyError) {
             console.error("Error stringifying game state:", stringifyError);
             showTemporaryNotification(translations.saveCritError?.[currentLanguage] || "Critical save error!", "error");
        }
    }

    function loadGame() {
         // Reset potential autoclicker block on load
         isBlocked = false;
         warningCount = 0;
         if (cauldronElement) cauldronElement.classList.remove('blocked-cauldron');

        if (!tg?.CloudStorage) {
            console.error("CloudStorage is not available for loading. Starting new game.");
            resetGameData();
            // Initial setup for new game
            applyTranslations(); // Apply default language translations
            updateDisplay();
            updateLiquidLevelVisual(LIQUID_MIN_LEVEL); // Set initial liquid level
            applyCauldronSkin(); // Apply default skin
            showTemporaryNotification(translations.loadErrorStartNew?.[currentLanguage] || "Failed to load progress. Starting new game.", "warning");
            return;
        }

        console.log("Attempting to load game state from CloudStorage...");
        tg.CloudStorage.getItem('gameState', (error, value) => {
            let loadedSuccessfully = false;
            if (error) {
                console.error("CloudStorage getItem error:", error);
                showTemporaryNotification(translations.loadError?.[currentLanguage] || "Error loading progress!", "error");
                resetGameData(); // Reset to defaults on load error
            } else if (value) {
                console.log("Received game state data from CloudStorage:", value.length, "bytes");
                try {
                    const savedState = JSON.parse(value);

                    // Load Core Stats with validation
                     essence = Number(savedState.essence) || 0;
                     if (!Number.isFinite(essence) || essence < 0) {
                         console.warn("Loaded invalid essence value, resetting to 0.");
                         essence = 0;
                     }
                     gems = Number(savedState.gems) || 0;
                     if (!Number.isFinite(gems) || gems < 0) {
                         console.warn("Loaded invalid gems value, resetting to 0.");
                         gems = 0;
                     }

                    // Load Language with validation
                    currentLanguage = savedState.language || 'ru';
                    if (!translations.greetingBase[currentLanguage]) {
                        console.warn(`Loaded unsupported language "${currentLanguage}", falling back to 'ru'.`);
                        currentLanguage = 'ru';
                    }

                    // Load Upgrades with validation
                    if (Array.isArray(savedState.upgrades)) {
                        upgrades.forEach(upgrade => {
                            const savedUpgrade = savedState.upgrades.find(su => su.id === upgrade.id);
                            const loadedLevel = Number(savedUpgrade?.level); // Use optional chaining
                            upgrade.currentLevel = (Number.isFinite(loadedLevel) && loadedLevel >= 0) ? loadedLevel : 0;
                        });
                    } else {
                         console.warn("Saved upgrades data is missing or not an array. Resetting levels.");
                         upgrades.forEach(upgrade => upgrade.currentLevel = 0);
                    }

                    // Load Skins with validation
                    ownedSkins = Array.isArray(savedState.ownedSkins) ? savedState.ownedSkins : ['default'];
                    if (!ownedSkins.includes('default')) { // Ensure default is always owned
                        ownedSkins.push('default');
                        console.warn("Default skin was missing from saved ownedSkins, added it back.");
                    }
                    // Validate active skin exists and is owned
                    activeSkinId = (typeof savedState.activeSkinId === 'string' && ownedSkins.includes(savedState.activeSkinId))
                                   ? savedState.activeSkinId
                                   : 'default';
                    if (savedState.activeSkinId && !ownedSkins.includes(savedState.activeSkinId)){
                        console.warn(`Saved active skin '${savedState.activeSkinId}' is not owned. Resetting to default.`);
                    }

                    recalculateBonuses(); // Recalculate based on loaded upgrade levels
                    console.log("Game state loaded and parsed successfully.");
                    loadedSuccessfully = true;

                } catch (parseError) {
                    console.error("Error parsing loaded game state:", parseError, "Raw value:", value);
                    showTemporaryNotification(translations.readError?.[currentLanguage] || "Error reading save data!", "error");
                    resetGameData(); // Reset if parsing fails
                }
            } else {
                console.log("No saved game state found in CloudStorage. Starting fresh.");
                resetGameData(); // Reset to defaults if no data found
            }

            // --- Post-Load Setup ---
            checkReferralAndBonus(); // Check for referral/bonus link parameters
            applyTranslations();     // Apply loaded or default language
            updateDisplay();         // Update UI elements
            applyCauldronSkin();     // Apply loaded or default skin
            // Reset visual state unrelated to saved progress
            visualLiquidLevel = LIQUID_MIN_LEVEL;
            lastInteractionTime = Date.now();
            updateLiquidLevelVisual(visualLiquidLevel); // Set initial liquid level visual

            if (!loadedSuccessfully && !error && !value) {
                 // Optional: Show a welcome message for first-time players
                 // showTemporaryNotification("Добро пожаловать в Лабораторию!", "info");
            }
        });
    }

    function resetGameData() {
        console.log("Resetting game data to defaults.");
        isBlocked = false;
        warningCount = 0;
        if (cauldronElement) cauldronElement.classList.remove('blocked-cauldron');
        essence = 0;
        gems = 0;
        upgrades.forEach(upgrade => upgrade.currentLevel = 0);
        currentLanguage = 'ru'; // Or detect browser language if preferred
        ownedSkins = ['default'];
        activeSkinId = 'default';
        recalculateBonuses();
        visualLiquidLevel = LIQUID_MIN_LEVEL;
        lastInteractionTime = Date.now();
        // Note: applyTranslations, updateDisplay, applyCauldronSkin, updateLiquidLevelVisual
        // should be called *after* resetGameData in the calling context (like in loadGame error handling)
    }


    // --- Функция уведомлений ---
    function showTemporaryNotification(message, type = "info") {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        // Force reflow to enable transition
        void notification.offsetWidth;

        // Animate in
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.bottom = '80px'; // Move up to final position
        });

        // Animate out and remove
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.bottom = '70px'; // Move down slightly on fade out
            setTimeout(() => {
                if (notification.parentNode) {
                     notification.remove();
                }
            }, 500); // Wait for fade out transition (0.5s)
        }, 2500); // Notification visible duration
    }


    // --- Первоначальная инициализация ---
    loadGame(); // Load game state on start


    // --- Автосохранение и обработчики событий ---
    const autoSaveInterval = setInterval(saveGame, 15000); // Save every 15 seconds

    // Save before the page unloads (best effort)
    window.addEventListener('beforeunload', saveGame);

    // Save when the app loses visibility (e.g., user switches tabs/apps)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            saveGame();
        }
    });

    // Save when Telegram instructs the app state might change
    if (tg?.onEvent) {
        tg.onEvent('viewportChanged', (event) => {
            // Save when the viewport becomes stable after resizing/opening keyboard etc.
             if (event.isStateStable) {
                 console.log("Viewport stable, triggering save.");
                 saveGame();
            }
        });
         // Potentially save on other events like 'themeChanged' if needed
         // tg.onEvent('themeChanged', saveGame);
    }

}); // Конец DOMContentLoaded