// Файл: script.js
// Версия БЕЗ ЗВУКА, БЕЗ ОБВОДКИ, с исправлением ошибки CloudStorage
// Добавлено: Динамический цвет жидкости, Обводка колбы, Отладочные логи
// Исправлено: Мигание кнопок
// Упрощен конец файла для поиска SyntaxError
document.addEventListener('DOMContentLoaded', () => {
    // Инициализация Telegram Web App
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    // --- Получаем ссылки на элементы DOM ---
    const essenceCountElement = document.getElementById('essence-count');
    const cauldronElement = document.getElementById('cauldron');
    const openUpgradesBtn = document.getElementById('open-upgrades-btn');

    // !!! Отладочная проверка !!!
    console.log('DOMContentLoaded fired.');
    console.log('cauldronElement:', cauldronElement);
    console.log('essenceCountElement:', essenceCountElement);
    console.log('openUpgradesBtn:', openUpgradesBtn);
    // !!! Конец проверки !!!

    const essencePerSecondElement = document.getElementById('essence-per-second');
    const gemCountElement = document.getElementById('gem-count');
    const clickFeedbackContainer = document.getElementById('click-feedback-container');
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
    let ownedSkins = ['default'];
    let activeSkinId = 'default';
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
    if (bubblesContainer) { setInterval(createBubble, 500); } else { console.warn("Контейнер для пузырьков не найден."); }

    // --- Функция обновления визуала жидкости ---
    function updateLiquidLevelVisual(percentage) {
        const l = Math.max(LIQUID_MIN_LEVEL, Math.min(LIQUID_MAX_LEVEL, percentage));
        if (cauldronElement) {
            cauldronElement.style.setProperty('--liquid-level', `${l}%`);
            if(bubblesContainer) {
                bubblesContainer.style.height = `${l}%`;
            }
        }
    }

    // --- Функции для динамического цвета жидкости (по времени Лондона/UTC) ---
    function getLondonHour() {
        const now = new Date();
        return now.getUTCHours(); // Используем UTC
    }

    function getLiquidColorByLondonTime() {
        const hour = getLondonHour();
        const alpha = 0.35; // Установленная прозрачность

        if (hour >= 22 || hour < 5) { // Ночь (22:00 - 04:59 UTC)
            return `rgba(40, 40, 100, ${alpha})`; // Темно-синий
        } else if (hour >= 5 && hour < 7) { // Рассвет (05:00 - 06:59 UTC)
            return `rgba(255, 150, 100, ${alpha})`; // Розово-оранжевый
        } else if (hour >= 7 && hour < 11) { // Утро (07:00 - 10:59 UTC)
            return `rgba(100, 180, 220, ${alpha})`; // Светло-голубой
        } else if (hour >= 11 && hour < 17) { // День (11:00 - 16:59 UTC)
            return `rgba(220, 220, 100, ${alpha})`; // Желто-зеленый
        } else if (hour >= 17 && hour < 20) { // Закат (17:00 - 19:59 UTC)
            return `rgba(255, 120, 50, ${alpha})`; // Оранжево-красный
        } else { // Вечер (20:00 - 21:59 UTC)
            return `rgba(70, 70, 150, ${alpha})`; // Сине-фиолетовый
        }
    }

    function updateLiquidColor() {
        if (!cauldronElement) return;
        const color = getLiquidColorByLondonTime();
        cauldronElement.style.setProperty('--liquid-color', color);
    }
    // --- Конец функций для динамического цвета жидкости ---

    // --- Общая функция обновления UI ---
    function updateDisplay() {
        if (essenceCountElement) essenceCountElement.textContent = formatNumber(Math.floor(essence));
        if (essencePerSecondElement && perSecondDisplayDiv) {
            essencePerSecondElement.textContent = formatNumber(essencePerSecond);
            perSecondDisplayDiv.style.display = essencePerSecond > 0 ? 'block' : 'none';
        }
        if (gemCountElement) gemCountElement.textContent = formatNumber(gems);

        // Обновление уровня жидкости
        updateLiquidLevelVisual(visualLiquidLevel);

        // ИЗМЕНЕНО: Вызываем функции обновления состояния кнопок вместо полной перерисовки
        if (upgradesPanel && !upgradesPanel.classList.contains('hidden')) {
            updateUpgradeButtonStates(); // Обновляем только состояние кнопок улучшений
        }
        if (shopPanel && !shopPanel.classList.contains('hidden')) {
            updateSkinButtonStates(); // Обновляем состояние кнопок скинов и счетчик гемов
        }
    }

    // --- Функция форматирования чисел ---
    function formatNumber(num) { if (isNaN(num) || !Number.isFinite(num)) { console.warn("formatNumber получено некорректное значение:", num); return "ERR"; } const abbreviations = ["", "K", "M", "B", "T", "q", "Q", "s", "S", "O", "N", "d", "U"]; if (num < 1000) return num.toString(); let i = 0; while (num >= 1000 && i < abbreviations.length - 1) { num /= 1000; i++; } const formattedNum = num % 1 === 0 ? num.toString() : num.toFixed(1); return formattedNum + abbreviations[i]; }

    // --- Функция для отображения "+N" при клике ---
    function showClickFeedback(amount, type = 'essence') { if (isBlocked || !clickFeedbackContainer) return; const f = document.createElement('div'); f.className = 'click-feedback'; const fmt = formatNumber(amount); if (type === 'gem') { const svgIconHtml = `<span class="gem-icon" style="display:inline-flex; vertical-align: middle; margin-left: 4px;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" fill="var(--gem-color)"><path d="M12 1.68l-8 8.42L12 22.32l8-8.42L12 1.68zm0 2.1l5.95 6.27L12 18.54l-5.95-6.27L12 3.78z M6.4 10.1L12 16.1l5.6-6H6.4z"></path></svg></span>`; f.innerHTML = `+${fmt}${svgIconHtml}`; f.style.fontSize = '1.3em'; f.style.fontWeight = 'bold'; f.style.color = 'var(--gem-color)'; } else { f.textContent = `+${fmt} 🧪`; f.style.color = 'var(--accent-color)'; } const ox = Math.random() * 60 - 30; const oy = (type === 'gem') ? (Math.random() * 20 + 15) : (Math.random() * 20 - 10); f.style.left = `calc(50% + ${ox}px)`; f.style.top = `calc(50% + ${oy}px)`; clickFeedbackContainer.appendChild(f); setTimeout(() => { f.remove(); }, 950); }

    // --- Логика клика по котлу ---
     if (cauldronElement) {
         cauldronElement.addEventListener('click', () => {
             // !!! Отладочный лог !!!
             console.log('Cauldron click event fired!');
             // !!! Конец лога !!!

             const currentTime = Date.now();
             if (tg?.HapticFeedback) { tg.HapticFeedback.impactOccurred('light'); }
             if (isBlocked) { showTemporaryNotification(translations.autoclickerBlocked?.[currentLanguage] || "Автокликер обнаружен!", "error"); return; }
             if (currentTime - lastClickTime >= MIN_CLICK_INTERVAL) {
                 warningCount = 0; lastInteractionTime = currentTime;
                 let clickAmount = essencePerClick;
                 if (Number.isFinite(clickAmount)) { essence += clickAmount; if (clickFeedbackContainer) showClickFeedback(clickAmount, 'essence'); } else { console.error("Некорр. essencePerClick:", essencePerClick); }
                 if (Math.random() < GEM_AWARD_CHANCE) { gems += GEMS_PER_AWARD; console.log(`+${GEMS_PER_AWARD} кристалл! Всего: ${gems}`); if (clickFeedbackContainer) showClickFeedback(GEMS_PER_AWARD, 'gem'); if (tg?.HapticFeedback) { tg.HapticFeedback.impactOccurred('medium'); } }
                 visualLiquidLevel += LIQUID_INCREASE_PER_CLICK; visualLiquidLevel = Math.min(visualLiquidLevel, LIQUID_MAX_LEVEL);
                 updateDisplay(); // Обновляем UI (включая счетчики и уровень жидкости)
                 cauldronElement.style.transform = 'scale(0.95)'; setTimeout(() => { if (cauldronElement) cauldronElement.style.transform = 'scale(1)'; }, 80);
                 lastClickTime = currentTime;
             } else {
                 warningCount++; lastInteractionTime = currentTime; console.warn(`Быстрый клик ${warningCount}/${MAX_WARNINGS}`); showTemporaryNotification(`${translations.tooFastClick?.[currentLanguage] || "Слишком быстро!"} (${warningCount}/${MAX_WARNINGS})`, "warning"); if (tg?.HapticFeedback) { tg.HapticFeedback.impactOccurred('medium'); }
                 if (warningCount >= MAX_WARNINGS) { isBlocked = true; console.error("Автокликер заблокирован."); showTemporaryNotification(translations.autoclickerBlocked?.[currentLanguage] || "Автокликер обнаружен!", "error"); if (tg?.HapticFeedback) { tg.HapticFeedback.notificationOccurred('error'); } if (cauldronElement) cauldronElement.classList.add('blocked-cauldron'); }
             }
         });
         // !!! Отладочный лог !!!
         console.log('Cauldron click listener ADDED.');
         // !!! Конец лога !!!
     } else {
         // !!! Отладочный лог !!!
         console.error("Элемент колбы #cauldron не найден ДО добавления слушателя!");
         // !!! Конец лога !!!
     }

    // --- Логика авто-клика ---
    // Обернем в try-catch на всякий случай
    try {
        setInterval(() => { if (!isBlocked && essencePerSecond > 0 && Number.isFinite(essencePerSecond)) { const essenceToAdd = essencePerSecond / 10; if (Number.isFinite(essenceToAdd)) { essence += essenceToAdd; updateDisplay(); } else { console.warn("Рассчитана некорректная порция эссенции."); } } }, 100);
    } catch(e) { console.error("Ошибка в интервале автоклика:", e); }

    // --- Интервал для уменьшения уровня жидкости ---
    // Обернем в try-catch на всякий случай
    try {
        setInterval(() => {
            const currentTime = Date.now();
            if (currentTime - lastInteractionTime > IDLE_TIMEOUT && visualLiquidLevel > LIQUID_MIN_LEVEL) {
                visualLiquidLevel -= LIQUID_DECAY_RATE;
                visualLiquidLevel = Math.max(visualLiquidLevel, LIQUID_MIN_LEVEL);
                updateDisplay(); // Обновляем UI, чтобы показать изменение уровня
            }
        }, LIQUID_UPDATE_INTERVAL);
    } catch(e) { console.error("Ошибка в интервале уменьшения жидкости:", e); }

    // --- Логика улучшений ---
    function calculateCost(upgrade) { if (!upgrade || typeof upgrade.baseCost !== 'number' || typeof upgrade.costMultiplier !== 'number' || typeof upgrade.currentLevel !== 'number') { console.error("Некорректные данные улучшения для расчета стоимости:", upgrade); return Infinity; } return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.currentLevel)); }

    // Функция renderUpgrades теперь вызывается реже (при открытии панели)
    function renderUpgrades() {
        if (!upgradesListElement) { console.error("Элемент #upgrades-list не найден!"); return; }
        upgradesListElement.innerHTML = ''; // Очищаем перед заполнением
        upgrades.sort((a, b) => (a.requiredEssence || 0) - (b.requiredEssence || 0));
        if (upgrades.length === 0) { upgradesListElement.innerHTML = `<li><p>Улучшения не определены.</p></li>`; return; }

        const currentEssenceFloored = Math.floor(essence);

        upgrades.forEach(upgrade => {
            const cost = calculateCost(upgrade);
            if (!Number.isFinite(cost)) { console.error("Пропуск рендера улучшения с неверной стоимостью:", upgrade.id); return; }

            const required = upgrade.requiredEssence || 0;
            const isLocked = currentEssenceFloored < required;
            const canAfford = currentEssenceFloored >= cost;

            const listItem = document.createElement('li');
            listItem.dataset.upgradeId = upgrade.id; // Добавляем ID для легкого доступа в updateUpgradeButtonStates

            if (isLocked) { listItem.classList.add('locked'); }
            else if (!canAfford) { listItem.classList.add('cannot-afford'); }

            const translatedName = translations[upgrade.nameKey]?.[currentLanguage] || upgrade.nameKey;
            const translatedDesc = translations[upgrade.descKey]?.[currentLanguage] || upgrade.descKey;
            const buyButtonText = translations.buyButton?.[currentLanguage] || "Купить";
            const requirementPrefix = translations.requirementPrefix?.[currentLanguage] || "Нужно";
            const requirementInfoPrefix = translations.requirementInfoPrefix?.[currentLanguage] || "Требуется";

            let buttonText = buyButtonText;
            let isButtonDisabled = false;

            if (isLocked) {
                isButtonDisabled = true;
                buttonText = `${requirementPrefix} ${formatNumber(required)} 🧪`;
            } else if (!canAfford) {
                isButtonDisabled = true;
            }

            // Создаем HTML для элемента списка
            listItem.innerHTML = `
                <div class="upgrade-info">
                    <h3>${translatedName} (Ур. ${upgrade.currentLevel})</h3>
                    <p>${translatedDesc}</p>
                    <p class="upgrade-cost">Цена: ${formatNumber(cost)} 🧪</p>
                    <p class="requirement-info" style="display: ${isLocked ? 'block' : 'none'};">${requirementInfoPrefix}: ${formatNumber(required)} 🧪</p>
                </div>
                <button class="buy-upgrade-btn" data-upgrade-id="${upgrade.id}">${buttonText}</button>
            `;

            const buyButton = listItem.querySelector('.buy-upgrade-btn');
            if (buyButton) {
                buyButton.disabled = isButtonDisabled;
                // Добавляем слушатель клика только если кнопка не заблокирована по требованию
                if (!isLocked) {
                    buyButton.addEventListener('click', (event) => {
                        event.stopPropagation();
                        if (!buyButton.disabled) { // Доп. проверка на disabled перед покупкой
                            buyUpgrade(upgrade.id);
                        }
                    });
                }
            }
            upgradesListElement.appendChild(listItem);
        });
    }

    // Функция покупки остается прежней, но после покупки вызывает renderUpgrades для обновления Ур.
    function buyUpgrade(upgradeId) {
        if (isBlocked) { showTemporaryNotification(translations.actionBlocked?.[currentLanguage] || "Действие заблокировано.", "error"); return; }
        const upgrade = upgrades.find(up => up.id === upgradeId);
        if (!upgrade) { console.error("Улучшение не найдено:", upgradeId); return; }

        const required = upgrade.requiredEssence || 0;
        if (Math.floor(essence) < required) {
            showTemporaryNotification(`${translations.needMoreEssence?.[currentLanguage] || "Нужно больше!"} ${formatNumber(required)} 🧪`, "warning");
            if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('warning');
            return;
        }

        const cost = calculateCost(upgrade);
        if (!Number.isFinite(cost)) { showTemporaryNotification(translations.invalidCostError?.[currentLanguage] || "Ошибка стоимости!", "error"); return; }

        if (essence >= cost) {
            essence -= cost;
            upgrade.currentLevel++;
            recalculateBonuses();
            updateDisplay(); // Обновит счетчики
            renderUpgrades(); // Перерисовываем панель, чтобы показать новый уровень и цену
            saveGame();
            if (tg?.HapticFeedback) { tg.HapticFeedback.impactOccurred('light'); }
        } else {
            showTemporaryNotification(translations.notEnoughEssence?.[currentLanguage] || "Недостаточно эссенции!", "warning");
            if (tg?.HapticFeedback) { tg.HapticFeedback.notificationOccurred('warning'); }
        }
    }

    function recalculateBonuses() { essencePerClick = 1; essencePerSecond = 0; upgrades.forEach(upgrade => { if (upgrade.currentLevel > 0 && Number.isFinite(upgrade.value) && typeof upgrade.type === 'string') { if (upgrade.type === 'click') { essencePerClick += upgrade.value * upgrade.currentLevel; } else if (upgrade.type === 'auto') { essencePerSecond += upgrade.value * upgrade.currentLevel; } } else if (upgrade.currentLevel > 0) { console.warn("Улучшение с ур > 0 имеет неверные данные:", upgrade); } }); if (!Number.isFinite(essencePerClick) || essencePerClick < 1) { console.error("Неверный essencePerClick:", essencePerClick); essencePerClick = 1; } if (!Number.isFinite(essencePerSecond) || essencePerSecond < 0) { console.error("Неверный essencePerSecond:", essencePerSecond); essencePerSecond = 0; } }

    // --- НОВАЯ ФУНКЦИЯ: Обновление состояния кнопок улучшений ---
    function updateUpgradeButtonStates() {
        if (!upgradesListElement || !upgradesPanel || upgradesPanel.classList.contains('hidden')) {
            return;
        }

        const currentEssenceFloored = Math.floor(essence);
        // Используем querySelectorAll на существующем списке
        const upgradeListItems = upgradesListElement.querySelectorAll('li[data-upgrade-id]');

        upgradeListItems.forEach(listItem => {
            const button = listItem.querySelector('.buy-upgrade-btn');
            const upgradeId = listItem.dataset.upgradeId; // Берем ID с li
            if (!button || !upgradeId) return;

            const upgrade = upgrades.find(up => up.id === upgradeId);
            if (!upgrade) return;

            const costElement = listItem.querySelector('.upgrade-cost');
            const requirementInfoElement = listItem.querySelector('.requirement-info');

            const cost = calculateCost(upgrade);
            const required = upgrade.requiredEssence || 0;
            const isLocked = currentEssenceFloored < required;
            const canAfford = currentEssenceFloored >= cost;

            let isButtonDisabled = false;
            let buttonText = translations.buyButton?.[currentLanguage] || "Купить";
            const currentButtonText = button.textContent; // Текущий текст кнопки

            listItem.classList.toggle('locked', isLocked);
            listItem.classList.toggle('cannot-afford', !isLocked && !canAfford);

            if (isLocked) {
                isButtonDisabled = true;
                buttonText = `${translations.requirementPrefix?.[currentLanguage] || "Нужно"} ${formatNumber(required)} 🧪`;
                if (requirementInfoElement) {
                    requirementInfoElement.textContent = `${translations.requirementInfoPrefix?.[currentLanguage] || "Требуется"}: ${formatNumber(required)} 🧪`;
                    requirementInfoElement.style.display = 'block';
                }
            } else {
                if (requirementInfoElement) {
                    requirementInfoElement.style.display = 'none';
                }
                if (!canAfford) {
                    isButtonDisabled = true;
                } else {
                    isButtonDisabled = false;
                }
            }

            button.disabled = isButtonDisabled;

            // Обновляем текст кнопки только если он действительно должен измениться
            if (isLocked && currentButtonText !== buttonText) {
                button.textContent = buttonText;
            } else if (!isLocked && currentButtonText !== buyButtonText) {
                button.textContent = buyButtonText;
            }

            // Обновляем текст цены
            if (costElement) {
                const costText = `Цена: ${formatNumber(cost)} 🧪`;
                if (costElement.textContent !== costText) {
                    costElement.textContent = costText;
                }
            }
        });
    }

    // --- НОВАЯ ФУНКЦИЯ: Обновление состояния кнопок скинов ---
    function updateSkinButtonStates() {
        if (!skinsListElement || !shopPanel || shopPanel.classList.contains('hidden')) {
            return;
        }

        // Обновляем счетчик гемов в шапке магазина
        if (shopGemCountElement) {
            shopGemCountElement.textContent = formatNumber(gems);
        }

        const skinListItems = skinsListElement.querySelectorAll('li[data-skin-id]');

        skinListItems.forEach(listItem => {
            const button = listItem.querySelector('.skin-action-btn.buy-btn'); // Ищем только кнопки "Купить"
            const skinId = listItem.dataset.skinId;
            if (!button || !skinId) return; // Пропускаем, если не кнопка покупки или нет ID

            const skin = availableSkins.find(s => s.id === skinId);
            if (!skin || skin.cost <= 0) return; // Пропускаем бесплатные или ненайденные

            const canAfford = gems >= skin.cost;
            button.disabled = !canAfford; // Обновляем состояние disabled
        });
    }

    // --- Открытие/Закрытие панелей ---
    function closeSettings() { if (settingsPanel) settingsPanel.classList.add('hidden'); }
    function closeUpgrades() { if (upgradesPanel) upgradesPanel.classList.add('hidden'); }
    function closeShop() { if (shopPanel) shopPanel.classList.add('hidden'); }

    if (openUpgradesBtn && upgradesPanel) {
        openUpgradesBtn.addEventListener('click', () => {
            console.log('Open Upgrades button clicked.'); // Отладка
            renderUpgrades(); // Полная перерисовка при открытии
            upgradesPanel.classList.remove('hidden');
            closeSettings(); closeShop();
        });
    } else { console.error("Кнопка/панель улучшений не найдена."); }

    if (closeUpgradesBtn && upgradesPanel) { closeUpgradesBtn.addEventListener('click', closeUpgrades); } else { console.error("Кнопка/панель улучшений не найдена."); }

    if (settingsBtn && settingsPanel) {
        settingsBtn.addEventListener('click', () => {
            console.log('Settings button clicked.'); // Отладка
            updateActiveLangButton();
            settingsPanel.classList.remove('hidden');
            closeUpgrades(); closeShop();
        });
    } else { console.error("Кнопка/панель настроек не найдена."); }

    if (closeSettingsBtn && settingsPanel) { closeSettingsBtn.addEventListener('click', closeSettings); } else { console.error("Кнопка/панель настроек не найдена."); }
    if (settingsPanel) { settingsPanel.addEventListener('click', (e) => { if (e.target === settingsPanel) closeSettings(); }); }

    if (shopBtn && shopPanel) {
        shopBtn.addEventListener('click', () => {
            console.log('Shop button clicked.'); // Отладка
            renderSkins(); // Полная перерисовка при открытии
            shopPanel.classList.remove('hidden');
            closeUpgrades(); closeSettings();
            if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
        });
    } else { console.error("Кнопка/панель магазина не найдена."); }

    if (closeShopBtn && shopPanel) { closeShopBtn.addEventListener('click', closeShop); } else { console.error("Кнопка/панель магазина не найдена."); }

    // --- Логика Настроек (только язык) ---
    function setLanguage(lang) { if (translations.greetingBase[lang]) { currentLanguage = lang; console.log(`Язык изменен на: ${currentLanguage}`); applyTranslations(); updateActiveLangButton(); saveGame(); if (upgradesPanel && !upgradesPanel.classList.contains('hidden')) { renderUpgrades(); } if (shopPanel && !shopPanel.classList.contains('hidden')) { renderSkins(); } } else { console.warn(`Язык "${lang}" не найден.`); } }
    function applyTranslations() { if (userGreetingElement) { let greeting = translations.greetingBase[currentLanguage] || "Лаборатория"; if (userName) { greeting += ` ${userName}`; } userGreetingElement.textContent = greeting; } document.querySelectorAll('[data-translate]').forEach(element => { const key = element.dataset.translate; const translation = translations[key]?.[currentLanguage]; if (translation) { element.textContent = translation; } else { /* console.warn(`Ключ перевода "${key}" не найден.`); */ } }); const perSecTextNode = perSecondDisplayDiv?.lastChild; if (perSecTextNode && perSecTextNode.nodeType === Node.TEXT_NODE) { perSecTextNode.textContent = ` ${translations.perSec?.[currentLanguage] || 'в сек'}`; } }
    function updateActiveLangButton() { if (!languageOptionsContainer) return; languageOptionsContainer.querySelectorAll('.lang-btn').forEach(button => { button.classList.toggle('active', button.dataset.lang === currentLanguage); }); }
    if (languageOptionsContainer) { languageOptionsContainer.addEventListener('click', (event) => { if (event.target.classList.contains('lang-btn')) { const lang = event.target.dataset.lang; if (lang && lang !== currentLanguage) { setLanguage(lang); } } }); } else { console.error("Контейнер выбора языка не найден."); }

    // --- Логика магазина ---
    // Функция renderSkins вызывается реже (при открытии панели)
    function renderSkins() {
        if (!skinsListElement) { console.error("Элемент #skins-list не найден!"); return; }
        skinsListElement.innerHTML = ''; // Очищаем перед заполнением

        // Обновляем счетчик гемов в шапке при перерисовке
        if (shopGemCountElement) { shopGemCountElement.textContent = formatNumber(gems); }

        availableSkins.forEach(skin => {
            const isOwned = ownedSkins.includes(skin.id);
            const isActive = activeSkinId === skin.id;
            const canAfford = gems >= skin.cost;

            const listItem = document.createElement('li');
            listItem.dataset.skinId = skin.id; // Добавляем ID
            if (isActive) { listItem.classList.add('active-skin'); }

            const translatedName = translations[skin.nameKey]?.[currentLanguage] || skin.nameKey;
            const buyButtonText = translations.buyButton?.[currentLanguage] || "Купить";
            const selectButtonText = translations.selectButton?.[currentLanguage] || "Выбрать";
            const selectedButtonText = translations.selectedButton?.[currentLanguage] || "Выбрано";
            const gemIconSvg = `<span class="gem-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em"><path d="M12 1.68l-8 8.42L12 22.32l8-8.42L12 1.68zm0 2.1l5.95 6.27L12 18.54l-5.95-6.27L12 3.78z M6.4 10.1L12 16.1l5.6-6H6.4z"/></svg></span>`;

            let actionButtonHtml = '';
            if (isActive) {
                actionButtonHtml = `<button class="skin-action-btn selected-btn" disabled>${selectedButtonText}</button>`;
            } else if (isOwned) {
                actionButtonHtml = `<button class="skin-action-btn select-btn">${selectButtonText}</button>`;
            } else {
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
            if (actionButton && !actionButton.classList.contains('selected-btn')) {
                actionButton.addEventListener('click', () => {
                    // Проверяем disabled еще раз перед действием
                    if (!actionButton.disabled) {
                         handleSkinAction(skin.id);
                    }
                });
            }
            skinsListElement.appendChild(listItem);
        });
    }

    function handleSkinAction(skinId) { if (isBlocked) { showTemporaryNotification(translations.actionBlocked?.[currentLanguage] || "Действие заблокировано.", "error"); return; } const skin = availableSkins.find(s => s.id === skinId); if (!skin) return; const isOwned = ownedSkins.includes(skinId); if (isOwned) { if (activeSkinId !== skinId) { setActiveSkin(skinId); } } else { buySkin(skinId); } }

    // Функция покупки скина теперь вызывает renderSkins для обновления списка
    function buySkin(skinId) {
        const skin = availableSkins.find(s => s.id === skinId);
        if (!skin || ownedSkins.includes(skinId) || skin.cost <= 0) return;

        if (gems >= skin.cost) {
            gems -= skin.cost;
            ownedSkins.push(skinId);
            console.log(`Скин куплен: ${skinId}. Осталось: ${gems}`);
            showTemporaryNotification(translations.skinPurchaseSuccess?.[currentLanguage] || "Скин куплен!", "success");
            if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
            updateDisplay(); // Обновит счетчик гемов вверху
            renderSkins(); // Перерисовываем магазин, чтобы кнопка сменилась на "Выбрать"
            setActiveSkin(skinId); // Сразу активируем купленный скин
        } else {
            console.log(`Недостаточно кристаллов: ${skinId}. Нужно: ${skin.cost}, Есть: ${gems}`);
            showTemporaryNotification(translations.notEnoughGems?.[currentLanguage] || "Недостаточно кристаллов!", "warning");
            if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('warning');
        }
    }

    function setActiveSkin(skinId) { if (!ownedSkins.includes(skinId)) { console.error(`Попытка акт. не купл. скина: ${skinId}`); return; } if (activeSkinId !== skinId) { activeSkinId = skinId; console.log(`Активный скин: ${skinId}`); applyCauldronSkin(); if (shopPanel && !shopPanel.classList.contains('hidden')) { renderSkins(); // Обновляем магазин, чтобы показать активный скин } saveGame(); showTemporaryNotification(translations.skinSelected?.[currentLanguage] || "Скин выбран!", "info"); if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light'); } }
    function applyCauldronSkin() { if (!cauldronElement) { console.warn("Не могу применить скин: элемент колбы не найден."); return; } const activeSkinDefinition = availableSkins.find(s => s.id === activeSkinId); const skinClass = activeSkinDefinition?.cssClass; availableSkins.forEach(skin => { if (skin.cssClass) { cauldronElement.classList.remove(skin.cssClass); } }); if (skinClass) { cauldronElement.classList.add(skinClass); console.log(`Применен класс скина: ${skinClass}`); } else { console.warn(`Нет CSS класса для скина: ${activeSkinId}.`); } }

    // --- Логика реферальной системы ---
    function checkReferralAndBonus() { const startParam = tg.initDataUnsafe?.start_param; const urlParams = new URLSearchParams(window.location.search); const claimBonusParam = urlParams.get('claimBonus'); console.log("Start Param:", startParam, "Claim Bonus Param:", claimBonusParam); if (claimBonusParam) { handleBonusClaim(claimBonusParam); } else if (startParam && !isNaN(parseInt(startParam))) { handleNewReferral(startParam); } }
    function handleNewReferral(inviterId) { console.log("Обработка нового реферала от", inviterId); /* Логика здесь */ }
    function handleBonusClaim(referralId) { console.log("Обработка запроса на бонус за реферала", referralId); /* Логика здесь */ }
    function cleanBonusUrlParam() { /* Логика здесь */ }
    if (inviteFriendBtn) { /* Логика кнопки приглашения */ }

    // --- Сохранение/Загрузка ---
    function saveGame() {
        if (!tg?.CloudStorage || !tg.CloudStorage.setItem) { return; }
        // console.log("[Save] Попытка сохранения..."); // Можно раскомментировать для отладки
        let isValid = true;
        if (!Number.isFinite(essence) || essence < 0) { console.warn(`[Save Valid] Эссенция->0`); essence = 0; isValid = false; }
        if (!Number.isFinite(gems) || gems < 0) { console.warn(`[Save Valid] Кристаллы->0`); gems = 0; isValid = false; }
        if (!Array.isArray(ownedSkins) || !ownedSkins.includes('default')) { console.warn(`[Save Valid] Скины->сброс`); ownedSkins = ['default']; if (activeSkinId !== 'default') activeSkinId = 'default'; isValid = false; }
        if (typeof activeSkinId !== 'string' || !ownedSkins.includes(activeSkinId)) { console.warn(`[Save Valid] Акт. скин->default`); activeSkinId = 'default'; isValid = false; }
        upgrades.forEach(upg => { if (!Number.isFinite(upg.currentLevel) || upg.currentLevel < 0) { console.warn(`[Save Valid] Апгрейд ${upg.id}->0`); upg.currentLevel = 0; isValid = false; } });
        if (!isValid) { console.warn("[Save] Данные скорректированы."); }

        const gameState = {
            essence: essence, gems: gems, upgrades: upgrades.map(u => ({ id: u.id, level: u.currentLevel })),
            language: currentLanguage, ownedSkins: ownedSkins, activeSkinId: activeSkinId
        };
        try {
            const gameStateString = JSON.stringify(gameState);
            // console.log(`[Save] Сохранение данных (${gameStateString.length} байт)...`); // Отладка
            try {
                tg.CloudStorage.setItem('gameState', gameStateString, (error, success) => {
                    if (error) { console.error("[Save Cb] Ошибка:", error); } else if (success) { /* Успешно */ } else { console.warn("[Save Cb] Неопред. результат."); }
                });
            } catch (storageError) { console.error("[Save Try] Ошибка вызова setItem:", storageError); }
        } catch (stringifyError) { console.error("[Save] Ошибка JSON.stringify:", stringifyError); showTemporaryNotification(translations.saveCritError?.[currentLanguage] || "Ошибка сохранения!", "error"); }
    }

    function loadGame() {
        console.log("[Load] Попытка загрузки...");
        isBlocked = false; warningCount = 0;
        if (cauldronElement) cauldronElement.classList.remove('blocked-cauldron');
        let needsReset = false;

        if (!tg?.CloudStorage || !tg.CloudStorage.getItem) {
            console.warn("[Load] CloudStorage объект недоступен. Новая игра.");
            needsReset = true;
        } else {
            try {
                tg.CloudStorage.getItem('gameState', (error, value) => {
                    console.log("[Load Cb] Ответ от getItem.");
                    let loadedSuccessfully = false;
                    if (error) {
                        console.error("[Load Cb] Ошибка получения:", error);
                        if (error.message && error.message.includes("Unsupported")) { console.warn("[Load Cb] CloudStorage.getItem не поддерживается."); showTemporaryNotification("Сохранение/загрузка недоступны.", "warning"); } else { showTemporaryNotification(translations.loadError?.[currentLanguage] || "Ошибка загрузки!", "error"); }
                        needsReset = true;
                    } else if (value) {
                        console.log(`[Load Cb] Данные получены (${value.length} байт). Парсинг...`);
                        try {
                            const savedState = JSON.parse(value);
                            console.log("[Load Parse] OK:", savedState);
                            essence = Number(savedState.essence) || 0; if (!Number.isFinite(essence) || essence < 0) { console.warn("[Load Valid] Эссенция->0"); essence = 0; }
                            gems = Number(savedState.gems) || 0; if (!Number.isFinite(gems) || gems < 0) { console.warn("[Load Valid] Кристаллы->0"); gems = 0; }
                            currentLanguage = savedState.language || 'ru'; if (!translations.greetingBase[currentLanguage]) { console.warn(`[Load Valid] Язык->ru`); currentLanguage = 'ru'; }
                            if (Array.isArray(savedState.upgrades)) { upgrades.forEach(u => { const sU = savedState.upgrades.find(su => su.id === u.id); const lvl = Number(sU?.level); u.currentLevel = (Number.isFinite(lvl) && lvl >= 0) ? lvl : 0; if(u.currentLevel !==0 && !(Number.isFinite(lvl) && lvl >=0)) console.warn(`[Load Valid] Апгрейд ${u.id}->0`); }); } else { console.warn("[Load Valid] Апгрейды->0"); upgrades.forEach(u => u.currentLevel = 0); }
                            ownedSkins = Array.isArray(savedState.ownedSkins) ? savedState.ownedSkins : ['default']; if (!ownedSkins.includes('default')) { ownedSkins.push('default'); console.warn("[Load Valid] Скин default добавлен."); }
                            activeSkinId = (typeof savedState.activeSkinId === 'string' && ownedSkins.includes(savedState.activeSkinId)) ? savedState.activeSkinId : 'default'; if (savedState.activeSkinId && !ownedSkins.includes(savedState.activeSkinId)) { console.warn(`[Load Valid] Активный скин->default`); }
                            recalculateBonuses(); console.log("[Load] Загружено успешно."); loadedSuccessfully = true;
                        } catch (parseError) { console.error("[Load Parse] Ошибка:", parseError); showTemporaryNotification(translations.readError?.[currentLanguage] || "Ошибка чтения!", "error"); needsReset = true; }
                    } else { console.log("[Load Cb] Нет данных. Новая игра."); needsReset = true; }

                    if (needsReset) { resetGameData(); }
                    // Пост-настройки ВНУТРИ колбэка
                    applyTranslations();
                    updateDisplay(); // Первоначальное отображение
                    applyCauldronSkin();
                    updateLiquidColor(); // Устанавливаем цвет жидкости
                    visualLiquidLevel = LIQUID_MIN_LEVEL; lastInteractionTime = Date.now(); updateLiquidLevelVisual(visualLiquidLevel); // Устанавливаем нач. уровень
                    checkReferralAndBonus();
                    console.log(`[Load Cb] Завершено. Состояние: E:${essence}, G:${gems}, Skin:${activeSkinId}`);
                });
            } catch (storageError) {
                console.error("[Load Try] Ошибка вызова getItem:", storageError); showTemporaryNotification("Загрузка недоступна.", "error"); needsReset = true;
                if (needsReset) { resetGameData(); }
                // Пост-настройки ПРИ ОШИБКЕ ВЫЗОВА
                applyTranslations();
                updateDisplay();
                applyCauldronSkin();
                updateLiquidColor();
                visualLiquidLevel = LIQUID_MIN_LEVEL; lastInteractionTime = Date.now(); updateLiquidLevelVisual(visualLiquidLevel);
                checkReferralAndBonus();
                console.log(`[Load] Завершено после ошибки вызова getItem.`);
            }
        }

        // Пост-настройки если CloudStorage недоступен сразу
        if (!tg?.CloudStorage) {
             setTimeout(() => {
                 if (needsReset) { resetGameData(); }
                 console.log("[Load Timeout] Выполнение пост-настройки.");
                 applyTranslations();
                 updateDisplay();
                 applyCauldronSkin();
                 updateLiquidColor();
                 visualLiquidLevel = LIQUID_MIN_LEVEL; lastInteractionTime = Date.now(); updateLiquidLevelVisual(visualLiquidLevel);
                 checkReferralAndBonus();
                 console.log(`[Load Timeout] Завершено. Состояние: E:${essence}, G:${gems}, Skin:${activeSkinId}`);
                 showTemporaryNotification("Прогресс не будет сохранен.", "warning");
             }, 50);
        }
    }

    function resetGameData() {
        console.log("Сброс данных игры к значениям по умолчанию.");
        essence = 0; gems = 0;
        upgrades.forEach(upgrade => upgrade.currentLevel = 0);
        ownedSkins = ['default']; activeSkinId = 'default';
        recalculateBonuses();
    }

    // --- Функция уведомлений ---
    function showTemporaryNotification(message, type = "info") { const notification = document.createElement('div'); notification.className = `notification ${type}`; notification.textContent = message; document.body.appendChild(notification); void notification.offsetWidth; requestAnimationFrame(() => { notification.style.opacity = '1'; notification.style.bottom = '80px'; }); setTimeout(() => { notification.style.opacity = '0'; notification.style.bottom = '70px'; setTimeout(() => { if (notification.parentNode) { notification.remove(); } }, 500); }, 2500); }

    // --- Первоначальная инициализация ---
    // Убрали try...catch отсюда, чтобы видеть ошибки загрузки напрямую
    loadGame();


    // --- Автосохранение и обработчики событий ---
    const autoSaveInterval = setInterval(saveGame, 15000);
    window.addEventListener('beforeunload', saveGame);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { saveGame(); } });
    if (tg?.onEvent) { tg.onEvent('viewportChanged', (event) => { if (event.isStateStable) { /* console.log("Viewport stable, save."); */ saveGame(); } }); }

    // --- Интервал для обновления цвета жидкости ---
    const liquidColorUpdateInterval = setInterval(updateLiquidColor, 5 * 60 * 1000); // Обновлять каждые 5 минут

}); // Конец DOMContentLoaded - Строка ~721