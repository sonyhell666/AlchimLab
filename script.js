// Файл: script.js
document.addEventListener('DOMContentLoaded', () => {
    // Инициализация Telegram Web App
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    // --- Версия приложения ---
    const APP_VERSION = "1.78"; // <-- УВЕЛИЧИЛ ВЕРСИЮ (опционально)

    // --- Получаем ссылки на элементы DOM ---
    const essenceCountElement = document.getElementById('essence-count');
    const cauldronElement = document.getElementById('cauldron');
    const openUpgradesBtn = document.getElementById('open-upgrades-btn');
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
    const languageOptionsContainer = settingsPanel?.querySelector('.language-options');
    const shopBtn = document.getElementById('shop-btn');
    const shopPanel = document.getElementById('shop-panel');
    const closeShopBtn = document.getElementById('close-shop-btn');
    const skinsListElement = document.getElementById('skins-list');
    const shopGemCountElement = document.getElementById('shop-gem-count');
    const oneTimeBonusBtn = document.getElementById('one-time-bonus-btn');
    const appVersionElement = document.getElementById('app-version');
    // const volumeSliderElement = document.getElementById('volume-slider'); // <-- УДАЛЕНО
    const shopTabsContainer = shopPanel?.querySelector('.shop-tabs');
    const shopContentContainer = shopPanel?.querySelector('.shop-content');

    // Проверка критически важных элементов
    if (!essenceCountElement || !cauldronElement || !openUpgradesBtn || !upgradesPanel || !settingsPanel || !shopPanel || !inviteFriendBtn || !settingsBtn || !shopBtn || !gemCountElement || !userGreetingElement || !oneTimeBonusBtn || !appVersionElement || /*!volumeSliderElement ||*/ !shopTabsContainer || !shopContentContainer) { // <-- УДАЛЕНА ПРОВЕРКА volumeSliderElement
        console.error("КРИТИЧЕСКАЯ ОШИБКА: Не найдены один или несколько основных элементов DOM. Работа скрипта невозможна.");
        alert("Произошла ошибка при загрузке интерфейса. Пожалуйста, попробуйте перезапустить приложение.");
        return;
    }

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
    let bonusClaimed = false;
    // let currentVolume = 0.5; // <-- УДАЛЕНО

    // --- Переменные для защиты от автокликера ---
    let lastClickTime = 0;
    const MIN_CLICK_INTERVAL = 60;
    const MAX_WARNINGS = 5;
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
    let lastInteractionTime = Date.now();

    // --- Переменные для Web Audio API --- УДАЛЕНЫ ---
    // let audioContext;
    // let clickSoundBuffer = null;
    // let clickVolumeNode;
    // let audioInitialized = false;
    // const CLICK_SOUND_SRC = 'sounds/click.mp3';
    // --- --- --- --- --- --- --- --- --- --- --- ---

    // --- Объект с переводами ---
    const translations = {
        // ... (все существующие переводы КРОМЕ volumeTitle) ...
        // volumeTitle: { ru: "Громкость", en: "Volume" }, // <-- УДАЛЕНО
        skinsTab: { ru: "Скины", en: "Skins" },
        decorationsTab: { ru: "Декорации", en: "Decorations" },
        decorationsSoon: { ru: "Раздел в разработке. Скоро здесь появятся украшения для вашей лаборатории!", en: "Section under development. Decorations for your lab will appear here soon!" },
        bonusClaimedAlready: { ru: "Бонус уже получен.", en: "Bonus already claimed." },
        bonusClaimSuccess: { ru: "+100K 🧪 Бонус получен!", en: "+100K 🧪 Bonus claimed!" },
        versionPrefix: { ru: "Версия:", en: "Version:" },
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
        autoclickerBlocked: { ru: "Автокликер обнаружен! Клики временно заблокированы.", en: "Autoclicker detected! Clicking temporarily blocked." },
        actionBlocked: { ru: "Действие заблокировано.", en: "Action blocked." },
        needMoreEssence: { ru: "Нужно больше эссенции!", en: "Need more essence!" },
        invalidCostError: { ru: "Ошибка: Неверная стоимость улучшения!", en: "Error: Invalid upgrade cost!" },
        notEnoughEssence: { ru: "Недостаточно эссенции!", en: "Not enough essence!" },
        loadErrorStartNew: { ru: "Ошибка загрузки прогресса. Начинаем новую игру.", en: "Failed to load progress. Starting new game." },
        loadError: { ru: "Ошибка загрузки прогресса!", en: "Error loading progress!" },
        readError: { ru: "Ошибка чтения данных сохранения!", en: "Error reading save data!" },
        saveCritError: { ru: "Критическая ошибка сохранения!", en: "Critical save error!" },
        saveSuccess: { ru: "Прогресс сохранен", en: "Progress saved" },
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

    // --- Определения улучшений (без изменений) ---
    const upgrades = [ { id: 'click1', nameKey: 'upgrade_click1_name', descKey: 'upgrade_click1_desc', baseCost: 15, costMultiplier: 1.4, type: 'click', value: 1, currentLevel: 0, requiredEssence: 0 }, { id: 'auto1', nameKey: 'upgrade_auto1_name', descKey: 'upgrade_auto1_desc', baseCost: 60, costMultiplier: 1.6, type: 'auto', value: 1, currentLevel: 0, requiredEssence: 0 }, { id: 'click2', nameKey: 'upgrade_click2_name', descKey: 'upgrade_click2_desc', baseCost: 300, costMultiplier: 1.5, type: 'click', value: 5, currentLevel: 0, requiredEssence: 500 }, { id: 'auto2', nameKey: 'upgrade_auto2_name', descKey: 'upgrade_auto2_desc', baseCost: 750, costMultiplier: 1.7, type: 'auto', value: 4, currentLevel: 0, requiredEssence: 700 }, { id: 'click3', nameKey: 'upgrade_click3_name', descKey: 'upgrade_click3_desc', baseCost: 5000, costMultiplier: 1.6, type: 'click', value: 25, currentLevel: 0, requiredEssence: 10000 }, { id: 'auto3', nameKey: 'upgrade_auto3_name', descKey: 'upgrade_auto3_desc', baseCost: 12000, costMultiplier: 1.8, type: 'auto', value: 20, currentLevel: 0, requiredEssence: 15000 }, { id: 'auto4', nameKey: 'upgrade_auto4_name', descKey: 'upgrade_auto4_desc', baseCost: 30000, costMultiplier: 1.9, type: 'auto', value: 50, currentLevel: 0, requiredEssence: 40000 }, { id: 'click4', nameKey: 'upgrade_click4_name', descKey: 'upgrade_click4_desc', baseCost: 250000, costMultiplier: 1.7, type: 'click', value: 150, currentLevel: 0, requiredEssence: 500000 }, { id: 'auto5', nameKey: 'upgrade_auto5_name', descKey: 'upgrade_auto5_desc', baseCost: 1000000, costMultiplier: 2.0, type: 'auto', value: 250, currentLevel: 0, requiredEssence: 1200000 }, { id: 'auto6', nameKey: 'upgrade_auto6_name', descKey: 'upgrade_auto6_desc', baseCost: 5000000, costMultiplier: 2.2, type: 'auto', value: 1000, currentLevel: 0, requiredEssence: 6000000 }, { id: 'click5', nameKey: 'upgrade_click5_name', descKey: 'upgrade_click5_desc', baseCost: 10000000, costMultiplier: 1.8, type: 'click', value: 1000, currentLevel: 0, requiredEssence: 15000000 }, { id: 'auto7', nameKey: 'upgrade_auto7_name', descKey: 'upgrade_auto7_desc', baseCost: 50000000, costMultiplier: 2.1, type: 'auto', value: 5000, currentLevel: 0, requiredEssence: 60000000 }, ];
    // --- Определения скинов (без изменений) ---
    const availableSkins = [ { id: 'default', nameKey: 'skin_default_name', cost: 0, cssClass: 'skin-default' }, { id: 'gold', nameKey: 'skin_gold_name', cost: 15, cssClass: 'skin-gold' }, { id: 'crystal', nameKey: 'skin_crystal_name', cost: 50, cssClass: 'skin-crystal' }, { id: 'obsidian', nameKey: 'skin_obsidian_name', cost: 100, cssClass: 'skin-obsidian' }, ];

    // --- Функции Web Audio API --- УДАЛЕНЫ ---
    // async function initAudio() { /* ... */ }
    // function playClickSound() { /* ... */ }
    // --- --- --- --- --- --- --- --- --- ---

    // --- Функция обновления громкости --- УДАЛЕНА ---
    // function updateVolume(volume) { /* ... */ }
    // --- --- --- --- --- --- --- --- --- --- --- ---

    // --- Функции для пузырьков (без изменений) ---
    function createBubble() { if (!bubblesContainer) return; const b = document.createElement('div'); b.classList.add('bubble'); const s = Math.random() * 8 + 6; const d = Math.random() * 2.5 + 3; const l = Math.random() * 1.5; const h = Math.random() * 90 + 5; b.style.width = `${s}px`; b.style.height = `${s}px`; b.style.left = `${h}%`; b.style.animationDuration = `${d}s`; b.style.animationDelay = `${l}s`; try { bubblesContainer.appendChild(b); } catch (e) { /* Ignore DOMException if container removed */ }; setTimeout(() => { b.remove(); }, (d + l) * 1000 + 100); }
    let bubbleInterval = null;
    if (bubblesContainer) { bubbleInterval = setInterval(createBubble, 500); } else { console.warn("Контейнер для пузырьков не найден при инициализации."); }

    // --- Функция обновления визуала жидкости (без изменений) ---
    function updateLiquidLevelVisual(percentage) { if (!cauldronElement) return; const l = Math.max(LIQUID_MIN_LEVEL, Math.min(LIQUID_MAX_LEVEL, percentage)); cauldronElement.style.setProperty('--liquid-level', `${l}%`); if(bubblesContainer) { bubblesContainer.style.height = `${l}%`; } }
    // --- Функции для динамического цвета жидкости (без изменений) ---
    function getLondonHour() { const now = new Date(); return now.getUTCHours(); }
    function getLiquidColorByLondonTime() { const hour = getLondonHour(); const alpha = 0.35; if (hour >= 22 || hour < 5) return `rgba(40, 40, 100, ${alpha})`; if (hour >= 5 && hour < 7)  return `rgba(255, 150, 100, ${alpha})`; if (hour >= 7 && hour < 11) return `rgba(100, 180, 220, ${alpha})`; if (hour >= 11 && hour < 17) return `rgba(220, 220, 100, ${alpha})`; if (hour >= 17 && hour < 20) return `rgba(255, 120, 50, ${alpha})`; return `rgba(70, 70, 150, ${alpha})`; }
    function updateLiquidColor() { if (!cauldronElement) return; const color = getLiquidColorByLondonTime(); cauldronElement.style.setProperty('--liquid-color', color); }

    // --- Общая функция обновления UI (без изменений) ---
    function updateDisplay() { if (essenceCountElement) essenceCountElement.textContent = formatNumber(Math.floor(essence)); if (essencePerSecondElement && perSecondDisplayDiv) { essencePerSecondElement.textContent = formatNumber(essencePerSecond); perSecondDisplayDiv.style.display = essencePerSecond > 0 ? 'block' : 'none'; } if (gemCountElement) gemCountElement.textContent = formatNumber(gems); updateLiquidLevelVisual(visualLiquidLevel); if (upgradesPanel && !upgradesPanel.classList.contains('hidden')) updateUpgradeButtonStates(); if (shopPanel && !shopPanel.classList.contains('hidden')) updateSkinButtonStates(); }
    // --- Функция форматирования чисел (без изменений) ---
    function formatNumber(num) { if (isNaN(num) || !Number.isFinite(num)) { console.warn("formatNumber: некорректное значение", num); return "ERR"; } if (num < 1000) return num.toString(); const ab = ["", "K", "M", "B", "T", "q", "Q", "s", "S", "O", "N", "d", "U"]; let i = 0; let t = num; while (t >= 1000 && i < ab.length - 1) { t /= 1000; i++; } return (t % 1 === 0 ? t.toString() : t.toFixed(1)) + ab[i]; }
    // --- Функция для отображения "+N" при клике (без изменений) ---
    function showClickFeedback(amount, type = 'essence') { if (isBlocked || !clickFeedbackContainer) return; const fb = document.createElement('div'); fb.className = 'click-feedback'; const fa = formatNumber(amount); if (type === 'gem') { const si = `<span class="gem-icon" style="display:inline-flex; vertical-align: middle; margin-left: 4px;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" fill="var(--gem-color)"><path d="M12 1.68l-8 8.42L12 22.32l8-8.42L12 1.68zm0 2.1l5.95 6.27L12 18.54l-5.95-6.27L12 3.78z M6.4 10.1L12 16.1l5.6-6H6.4z"></path></svg></span>`; fb.innerHTML = `+${fa}${si}`; fb.style.cssText = 'font-size: 1.3em; font-weight: bold; color: var(--gem-color);'; } else { fb.textContent = `+${fa} 🧪`; fb.style.color = 'var(--accent-color)'; } const ox = Math.random() * 60 - 30; const oy = (type === 'gem') ? (Math.random() * 20 + 15) : (Math.random() * 20 - 10); fb.style.left = `calc(50% + ${ox}px)`; fb.style.top = `calc(50% + ${oy}px)`; clickFeedbackContainer.appendChild(fb); setTimeout(() => { fb.remove(); }, 950); }

    // --- Логика клика по котлу (УБРАН ВЫЗОВ ЗВУКА) ---
    cauldronElement.addEventListener('click', () => {
        const now = Date.now();
        tg.HapticFeedback?.impactOccurred('light'); // Вибрация остается

        // --- Убрана инициализация аудио ---
        // if (!audioInitialized && !audioContext) {
        //     initAudio();
        // }
        // --- --- --- --- --- --- --- --- ---

        if (isBlocked) { showTemporaryNotification(translations.autoclickerBlocked[currentLanguage], "error"); return; }

        if (now - lastClickTime >= MIN_CLICK_INTERVAL) {
            warningCount = 0;
            lastInteractionTime = now;

            // playClickSound(); // <--- УДАЛЕН ВЫЗОВ ЗВУКА

            const ca = essencePerClick;
            if (Number.isFinite(ca) && ca > 0) {
                essence += ca;
                showClickFeedback(ca, 'essence');
            } else {
                console.error("Invalid essencePerClick:", ca);
            }

            if (Math.random() < GEM_AWARD_CHANCE) {
                gems += GEMS_PER_AWARD;
                console.log(`+${GEMS_PER_AWARD} gem! Total: ${gems}`);
                showClickFeedback(GEMS_PER_AWARD, 'gem');
                tg.HapticFeedback?.impactOccurred('medium');
            }

            visualLiquidLevel = Math.min(visualLiquidLevel + LIQUID_INCREASE_PER_CLICK, LIQUID_MAX_LEVEL);
            updateDisplay();
            cauldronElement.style.transform = 'scale(0.95)';
            setTimeout(() => { if(cauldronElement) cauldronElement.style.transform = 'scale(1)'; }, 80);
            lastClickTime = now;

        } else {
            warningCount++;
            lastInteractionTime = now;
            console.warn(`Fast click ${warningCount}/${MAX_WARNINGS}`);
            showTemporaryNotification(`${translations.tooFastClick[currentLanguage]} (${warningCount}/${MAX_WARNINGS})`, "warning");
            tg.HapticFeedback?.impactOccurred('medium');
            if (warningCount >= MAX_WARNINGS) {
                isBlocked = true;
                console.error("Autoclicker blocked.");
                showTemporaryNotification(translations.autoclickerBlocked[currentLanguage], "error");
                tg.HapticFeedback?.notificationOccurred('error');
                if(cauldronElement) cauldronElement.classList.add('blocked-cauldron');
            }
        }
    });

    // --- Логика авто-клика (без изменений) ---
    let autoClickInterval = null;
    try { autoClickInterval = setInterval(() => { if (!isBlocked && essencePerSecond > 0 && Number.isFinite(essencePerSecond)) { const ea = essencePerSecond / 10; if (Number.isFinite(ea) && ea > 0) { essence += ea; } else if (ea !== 0) { console.warn("Invalid auto-click essence portion:", ea); } } }, 100); } catch(e) { console.error("Error in auto-click interval:", e); }
    // --- Интервал обновления UI/жидкости (без изменений) ---
    let uiInterval = null;
    try { uiInterval = setInterval(() => { const now = Date.now(); if (!isBlocked && now - lastInteractionTime > IDLE_TIMEOUT && visualLiquidLevel > LIQUID_MIN_LEVEL) { visualLiquidLevel = Math.max(visualLiquidLevel - LIQUID_DECAY_RATE, LIQUID_MIN_LEVEL); } updateDisplay(); }, LIQUID_UPDATE_INTERVAL); } catch(e) { console.error("Error in UI update interval:", e); }
    // --- Логика улучшений (без изменений) ---
    function calculateCost(upg) { if (!upg || typeof upg.baseCost !== 'number' || typeof upg.costMultiplier !== 'number' || typeof upg.currentLevel !== 'number') { console.error("Invalid upgrade data for cost calculation:", upg); return Infinity; } return Math.floor(upg.baseCost * Math.pow(upg.costMultiplier, upg.currentLevel)); }
    function renderUpgrades() { if (!upgradesListElement) return; upgradesListElement.innerHTML = ''; upgrades.sort((a, b) => (a.requiredEssence || 0) - (b.requiredEssence || 0)); if (upgrades.length === 0) { upgradesListElement.innerHTML = `<li><p>Нет улучшений.</p></li>`; return; } const cef = Math.floor(essence); upgrades.forEach(upg => { const cost = calculateCost(upg); if (!Number.isFinite(cost)) { console.error("Skip rendering upgrade with invalid cost:", upg.id, cost); return; } const req = upg.requiredEssence || 0; const lock = cef < req; const aff = cef >= cost; const li = document.createElement('li'); li.dataset.upgradeId = upg.id; li.classList.toggle('locked', lock); li.classList.toggle('cannot-afford', !lock && !aff); const tName = translations[upg.nameKey]?.[currentLanguage] || upg.nameKey; const tDesc = translations[upg.descKey]?.[currentLanguage] || upg.descKey; const btnBuy = translations.buyButton?.[currentLanguage] || "Купить"; const preReq = translations.requirementPrefix?.[currentLanguage] || "Нужно"; const infReq = translations.requirementInfoPrefix?.[currentLanguage] || "Требуется"; let btnTxt = btnBuy; let dis = lock || !aff; if (lock) { btnTxt = `${preReq} ${formatNumber(req)} 🧪`; } li.innerHTML = `<div class="upgrade-info"><h3>${tName} (Ур. ${upg.currentLevel})</h3><p>${tDesc}</p><p class="upgrade-cost">Цена: ${formatNumber(cost)} 🧪</p><p class="requirement-info" style="display: ${lock ? 'block' : 'none'};">${infReq}: ${formatNumber(req)} 🧪</p></div><button class="buy-upgrade-btn" data-upgrade-id="${upg.id}">${btnTxt}</button>`; const btn = li.querySelector('.buy-upgrade-btn'); if (btn) { btn.disabled = dis; btn.addEventListener('click', (e) => { e.stopPropagation(); if (!btn.disabled) { buyUpgrade(upg.id); } else { console.log("Clicked disabled upgrade button:", upg.id); tg.HapticFeedback?.notificationOccurred('warning'); if (lock) { showTemporaryNotification(`${infReq}: ${formatNumber(req)} 🧪`, "warning"); } else if (!aff) { showTemporaryNotification(translations.notEnoughEssence[currentLanguage], "warning"); } } }); } upgradesListElement.appendChild(li); }); }
    function buyUpgrade(id) { if (isBlocked) { showTemporaryNotification(translations.actionBlocked[currentLanguage], "error"); return; } const upg = upgrades.find(u => u.id === id); if (!upg) { console.error("Upgrade not found:", id); return; } const req = upg.requiredEssence || 0; if (Math.floor(essence) < req) { showTemporaryNotification(`${translations.requirementInfoPrefix[currentLanguage]}: ${formatNumber(req)} 🧪`, "warning"); tg.HapticFeedback?.notificationOccurred('warning'); return; } const cost = calculateCost(upg); if (!Number.isFinite(cost)) { showTemporaryNotification(translations.invalidCostError[currentLanguage], "error"); console.error("Attempted buy with invalid cost:", id, cost); return; } if (essence >= cost) { essence -= cost; upg.currentLevel++; recalculateBonuses(); renderUpgrades(); saveGame(); tg.HapticFeedback?.impactOccurred('light'); } else { showTemporaryNotification(translations.notEnoughEssence[currentLanguage], "warning"); tg.HapticFeedback?.notificationOccurred('warning'); } }
    function recalculateBonuses() { let cb = 0; let ab = 0; upgrades.forEach(u => { if (u.currentLevel > 0 && Number.isFinite(u.value) && typeof u.type === 'string') { const b = u.value * u.currentLevel; if (u.type === 'click') cb += b; else if (u.type === 'auto') ab += b; } else if (u.currentLevel > 0) { console.warn("Invalid upgrade data for bonus calc:", u); } }); essencePerClick = 1 + cb; essencePerSecond = ab; if (!Number.isFinite(essencePerClick) || essencePerClick < 1) { console.error("Invalid final essencePerClick:", essencePerClick); essencePerClick = 1; } if (!Number.isFinite(essencePerSecond) || essencePerSecond < 0) { console.error("Invalid final essencePerSecond:", essencePerSecond); essencePerSecond = 0; } }
    function updateUpgradeButtonStates() { if (!upgradesListElement || !upgradesPanel || upgradesPanel.classList.contains('hidden')) return; const cef = Math.floor(essence); const items = upgradesListElement.querySelectorAll('li[data-upgrade-id]'); items.forEach(li => { const btn = li.querySelector('.buy-upgrade-btn'); const id = li.dataset.upgradeId; if (!btn || !id) return; const upg = upgrades.find(u => u.id === id); if (!upg) return; const cost = calculateCost(upg); const req = upg.requiredEssence || 0; const lock = cef < req; const aff = cef >= cost; const dis = lock || !aff; li.classList.toggle('locked', lock); li.classList.toggle('cannot-afford', !lock && !aff); if (btn.disabled !== dis) btn.disabled = dis; let btnTxt = translations.buyButton[currentLanguage]; if (lock) btnTxt = `${translations.requirementPrefix[currentLanguage]} ${formatNumber(req)} 🧪`; if (btn.textContent !== btnTxt && (!dis || lock)) btn.textContent = btnTxt; const ce = li.querySelector('.upgrade-cost'); if (ce) { const ct = `Цена: ${formatNumber(cost)} 🧪`; if (ce.textContent !== ct) ce.textContent = ct; } const rie = li.querySelector('.requirement-info'); if (rie) { const rt = `${translations.requirementInfoPrefix[currentLanguage]}: ${formatNumber(req)} 🧪`; if (rie.textContent !== rt) rie.textContent = rt; const sv = lock; if ((rie.style.display === 'none') === sv) rie.style.display = sv ? 'block' : 'none'; } }); }

    // --- Логика магазина (Вкладки остаются) ---
    function renderSkins() { if (!skinsListElement) return; skinsListElement.innerHTML = ''; if (shopGemCountElement) shopGemCountElement.textContent = formatNumber(gems); availableSkins.forEach(skin => { const own = ownedSkins.includes(skin.id); const act = activeSkinId === skin.id; const aff = gems >= skin.cost; const li = document.createElement('li'); li.dataset.skinId = skin.id; li.classList.toggle('active-skin', act); const tName = translations[skin.nameKey]?.[currentLanguage] || skin.nameKey; const btnBuy = translations.buyButton?.[currentLanguage] || "Купить"; const btnSel = translations.selectButton?.[currentLanguage] || "Выбрать"; const btnSeld = translations.selectedButton?.[currentLanguage] || "Выбрано"; const gemSvg = `<span class="gem-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" fill="var(--gem-color)"><path d="M12 1.68l-8 8.42L12 22.32l8-8.42L12 1.68zm0 2.1l5.95 6.27L12 18.54l-5.95-6.27L12 3.78z M6.4 10.1L12 16.1l5.6-6H6.4z"/></svg></span>`; let btnHtml = ''; if (act) btnHtml = `<button class="skin-action-btn selected-btn" disabled>${btnSeld}</button>`; else if (own) btnHtml = `<button class="skin-action-btn select-btn" data-skin-id="${skin.id}">${btnSel}</button>`; else btnHtml = `<button class="skin-action-btn buy-btn" data-skin-id="${skin.id}" ${!aff ? 'disabled' : ''}>${btnBuy}</button>`; li.innerHTML = `<div class="skin-preview ${skin.cssClass || ''}"></div><div class="skin-info"><h3>${tName}</h3>${skin.cost > 0 ? `<p class="skin-cost">${gemSvg} ${formatNumber(skin.cost)}</p>` : '<p class="skin-cost"> </p>'}</div>${btnHtml}`; const ab = li.querySelector('.skin-action-btn:not(.selected-btn)'); if (ab) { ab.addEventListener('click', (e) => { if (e.currentTarget && !e.currentTarget.disabled) { handleSkinAction(skin.id); } else { console.log("Clicked disabled skin button:", skin.id); tg.HapticFeedback?.notificationOccurred('warning'); if (!own && !aff) showTemporaryNotification(translations.notEnoughGems[currentLanguage], "warning"); } }); } skinsListElement.appendChild(li); }); }
    function switchShopTab(tabId) { if (!shopTabsContainer || !shopContentContainer) return; shopTabsContainer.querySelectorAll('.shop-tab').forEach(btn => btn.classList.remove('active')); shopContentContainer.querySelectorAll('.shop-tab-content').forEach(content => content.classList.remove('active')); const activeButton = shopTabsContainer.querySelector(`.shop-tab[data-tab="${tabId}"]`); const activeContent = shopContentContainer.querySelector(`#${tabId}-content`); if (activeButton) activeButton.classList.add('active'); if (activeContent) activeContent.classList.add('active'); console.log(`[Shop] Switched to tab: ${tabId}`); if (tabId === 'skins') { renderSkins(); updateSkinButtonStates(); } else if (tabId === 'decorations') { /* Пока ничего не делаем */ } }
    if (shopTabsContainer) { shopTabsContainer.addEventListener('click', (e) => { if (e.target && e.target.classList.contains('shop-tab')) { const tabId = e.target.dataset.tab; if (tabId) { switchShopTab(tabId); } } }); }
    function handleSkinAction(id) { if (isBlocked) { showTemporaryNotification(translations.actionBlocked[currentLanguage], "error"); return; } const skin = availableSkins.find(s => s.id === id); if (!skin) { console.error("Skin not found:", id); return; } if (ownedSkins.includes(id)) { if (activeSkinId !== id) setActiveSkin(id); } else { buySkin(id); } }
    function buySkin(id) { const skin = availableSkins.find(s => s.id === id); if (!skin || ownedSkins.includes(id) || skin.cost <= 0) { console.warn("Cannot buy skin (not found, owned, or free):", id); return; } if (gems >= skin.cost) { gems -= skin.cost; ownedSkins.push(id); console.log(`Skin purchased: ${id}. Gems left: ${gems}`); showTemporaryNotification(translations.skinPurchaseSuccess[currentLanguage], "success"); tg.HapticFeedback?.notificationOccurred('success'); renderSkins(); setActiveSkin(id); /* saveGame() вызовется в setActiveSkin */ } else { console.log(`Not enough gems for skin: ${id}. Need: ${skin.cost}, Have: ${gems}`); showTemporaryNotification(translations.notEnoughGems[currentLanguage], "warning"); tg.HapticFeedback?.notificationOccurred('warning'); } }
    function setActiveSkin(id) { if (!ownedSkins.includes(id)) { console.error(`Attempt to activate unowned skin: ${id}`); return; } if (activeSkinId !== id) { activeSkinId = id; console.log(`Active skin set to: ${id}`); applyCauldronSkin(); if (shopPanel && !shopPanel.classList.contains('hidden')) renderSkins(); saveGame(); showTemporaryNotification(translations.skinSelected[currentLanguage], "info"); tg.HapticFeedback?.impactOccurred('light'); } }
    function applyCauldronSkin() { if (!cauldronElement) return; const ad = availableSkins.find(s => s.id === activeSkinId); const sc = ad?.cssClass; availableSkins.forEach(s => { if (s.cssClass && cauldronElement) cauldronElement.classList.remove(s.cssClass); }); if (sc) { cauldronElement.classList.add(sc); console.log(`Applied skin class: ${sc}`); } else { if (cauldronElement) cauldronElement.classList.add('skin-default'); console.warn(`CSS class not found for active skin: ${activeSkinId}. Applied 'skin-default'.`); } }
    function updateSkinButtonStates() { if (!skinsListElement || !shopPanel || shopPanel.classList.contains('hidden')) return; if (shopGemCountElement) { const fg = formatNumber(gems); if (shopGemCountElement.textContent !== fg) shopGemCountElement.textContent = fg; } const items = skinsListElement.querySelectorAll('li[data-skin-id]'); items.forEach(li => { const id = li.dataset.skinId; if (!id) return; const skin = availableSkins.find(s => s.id === id); if (!skin) return; const buyBtn = li.querySelector('.skin-action-btn.buy-btn'); const own = ownedSkins.includes(id); const act = activeSkinId === id; li.classList.toggle('active-skin', act); if (buyBtn && !own) { const aff = gems >= skin.cost; if (buyBtn.disabled === aff) buyBtn.disabled = !aff; } }); }

    // --- Открытие/Закрытие панелей (без изменений) ---
    function closeAllPanels() { if(settingsPanel) settingsPanel.classList.add('hidden'); if(upgradesPanel) upgradesPanel.classList.add('hidden'); if(shopPanel) shopPanel.classList.add('hidden'); }
    function openPanel(panel) { if (!panel) return; closeAllPanels(); panel.classList.remove('hidden'); tg.HapticFeedback?.impactOccurred('light'); }
    if (openUpgradesBtn) openUpgradesBtn.addEventListener('click', () => { renderUpgrades(); openPanel(upgradesPanel); });
    if (settingsBtn) settingsBtn.addEventListener('click', () => { updateActiveLangButton(); openPanel(settingsPanel); });
    if (shopBtn) shopBtn.addEventListener('click', () => { switchShopTab('skins'); openPanel(shopPanel); });
    if (closeUpgradesBtn) closeUpgradesBtn.addEventListener('click', closeAllPanels);
    if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', closeAllPanels);
    if (closeShopBtn) closeShopBtn.addEventListener('click', closeAllPanels);
    if (settingsPanel) settingsPanel.addEventListener('click', (e) => { if (e.target === settingsPanel) closeAllPanels(); });

    // --- Логика Настроек (язык - без изменений, громкость - убрана) ---
    function setLanguage(lang) { if (translations.greetingBase[lang] && lang !== currentLanguage) { currentLanguage = lang; console.log(`Language changed to: ${currentLanguage}`); applyTranslations(); updateAppVersionDisplay(); updateActiveLangButton(); saveGame(); if (upgradesPanel && !upgradesPanel.classList.contains('hidden')) renderUpgrades(); if (shopPanel && !shopPanel.classList.contains('hidden')) renderSkins(); } else if (!translations.greetingBase[lang]) { console.warn(`Language "${lang}" not found.`); } }
    function applyTranslations() { if (userGreetingElement) { let g = translations.greetingBase[currentLanguage] || "Лаборатория"; if (userName) g += ` ${userName}`; userGreetingElement.textContent = g; } document.querySelectorAll('[data-translate]').forEach(el => { const k = el.dataset.translate; const t = translations[k]?.[currentLanguage]; if (t && el.textContent !== t) el.textContent = t; else if (!t && k) console.warn(`Translation key "${k}" not found for lang "${currentLanguage}".`); }); const ps = perSecondDisplayDiv?.querySelector('span[data-translate="perSec"]'); if(ps) { const pt = translations.perSec?.[currentLanguage] || '/ sec'; if (ps.textContent !== pt) ps.textContent = pt; } shopTabsContainer?.querySelectorAll('.shop-tab[data-translate]').forEach(tab => { const k = tab.dataset.translate; const t = translations[k]?.[currentLanguage]; if (t && tab.textContent !== t) tab.textContent = t; }); }
    function updateAppVersionDisplay() { if (appVersionElement) { const prefix = translations.versionPrefix?.[currentLanguage] || "Version:"; appVersionElement.textContent = `${prefix} ${APP_VERSION}`; } }
    function updateActiveLangButton() { if (!languageOptionsContainer) return; languageOptionsContainer.querySelectorAll('.lang-btn').forEach(b => { if (b.dataset.lang) b.classList.toggle('active', b.dataset.lang === currentLanguage); }); }
    if (languageOptionsContainer) { languageOptionsContainer.addEventListener('click', (e) => { if (e.target instanceof HTMLElement && e.target.classList.contains('lang-btn')) { const l = e.target.dataset.lang; if (l) setLanguage(l); } }); } else { console.error("Language options container not found."); }

    // --- Обработчик ползунка громкости --- УДАЛЕН ---
    // if (volumeSliderElement) { /* ... */ }
    // --- --- --- --- --- --- --- --- --- --- --- ---

    // --- Логика реферальной системы (без изменений) ---
    function checkReferralAndBonus() { try { const sp = tg.initDataUnsafe?.start_param; const up = new URLSearchParams(window.location.search); const cp = up.get('claimBonus'); console.log("Launch Params:", { startParam: sp, claimBonusParam: cp }); if (cp) { handleBonusClaim(cp); cleanBonusUrlParam(); } else if (sp && !isNaN(parseInt(sp))) { const cuid = tg.initDataUnsafe?.user?.id?.toString(); if (sp !== cuid) { handleNewReferral(sp); } else { console.log("User opened via own ref link."); } } } catch (e) { console.error("Error checking ref/bonus params:", e); } }
    function handleNewReferral(invId) { console.log(`Handling new referral from inviter ID: ${invId}.`); /* TODO: Implement logic if needed (e.g., notify backend) */ }
    function handleBonusClaim(refId) { console.log(`Handling potential bonus claim for referral ID: ${refId}.`); /* TODO: Implement bonus claim logic (likely backend communication) */ }
    function cleanBonusUrlParam() { try { const url = new URL(window.location.href); if (url.searchParams.has('claimBonus')) { url.searchParams.delete('claimBonus'); window.history.replaceState({}, document.title, url.toString()); console.log("claimBonus param removed from URL."); } } catch (e) { console.error("Error cleaning URL param:", e); } }

    // --- Обработчик кнопки "Пригласить друзей" (без изменений) ---
    inviteFriendBtn.addEventListener('click', () => { console.log("[Invite Button] Clicked."); if (isBlocked) { console.warn("[Invite Button] Action blocked."); showTemporaryNotification(translations.actionBlocked[currentLanguage], "error"); return; } const versionCheck = tg.isVersionAtLeast('6.1'); console.log(`[Invite Button] isVersionAtLeast('6.1'): ${versionCheck}`); if (versionCheck) { const uid = tg.initDataUnsafe?.user?.id; const YOUR_BOT_USERNAME_PLACEHOLDER = 'AlchimLaboratory_Bot'; const botUsername = tg.initDataUnsafe?.bot?.username || YOUR_BOT_USERNAME_PLACEHOLDER; if (botUsername === YOUR_BOT_USERNAME_PLACEHOLDER && YOUR_BOT_USERNAME_PLACEHOLDER !== 'ВАШ_БОТ_USERNAME') { console.log(`[Invite Button] Using hardcoded bot username: ${botUsername}`); } else if (botUsername === YOUR_BOT_USERNAME_PLACEHOLDER) { console.warn(`[Invite Button] WARNING: Using DEFAULT placeholder bot username: '${botUsername}'. Please replace it in the code!`); } else { console.log(`[Invite Button] Using bot username from initData: ${botUsername}`); } console.log("[Invite Button] Data Check:", { uid, botUsername }); if (!uid || !botUsername || botUsername === 'ВАШ_БОТ_USERNAME') { console.error("[Invite Button] User ID missing or Bot username is missing/not replaced!"); if (botUsername === 'ВАШ_БОТ_USERNAME') { alert("ОШИБКА КОНФИГУРАЦИИ: Имя пользователя бота не задано в коде script.js! Обратитесь к разработчику."); } showTemporaryNotification(translations.inviteLinkError[currentLanguage], "error"); if (!uid) console.error("[Invite Button] Reason: User ID is missing."); if (!botUsername) console.error("[Invite Button] Reason: Bot Username is missing."); return; } const url = `https://t.me/${botUsername}?startapp=${uid}`; const txt = translations.shareText?.[currentLanguage] || 'Присоединяйся к моей Алхимической Лаборатории в Telegram! 🧪⚗️ Кликай и создавай эликсиры!'; console.log("[Invite Button] Generated link:", { url, txt }); try { console.log("[Invite Button] Attempting to call openTelegramLink for sharing..."); tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(txt)}`); console.log("[Invite Button] openTelegramLink called successfully (no immediate error)."); tg.HapticFeedback?.impactOccurred('light'); } catch (e) { console.error("[Invite Button] Error calling openTelegramLink for sharing:", e); showTemporaryNotification(translations.inviteLinkError[currentLanguage], "error"); } } else { console.warn("[Invite Button] Version check failed."); const errMsg = (translations.referralRegErrorFunc?.[currentLanguage] || "Feature unavailable") + " (v6.1+)"; showTemporaryNotification(errMsg, "warning"); } });

    // --- Сохранение/Загрузка (УБРАНА ГРОМКОСТЬ) ---
    let saveTimeout = null;
    function saveGame(immediate = false) {
        if (typeof tg?.CloudStorage?.setItem !== 'function') { return; }
        const saveData = () => {
            let vld = true;
            if (!Number.isFinite(essence) || essence < 0) { console.warn(`[Save Valid] Неверная эссенция ${essence}. Сброс до 0.`); essence = 0; vld = false; }
            if (!Number.isFinite(gems) || gems < 0) { console.warn(`[Save Valid] Неверные кристаллы ${gems}. Сброс до 0.`); gems = 0; vld = false; }
            if (!Array.isArray(ownedSkins) || !ownedSkins.includes('default')) { console.warn(`[Save Valid] Неверные купленные скины ${ownedSkins}. Сброс до ['default'].`); ownedSkins = ['default']; if (activeSkinId !== 'default') activeSkinId = 'default'; vld = false; }
            if (typeof activeSkinId !== 'string' || !ownedSkins.includes(activeSkinId)) { console.warn(`[Save Valid] Неверный активный скин ${activeSkinId}. Сброс до 'default'.`); activeSkinId = 'default'; vld = false; }
            upgrades.forEach(u => { if (!Number.isFinite(u.currentLevel) || u.currentLevel < 0) { console.warn(`[Save Valid] Неверный уровень улучшения ${u.id}: ${u.currentLevel}. Сброс до 0.`); u.currentLevel = 0; vld = false; } });
            if (typeof bonusClaimed !== 'boolean') { console.warn(`[Save Valid] Неверный флаг бонуса ${bonusClaimed}. Сброс до false.`); bonusClaimed = false; vld = false; }
            // --- Валидация громкости удалена ---

            if (!vld) console.warn("[Save] Данные были исправлены перед сохранением.");

            const gs = {
                essence: essence,
                gems: gems,
                upgrades: upgrades.map(u => ({ id: u.id, level: u.currentLevel })),
                language: currentLanguage,
                ownedSkins: ownedSkins,
                activeSkinId: activeSkinId,
                bonusClaimed: bonusClaimed,
                // volume: currentVolume, // <-- УДАЛЕНО
                saveVersion: 3 // Увеличиваем версию сохранения (опционально, т.к. поле просто удалено)
            };

            try {
                const gss = JSON.stringify(gs);
                try {
                    tg.CloudStorage.setItem('gameState', gss, (err, ok) => { if (err) { console.error("[Save Callback] Ошибка при вызове setItem:", err); } });
                } catch (setItemError) { console.error("[Save] КРИТИЧЕСКАЯ ошибка ПРЯМОГО вызова tg.CloudStorage.setItem:", setItemError); try { const errMsg = translations?.saveCritError?.[currentLanguage] ?? "Критическая ошибка сохранения!"; showTemporaryNotification(errMsg, "error"); } catch (notifyError) { console.error("[Save] Ошибка при показе уведомления об ошибке setItem:", notifyError);} }
            } catch (e) { console.error("[Save] Ошибка JSON.stringify:", e); try { const errMsg = translations?.saveCritError?.[currentLanguage] ?? "Критическая ошибка сохранения!"; showTemporaryNotification(errMsg, "error"); } catch (notifyError) { console.error("[Save] Ошибка при показе уведомления об ошибке JSON.stringify:", notifyError); } }
            saveTimeout = null;
        };
        if (saveTimeout) clearTimeout(saveTimeout);
        if (immediate) { saveData(); } else { saveTimeout = setTimeout(saveData, 1000); }
    }

    function loadGame() {
        console.log("[Load] Попытка загрузки...");
        isBlocked = false; warningCount = 0; if (cauldronElement) cauldronElement.classList.remove('blocked-cauldron');
        let setupDone = false;

        const postSetup = (isNew = false) => {
            if (setupDone) return;
            console.log("[Load] Выполнение пост-загрузочной настройки...");
            if (isNew) { console.log("[Load] Начало новой игры."); resetGameData(); }

            // --- Убрана установка громкости ---
            // if (volumeSliderElement) { volumeSliderElement.value = currentVolume; ... }
            // --- --- --- --- --- --- --- --- ---

            recalculateBonuses();
            applyTranslations();
            updateAppVersionDisplay();
            updateLiquidColor();
            visualLiquidLevel = LIQUID_MIN_LEVEL;
            lastInteractionTime = Date.now();
            applyCauldronSkin();
            updateDisplay();
            checkReferralAndBonus();
            updateBonusButtonVisibility();
            // --- Убран вызов initAudio ---
            console.log(`[Load] Пост-настройка завершена. Состояние: E:${formatNumber(essence)}, G:${gems}, Lng:${currentLanguage}, Skin:${activeSkinId}, Bonus:${bonusClaimed}`); // Убрана громкость из лога
            setupDone = true;
        };

        if (typeof tg?.CloudStorage?.getItem !== 'function') { console.warn("[Load] CloudStorage.getItem недоступен. Начало новой игры."); postSetup(true); showTemporaryNotification("Прогресс не будет сохранен.", "warning"); return; }

        try {
            tg.CloudStorage.getItem('gameState', (err, val) => {
                console.log("[Load Callback] Ответ от CloudStorage получен.");
                let reset = false;
                if (err) { if (typeof err === 'string' && err.includes("STORAGE_KEY_CLOUD_NOT_FOUND") || err?.message?.includes("STORAGE_KEY_CLOUD_NOT_FOUND")) { console.log("[Load Callback] Ключ 'gameState' не найден. Новая игра."); reset = true; } else if (err?.message?.includes("Unsupported") || (typeof err === 'string' && err.includes("Unsupported"))) { console.warn("[Load Callback] CloudStorage.getItem не поддерживается."); showTemporaryNotification("Сохранение/загрузка недоступны.", "warning"); reset = true; } else { showTemporaryNotification(translations.loadError[currentLanguage], "error"); reset = true; }
                } else if (val) {
                    console.log(`[Load Callback] Данные получены (${val ? val.length : 0} байт). Парсинг...`);
                    try {
                        const ss = JSON.parse(val);
                        console.log("[Load Parse] OK:", ss);
                        essence = Number(ss.essence) || 0; if (!Number.isFinite(essence) || essence < 0) { console.warn("[Load Valid] essence -> 0"); essence = 0; }
                        gems = Number(ss.gems) || 0; if (!Number.isFinite(gems) || gems < 0) { console.warn("[Load Valid] gems -> 0"); gems = 0; }
                        currentLanguage = ss.language || 'ru'; if (!translations.greetingBase[currentLanguage]) { console.warn(`[Load Valid] язык '${ss.language}' -> ru`); currentLanguage = 'ru'; }
                        // --- Загрузка громкости удалена ---
                        if (Array.isArray(ss.upgrades)) { upgrades.forEach(u => { const savedUpgrade = ss.upgrades.find(s => s.id === u.id); const level = Number(savedUpgrade?.level); u.currentLevel = (Number.isFinite(level) && level >= 0) ? level : 0; if (u.currentLevel !== 0 && !(Number.isFinite(level) && level >= 0)) console.warn(`[Load Valid] уровень улучш. ${u.id} (${savedUpgrade?.level}) -> 0`); }); } else { console.warn("[Load Valid] массив улучшений неверный -> все уровни 0"); upgrades.forEach(u => u.currentLevel = 0); }
                        ownedSkins = Array.isArray(ss.ownedSkins) ? ss.ownedSkins : ['default']; if (!ownedSkins.includes('default')) { ownedSkins.push('default'); console.warn("[Load Valid] добавлен скин 'default'."); }
                        activeSkinId = (typeof ss.activeSkinId === 'string' && ownedSkins.includes(ss.activeSkinId)) ? ss.activeSkinId : 'default'; if (ss.activeSkinId && !ownedSkins.includes(ss.activeSkinId)) console.warn(`[Load Valid] активный скин '${ss.activeSkinId}' не куплен -> 'default'`);
                        bonusClaimed = ss.bonusClaimed === true; if (ss.bonusClaimed !== undefined) console.log(`[Load] Статус бонуса загружен: ${bonusClaimed}`); else { bonusClaimed = false; console.warn("[Load Valid] Флаг бонуса отсутствовал -> false"); }
                        console.log("[Load] Данные успешно загружены.");
                    } catch (pe) { console.error("[Load Parse] Ошибка парсинга JSON:", pe, "Данные:", val); showTemporaryNotification(translations.readError[currentLanguage], "error"); reset = true; }
                } else { console.log("[Load Callback] Пустое значение от CloudStorage. Новая игра."); reset = true; }
                postSetup(reset);
            });
        } catch (se) { console.error("[Load Try] Критическая ошибка вызова CloudStorage.getItem:", se); showTemporaryNotification("Ошибка доступа к хранилищу.", "error"); postSetup(true); }
    }

    function resetGameData() {
        console.warn("Сброс игровых данных к значениям по умолчанию!");
        essence = 0; gems = 0; upgrades.forEach(u => u.currentLevel = 0); ownedSkins = ['default']; activeSkinId = 'default'; bonusClaimed = false; isBlocked = false; warningCount = 0;
        // currentVolume = 0.5; // <-- УДАЛЕНО
    }

    // --- Функция уведомлений (без изменений) ---
    function showTemporaryNotification(msg, type = "info", dur = 2500) { const oldN = document.querySelector('.notification'); if (oldN) oldN.remove(); const n = document.createElement('div'); n.className = `notification ${type}`; n.textContent = msg; document.body.appendChild(n); requestAnimationFrame(() => { n.style.opacity = '1'; n.style.transform = 'translate(-50%, 0)'; }); setTimeout(() => { n.style.opacity = '0'; n.style.transform = 'translate(-50%, 10px)'; setTimeout(() => { if (n.parentNode) n.remove(); }, 500); }, dur); }
    // --- Функция: Управляет видимостью кнопки бонуса (без изменений) ---
    function updateBonusButtonVisibility() { if (!oneTimeBonusBtn) return; if (bonusClaimed) { oneTimeBonusBtn.classList.add('hidden'); } else { oneTimeBonusBtn.classList.remove('hidden'); } console.log(`[Bonus Button] Visibility updated. Claimed: ${bonusClaimed}, Hidden: ${oneTimeBonusBtn.classList.contains('hidden')}`); }

    // --- Первоначальная инициализация ---
    loadGame();

    // --- Автосохранение и обработчики событий (без изменений) ---
    setInterval(() => saveGame(false), 3000);
    window.addEventListener('beforeunload', () => saveGame(true));
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveGame(true); });
    if (tg?.onEvent) { tg.onEvent('viewportChanged', (e) => { if (e && e.isStateStable) { console.log("Viewport стабилен, сохранение."); saveGame(false); } }); }
    let liquidColorInterval = setInterval(updateLiquidColor, 5 * 60 * 1000);

    // --- ОБРАБОТЧИК: Клик по кнопке одноразового бонуса (без изменений) ---
    if (oneTimeBonusBtn) { oneTimeBonusBtn.addEventListener('click', () => { if (isBlocked) { const message = translations.actionBlocked?.[currentLanguage] ?? "Действие заблокировано."; showTemporaryNotification(message, "error"); return; } if (!bonusClaimed) { console.log("Получение одноразового бонуса!"); tg.HapticFeedback?.notificationOccurred('success'); essence += 100000; bonusClaimed = true; const successMessage = translations.bonusClaimSuccess?.[currentLanguage] ?? "+100K 🧪 Бонус получен!"; showTemporaryNotification(successMessage, "success", 3000); updateBonusButtonVisibility(); updateDisplay(); saveGame(true); } else { console.log("Бонус уже был получен ранее."); tg.HapticFeedback?.notificationOccurred('warning'); const alreadyClaimedMsg = translations.bonusClaimedAlready?.[currentLanguage] ?? "Бонус уже получен."; showTemporaryNotification(alreadyClaimedMsg, "warning"); } }); } else { console.error("Кнопка одноразового бонуса не найдена!"); }

    // --- Очистка интервалов при необходимости (без изменений) ---
     window.addEventListener('unload', () => { if (bubbleInterval) clearInterval(bubbleInterval); if (autoClickInterval) clearInterval(autoClickInterval); if (uiInterval) clearInterval(uiInterval); if (liquidColorInterval) clearInterval(liquidColorInterval); if (saveTimeout) { clearTimeout(saveTimeout); saveGame(true); } console.log("Intervals cleared on unload."); });

}); // --- КОНЕЦ DOMContentLoaded ---