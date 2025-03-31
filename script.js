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
    try {
        clickSound = new Audio('click.mp3'); // Укажите путь к вашему файлу
        clickSound.preload = 'auto'; // Попросить браузер предзагрузить
        clickSound.load(); // Начать загрузку
        console.log("Звук клика инициализирован.");
    } catch (error) {
        console.error("Не удалось инициализировать звук клика:", error);
        isSoundEnabled = false; // Отключаем звук, если не смогли создать Audio объект
    }

    // --- Объект с переводами ---
    const translations = {
        // ... (все переводы, включая звук и скины) ...
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
    const upgrades = [ /* ... без изменений ... */ ];

    // --- Определения скинов ---
    const availableSkins = [ /* ... без изменений ... */ ];

    // --- Функции для пузырьков ---
    function createBubble() { /* ... без изменений ... */ }
    // --- Функция обновления визуала жидкости и пузырьков ---
    function updateLiquidLevelVisual(percentage) { /* ... без изменений ... */ }

    // --- Общая функция обновления UI ---
    function updateDisplay() { /* ... без изменений ... */ }
    // --- Функция форматирования чисел ---
    function formatNumber(num) { /* ... без изменений ... */ }
    // --- Функция для отображения "+N" при клике ---
    function showClickFeedback(amount, type = 'essence') { /* ... без изменений ... */ }

    // --- Логика клика по котлу (с воспроизведением звука) ---
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

                 // --- Воспроизведение звука клика ---
                 if (clickSound && isSoundEnabled) {
                     try {
                         clickSound.volume = soundVolume;
                         clickSound.currentTime = 0;
                         const playPromise = clickSound.play();
                         if (playPromise !== undefined) {
                             playPromise.catch(error => {
                                 console.warn("Не удалось воспроизвести звук клика (возможно, нужно взаимодействие):", error);
                             });
                         }
                     } catch (err) {
                         console.error("Ошибка при воспроизведении звука клика:", err);
                     }
                 }

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
    setInterval(() => { /* ... без изменений ... */ }, 100);
    // --- Интервал для уменьшения уровня жидкости ---
    setInterval(() => { /* ... без изменений ... */ }, LIQUID_UPDATE_INTERVAL);

    // --- Логика улучшений ---
    function calculateCost(upgrade) { /* ... без изменений ... */ }
    function renderUpgrades() { /* ... без изменений ... */ }
    function buyUpgrade(upgradeId) { /* ... без изменений ... */ }
    function recalculateBonuses() { /* ... без изменений ... */ }

    // --- Открытие/Закрытие панелей ---
    if (openUpgradesBtn && upgradesPanel) { /* ... без изменений ... */ }
    if (closeUpgradesBtn && upgradesPanel) { /* ... без изменений ... */ }
    if (settingsBtn && settingsPanel) { /* ... без изменений ... */ }
    if (closeSettingsBtn && settingsPanel) { /* ... без изменений ... */ }
    if (settingsPanel) { /* ... без изменений ... */ }
    if (shopBtn && shopPanel) { /* ... без изменений ... */ }
    if (closeShopBtn && shopPanel) { /* ... без изменений ... */ }

    // --- Логика Настроек ---
    function openSettings() { /* ... без изменений ... */ }
    function closeSettings() { /* ... без изменений ... */ }
    function closeUpgrades() { /* ... без изменений ... */ }
    function closeShop() { /* ... без изменений ... */ }
    function setLanguage(lang) { /* ... без изменений ... */ }
    function applyTranslations() { /* ... обновлена для звука ... */
        if (userGreetingElement) {
            let greeting = translations.greetingBase[currentLanguage] || "Лаборатория";
            if (userName) {
                greeting += ` ${userName}`;
            }
            userGreetingElement.textContent = greeting;
        }
        // Общие элементы с data-translate
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.dataset.translate;
            // Исключаем элементы внутри настроек звука, т.к. обновляем их отдельно
            if (!element.closest('.setting-item')) {
                const translation = translations[key]?.[currentLanguage];
                if (translation) {
                    element.textContent = translation;
                } else {
                    console.warn(`Ключ перевода "${key}" не найден для языка "${currentLanguage}".`);
                }
            }
        });
         // Текст "в сек"
         const perSecTextNode = perSecondDisplayDiv?.lastChild;
         if (perSecTextNode && perSecTextNode.nodeType === Node.TEXT_NODE) {
             perSecTextNode.textContent = ` ${translations.perSec?.[currentLanguage] || 'в сек'}`;
         }
        // Обновляем текст для настроек звука
        document.querySelectorAll('.setting-item label[data-translate]').forEach(element => {
             const key = element.dataset.translate;
             const translation = translations[key]?.[currentLanguage];
             if (translation) {
                 element.textContent = translation;
             } else {
                 console.warn(`Ключ перевода (label) "${key}" не найден для языка "${currentLanguage}".`);
             }
        });
        document.querySelectorAll('.settings-content h3[data-translate]').forEach(element => {
             const key = element.dataset.translate;
             const translation = translations[key]?.[currentLanguage];
             if (translation) {
                 element.textContent = translation;
             } else {
                  console.warn(`Ключ перевода (h3) "${key}" не найден для языка "${currentLanguage}".`);
             }
        });
    }
    function updateActiveLangButton() { /* ... без изменений ... */ }
    if (languageOptionsContainer) { /* ... без изменений ... */ }

    // --- Логика настроек звука ---
    function applySoundSettingsToUI() { /* ... без изменений ... */ }
    if (soundToggleCheckbox) { /* ... без изменений ... */ }
    if (volumeSlider) { /* ... без изменений ... */ }

    // --- Логика магазина ---
    function openShop() { /* ... без изменений ... */ }
    function closeShop() { /* ... без изменений ... */ }
    function renderSkins() { /* ... без изменений ... */ }
    function handleSkinAction(skinId) { /* ... без изменений ... */ }
    function buySkin(skinId) { /* ... без изменений ... */ }
    function setActiveSkin(skinId) { /* ... без изменений ... */ }
    function applyCauldronSkin() { /* ... без изменений ... */ }

    // --- Логика реферальной системы ---
    function checkReferralAndBonus() { /* ... без изменений ... */ }
    function handleNewReferral(inviterId) { /* ... без изменений ... */ }
    function handleBonusClaim(referralId) { /* ... без изменений ... */ }
    function cleanBonusUrlParam() { /* ... без изменений ... */ }
    if (inviteFriendBtn) { /* ... без изменений ... */ }

    // --- Сохранение/Загрузка (С ЛОГИРОВАНИЕМ) ---
    function saveGame() {
        console.log("[Save] Попытка сохранения..."); // Лог: Начало сохранения
        if (!tg?.CloudStorage) {
            console.warn("[Save] CloudStorage недоступен. Сохранение отменено."); // Лог: API недоступен
            return;
        }

        // --- Валидация данных перед сохранением ---
        let isValid = true;
        if (!Number.isFinite(essence) || essence < 0) { console.warn(`[Save Validation] Некорректная эссенция (${essence}). Сброс на 0.`); essence = 0; isValid = false; }
        if (!Number.isFinite(gems) || gems < 0) { console.warn(`[Save Validation] Некорректные кристаллы (${gems}). Сброс на 0.`); gems = 0; isValid = false; }
        if (typeof isSoundEnabled !== 'boolean') { console.warn(`[Save Validation] Некорректный флаг звука (${isSoundEnabled}). Установка true.`); isSoundEnabled = true; isValid = false; }
        if (!Number.isFinite(soundVolume) || soundVolume < 0 || soundVolume > 1) { console.warn(`[Save Validation] Некорректная громкость (${soundVolume}). Сброс на 0.5.`); soundVolume = 0.5; isValid = false; }
        if (!Array.isArray(ownedSkins) || !ownedSkins.includes('default')) { console.warn(`[Save Validation] Некорректный список скинов (${JSON.stringify(ownedSkins)}). Сброс.`); ownedSkins = ['default']; if (activeSkinId !== 'default') activeSkinId = 'default'; isValid = false; }
        if (typeof activeSkinId !== 'string' || !ownedSkins.includes(activeSkinId)) { console.warn(`[Save Validation] Некорректный активный скин (${activeSkinId}). Сброс на default.`); activeSkinId = 'default'; isValid = false; }
        upgrades.forEach(upg => {
            if (!Number.isFinite(upg.currentLevel) || upg.currentLevel < 0) {
                console.warn(`[Save Validation] Некорректный уровень для апгрейда ${upg.id} (${upg.currentLevel}). Сброс на 0.`);
                upg.currentLevel = 0;
                isValid = false;
            }
        });
        if (!isValid) { console.warn("[Save] Обнаружены некорректные данные, значения были скорректированы перед сохранением."); }
        // --- Конец валидации ---

        const gameState = {
            essence: essence,
            gems: gems,
            upgrades: upgrades.map(u => ({ id: u.id, level: u.currentLevel })),
            language: currentLanguage,
            ownedSkins: ownedSkins,
            activeSkinId: activeSkinId,
            isSoundEnabled: isSoundEnabled,
            soundVolume: soundVolume
        };

        try {
            const gameStateString = JSON.stringify(gameState);
            console.log(`[Save] Данные для сохранения (JSON ${gameStateString.length} байт):`, gameState); // Лог: Что сохраняем

            tg.CloudStorage.setItem('gameState', gameStateString, (error, success) => {
                if (error) {
                    console.error("[Save Callback] Ошибка при сохранении в CloudStorage:", error); // Лог: Ошибка от API
                } else if (success) {
                    console.log("[Save Callback] Состояние успешно сохранено в CloudStorage."); // Лог: Успех от API
                } else {
                    console.warn("[Save Callback] Сохранение завершилось без ошибки, но и без флага успеха.");
                }
            });
        } catch (stringifyError) {
             console.error("[Save] Критическая ошибка при JSON.stringify:", stringifyError, "Объект gameState:", gameState); // Лог: Ошибка сериализации
             showTemporaryNotification(translations.saveCritError?.[currentLanguage] || "Критическая ошибка сохранения!", "error");
        }
    }

    function loadGame() {
        console.log("[Load] Попытка загрузки..."); // Лог: Начало загрузки
        isBlocked = false; // Сброс блока при загрузке
        warningCount = 0;
        if (cauldronElement) cauldronElement.classList.remove('blocked-cauldron');

        if (!tg?.CloudStorage) {
            console.error("[Load] CloudStorage недоступен. Новая игра.");
            resetGameData();
            applyTranslations(); updateDisplay(); applyCauldronSkin(); applySoundSettingsToUI(); updateLiquidLevelVisual(LIQUID_MIN_LEVEL);
            showTemporaryNotification(translations.loadErrorStartNew?.[currentLanguage] || "Ошибка загрузки прогресса. Новая игра.", "warning");
            return;
        }

        tg.CloudStorage.getItem('gameState', (error, value) => {
            console.log("[Load Callback] Получен ответ от CloudStorage.getItem."); // Лог: Получили ответ
            let loadedSuccessfully = false;
            if (error) {
                console.error("[Load Callback] Ошибка при получении данных из CloudStorage:", error); // Лог: Ошибка от API
                showTemporaryNotification(translations.loadError?.[currentLanguage] || "Ошибка загрузки прогресса!", "error");
                resetGameData(); // Сброс при ошибке загрузки
            } else if (value) {
                console.log(`[Load Callback] Получены данные из CloudStorage (${value.length} байт). Попытка парсинга...`); // Лог: Есть данные
                try {
                    const savedState = JSON.parse(value);
                    console.log("[Load Parse] Данные успешно распарсены:", savedState); // Лог: Успешный парсинг

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

                    recalculateBonuses(); // Пересчитать бонусы после загрузки апгрейдов
                    console.log("[Load] Состояние игры успешно загружено и применено.");
                    loadedSuccessfully = true;
                } catch (parseError) {
                    console.error("[Load Parse] Ошибка при парсинге JSON из CloudStorage:", parseError, "Полученное значение:", value); // Лог: Ошибка парсинга
                    showTemporaryNotification(translations.readError?.[currentLanguage] || "Ошибка чтения данных сохранения!", "error");
                    resetGameData(); // Сброс при ошибке парсинга
                }
            } else {
                console.log("[Load Callback] Сохраненное состояние не найдено в CloudStorage. Новая игра."); // Лог: Нет данных
                resetGameData(); // Сброс, если нет данных
            }

            // --- Пост-загрузочная настройка (выполняется всегда после попытки загрузки) ---
            checkReferralAndBonus(); applyTranslations(); updateDisplay(); applyCauldronSkin(); applySoundSettingsToUI();
            visualLiquidLevel = LIQUID_MIN_LEVEL; lastInteractionTime = Date.now(); updateLiquidLevelVisual(visualLiquidLevel);
            console.log(`[Load] Загрузка завершена. Essence: ${essence}, Gems: ${gems}, Active Skin: ${activeSkinId}, Sound: ${isSoundEnabled}, Volume: ${soundVolume}`); // Итоговый лог состояния
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
    function showTemporaryNotification(message, type = "info") { /* ... без изменений ... */ }

    // --- Первоначальная инициализация ---
    loadGame(); // Загрузка игры

    // --- Автосохранение и обработчики событий ---
    const autoSaveInterval = setInterval(saveGame, 15000); // Сохранять каждые 15 секунд
    window.addEventListener('beforeunload', saveGame); // Попытка сохранить при закрытии
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { saveGame(); } }); // Сохранить при сворачивании
    if (tg?.onEvent) { tg.onEvent('viewportChanged', (event) => { if (event.isStateStable) { console.log("Viewport stable, triggering save."); saveGame(); } }); }

}); // Конец DOMContentLoaded