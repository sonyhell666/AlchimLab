// Файл: script.js
// Версия без функционала звука, но с магазином и обводкой скинов
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
    // Элементы звука удалены

    // --- Игровые переменные (состояние) ---
    let essence = 0;
    let essencePerClick = 1;
    let essencePerSecond = 0;
    let gems = 0;
    let ownedSkins = ['default'];
    let activeSkinId = 'default';
    // Переменные звука удалены
    const GEM_AWARD_CHANCE = 0.03;
    const GEMS_PER_AWARD = 1;
    let currentLanguage = 'ru';
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

    // Инициализация звука удалена

    // --- Объект с переводами ---
    const translations = {
        // Переводы для звука удалены
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
        shopTitle: { ru: "Магазин", en: "Shop" },
        yourGems: { ru: "Ваши кристаллы:", en: "Your Gems:" },
        selectButton: { ru: "Выбрать", en: "Select" },
        selectedButton: { ru: "Выбрано", en: "Selected" },
        notEnoughGems: { ru: "Недостаточно кристаллов!", en: "Not enough gems!" },
        skinPurchaseSuccess: { ru: "Скин куплен!", en: "Skin purchased!" },
        skinSelected: { ru: "Скин выбран!", en: "Skin selected!" },
        skin_default_name: { ru: "Стандартная колба", en: "Standard Flask" },
        skin_gold_name: { ru: "Золотая колба", en: "Golden Flask" },
        skin_crystal_name: { ru: "Хрустальный сосуд", en: "Crystal Vial" },
        skin_obsidian_name: { ru: "Обсидиановая реторта", en: "Obsidian Retort" },
        // ... (остальные переводы улучшений) ...
        upgrade_click1_name: { ru: "Улучшенный рецепт", en: "Improved Recipe" },
        upgrade_click1_desc: { ru: "+1 к клику", en: "+1 per click" },
        upgrade_auto1_name: { ru: "Гомункул-Помощник", en: "Homunculus Helper" },
        upgrade_auto1_desc: { ru: "+1 в секунду", en: "+1 per second" },
        // ... и т.д.
    };

    // --- Определения улучшений ---
    const upgrades = [ /* ... как были раньше ... */ ];

    // --- Определения скинов ---
    const availableSkins = [ /* ... как были раньше ... */ ];

    // --- Функции для пузырьков ---
    function createBubble() { /* ... */ }
    setInterval(createBubble, 500);
    // --- Функция обновления визуала жидкости ---
    function updateLiquidLevelVisual(percentage) { /* ... */ }
    // --- Общая функция обновления UI ---
    function updateDisplay() { /* ... */ }
    // --- Функция форматирования чисел ---
    function formatNumber(num) { /* ... */ }
    // --- Функция для отображения "+N" при клике ---
    function showClickFeedback(amount, type = 'essence') { /* ... */ }

    // --- Логика клика по котлу (БЕЗ ЗВУКА) ---
     if (cauldronElement) {
         cauldronElement.addEventListener('click', () => {
             const currentTime = Date.now();
             if (tg?.HapticFeedback) { tg.HapticFeedback.impactOccurred('light'); }

             if (isBlocked) {
                 showTemporaryNotification(translations.autoclickerBlocked?.[currentLanguage] || "Автокликер обнаружен! Клики заблокированы.", "error");
                 return;
             }

             if (currentTime - lastClickTime >= MIN_CLICK_INTERVAL) {
                 warningCount = 0;
                 lastInteractionTime = currentTime;

                 let clickAmount = essencePerClick;
                 if (Number.isFinite(clickAmount)) {
                     essence += clickAmount;
                     if (clickFeedbackContainer) showClickFeedback(clickAmount, 'essence');
                 } else {
                     console.error("Некорректное значение essencePerClick:", essencePerClick);
                 }

                 if (Math.random() < GEM_AWARD_CHANCE) {
                     gems += GEMS_PER_AWARD;
                     console.log(`Получен ${GEMS_PER_AWARD} кристалл(ов)! Всего: ${gems}`);
                     if (clickFeedbackContainer) showClickFeedback(GEMS_PER_AWARD, 'gem');
                     if (tg?.HapticFeedback) { tg.HapticFeedback.impactOccurred('medium'); }
                 }

                 visualLiquidLevel += LIQUID_INCREASE_PER_CLICK;
                 visualLiquidLevel = Math.min(visualLiquidLevel, LIQUID_MAX_LEVEL);
                 updateLiquidLevelVisual(visualLiquidLevel);
                 updateDisplay();

                 // Звук удален

                 // Visual feedback for click
                 cauldronElement.style.transform = 'scale(0.95)';
                 setTimeout(() => { if (cauldronElement) cauldronElement.style.transform = 'scale(1)'; }, 80);

                 lastClickTime = currentTime;

             } else {
                 warningCount++;
                 lastInteractionTime = currentTime;
                 console.warn(`Слишком быстрый клик, предупреждение ${warningCount}/${MAX_WARNINGS}`);
                 showTemporaryNotification(`${translations.tooFastClick?.[currentLanguage] || "Слишком быстро!"} (${warningCount}/${MAX_WARNINGS})`, "warning");
                 if (tg?.HapticFeedback) { tg.HapticFeedback.impactOccurred('medium'); }

                 if (warningCount >= MAX_WARNINGS) {
                     isBlocked = true;
                     console.error("Обнаружен и заблокирован автокликер.");
                     showTemporaryNotification(translations.autoclickerBlocked?.[currentLanguage] || "Автокликер обнаружен! Клики заблокированы.", "error");
                     if (tg?.HapticFeedback) { tg.HapticFeedback.notificationOccurred('error'); }
                     if (cauldronElement) cauldronElement.classList.add('blocked-cauldron');
                 }
             }
         });
     } else {
         console.error("Элемент колбы не найден!");
     }

    // --- Логика авто-клика ---
    setInterval(() => { /* ... */ }, 100);
    // --- Интервал для уменьшения уровня жидкости ---
    setInterval(() => { /* ... */ }, LIQUID_UPDATE_INTERVAL);

    // --- Логика улучшений ---
    function calculateCost(upgrade) { /* ... */ }
    function renderUpgrades() { /* ... */ }
    function buyUpgrade(upgradeId) { /* ... */ }
    function recalculateBonuses() { /* ... */ }

    // --- Открытие/Закрытие панелей ---
    function closeSettings() { /* ... */ }
    function closeUpgrades() { /* ... */ }
    function closeShop() { /* ... */ }
    if (openUpgradesBtn && upgradesPanel) { /* ... */ }
    if (closeUpgradesBtn && upgradesPanel) { /* ... */ }
    // Обработчик для settingsBtn (без applySoundSettingsToUI)
    if (settingsBtn && settingsPanel) { settingsBtn.addEventListener('click', () => { updateActiveLangButton(); settingsPanel.classList.remove('hidden'); closeUpgrades(); closeShop(); }); } else { console.error("Кнопка настроек или панель не найдена."); }
    if (closeSettingsBtn && settingsPanel) { /* ... */ }
    if (settingsPanel) { /* ... */ }
    if (shopBtn && shopPanel) { /* ... */ }
    if (closeShopBtn && shopPanel) { /* ... */ }

    // --- Логика Настроек ---
    function setLanguage(lang) { /* ... */ }
    function applyTranslations() { /* ... (версия без обновления элементов звука) */
        if (userGreetingElement) { let greeting = translations.greetingBase[currentLanguage] || "Лаборатория"; if (userName) { greeting += ` ${userName}`; } userGreetingElement.textContent = greeting; }
        document.querySelectorAll('[data-translate]').forEach(element => { const key = element.dataset.translate; const translation = translations[key]?.[currentLanguage]; if (translation) { element.textContent = translation; } else { console.warn(`Ключ перевода "${key}" не найден для языка "${currentLanguage}".`); } });
        const perSecTextNode = perSecondDisplayDiv?.lastChild; if (perSecTextNode && perSecTextNode.nodeType === Node.TEXT_NODE) { perSecTextNode.textContent = ` ${translations.perSec?.[currentLanguage] || 'в сек'}`; }
        // Удалено обновление текста для настроек звука
    }
    function updateActiveLangButton() { /* ... */ }
    if (languageOptionsContainer) { /* ... */ }

    // --- Логика настроек звука УДАЛЕНА ---
    // function applySoundSettingsToUI() { ... }
    // event listeners for soundToggleCheckbox, volumeSlider удалены

    // --- Логика магазина ---
    function renderSkins() { /* ... */ }
    function handleSkinAction(skinId) { /* ... */ }
    function buySkin(skinId) { /* ... */ }
    function setActiveSkin(skinId) { /* ... */ }
    function applyCauldronSkin() { /* ... */ }

    // --- Логика реферальной системы ---
    function checkReferralAndBonus() { /* ... */ }
    function handleNewReferral(inviterId) { /* ... */ }
    function handleBonusClaim(referralId) { /* ... */ }
    function cleanBonusUrlParam() { /* ... */ }
    if (inviteFriendBtn) { /* ... */ }

    // --- Сохранение/Загрузка (БЕЗ НАСТРОЕК ЗВУКА, с проверкой CloudStorage) ---
    function saveGame() {
        if (!tg?.CloudStorage || !tg.CloudStorage.setItem) {
            // console.log("[Save] CloudStorage недоступен. Сохранение пропускается.");
            return;
        }
        console.log("[Save] Попытка сохранения...");
        // Валидация удалена для звука
        let isValid = true;
        // ... (валидация essence, gems, skins, upgrades) ...
        if (!isValid) { console.warn("[Save] Обнаружены некорректные данные, значения были скорректированы."); }

        const gameState = {
            essence: essence, gems: gems, upgrades: upgrades.map(u => ({ id: u.id, level: u.currentLevel })),
            language: currentLanguage, ownedSkins: ownedSkins, activeSkinId: activeSkinId
            // Поля звука удалены
        };
        try {
            const gameStateString = JSON.stringify(gameState);
            console.log(`[Save] Данные для сохранения (JSON ${gameStateString.length} байт):`, gameState);
            tg.CloudStorage.setItem('gameState', gameStateString, (error, success) => {
                if (error) { console.error("[Save Callback] Ошибка при сохранении:", error);
                } else if (success) { console.log("[Save Callback] Состояние сохранено.");
                } else { console.warn("[Save Callback] Сохранение без ошибки и успеха."); }
            });
        } catch (stringifyError) {
             console.error("[Save] Ошибка JSON.stringify:", stringifyError);
             showTemporaryNotification(translations.saveCritError?.[currentLanguage] || "Критическая ошибка сохранения!", "error");
        }
    }

    function loadGame() {
        console.log("[Load] Попытка загрузки...");
        isBlocked = false; warningCount = 0;
        if (cauldronElement) cauldronElement.classList.remove('blocked-cauldron');

        if (!tg?.CloudStorage || !tg.CloudStorage.getItem) {
            console.warn("[Load] CloudStorage недоступен. Новая игра.");
            resetGameData();
            applyTranslations(); updateDisplay(); applyCauldronSkin();
            // applySoundSettingsToUI() удален
            updateLiquidLevelVisual(LIQUID_MIN_LEVEL);
            showTemporaryNotification("Прогресс не будет сохранен.", "warning");
            return;
        }

        tg.CloudStorage.getItem('gameState', (error, value) => {
            console.log("[Load Callback] Получен ответ от CloudStorage.");
            let loadedSuccessfully = false;
            let needsReset = false;

            if (error) {
                console.error("[Load Callback] Ошибка получения данных:", error);
                showTemporaryNotification(translations.loadError?.[currentLanguage] || "Ошибка загрузки!", "error");
                needsReset = true;
            } else if (value) {
                console.log(`[Load Callback] Получены данные (${value.length} байт). Парсинг...`);
                try {
                    const savedState = JSON.parse(value);
                    console.log("[Load Parse] Распарсено:", savedState);
                    // --- Загрузка БЕЗ звука ---
                    essence = Number(savedState.essence) || 0; if (!Number.isFinite(essence) || essence < 0) { console.warn("[Load Validation] Некорр. эссенция, сброс."); essence = 0; }
                    gems = Number(savedState.gems) || 0; if (!Number.isFinite(gems) || gems < 0) { console.warn("[Load Validation] Некорр. кристаллы, сброс."); gems = 0; }
                    currentLanguage = savedState.language || 'ru'; if (!translations.greetingBase[currentLanguage]) { console.warn(`[Load Validation] Неподд. язык "${currentLanguage}", сброс.`); currentLanguage = 'ru'; }
                    if (Array.isArray(savedState.upgrades)) { upgrades.forEach(upgrade => { const savedUpgrade = savedState.upgrades.find(su => su.id === upgrade.id); const loadedLevel = Number(savedUpgrade?.level); upgrade.currentLevel = (Number.isFinite(loadedLevel) && loadedLevel >= 0) ? loadedLevel : 0; if (upgrade.currentLevel !== 0 && !(Number.isFinite(loadedLevel) && loadedLevel >= 0)) { console.warn(`[Load Validation] Некорр. ур. апгрейда ${upgrade.id}, сброс.`);}}); } else { console.warn("[Load Validation] Данные апгрейдов некорр., сброс."); upgrades.forEach(upgrade => upgrade.currentLevel = 0); }
                    ownedSkins = Array.isArray(savedState.ownedSkins) ? savedState.ownedSkins : ['default']; if (!ownedSkins.includes('default')) { ownedSkins.push('default'); console.warn("[Load Validation] Нет скина 'default', добавлен."); }
                    activeSkinId = (typeof savedState.activeSkinId === 'string' && ownedSkins.includes(savedState.activeSkinId)) ? savedState.activeSkinId : 'default'; if (savedState.activeSkinId && !ownedSkins.includes(savedState.activeSkinId)) { console.warn(`[Load Validation] Активный скин '${savedState.activeSkinId}' не куплен, сброс.`); }
                    // Загрузка звука удалена
                    // --- Конец загрузки ---
                    recalculateBonuses();
                    console.log("[Load] Состояние успешно загружено.");
                    loadedSuccessfully = true;
                } catch (parseError) {
                    console.error("[Load Parse] Ошибка парсинга JSON:", parseError);
                    showTemporaryNotification(translations.readError?.[currentLanguage] || "Ошибка чтения!", "error");
                    needsReset = true;
                }
            } else {
                console.log("[Load Callback] Состояние не найдено. Новая игра.");
                needsReset = true;
            }

            if (needsReset) {
                resetGameData();
            }

            // --- Пост-загрузочная настройка ---
            checkReferralAndBonus(); applyTranslations(); updateDisplay(); applyCauldronSkin();
            // applySoundSettingsToUI() удален
            visualLiquidLevel = LIQUID_MIN_LEVEL; lastInteractionTime = Date.now(); updateLiquidLevelVisual(visualLiquidLevel);
            console.log(`[Load] Загрузка завершена. Состояние: Essence: ${essence}, Gems: ${gems}, Active Skin: ${activeSkinId}`);

        }); // Конец колбэка getItem
    }

    function resetGameData() {
        console.log("Сброс данных к значениям по умолчанию.");
        essence = 0; gems = 0;
        upgrades.forEach(upgrade => upgrade.currentLevel = 0);
        ownedSkins = ['default']; activeSkinId = 'default';
        // Сброс звука удален
        recalculateBonuses();
    }

    // --- Функция уведомлений ---
    function showTemporaryNotification(message, type = "info") { /* ... */ }

    // --- Первоначальная инициализация ---
    loadGame();

    // --- Автосохранение и обработчики событий ---
    const autoSaveInterval = setInterval(saveGame, 15000);
    window.addEventListener('beforeunload', saveGame);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { saveGame(); } });
    if (tg?.onEvent) { tg.onEvent('viewportChanged', (event) => { if (event.isStateStable) { console.log("Viewport stable, save."); saveGame(); } }); }

}); // Конец DOMContentLoaded