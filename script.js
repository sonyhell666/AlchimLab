```javascript
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

    // --- Инициализация звука (ИСПРАВЛЕН ПУТЬ) ---
    let clickSound = null;
    const soundFilePath = 'click.mp3'; // <- Указываем путь без лишних папок
    try {
        console.log(`[Sound] Попытка загрузки звука: ${soundFilePath}`);
        clickSound = new Audio(soundFilePath);
        clickSound.preload = 'auto';
        clickSound.load();
        // Тестовое воспроизведение тихого звука для проверки загрузки (может быть заблокировано браузером)
        clickSound.volume = 0.01;
        clickSound.play().then(() => {
            console.log("[Sound] Звук клика успешно инициализирован и может воспроизводиться.");
            clickSound.pause(); // Остановить тестовое воспроизведение
            clickSound.currentTime = 0; // Сбросить на начало
        }).catch(error => {
            if (error.name === 'NotAllowedError') {
                console.warn("[Sound] Воспроизведение звука заблокировано браузером до взаимодействия пользователя. Звук инициализирован, но потребует клика для первого воспроизведения.");
            } else if (error.name === 'NotSupportedError'){
                console.error(`[Sound] Формат аудио (${soundFilePath}) не поддерживается браузером.`);
                isSoundEnabled = false; // Отключаем звук если формат не поддерживается
            }
            else {
                console.error(`[Sound] Не удалось воспроизвести тестовый звук (${error.name}):`, error.message);
                // Можно отключить звук совсем, если есть критическая ошибка загрузки
                // isSoundEnabled = false;
            }
        });
    } catch (error) {
        console.error("[Sound] Критическая ошибка при создании Audio объекта:", error);
        isSoundEnabled = false; // Отключаем звук, если не смогли создать Audio объект
    }

    // --- Объект с переводами ---
    const translations = {
        // ... (все переводы, как были раньше) ...
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
    ];

    // --- Функции для пузырьков ---
    function createBubble() { if (!bubblesContainer) return; const b = document.createElement('div'); b.classList.add('bubble'); const s = Math.random() * 8 + 6; const d = Math.random() * 2.5 + 3; const l = Math.random() * 1.5; const h = Math.random() * 90 + 5; b.style.width = `${s}px`; b.style.height = `${s}px`; b.style.left = `${h}%`; b.style.animationDuration = `${d}s`; b.style.animationDelay = `${l}s`; bubblesContainer.appendChild(b); setTimeout(() => { b.remove(); }, (d + l) * 1000 + 100); }
    setInterval(createBubble, 500);

    // --- Функция обновления визуала жидкости и пузырьков ---
    function updateLiquidLevelVisual(percentage) { const l = Math.max(LIQUID_MIN_LEVEL, Math.min(LIQUID_MAX_LEVEL, percentage)); if (cauldronElement) { cauldronElement.style.setProperty('--liquid-level', `${l}%`); if(bubblesContainer) { bubblesContainer.style.height = `${l}%`; } } else { console.warn("Элемент колбы не найден для обновления жидкости."); } }

    // --- Общая функция обновления UI ---
    function updateDisplay() { if (essenceCountElement) essenceCountElement.textContent = formatNumber(Math.floor(essence)); if (essencePerSecondElement && perSecondDisplayDiv) { essencePerSecondElement.textContent = formatNumber(essencePerSecond); perSecondDisplayDiv.style.display = essencePerSecond > 0 ? 'block' : 'none'; } if (gemCountElement) gemCountElement.textContent = formatNumber(gems); if (shopPanel && !shopPanel.classList.contains('hidden') && shopGemCountElement) { shopGemCountElement.textContent = formatNumber(gems); } if (upgradesPanel && !upgradesPanel.classList.contains('hidden')) renderUpgrades(); }

    // --- Функция форматирования чисел ---
    function formatNumber(num) { if (isNaN(num) || !Number.isFinite(num)) { console.warn("formatNumber получено некорректное значение:", num); return "ERR"; } const abbreviations = ["", "K", "M", "B", "T", "q", "Q", "s", "S", "O", "N", "d", "U"]; if (num < 1000) return num.toString(); let i = 0; while (num >= 1000 && i < abbreviations.length - 1) { num /= 1000; i++; } const formattedNum = num % 1 === 0 ? num.toString() : num.toFixed(1); return formattedNum + abbreviations[i]; }

    // --- Функция для отображения "+N" при клике ---
    function showClickFeedback(amount, type = 'essence') { if (isBlocked || !clickFeedbackContainer) return; const f = document.createElement('div'); f.className = 'click-feedback'; const fmt = formatNumber(amount); if (type === 'gem') { const svgIconHtml = `<span class="gem-icon" style="display:inline-flex; vertical-align: middle; margin-left: 4px;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" fill="var(--gem-color)"><path d="M12 1.68l-8 8.42L12 22.32l8-8.42L12 1.68zm0 2.1l5.95 6.27L12 18.54l-5.95-6.27L12 3.78z M6.4 10.1L12 16.1l5.6-6H6.4z"></path></svg></span>`; f.innerHTML = `+${fmt}${svgIconHtml}`; f.style.fontSize = '1.3em'; f.style.fontWeight = 'bold'; f.style.color = 'var(--gem-color)'; } else { f.textContent = `+${fmt} 🧪`; f.style.color = 'var(--accent-color)'; } const ox = Math.random() * 60 - 30; const oy = (type === 'gem') ? (Math.random() * 20 + 15) : (Math.random() * 20 - 10); f.style.left = `calc(50% + ${ox}px)`; f.style.top = `calc(50% + ${oy}px)`; clickFeedbackContainer.appendChild(f); setTimeout(() => { f.remove(); }, 950); }

    // --- Логика клика по котлу ---
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
                                 // Не выводим ошибку в консоль, если это просто блокировка автовоспроизведения
                                 if (error.name !== 'NotAllowedError') {
                                     console.warn("Не удалось воспроизвести звук клика:", error);
                                 }
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
    setInterval(() => { if (!isBlocked && essencePerSecond > 0 && Number.isFinite(essencePerSecond)) { const essenceToAdd = essencePerSecond / 10; if (Number.isFinite(essenceToAdd)) { essence += essenceToAdd; updateDisplay(); } else { console.warn("Рассчитана некорректная порция эссенции в секунду."); } } }, 100);

    // --- Интервал для уменьшения уровня жидкости ---
    setInterval(() => { const currentTime = Date.now(); if (currentTime - lastInteractionTime > IDLE_TIMEOUT && visualLiquidLevel > LIQUID_MIN_LEVEL) { visualLiquidLevel -= LIQUID_DECAY_RATE; visualLiquidLevel = Math.max(visualLiquidLevel, LIQUID_MIN_LEVEL); } updateLiquidLevelVisual(visualLiquidLevel); }, LIQUID_UPDATE_INTERVAL);

    // --- Логика улучшений ---
    function calculateCost(upgrade) { if (!upgrade || typeof upgrade.baseCost !== 'number' || typeof upgrade.costMultiplier !== 'number' || typeof upgrade.currentLevel !== 'number') { console.error("Некорректные данные улучшения для расчета стоимости:", upgrade); return Infinity; } return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.currentLevel)); }
    function renderUpgrades() { if (!upgradesListElement) { console.error("Элемент списка улучшений не найден!"); return; } upgradesListElement.innerHTML = ''; upgrades.sort((a, b) => (a.requiredEssence || 0) - (b.requiredEssence || 0)); if (upgrades.length === 0) { upgradesListElement.innerHTML = `<li><p>Улучшения не определены.</p></li>`; return; } const currentEssenceFloored = Math.floor(essence); upgrades.forEach(upgrade => { const cost = calculateCost(upgrade); if (!Number.isFinite(cost)) { console.error("Пропуск рендера улучшения с неверной стоимостью:", upgrade.id); return; } const required = upgrade.requiredEssence || 0; const isLocked = currentEssenceFloored < required; const canAfford = currentEssenceFloored >= cost; const listItem = document.createElement('li'); if (isLocked) { listItem.classList.add('locked'); } else if (!canAfford) { listItem.classList.add('cannot-afford'); } const translatedName = translations[upgrade.nameKey]?.[currentLanguage] || upgrade.nameKey; const translatedDesc = translations[upgrade.descKey]?.[currentLanguage] || upgrade.descKey; const buyButtonText = translations.buyButton?.[currentLanguage] || "Купить"; const requirementPrefix = translations.requirementPrefix?.[currentLanguage] || "Нужно"; const requirementInfoPrefix = translations.requirementInfoPrefix?.[currentLanguage] || "Требуется"; let buttonText = buyButtonText; let isButtonDisabled = false; if (isLocked) { isButtonDisabled = true; buttonText = `${requirementPrefix} ${formatNumber(required)} 🧪`; } else if (!canAfford) { isButtonDisabled = true; } listItem.innerHTML = `<div class="upgrade-info"><h3>${translatedName} (Ур. ${upgrade.currentLevel})</h3><p>${translatedDesc}</p><p class="upgrade-cost">Цена: ${formatNumber(cost)} 🧪</p>${isLocked ? `<p class="requirement-info">${requirementInfoPrefix}: ${formatNumber(required)} 🧪</p>` : ''}</div><button class="buy-upgrade-btn" data-upgrade-id="${upgrade.id}">${buttonText}</button>`; const buyButton = listItem.querySelector('.buy-upgrade-btn'); if (buyButton) { buyButton.disabled = isButtonDisabled; if (!isLocked) { buyButton.addEventListener('click', (event) => { event.stopPropagation(); if (!buyButton.disabled) { buyUpgrade(upgrade.id); } }); } } upgradesListElement.appendChild(listItem); }); }
    function buyUpgrade(upgradeId) { if (isBlocked) { showTemporaryNotification(translations.actionBlocked?.[currentLanguage] || "Действие заблокировано.", "error"); return; } const upgrade = upgrades.find(up => up.id === upgradeId); if (!upgrade) { console.error("Улучшение не найдено:", upgradeId); return; } const required = upgrade.requiredEssence || 0; if (Math.floor(essence) < required) { showTemporaryNotification(`${translations.needMoreEssence?.[currentLanguage] || "Нужно больше эссенции!"} ${formatNumber(required)} 🧪`, "warning"); if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('warning'); return; } const cost = calculateCost(upgrade); if (!Number.isFinite(cost)) { showTemporaryNotification(translations.invalidCostError?.[currentLanguage] || "Ошибка: Неверная стоимость улучшения!", "error"); return; } if (essence >= cost) { essence -= cost; upgrade.currentLevel++; recalculateBonuses(); updateDisplay(); renderUpgrades(); saveGame(); if (tg?.HapticFeedback) { tg.HapticFeedback.impactOccurred('light'); } } else { showTemporaryNotification(translations.notEnoughEssence?.[currentLanguage] || "Недостаточно эссенции!", "warning"); if (tg?.HapticFeedback) { tg.HapticFeedback.notificationOccurred('warning'); } } }
    function recalculateBonuses() { essencePerClick = 1; essencePerSecond = 0; upgrades.forEach(upgrade => { if (upgrade.currentLevel > 0 && Number.isFinite(upgrade.value) && typeof upgrade.type === 'string') { if (upgrade.type === 'click') { essencePerClick += upgrade.value * upgrade.currentLevel; } else if (upgrade.type === 'auto') { essencePerSecond += upgrade.value * upgrade.currentLevel; } } else if (upgrade.currentLevel > 0) { console.warn("Улучшение имеет уровень > 0, но неверные данные бонуса:", upgrade); } }); if (!Number.isFinite(essencePerClick) || essencePerClick < 1) { console.error("Пересчет привел к неверному essencePerClick:", essencePerClick); essencePerClick = 1; } if (!Number.isFinite(essencePerSecond) || essencePerSecond < 0) { console.error("Пересчет привел к неверному essencePerSecond:", essencePerSecond); essencePerSecond = 0; } }

    // --- Открытие/Закрытие панелей ---
    function closeSettings() { if (settingsPanel) settingsPanel.classList.add('hidden'); }
    function closeUpgrades() { if (upgradesPanel) upgradesPanel.classList.add('hidden'); }
    function closeShop() { if (shopPanel) shopPanel.classList.add('hidden'); }
    if (openUpgradesBtn && upgradesPanel) { openUpgradesBtn.addEventListener('click', () => { renderUpgrades(); upgradesPanel.classList.remove('hidden'); closeSettings(); closeShop(); }); } else { console.error("Кнопка открытия улучшений или панель не найдена."); }
    if (closeUpgradesBtn && upgradesPanel) { closeUpgradesBtn.addEventListener('click', closeUpgrades); } else { console.error("Кнопка закрытия улучшений или панель не найдена."); }
    if (settingsBtn && settingsPanel) { settingsBtn.addEventListener('click', () => { applySoundSettingsToUI(); updateActiveLangButton(); settingsPanel.classList.remove('hidden'); closeUpgrades(); closeShop(); }); } else { console.error("Кнопка настроек или панель не найдена."); }
    if (closeSettingsBtn && settingsPanel) { closeSettingsBtn.addEventListener('click', closeSettings); } else { console.error("Кнопка закрытия настроек или панель не найдена."); }
    if (settingsPanel) { settingsPanel.addEventListener('click', (e) => { if (e.target === settingsPanel) closeSettings(); }); }
    if (shopBtn && shopPanel) { shopBtn.addEventListener('click', () => { if (shopGemCountElement) shopGemCountElement.textContent = formatNumber(gems); renderSkins(); shopPanel.classList.remove('hidden'); closeUpgrades(); closeSettings(); if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light'); }); } else { console.error("Кнопка магазина или панель не найдена."); }
    if (closeShopBtn && shopPanel) { closeShopBtn.addEventListener('click', closeShop); } else { console.error("Кнопка закрытия магазина или панель не найдена."); }

    // --- Логика Настроек ---
    function setLanguage(lang) { if (translations.greetingBase[lang]) { currentLanguage = lang; console.log(`Язык изменен на: ${currentLanguage}`); applyTranslations(); updateActiveLangButton(); saveGame(); if (upgradesPanel && !upgradesPanel.classList.contains('hidden')) { renderUpgrades(); } if (shopPanel && !shopPanel.classList.contains('hidden')) { renderSkins(); } } else { console.warn(`Язык "${lang}" не найден в переводах.`); } }
    function applyTranslations() { if (userGreetingElement) { let greeting = translations.greetingBase[currentLanguage] || "Лаборатория"; if (userName) { greeting += ` ${userName}`; } userGreetingElement.textContent = greeting; } document.querySelectorAll('[data-translate]').forEach(element => { const key = element.dataset.translate; if (!element.closest('.setting-item')) { const translation = translations[key]?.[currentLanguage]; if (translation) { element.textContent = translation; } else { console.warn(`Ключ перевода "${key}" не найден для языка "${currentLanguage}".`); } } }); const perSecTextNode = perSecondDisplayDiv?.lastChild; if (perSecTextNode && perSecTextNode.nodeType === Node.TEXT_NODE) { perSecTextNode.textContent = ` ${translations.perSec?.[currentLanguage] || 'в сек'}`; } document.querySelectorAll('.setting-item label[data-translate]').forEach(element => { const key = element.dataset.translate; const translation = translations[key]?.[currentLanguage]; if (translation) { element.textContent = translation; } else { console.warn(`Ключ перевода (label) "${key}" не найден для языка "${currentLanguage}".`); } }); document.querySelectorAll('.settings-content h3[data-translate]').forEach(element => { const key = element.dataset.translate; const translation = translations[key]?.[currentLanguage]; if (translation) { element.textContent = translation; } else { console.warn(`Ключ перевода (h3) "${key}" не найден для языка "${currentLanguage}".`); } }); }
    function updateActiveLangButton() { if (!languageOptionsContainer) return; languageOptionsContainer.querySelectorAll('.lang-btn').forEach(button => { button.classList.toggle('active', button.dataset.lang === currentLanguage); }); }
    if (languageOptionsContainer) { languageOptionsContainer.addEventListener('click', (event) => { if (event.target.classList.contains('lang-btn')) { const lang = event.target.dataset.lang; if (lang && lang !== currentLanguage) { setLanguage(lang); } } }); } else { console.error("Контейнер выбора языка не найден."); }

    // --- Логика настроек звука ---
    function applySoundSettingsToUI() { if (soundToggleCheckbox && volumeSlider && volumeValueDisplay) { soundToggleCheckbox.checked = isSoundEnabled; volumeSlider.value = Math.round(soundVolume * 100); volumeValueDisplay.textContent = `${volumeSlider.value}%`; volumeSlider.disabled = !isSoundEnabled; volumeValueDisplay.classList.toggle('disabled', !isSoundEnabled); } else { console.warn("Элементы настроек звука не найдены в DOM."); } }
    if (soundToggleCheckbox) { soundToggleCheckbox.addEventListener('change', () => { isSoundEnabled = soundToggleCheckbox.checked; console.log(`Звук ${isSoundEnabled ? 'включен' : 'выключен'}`); applySoundSettingsToUI(); saveGame(); if(tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light'); }); }
    if (volumeSlider) { volumeSlider.addEventListener('input', () => { const volumeValue = parseInt(volumeSlider.value, 10); soundVolume = volumeValue / 100; if (volumeValueDisplay) { volumeValueDisplay.textContent = `${volumeValue}%`; } }); volumeSlider.addEventListener('change', () => { console.log(`Громкость установлена на: ${Math.round(soundVolume * 100)}%`); saveGame(); if (clickSound && isSoundEnabled) { try { clickSound.volume = soundVolume; clickSound.currentTime = 0; clickSound.play().catch(e => {}); } catch (err) {} } }); }

    // --- Логика магазина ---
    function renderSkins() { if (!skinsListElement) { console.error("Элемент списка скинов не найден!"); return; } skinsListElement.innerHTML = ''; availableSkins.forEach(skin => { const isOwned = ownedSkins.includes(skin.id); const isActive = activeSkinId === skin.id; const canAfford = gems >= skin.cost; const listItem = document.createElement('li'); listItem.dataset.skinId = skin.id; if (isActive) { listItem.classList.add('active-skin'); } const translatedName = translations[skin.nameKey]?.[currentLanguage] || skin.nameKey; const buyButtonText = translations.buyButton?.[currentLanguage] || "Купить"; const selectButtonText = translations.selectButton?.[currentLanguage] || "Выбрать"; const selectedButtonText = translations.selectedButton?.[currentLanguage] || "Выбрано"; const gemIconSvg = `<span class="gem-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em"><path d="M12 1.68l-8 8.42L12 22.32l8-8.42L12 1.68zm0 2.1l5.95 6.27L12 18.54l-5.95-6.27L12 3.78z M6.4 10.1L12 16.1l5.6-6H6.4z"/></svg></span>`; let actionButtonHtml = ''; if (isActive) { actionButtonHtml = `<button class="skin-action-btn selected-btn" disabled>${selectedButtonText}</button>`; } else if (isOwned) { actionButtonHtml = `<button class="skin-action-btn select-btn">${selectButtonText}</button>`; } else { actionButtonHtml = `<button class="skin-action-btn buy-btn" ${!canAfford ? 'disabled' : ''}>${buyButtonText}</button>`; } listItem.innerHTML = `<div class="skin-preview ${skin.cssClass || ''}"></div><div class="skin-info"><h3>${translatedName}</h3>${skin.cost > 0 ? `<p class="skin-cost">${gemIconSvg} ${formatNumber(skin.cost)}</p>` : ''}</div>${actionButtonHtml}`; const actionButton = listItem.querySelector('.skin-action-btn'); if (actionButton && !actionButton.classList.contains('selected-btn')) { actionButton.addEventListener('click', () => { if (!actionButton.disabled) { handleSkinAction(skin.id); } }); } skinsListElement.appendChild(listItem); }); }
    function handleSkinAction(skinId) { if (isBlocked) { showTemporaryNotification(translations.actionBlocked?.[currentLanguage] || "Действие заблокировано.", "error"); return; } const skin = availableSkins.find(s => s.id === skinId); if (!skin) return; const isOwned = ownedSkins.includes(skinId); if (isOwned) { if (activeSkinId !== skinId) { setActiveSkin(skinId); } } else { buySkin(skinId); } }
    function buySkin(skinId) { const skin = availableSkins.find(s => s.id === skinId); if (!skin || ownedSkins.includes(skinId) || skin.cost <= 0) return; if (gems >= skin.cost) { gems -= skin.cost; ownedSkins.push(skinId); console.log(`Скин куплен: ${skinId}. Осталось кристаллов: ${gems}`); showTemporaryNotification(translations.skinPurchaseSuccess?.[currentLanguage] || "Скин куплен!", "success"); if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success'); updateDisplay(); renderSkins(); setActiveSkin(skinId); } else { console.log(`Недостаточно кристаллов для покупки скина: ${skinId}. Нужно: ${skin.cost}, Есть: ${gems}`); showTemporaryNotification(translations.notEnoughGems?.[currentLanguage] || "Недостаточно кристаллов!", "warning"); if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('warning'); } }
    function setActiveSkin(skinId) { if (!ownedSkins.includes(skinId)) { console.error(`Попытка активировать не купленный скин: ${skinId}`); return; } if (activeSkinId !== skinId) { activeSkinId = skinId; console.log(`Активный скин установлен: ${skinId}`); applyCauldronSkin(); if (shopPanel && !shopPanel.classList.contains('hidden')) { renderSkins(); } saveGame(); showTemporaryNotification(translations.skinSelected?.[currentLanguage] || "Скин выбран!", "info"); if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light'); } }
    function applyCauldronSkin() { if (!cauldronElement) return; const activeSkinDefinition = availableSkins.find(s => s.id === activeSkinId); const skinClass = activeSkinDefinition?.cssClass; availableSkins.forEach(skin => { if (skin.cssClass) { cauldronElement.classList.remove(skin.cssClass); } }); if (skinClass) { cauldronElement.classList.add(skinClass); console.log(`Применен класс скина: ${skinClass} к колбе.`); } else { console.warn(`Не найден CSS класс для активного скина ID: ${activeSkinId}. Используется вид по умолчанию.`); } }

    // --- Логика реферальной системы ---
    function checkReferralAndBonus() { const startParam = tg.initDataUnsafe?.start_param; const urlParams = new URLSearchParams(window.location.search); const claimBonusParam = urlParams.get('claimBonus'); console.log("Start Param:", startParam, "Claim Bonus Param:", claimBonusParam); if (claimBonusParam) { handleBonusClaim(claimBonusParam); } else if (startParam && !isNaN(parseInt(startParam))) { handleNewReferral(startParam); } }
    function handleNewReferral(inviterId) { tg.CloudStorage.getItem('gameState', (error, value) => { if (error) { console.error("Ошибка CloudStorage при проверке реферала:", error); return; } let isConsideredNew = true; if (value) { try { const savedState = JSON.parse(value); const thresholdEssence = 100; const significantUpgrades = savedState.upgrades?.some(u => u.level > 0 && u.id !== 'click1' && u.id !== 'auto1'); if ((savedState.essence && savedState.essence > thresholdEssence) || significantUpgrades || (savedState.gems && savedState.gems > 0)) { isConsideredNew = false; console.log("Проверка реферала: Пользователь не считается новым по прогрессу."); } else { console.log("Проверка реферала: Пользователь считается новым (или существующий с минимальным прогрессом)."); } } catch (parseError) { console.error("Ошибка парсинга gameState при проверке реферала", parseError); } } else { console.log("Проверка реферала: gameState не найден, пользователь новый."); } if (isConsideredNew) { console.log(`Обработка реферала: Пользователь новый или с мин. прогрессом. ID пригласившего: ${inviterId}. Отправка данных боту...`); if (tg.sendData) { const dataToSend = JSON.stringify({ type: 'referral_registered', inviter_id: inviterId, referred_user_id: tg.initDataUnsafe?.user?.id }); try { tg.sendData(dataToSend); console.log("Данные регистрации реферала отправлены:", dataToSend); showTemporaryNotification(translations.welcomeReferral?.[currentLanguage] || "Добро пожаловать! Ваш пригласитель получит бонус.", "success"); saveGame(); } catch (sendError) { console.error("Ошибка отправки данных реферала через tg.sendData:", sendError); showTemporaryNotification(translations.referralRegErrorBot?.[currentLanguage] || "Не удалось зарегистрировать приглашение (ошибка бота).", "error"); } } else { console.error("tg.sendData недоступен для отправки информации о реферале."); showTemporaryNotification(translations.referralRegErrorFunc?.[currentLanguage] || "Не удалось зарегистрировать приглашение (функция недоступна).", "error"); } } else { console.log("Пользователь не новый, регистрация реферала пропущена."); } }); }
    function handleBonusClaim(referralId) { console.log(`Попытка получения бонуса за ID реферала: ${referralId}`); if (!referralId || typeof referralId !== 'string' || referralId.trim() === '') { console.warn("Неверный ID реферала для получения бонуса."); cleanBonusUrlParam(); return; } tg.CloudStorage.getItem('claimed_bonuses', (error, value) => { if (error) { console.error("Ошибка CloudStorage при получении полученных бонусов:", error); showTemporaryNotification(translations.bonusCheckError?.[currentLanguage] || "Ошибка проверки бонуса!", "error"); cleanBonusUrlParam(); return; } let claimedBonuses = []; if (value) { try { claimedBonuses = JSON.parse(value); if (!Array.isArray(claimedBonuses)) { console.warn("Данные полученных бонусов не массив, сброс."); claimedBonuses = []; } } catch (parseError) { console.error("Ошибка парсинга claimed_bonuses:", parseError); claimedBonuses = []; } } if (claimedBonuses.includes(referralId)) { console.log(`Бонус за ID реферала ${referralId} уже был получен.`); showTemporaryNotification(translations.bonusAlreadyClaimed?.[currentLanguage] || "Бонус уже получен.", "warning"); } else { const bonusAmount = 50000; if (Number.isFinite(essence)) { essence += bonusAmount; console.log(`Бонус успешно получен за ${referralId}! Добавлено ${bonusAmount} эссенции.`); const reasonText = translations.bonusReasonFriend?.[currentLanguage] || "за приглашенного друга!"; showTemporaryNotification(`+${formatNumber(bonusAmount)} 🧪 ${reasonText}`, "success"); updateDisplay(); claimedBonuses.push(referralId); tg.CloudStorage.setItem('claimed_bonuses', JSON.stringify(claimedBonuses), (setError) => { if (setError) { console.error("Ошибка CloudStorage при сохранении обновленных полученных бонусов:", setError); } else { console.log("Список полученных бонусов обновлен в CloudStorage."); saveGame(); } }); } else { console.error("Не могу добавить бонус, текущая эссенция не является числом:", essence); showTemporaryNotification(translations.bonusAddError?.[currentLanguage] || "Ошибка добавления бонуса!", "error"); } } cleanBonusUrlParam(); }); }
    function cleanBonusUrlParam() { try { const currentUrl = new URL(window.location); if (currentUrl.searchParams.has('claimBonus')) { currentUrl.searchParams.delete('claimBonus'); window.history.replaceState({}, document.title, currentUrl.toString()); console.log("Параметр URL claimBonus очищен."); } } catch (urlError) { console.warn("Не удалось очистить параметр URL claimBonus:", urlError); } }
    if (inviteFriendBtn) { inviteFriendBtn.addEventListener('click', () => { if (tg?.initDataUnsafe?.user?.id) { const botUsername = 'AlchimLaboratory_Bot'; const appName = 'AlchimLab'; const userId = tg.initDataUnsafe.user.id; const referralLink = `https://t.me/${botUsername}/${appName}?start=${userId}`; const shareText = translations.shareText?.[currentLanguage] || 'Присоединяйся к моей Алхимической Лаборатории в Telegram! 🧪⚗️ Кликай и создавай эликсиры!'; const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`; tg.openTelegramLink(shareUrl); console.log('Сгенерирована ссылка для репоста:', referralLink); if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light'); } else { console.error('Невозможно сгенерировать ссылку-приглашение: ID пользователя или контекст Telegram WebApp недоступен.'); showTemporaryNotification(translations.inviteLinkError?.[currentLanguage] || 'Не удалось создать ссылку-приглашение.', 'error'); if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('error'); } }); } else { console.error("Кнопка приглашения друга не найдена."); }

    // --- Сохранение/Загрузка (С ЛОГИРОВАНИЕМ и ПРОВЕРКОЙ CloudStorage) ---
    function saveGame() {
        // --- НАЧАЛО ИЗМЕНЕНИЯ: Проверка CloudStorage ---
        if (!tg?.CloudStorage || !tg.CloudStorage.setItem) { // Проверяем и сам объект, и метод
            // console.log("[Save] CloudStorage недоступен в этом окружении. Сохранение пропускается."); // Можно раскомментировать для отладки
            return; // Просто выходим, если сохранять некуда
        }
        // --- КОНЕЦ ИЗМЕНЕНИЯ ---

        console.log("[Save] Попытка сохранения...");
        // --- Валидация данных перед сохранением ---
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
        console.log("[Load] Попытка загрузки...");
        isBlocked = false; warningCount = 0;
        if (cauldronElement) cauldronElement.classList.remove('blocked-cauldron');

        // --- НАЧАЛО ИЗМЕНЕНИЯ: Проверка CloudStorage ---
        if (!tg?.CloudStorage || !tg.CloudStorage.getItem) { // Проверяем и сам объект, и метод
            console.warn("[Load] CloudStorage недоступен в этом окружении. Запуск новой игры без загрузки.");
            resetGameData(); // Сброс к дефолту
            // Применяем дефолтные настройки и обновляем UI
            applyTranslations();
            updateDisplay();
            applyCauldronSkin(); // Применить дефолтный скин
            applySoundSettingsToUI(); // Применить дефолтные настройки звука
            updateLiquidLevelVisual(LIQUID_MIN_LEVEL);
             showTemporaryNotification("Прогресс не будет сохранен в этой версии Telegram.", "warning");
            return; // Выходим, т.к. загружать нечего/некуда
        }
        // --- КОНЕЦ ИЗМЕНЕНИЯ ---

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