// Файл: script.js
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
    // --- Новые DOM элементы для звука ---
    const soundToggleCheckbox = document.getElementById('sound-toggle-checkbox');
    const volumeSlider = document.getElementById('volume-slider');
    const volumeValueDisplay = document.getElementById('volume-value-display');


    // --- Игровые переменные (состояние) ---
    let essence = 0;
    let essencePerClick = 1;
    let essencePerSecond = 0;
    let gems = 0;
    let ownedSkins = ['default']; // Игрок всегда владеет скином по умолчанию
    let activeSkinId = 'default'; // Активный скин по умолчанию
    let isSoundEnabled = true;  // Звук включен по умолчанию
    let soundVolume = 0.5;    // Громкость 50% по умолчанию (значение от 0 до 1)
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

    // --- Инициализация звука ---
    let clickSound = null;
    const soundFilePath = 'click.mp3'; // <- Путь без лишних папок
    try {
        console.log(`[Sound] Попытка загрузки звука: ${soundFilePath}`);
        clickSound = new Audio(soundFilePath);
        clickSound.preload = 'auto';
        clickSound.load();
        clickSound.volume = 0.01; // Тихо для теста
        clickSound.play().then(() => {
            console.log("[Sound] Звук клика успешно инициализирован и может воспроизводиться.");
            clickSound.pause();
            clickSound.currentTime = 0;
        }).catch(error => {
            if (error.name === 'NotAllowedError') {
                console.warn("[Sound] Воспроизведение звука заблокировано браузером до взаимодействия пользователя.");
            } else if (error.name === 'NotSupportedError'){
                console.error(`[Sound] Формат аудио (${soundFilePath}) не поддерживается браузером.`);
                isSoundEnabled = false;
            } else {
                console.error(`[Sound] Не удалось воспроизвести тестовый звук (${error.name}):`, error.message);
            }
        });
    } catch (error) {
        console.error("[Sound] Критическая ошибка при создании Audio объекта:", error);
        isSoundEnabled = false;
    }

    // --- Объект с переводами ---
    const translations = { /* ... все переводы ... */
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
        soundTitle: { ru: "Звук", en: "Sound" },
        soundEnableLabel: { ru: "Включить звук:", en: "Enable Sound:" },
        volumeLabel: { ru: "Громкость:", en: "Volume:" },
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
    const upgrades = [ /* ... как были раньше ... */
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
    const availableSkins = [ /* ... как были раньше ... */
        { id: 'default', nameKey: 'skin_default_name', cost: 0, cssClass: 'skin-default' },
        { id: 'gold', nameKey: 'skin_gold_name', cost: 15, cssClass: 'skin-gold' },
        { id: 'crystal', nameKey: 'skin_crystal_name', cost: 50, cssClass: 'skin-crystal' },
        { id: 'obsidian', nameKey: 'skin_obsidian_name', cost: 100, cssClass: 'skin-obsidian' },
    ];

    // --- Остальные функции (createBubble, updateLiquidLevelVisual, updateDisplay, formatNumber, showClickFeedback, click handler, intervals, upgrades logic, panel logic, settings logic, sound logic, shop logic, referral logic) ---
    // ... (весь остальной код функций без изменений по сравнению с предыдущим ответом) ...
    // ... (createBubble) ...
    // ... (updateLiquidLevelVisual) ...
    // ... (updateDisplay) ...
    // ... (formatNumber) ...
    // ... (showClickFeedback) ...
    // ... (cauldronElement click listener) ...
    // ... (setInterval for auto-click) ...
    // ... (setInterval for liquid decay) ...
    // ... (calculateCost, renderUpgrades, buyUpgrade, recalculateBonuses) ...
    // ... (closeSettings, closeUpgrades, closeShop) ...
    // ... (event listeners for open/close buttons) ...
    // ... (setLanguage, applyTranslations, updateActiveLangButton, languageOptionsContainer listener) ...
    // ... (applySoundSettingsToUI, soundToggleCheckbox listener, volumeSlider listeners) ...
    // ... (renderSkins, handleSkinAction, buySkin, setActiveSkin, applyCauldronSkin) ...
    // ... (checkReferralAndBonus, handleNewReferral, handleBonusClaim, cleanBonusUrlParam, inviteFriendBtn listener) ...

    // --- Сохранение/Загрузка (С УДАЛЕННОЙ ОШИБКОЙ и ПРОВЕРКОЙ CloudStorage) ---
    function saveGame() {
        // --- Проверка CloudStorage ---
        if (!tg?.CloudStorage || !tg.CloudStorage.setItem) {
            // console.log("[Save] CloudStorage недоступен. Сохранение пропускается.");
            return;
        }
        // --- Конец проверки ---

        console.log("[Save] Попытка сохранения...");
        // --- Валидация данных ---
        let isValid = true;
        if (!Number.isFinite(essence) || essence < 0) { console.warn(`[Save Validation] Некорректная эссенция (${essence}). Сброс на 0.`); essence = 0; isValid = false; }
        if (!Number.isFinite(gems) || gems < 0) { console.warn(`[Save Validation] Некорректные кристаллы (${gems}). Сброс на 0.`); gems = 0; isValid = false; }
        if (typeof isSoundEnabled !== 'boolean') { console.warn(`[Save Validation] Некорректный флаг звука (${isSoundEnabled}). Установка true.`); isSoundEnabled = true; isValid = false; }
        if (!Number.isFinite(soundVolume) || soundVolume < 0 || soundVolume > 1) { console.warn(`[Save Validation] Некорректная громкость (${soundVolume}). Сброс на 0.5.`); soundVolume = 0.5; isValid = false; }
        if (!Array.isArray(ownedSkins) || !ownedSkins.includes('default')) { console.warn(`[Save Validation] Некорректный список скинов (${JSON.stringify(ownedSkins)}). Сброс.`); ownedSkins = ['default']; if (activeSkinId !== 'default') activeSkinId = 'default'; isValid = false; }
        if (typeof activeSkinId !== 'string' || !ownedSkins.includes(activeSkinId)) { console.warn(`[Save Validation] Некорректный активный скин (${activeSkinId}). Сброс на default.`); activeSkinId = 'default'; isValid = false; }
        upgrades.forEach(upg => { if (!Number.isFinite(upg.currentLevel) || upg.currentLevel < 0) { console.warn(`[Save Validation] Некорректный уровень для апгрейда ${upg.id} (${upg.currentLevel}). Сброс на 0.`); upg.currentLevel = 0; isValid = false; } });
        if (!isValid) { console.warn("[Save] Обнаружены некорректные данные, значения были скорректированы перед сохранением."); }
        // --- Конец валидации ---

        const gameState = {
            essence: essence, gems: gems, upgrades: upgrades.map(u => ({ id: u.id, level: u.currentLevel })),
            language: currentLanguage, ownedSkins: ownedSkins, activeSkinId: activeSkinId,
            isSoundEnabled: isSoundEnabled, soundVolume: soundVolume
        };

        try {
            const gameStateString = JSON.stringify(gameState);
            console.log(`[Save] Данные для сохранения (JSON ${gameStateString.length} байт):`, gameState);

            tg.CloudStorage.setItem('gameState', gameStateString, (error, success) => {
                if (error) { console.error("[Save Callback] Ошибка при сохранении в CloudStorage:", error);
                } else if (success) { console.log("[Save Callback] Состояние успешно сохранено в CloudStorage.");
                } else { console.warn("[Save Callback] Сохранение завершилось без ошибки, но и без флага успеха."); }
            });
        } catch (stringifyError) {
             console.error("[Save] Критическая ошибка при JSON.stringify:", stringifyError, "Объект gameState:", gameState);
             showTemporaryNotification(translations.saveCritError?.[currentLanguage] || "Критическая ошибка сохранения!", "error");
        }
    }

    function loadGame() {
        console.log("[Load] Попытка загрузки..."); // Лог: Начало загрузки
        isBlocked = false; warningCount = 0; // Сброс блока при загрузке
        if (cauldronElement) cauldronElement.classList.remove('blocked-cauldron');

        // --- ИСПРАВЛЕНИЕ: Удалено ошибочное слово "Попытка" ---

        // --- Проверка CloudStorage ---
        if (!tg?.CloudStorage || !tg.CloudStorage.getItem) {
            console.warn("[Load] CloudStorage недоступен в этом окружении. Запуск новой игры без загрузки.");
            resetGameData();
            applyTranslations(); updateDisplay(); applyCauldronSkin(); applySoundSettingsToUI(); updateLiquidLevelVisual(LIQUID_MIN_LEVEL);
            showTemporaryNotification("Прогресс не будет сохранен в этой версии Telegram.", "warning");
            return;
        }
        // --- Конец проверки ---

        tg.CloudStorage.getItem('gameState', (error, value) => {
            console.log("[Load Callback] Получен ответ от CloudStorage.getItem.");
            let loadedSuccessfully = false;
            if (error) {
                console.error("[Load Callback] Ошибка при получении данных из CloudStorage:", error);
                showTemporaryNotification(translations.loadError?.[currentLanguage] || "Ошибка загрузки прогресса!", "error");
                resetGameData();
            } else if (value) {
                console.log(`[Load Callback] Получены данные из CloudStorage (${value.length} байт). Попытка парсинга...`);
                try {
                    const savedState = JSON.parse(value);
                    console.log("[Load Parse] Данные успешно распарсены:", savedState);
                    // --- Загрузка с валидацией ---
                    essence = Number(savedState.essence) || 0; if (!Number.isFinite(essence) || essence < 0) { console.warn("[Load Validation] Некорректная эссенция, сброс."); essence = 0; }
                    gems = Number(savedState.gems) || 0; if (!Number.isFinite(gems) || gems < 0) { console.warn("[Load Validation] Некорректные кристаллы, сброс."); gems = 0; }
                    currentLanguage = savedState.language || 'ru'; if (!translations.greetingBase[currentLanguage]) { console.warn(`[Load Validation] Неподдерживаемый язык "${currentLanguage}", сброс на 'ru'.`); currentLanguage = 'ru'; }
                    if (Array.isArray(savedState.upgrades)) { upgrades.forEach(upgrade => { const savedUpgrade = savedState.upgrades.find(su => su.id === upgrade.id); const loadedLevel = Number(savedUpgrade?.level); upgrade.currentLevel = (Number.isFinite(loadedLevel) && loadedLevel >= 0) ? loadedLevel : 0; if (upgrade.currentLevel !== 0 && !(Number.isFinite(loadedLevel) && loadedLevel >= 0)) { console.warn(`[Load Validation] Некорректный уровень апгрейда ${upgrade.id}, сброс.`);}}); } else { console.warn("[Load Validation] Данные апгрейдов отсутствуют/некорректны, сброс уровней."); upgrades.forEach(upgrade => upgrade.currentLevel = 0); }
                    ownedSkins = Array.isArray(savedState.ownedSkins) ? savedState.ownedSkins : ['default']; if (!ownedSkins.includes('default')) { ownedSkins.push('default'); console.warn("[Load Validation] Отсутствовал скин 'default', добавлен."); }
                    activeSkinId = (typeof savedState.activeSkinId === 'string' && ownedSkins.includes(savedState.activeSkinId)) ? savedState.activeSkinId : 'default'; if (savedState.activeSkinId && !ownedSkins.includes(savedState.activeSkinId)) { console.warn(`[Load Validation] Активный скин '${savedState.activeSkinId}' не найден в купленных, сброс.`); }
                    isSoundEnabled = typeof savedState.isSoundEnabled === 'boolean' ? savedState.isSoundEnabled : true;
                    let loadedVolume = Number(savedState.soundVolume); soundVolume = (Number.isFinite(loadedVolume) && loadedVolume >= 0 && loadedVolume <= 1) ? loadedVolume : 0.5; if (!(Number.isFinite(loadedVolume) && loadedVolume >= 0 && loadedVolume <= 1)) { console.warn(`[Load Validation] Некорректная громкость ${savedState.soundVolume}, сброс.`);}
                    // --- Конец загрузки с валидацией ---
                    recalculateBonuses();
                    console.log("[Load] Состояние игры успешно загружено и применено.");
                    loadedSuccessfully = true;
                } catch (parseError) {
                    console.error("[Load Parse] Ошибка при парсинге JSON из CloudStorage:", parseError, "Полученное значение:", value);
                    showTemporaryNotification(translations.readError?.[currentLanguage] || "Ошибка чтения данных сохранения!", "error");
                    resetGameData();
                }
            } else {
                console.log("[Load Callback] Сохраненное состояние не найдено в CloudStorage. Новая игра.");
                resetGameData();
            }
            // --- Пост-загрузочная настройка ---
            checkReferralAndBonus(); applyTranslations(); updateDisplay(); applyCauldronSkin(); applySoundSettingsToUI();
            visualLiquidLevel = LIQUID_MIN_LEVEL; lastInteractionTime = Date.now(); updateLiquidLevelVisual(visualLiquidLevel);
            console.log(`[Load] Загрузка завершена. Essence: ${essence}, Gems: ${gems}, Active Skin: ${activeSkinId}, Sound: ${isSoundEnabled}, Volume: ${soundVolume}`);
            if (!loadedSuccessfully && !error && !value) { console.log("[Load] Это первый запуск."); }
        });
    }


    function resetGameData() {
        console.log("Сброс данных игры к значениям по умолчанию.");
        isBlocked = false; warningCount = 0;
        if (cauldronElement) cauldronElement.classList.remove('blocked-cauldron');
        essence = 0; gems = 0;
        upgrades.forEach(upgrade => upgrade.currentLevel = 0);
        currentLanguage = 'ru';
        ownedSkins = ['default']; activeSkinId = 'default';
        isSoundEnabled = true; soundVolume = 0.5;
        recalculateBonuses();
        visualLiquidLevel = LIQUID_MIN_LEVEL; lastInteractionTime = Date.now();
    }

    // --- Функция уведомлений ---
    function showTemporaryNotification(message, type = "info") { const notification = document.createElement('div'); notification.className = `notification ${type}`; notification.textContent = message; document.body.appendChild(notification); void notification.offsetWidth; requestAnimationFrame(() => { notification.style.opacity = '1'; notification.style.bottom = '80px'; }); setTimeout(() => { notification.style.opacity = '0'; notification.style.bottom = '70px'; setTimeout(() => { if (notification.parentNode) { notification.remove(); } }, 500); }, 2500); }

    // --- Первоначальная инициализация ---
    loadGame(); // Загрузка игры

    // --- Автосохранение и обработчики событий ---
    const autoSaveInterval = setInterval(saveGame, 15000); // Сохранять каждые 15 секунд
    window.addEventListener('beforeunload', saveGame); // Попытка сохранить при закрытии
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { saveGame(); } }); // Сохранить при сворачивании
    if (tg?.onEvent) { tg.onEvent('viewportChanged', (event) => { if (event.isStateStable) { console.log("Viewport stable, triggering save."); saveGame(); } }); }

}); // Конец DOMContentLoaded