// Файл: script.js
document.addEventListener('DOMContentLoaded', () => {
    // Инициализация Telegram Web App
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    // --- Версия приложения ---
    const APP_VERSION = "1.79"; // Инкремент версии

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
    const languageOptionsContainer = settingsPanel ? settingsPanel.querySelector('.language-options') : null;
    const shopBtn = document.getElementById('shop-btn');
    const shopPanel = document.getElementById('shop-panel');
    const closeShopBtn = document.getElementById('close-shop-btn');
    const skinsListElement = document.getElementById('skins-list');
    const shopGemCountElement = document.getElementById('shop-gem-count');
    const oneTimeBonusBtn = document.getElementById('one-time-bonus-btn');
    const appVersionElement = document.getElementById('app-version');
    const shopTabsContainer = document.querySelector('.shop-tabs');
    const shopContentSections = document.querySelectorAll('.shop-content-section');
    const accessoriesListElement = document.getElementById('accessories-list');
    const accessoryDisplayArea = document.getElementById('accessory-display-area');
    const volumeSlider = document.getElementById('volume-slider'); // Слайдер громкости
    const volumeValueElement = document.getElementById('volume-value'); // Отображение % громкости
    const tapSoundElement = document.getElementById('tap-sound'); // Аудио элемент

    // Проверка критически важных элементов
    const requiredElements = {
        essenceCountElement, cauldronElement, openUpgradesBtn, essencePerSecondElement, gemCountElement,
        clickFeedbackContainer, closeUpgradesBtn, upgradesPanel, upgradesListElement, userGreetingElement,
        inviteFriendBtn, /* bubblesContainer, */ perSecondDisplayDiv, settingsBtn, settingsPanel, closeSettingsBtn,
        shopBtn, shopPanel, closeShopBtn, skinsListElement, shopGemCountElement, oneTimeBonusBtn, appVersionElement,
        shopTabsContainer, shopContentSections, accessoriesListElement, accessoryDisplayArea,
        volumeSlider, volumeValueElement, tapSoundElement // Добавляем новые
    };

    let criticalError = false;
    for (const key in requiredElements) {
        if (!requiredElements[key]) {
             // Пропускаем bubblesContainer как некритичный
             if (key !== 'bubblesContainer') {
                  console.error(`КРИТИЧЕСКАЯ ОШИБКА: Элемент DOM не найден: ${key}.`);
                  criticalError = true;
             } else {
                  console.warn("Предупреждение: Элемент bubblesContainer не найден. Пузырьки не будут работать.");
             }
        }
    }
     if (shopContentSections.length < 2) { console.error("КРИТИЧЕСКАЯ ОШИБКА: Не найдены секции контента магазина."); criticalError = true; }

    if (criticalError) { alert("Произошла ошибка при загрузке интерфейса. Пожалуйста, попробуйте перезапустить приложение."); return; }


    // --- Игровые переменные (состояние) ---
    let essence = 0;
    let essencePerClick = 1;
    let essencePerSecond = 0;
    let gems = 0;
    let ownedSkins = ['default'];
    let activeSkinId = 'default';
    let ownedAccessories = [];
    let activeAccessoryId = null;
    const GEM_AWARD_CHANCE = 0.03;
    const GEMS_PER_AWARD = 1;
    let currentLanguage = 'ru';
    let userName = tg.initDataUnsafe?.user?.first_name || null;
    let bonusClaimed = false;
    const DEFAULT_VOLUME = 0.5;
    let currentVolume = DEFAULT_VOLUME;

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
        selectButton: { ru: "Выбрать", en: "Select" }, // Для скинов
        selectedButton: { ru: "Выбрано", en: "Selected" }, // Для скинов
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
        bonusClaimedAlready: { ru: "Бонус уже получен.", en: "Bonus already claimed." },
        bonusClaimSuccess: { ru: "+100K 🧪 Бонус получен!", en: "+100K 🧪 Bonus claimed!" },
        versionPrefix: { ru: "Версия:", en: "Version:" },
        shopTabSkins: { ru: "Скины", en: "Skins" },
        shopTabAccessories: { ru: "Аксессуары", en: "Accessories" },
        accessoryPurchaseSuccess: { ru: "Аксессуар куплен!", en: "Accessory purchased!" },
        accessoryEquipped: { ru: "Аксессуар установлен!", en: "Accessory equipped!" },
        accessoryUnequipped: { ru: "Аксессуар снят.", en: "Accessory unequipped." },
        equipButton: { ru: "Установить", en: "Equip" },
        unequipButton: { ru: "Снять", en: "Unequip" },
        equippedButton: { ru: "Установлено", en: "Equipped" },
        accessory_none_name: { ru: "Без аксессуара", en: "No Accessory" },
        accessory_runic_base_name: { ru: "Руническое основание", en: "Runic Base" },
        accessory_metal_stand_name: { ru: "Металлическая подставка", en: "Metal Stand" },
        accessory_burning_stand_name: { ru: "Горящая подставка", en: "Burning Stand" },
        volumeTitle: { ru: "Громкость", en: "Volume" },
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

    // --- Определения аксессуаров ---
    const availableAccessories = [
        { id: 'runic-base', nameKey: 'accessory_runic_base_name', cost: 25, cssClass: 'runic-base', previewCssClass: 'accessory-runic-base' },
        { id: 'metal-stand', nameKey: 'accessory_metal_stand_name', cost: 40, cssClass: 'metal-stand', previewCssClass: 'accessory-metal-stand' },
        { id: 'burning-stand', nameKey: 'accessory_burning_stand_name', cost: 75, cssClass: 'burning-stand', previewCssClass: 'accessory-burning-stand' },
    ];

    // --- Функции для пузырьков ---
    function createBubble() {
        if (!bubblesContainer) return;
        const b = document.createElement('div'); b.classList.add('bubble');
        const s = Math.random() * 8 + 6; const d = Math.random() * 2.5 + 3; const l = Math.random() * 1.5; const h = Math.random() * 90 + 5;
        b.style.width = `${s}px`; b.style.height = `${s}px`; b.style.left = `${h}%`; b.style.animationDuration = `${d}s`; b.style.animationDelay = `${l}s`;
        try { bubblesContainer.appendChild(b); } catch (e) { if (e.name !== 'NotFoundError') { console.error("Ошибка добавления пузырька:", e); } }
        setTimeout(() => { if (b.parentNode) { b.remove(); } }, (d + l) * 1000 + 100);
    }
    let bubbleInterval = null;
    if (bubblesContainer) { bubbleInterval = setInterval(createBubble, 500); }

    // --- Функция обновления визуала жидкости ---
    function updateLiquidLevelVisual(percentage) { if (!cauldronElement) return; const l = Math.max(LIQUID_MIN_LEVEL, Math.min(LIQUID_MAX_LEVEL, percentage)); cauldronElement.style.setProperty('--liquid-level', `${l}%`); if(bubblesContainer) { bubblesContainer.style.height = `${l}%`; } }

    // --- Функции для динамического цвета жидкости ---
    function getLondonHour() { const now = new Date(); return now.getUTCHours(); }
    function getLiquidColorByLondonTime() { const hour = getLondonHour(); const alpha = 0.35; if (hour >= 22 || hour < 5) return `rgba(40, 40, 100, ${alpha})`; if (hour >= 5 && hour < 7)  return `rgba(255, 150, 100, ${alpha})`; if (hour >= 7 && hour < 11) return `rgba(100, 180, 220, ${alpha})`; if (hour >= 11 && hour < 17) return `rgba(220, 220, 100, ${alpha})`; if (hour >= 17 && hour < 20) return `rgba(255, 120, 50, ${alpha})`; return `rgba(70, 70, 150, ${alpha})`; }
    function updateLiquidColor() { if (!cauldronElement) return; const color = getLiquidColorByLondonTime(); cauldronElement.style.setProperty('--liquid-color', color); }

    // --- Общая функция обновления UI ---
    function updateDisplay() {
        if (essenceCountElement) essenceCountElement.textContent = formatNumber(Math.floor(essence));
        if (essencePerSecondElement && perSecondDisplayDiv) { essencePerSecondElement.textContent = formatNumber(essencePerSecond); perSecondDisplayDiv.style.display = essencePerSecond > 0 ? 'block' : 'none'; }
        if (gemCountElement) gemCountElement.textContent = formatNumber(gems);
        updateLiquidLevelVisual(visualLiquidLevel);
        if (upgradesPanel && !upgradesPanel.classList.contains('hidden')) updateUpgradeButtonStates();
        if (shopPanel && !shopPanel.classList.contains('hidden')) {
             updateShopButtonStates();
             if (shopGemCountElement) shopGemCountElement.textContent = formatNumber(gems);
        }
         if (settingsPanel && !settingsPanel.classList.contains('hidden') && volumeValueElement) {
             volumeValueElement.textContent = `${Math.round(currentVolume * 100)}%`;
         }
    }

    // --- Функция форматирования чисел ---
    function formatNumber(num) { if (isNaN(num) || !Number.isFinite(num)) { console.warn("formatNumber: некорректное значение", num); return "ERR"; } if (num < 1000) return num.toString(); const ab = ["", "K", "M", "B", "T", "q", "Q", "s", "S", "O", "N", "d", "U"]; let i = 0; let t = num; while (t >= 1000 && i < ab.length - 1) { t /= 1000; i++; } return (t % 1 === 0 ? t.toString() : t.toFixed(1)) + ab[i]; }

    // --- Функция для отображения "+N" при клике ---
    function showClickFeedback(amount, type = 'essence') { if (isBlocked || !clickFeedbackContainer) return; const fb = document.createElement('div'); fb.className = 'click-feedback'; const fa = formatNumber(amount); if (type === 'gem') { const si = `<span class="gem-icon" style="display:inline-flex; vertical-align: middle; margin-left: 4px;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" fill="var(--gem-color)"><path d="M12 1.68l-8 8.42L12 22.32l8-8.42L12 1.68zm0 2.1l5.95 6.27L12 18.54l-5.95-6.27L12 3.78z M6.4 10.1L12 16.1l5.6-6H6.4z"></path></svg></span>`; fb.innerHTML = `+${fa}${si}`; fb.style.cssText = 'font-size: 1.3em; font-weight: bold; color: var(--gem-color);'; } else { fb.textContent = `+${fa} 🧪`; fb.style.color = 'var(--accent-color)'; } const ox = Math.random() * 60 - 30; const oy = (type === 'gem') ? (Math.random() * 20 + 15) : (Math.random() * 20 - 10); fb.style.left = `calc(50% + ${ox}px)`; fb.style.top = `calc(50% + ${oy}px)`; clickFeedbackContainer.appendChild(fb); setTimeout(() => { if (fb.parentNode) fb.remove(); }, 950); }

    // --- Воспроизведение звука ---
    function playSound(audioElement) {
        if (!audioElement || currentVolume <= 0) return;
        try {
            audioElement.volume = currentVolume;
            audioElement.currentTime = 0;
            // play() возвращает промис, его лучше обработать
            const playPromise = audioElement.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    // Частая ошибка: пользователь не взаимодействовал со страницей
                    // console.warn("Не удалось воспроизвести звук:", error.name, error.message);
                });
            }
        } catch (e) { console.error("Ошибка воспроизведения звука:", e); }
    }

    // --- Логика клика по котлу ---
    cauldronElement.addEventListener('click', () => {
        const now = Date.now();
        if (isBlocked) { showTemporaryNotification(translations.autoclickerBlocked[currentLanguage], "error"); return; }

        playSound(tapSoundElement); // Звук тапа
        tg.HapticFeedback?.impactOccurred('light');

        if (now - lastClickTime >= MIN_CLICK_INTERVAL) {
            warningCount = 0; lastInteractionTime = now;
            const ca = essencePerClick; if (Number.isFinite(ca) && ca > 0) { essence += ca; showClickFeedback(ca, 'essence'); } else { console.error("Invalid essencePerClick:", ca); }
            if (Math.random() < GEM_AWARD_CHANCE) { gems += GEMS_PER_AWARD; console.log(`+${GEMS_PER_AWARD} gem! Total: ${gems}`); showClickFeedback(GEMS_PER_AWARD, 'gem'); tg.HapticFeedback?.impactOccurred('medium'); /* updateDisplay(); - убран, т.к. ниже */ }
            visualLiquidLevel = Math.min(visualLiquidLevel + LIQUID_INCREASE_PER_CLICK, LIQUID_MAX_LEVEL);
            updateDisplay();
            cauldronElement.style.transform = 'scale(0.95)'; setTimeout(() => { if(cauldronElement) cauldronElement.style.transform = 'scale(1)'; }, 80);
            lastClickTime = now;
        } else {
            warningCount++; lastInteractionTime = now; console.warn(`Fast click ${warningCount}/${MAX_WARNINGS}`); showTemporaryNotification(`${translations.tooFastClick[currentLanguage]} (${warningCount}/${MAX_WARNINGS})`, "warning"); tg.HapticFeedback?.impactOccurred('medium');
            if (warningCount >= MAX_WARNINGS) { isBlocked = true; console.error("Autoclicker blocked."); showTemporaryNotification(translations.autoclickerBlocked[currentLanguage], "error"); tg.HapticFeedback?.notificationOccurred('error'); if(cauldronElement) cauldronElement.classList.add('blocked-cauldron'); }
        }
    });

    // --- Логика авто-клика ---
    let autoClickInterval = null; try { autoClickInterval = setInterval(() => { if (!isBlocked && essencePerSecond > 0 && Number.isFinite(essencePerSecond)) { const ea = essencePerSecond / 10; if (Number.isFinite(ea) && ea > 0) { essence += ea; } else if (ea !== 0) { console.warn("Invalid auto-click essence portion:", ea); } } }, 100); } catch(e) { console.error("Error in auto-click interval:", e); }

    // --- Интервал обновления UI/жидкости ---
    let uiInterval = null; try { uiInterval = setInterval(() => { const now = Date.now(); if (!isBlocked && now - lastInteractionTime > IDLE_TIMEOUT && visualLiquidLevel > LIQUID_MIN_LEVEL) { visualLiquidLevel = Math.max(visualLiquidLevel - LIQUID_DECAY_RATE, LIQUID_MIN_LEVEL); } updateDisplay(); }, LIQUID_UPDATE_INTERVAL); } catch(e) { console.error("Error in UI update interval:", e); }

    // --- Логика улучшений ---
    function calculateCost(upg) { if (!upg || typeof upg.baseCost !== 'number' || typeof upg.costMultiplier !== 'number' || typeof upg.currentLevel !== 'number') { console.error("Invalid upgrade data for cost calculation:", upg); return Infinity; } return Math.floor(upg.baseCost * Math.pow(upg.costMultiplier, upg.currentLevel)); }
    function renderUpgrades() { if (!upgradesListElement) return; upgradesListElement.innerHTML = ''; upgrades.sort((a, b) => (a.requiredEssence || 0) - (b.requiredEssence || 0)); if (upgrades.length === 0) { upgradesListElement.innerHTML = `<li><p>Нет улучшений.</p></li>`; return; } const cef = Math.floor(essence); upgrades.forEach(upg => { const cost = calculateCost(upg); if (!Number.isFinite(cost)) { console.error("Skip rendering upgrade with invalid cost:", upg.id, cost); return; } const req = upg.requiredEssence || 0; const lock = cef < req; const aff = cef >= cost; const li = document.createElement('li'); li.dataset.upgradeId = upg.id; li.classList.toggle('locked', lock); li.classList.toggle('cannot-afford', !lock && !aff); const tName = translations[upg.nameKey]?.[currentLanguage] || upg.nameKey; const tDesc = translations[upg.descKey]?.[currentLanguage] || upg.descKey; const btnBuy = translations.buyButton?.[currentLanguage] || "Купить"; const preReq = translations.requirementPrefix?.[currentLanguage] || "Нужно"; const infReq = translations.requirementInfoPrefix?.[currentLanguage] || "Требуется"; let btnTxt = btnBuy; let dis = lock || !aff; if (lock) { btnTxt = `${preReq} ${formatNumber(req)} 🧪`; } li.innerHTML = `<div class="upgrade-info"><h3>${tName} (Ур. ${upg.currentLevel})</h3><p>${tDesc}</p><p class="upgrade-cost">Цена: ${formatNumber(cost)} 🧪</p><p class="requirement-info">${infReq}: ${formatNumber(req)} 🧪</p></div><button class="buy-upgrade-btn" data-upgrade-id="${upg.id}">${btnTxt}</button>`; const btn = li.querySelector('.buy-upgrade-btn'); if (btn) { btn.disabled = dis; btn.addEventListener('click', (e) => { e.stopPropagation(); if (!btn.disabled) { buyUpgrade(upg.id); } else { console.log("Clicked disabled upgrade button:", upg.id); tg.HapticFeedback?.notificationOccurred('warning'); if (lock) { showTemporaryNotification(`${infReq}: ${formatNumber(req)} 🧪`, "warning"); } else if (!aff) { showTemporaryNotification(translations.notEnoughEssence[currentLanguage], "warning"); } } }); } upgradesListElement.appendChild(li); }); }
    function buyUpgrade(id) { if (isBlocked) { showTemporaryNotification(translations.actionBlocked[currentLanguage], "error"); return; } const upg = upgrades.find(u => u.id === id); if (!upg) { console.error("Upgrade not found:", id); return; } const req = upg.requiredEssence || 0; if (Math.floor(essence) < req) { showTemporaryNotification(`${translations.requirementInfoPrefix[currentLanguage]}: ${formatNumber(req)} 🧪`, "warning"); tg.HapticFeedback?.notificationOccurred('warning'); return; } const cost = calculateCost(upg); if (!Number.isFinite(cost)) { showTemporaryNotification(translations.invalidCostError[currentLanguage], "error"); console.error("Attempted buy with invalid cost:", id, cost); return; } if (essence >= cost) { essence -= cost; upg.currentLevel++; recalculateBonuses(); renderUpgrades(); saveGame(); updateDisplay(); tg.HapticFeedback?.impactOccurred('light'); } else { showTemporaryNotification(translations.notEnoughEssence[currentLanguage], "warning"); tg.HapticFeedback?.notificationOccurred('warning'); } }
    function recalculateBonuses() { let cb = 0; let ab = 0; upgrades.forEach(u => { if (u.currentLevel > 0 && Number.isFinite(u.value) && typeof u.type === 'string') { const b = u.value * u.currentLevel; if (u.type === 'click') cb += b; else if (u.type === 'auto') ab += b; } else if (u.currentLevel > 0) { console.warn("Invalid upgrade data for bonus calc:", u); } }); essencePerClick = 1 + cb; essencePerSecond = ab; if (!Number.isFinite(essencePerClick) || essencePerClick < 1) { console.error("Invalid final essencePerClick:", essencePerClick); essencePerClick = 1; } if (!Number.isFinite(essencePerSecond) || essencePerSecond < 0) { console.error("Invalid final essencePerSecond:", essencePerSecond); essencePerSecond = 0; } }
    function updateUpgradeButtonStates() { if (!upgradesListElement || !upgradesPanel || upgradesPanel.classList.contains('hidden')) return; const cef = Math.floor(essence); const items = upgradesListElement.querySelectorAll('li[data-upgrade-id]'); items.forEach(li => { const btn = li.querySelector('.buy-upgrade-btn'); const id = li.dataset.upgradeId; if (!btn || !id) return; const upg = upgrades.find(u => u.id === id); if (!upg) return; const cost = calculateCost(upg); const req = upg.requiredEssence || 0; const lock = cef < req; const aff = cef >= cost; const dis = lock || !aff; li.classList.toggle('locked', lock); li.classList.toggle('cannot-afford', !lock && !aff); if (btn.disabled !== dis) btn.disabled = dis; let btnTxt = translations.buyButton[currentLanguage]; if (lock) btnTxt = `${translations.requirementPrefix[currentLanguage]} ${formatNumber(req)} 🧪`; if (btn.textContent !== btnTxt && (!dis || lock)) btn.textContent = btnTxt; const ce = li.querySelector('.upgrade-cost'); if (ce) { const ct = `Цена: ${formatNumber(cost)} 🧪`; if (ce.textContent !== ct) ce.textContent = ct; } const rie = li.querySelector('.requirement-info'); if (rie) { const rt = `${translations.requirementInfoPrefix[currentLanguage]}: ${formatNumber(req)} 🧪`; if (rie.textContent !== rt) rie.textContent = rt; const sv = lock; if ((rie.style.display === 'none') === sv) rie.style.display = sv ? 'block' : 'none'; } }); }

    // --- Логика магазина ---
    function renderSkins() { if (!skinsListElement) return; skinsListElement.innerHTML = ''; availableSkins.forEach(skin => { const isOwned = ownedSkins.includes(skin.id); const isActive = activeSkinId === skin.id; const canAfford = gems >= skin.cost; const li = createShopItemElement(skin, 'skin', isOwned, isActive, canAfford); skinsListElement.appendChild(li); }); }
    function renderAccessories() { if (!accessoriesListElement) return; accessoriesListElement.innerHTML = ''; availableAccessories.forEach(acc => { const isOwned = ownedAccessories.includes(acc.id); const isActive = activeAccessoryId === acc.id; const canAfford = gems >= acc.cost; const li = createShopItemElement(acc, 'accessory', isOwned, isActive, canAfford); accessoriesListElement.appendChild(li); }); }
    function createShopItemElement(item, itemType, isOwned, isActive, canAfford) { const li = document.createElement('li'); li.dataset.itemId = item.id; li.dataset.itemType = itemType; li.classList.toggle('active-item', isActive); const tName = translations[item.nameKey]?.[currentLanguage] || item.nameKey; const btnBuy = translations.buyButton[currentLanguage]; const btnSelect = (itemType === 'skin') ? translations.selectButton[currentLanguage] : translations.equipButton[currentLanguage]; const btnSelected = (itemType === 'skin') ? translations.selectedButton[currentLanguage] : translations.equippedButton[currentLanguage]; const btnUnequip = translations.unequipButton[currentLanguage]; const gemSvg = `<span class="gem-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" fill="var(--gem-color)"><path d="M12 1.68l-8 8.42L12 22.32l8-8.42L12 1.68zm0 2.1l5.95 6.27L12 18.54l-5.95-6.27L12 3.78z M6.4 10.1L12 16.1l5.6-6H6.4z"/></svg></span>`; let buttonHtml = ''; if (isActive) { if (itemType === 'accessory') { buttonHtml = `<button class="item-action-btn deselect-btn" data-item-id="${item.id}" data-item-type="${itemType}">${btnUnequip}</button>`; } else { buttonHtml = `<button class="item-action-btn selected-btn" disabled>${btnSelected}</button>`; } } else if (isOwned) { buttonHtml = `<button class="item-action-btn select-btn" data-item-id="${item.id}" data-item-type="${itemType}">${btnSelect}</button>`; } else { buttonHtml = `<button class="item-action-btn buy-btn" data-item-id="${item.id}" data-item-type="${itemType}" ${!canAfford ? 'disabled' : ''}>${btnBuy}</button>`; } const previewClass = itemType === 'skin' ? `skin-preview ${item.cssClass || ''}` : `accessory-preview ${item.previewCssClass || ''}`; const previewHtml = `<div class="${previewClass}"></div>`; li.innerHTML = ` ${previewHtml} <div class="item-info"> <h3>${tName}</h3> ${item.cost > 0 ? `<p class="item-cost">${gemSvg} ${formatNumber(item.cost)}</p>` : '<p class="item-cost" style="height: 1.2em;"> </p>'} </div> ${buttonHtml} `; const actionButton = li.querySelector('.item-action-btn:not(.selected-btn)'); if (actionButton) { actionButton.addEventListener('click', (e) => { const button = e.currentTarget; const itemId = button.dataset.itemId; const type = button.dataset.itemType; if (button && !button.disabled && itemId && type) { handleShopItemAction(itemId, type); } else if (button && button.disabled) { console.log(`Clicked disabled ${type} button:`, itemId); tg.HapticFeedback?.notificationOccurred('warning'); if (button.classList.contains('buy-btn')) { const clickedItem = (type === 'skin' ? availableSkins : availableAccessories).find(i => i.id === itemId); if (clickedItem && gems < clickedItem.cost) { showTemporaryNotification(translations.notEnoughGems[currentLanguage], "warning"); } } } else { console.error("Missing data on shop item button:", {itemId, type, button}) } }); } return li; }
    function handleShopItemAction(itemId, itemType) { if (isBlocked) { showTemporaryNotification(translations.actionBlocked[currentLanguage], "error"); return; } const item = (itemType === 'skin' ? availableSkins : availableAccessories).find(i => i.id === itemId); if (!item) { console.error(`${itemType} not found:`, itemId); return; } const isOwned = (itemType === 'skin' ? ownedSkins.includes(itemId) : ownedAccessories.includes(itemId)); const isActive = (itemType === 'skin' ? activeSkinId === itemId : activeAccessoryId === itemId); console.log(`Action for ${itemType} ${itemId}: Owned=${isOwned}, Active=${isActive}`); if (isActive) { if (itemType === 'accessory') { setActiveAccessory(null); } } else if (isOwned) { if (itemType === 'skin') { setActiveSkin(itemId); } else { setActiveAccessory(itemId); } } else { buyShopItem(itemId, itemType); } }
    function buyShopItem(itemId, itemType) { const itemData = itemType === 'skin' ? availableSkins : availableAccessories; const ownedData = itemType === 'skin' ? ownedSkins : ownedAccessories; const item = itemData.find(i => i.id === itemId); if (!item || ownedData.includes(itemId) || item.cost <= 0) { console.warn(`Cannot buy ${itemType} (not found, owned, or free):`, itemId); return; } if (gems >= item.cost) { gems -= item.cost; ownedData.push(itemId); if (itemType === 'skin') { console.log(`Skin purchased: ${itemId}. Gems left: ${gems}`); showTemporaryNotification(translations.skinPurchaseSuccess[currentLanguage], "success"); setActiveSkin(itemId); } else { console.log(`Accessory purchased: ${itemId}. Gems left: ${gems}`); showTemporaryNotification(translations.accessoryPurchaseSuccess[currentLanguage], "success"); setActiveAccessory(itemId); } tg.HapticFeedback?.notificationOccurred('success'); saveGame(); updateDisplay(); } else { console.log(`Not enough gems for ${itemType}: ${itemId}. Need: ${item.cost}, Have: ${gems}`); showTemporaryNotification(translations.notEnoughGems[currentLanguage], "warning"); tg.HapticFeedback?.notificationOccurred('warning'); } }
    function setActiveSkin(id) { if (!ownedSkins.includes(id)) { console.error(`Attempt to activate unowned skin: ${id}`); return; } if (activeSkinId !== id) { activeSkinId = id; console.log(`Active skin set to: ${id}`); applyCauldronSkin(); if (shopPanel && !shopPanel.classList.contains('hidden')) { renderSkins(); updateShopButtonStates(); } saveGame(); showTemporaryNotification(translations.skinSelected[currentLanguage], "info"); tg.HapticFeedback?.impactOccurred('light'); } }
    function setActiveAccessory(id) { if (id !== null && !ownedAccessories.includes(id)) { console.error(`Attempt to activate unowned accessory: ${id}`); return; } if (activeAccessoryId !== id) { activeAccessoryId = id; console.log(`Active accessory set to: ${id}`); applyAccessoryVisuals(); if (shopPanel && !shopPanel.classList.contains('hidden')) { renderAccessories(); updateShopButtonStates(); } saveGame(); if (id === null) { showTemporaryNotification(translations.accessoryUnequipped[currentLanguage], "info"); } else { showTemporaryNotification(translations.accessoryEquipped[currentLanguage], "info"); } tg.HapticFeedback?.impactOccurred('light'); } }
    function applyCauldronSkin() { if (!cauldronElement) return; const activeSkin = availableSkins.find(s => s.id === activeSkinId); const skinClass = activeSkin?.cssClass || 'skin-default'; availableSkins.forEach(s => { if (s.cssClass) cauldronElement.classList.remove(s.cssClass); }); cauldronElement.classList.add(skinClass); }
    function applyAccessoryVisuals() { if (!accessoryDisplayArea) return; const activeAccessory = availableAccessories.find(a => a.id === activeAccessoryId); const accessoryClass = activeAccessory?.cssClass; const classList = accessoryDisplayArea.classList; for (let i = classList.length - 1; i >= 0; i--) { const className = classList[i]; if (className.startsWith('accessory-active-')) { classList.remove(className); } } accessoryDisplayArea.classList.remove('active'); if (accessoryClass) { accessoryDisplayArea.classList.add(`accessory-active-${accessoryClass}`); accessoryDisplayArea.classList.add('active'); console.log(`Applied accessory class: accessory-active-${accessoryClass}`); } else { console.log(`No active accessory.`); } }
    function updateShopButtonStates() { if (!shopPanel || shopPanel.classList.contains('hidden')) return; const activeTabButton = shopTabsContainer.querySelector('.shop-tab-button.active'); if (!activeTabButton) return; const activeTabType = activeTabButton.dataset.tab; if (activeTabType === 'skins') { updateItemButtonState(skinsListElement, availableSkins, ownedSkins, activeSkinId, 'skin'); } else if (activeTabType === 'accessories') { updateItemButtonState(accessoriesListElement, availableAccessories, ownedAccessories, activeAccessoryId, 'accessory'); } }
    function updateItemButtonState(listElement, availableItems, ownedItems, activeItemId, itemType) { if (!listElement) return; const items = listElement.querySelectorAll('li[data-item-id]'); items.forEach(li => { const id = li.dataset.itemId; if (!id) return; const item = availableItems.find(i => i.id === id); if (!item) return; const buyBtn = li.querySelector('.item-action-btn.buy-btn'); const isOwned = ownedItems.includes(id); if (buyBtn && !isOwned) { const canAfford = gems >= item.cost; if (buyBtn.disabled === canAfford) { buyBtn.disabled = !canAfford; } } const isActive = activeItemId === id; li.classList.toggle('active-item', isActive); }); }
    function switchShopTab(targetTab) { shopTabsContainer.querySelectorAll('.shop-tab-button').forEach(btn => btn.classList.remove('active')); shopContentSections.forEach(section => section.classList.remove('active')); const targetTabButton = shopTabsContainer.querySelector(`button[data-tab="${targetTab}"]`); const targetSection = document.getElementById(`shop-section-${targetTab}`); if (targetTabButton && targetSection) { targetTabButton.classList.add('active'); targetSection.classList.add('active'); if (targetTab === 'skins') { renderSkins(); } else if (targetTab === 'accessories') { renderAccessories(); } updateShopButtonStates(); console.log(`Switched to shop tab: ${targetTab}`); } else { console.error(`Cannot switch to shop tab: ${targetTab}. Button or section not found.`); const skinsTabButton = shopTabsContainer.querySelector('button[data-tab="skins"]'); const skinsSection = document.getElementById('shop-section-skins'); if (skinsTabButton && skinsSection) { skinsTabButton.classList.add('active'); skinsSection.classList.add('active'); renderSkins(); updateShopButtonStates(); } } }
    shopTabsContainer.addEventListener('click', (e) => { if (e.target.classList.contains('shop-tab-button') && !e.target.classList.contains('active')) { const targetTab = e.target.dataset.tab; if (targetTab) { switchShopTab(targetTab); tg.HapticFeedback?.impactOccurred('light'); } } });
    function renderShop() { if (!shopPanel || shopPanel.classList.contains('hidden')) return; const activeTabButton = shopTabsContainer.querySelector('.shop-tab-button.active'); const activeTab = activeTabButton ? activeTabButton.dataset.tab : 'skins'; renderSkins(); renderAccessories(); switchShopTab(activeTab); }

    // --- Открытие/Закрытие панелей ---
    function closeAllPanels() { if(settingsPanel) settingsPanel.classList.add('hidden'); if(upgradesPanel) upgradesPanel.classList.add('hidden'); if(shopPanel) shopPanel.classList.add('hidden'); }
    function openPanel(panel, setupFunction = null) { if (!panel) return; closeAllPanels(); if (setupFunction) setupFunction(); panel.classList.remove('hidden'); tg.HapticFeedback?.impactOccurred('light'); }

    if (openUpgradesBtn) openUpgradesBtn.addEventListener('click', () => openPanel(upgradesPanel, renderUpgrades));
    if (settingsBtn) settingsBtn.addEventListener('click', () => {
        openPanel(settingsPanel, () => {
            updateActiveLangButton();
            if (volumeSlider) volumeSlider.value = currentVolume;
            if (volumeValueElement) volumeValueElement.textContent = `${Math.round(currentVolume * 100)}%`;
        });
    });
    if (shopBtn) shopBtn.addEventListener('click', () => {
        openPanel(shopPanel, () => {
            const activeTabButton = shopTabsContainer.querySelector('.shop-tab-button.active');
            const currentTab = activeTabButton ? activeTabButton.dataset.tab : 'skins';
            switchShopTab(currentTab);
             if (shopGemCountElement) shopGemCountElement.textContent = formatNumber(gems);
        });
    });
    if (closeUpgradesBtn) closeUpgradesBtn.addEventListener('click', closeAllPanels);
    if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', closeAllPanels);
    if (closeShopBtn) closeShopBtn.addEventListener('click', closeAllPanels);
    if (settingsPanel) settingsPanel.addEventListener('click', (e) => { if (e.target === settingsPanel) closeAllPanels(); });

    // --- Логика Настроек (язык и ГРОМКОСТЬ) ---
    function setLanguage(lang) { if (translations.greetingBase[lang] && lang !== currentLanguage) { currentLanguage = lang; console.log(`Language changed to: ${currentLanguage}`); applyTranslations(); updateAppVersionDisplay(); updateActiveLangButton(); if (upgradesPanel && !upgradesPanel.classList.contains('hidden')) renderUpgrades(); if (shopPanel && !shopPanel.classList.contains('hidden')) renderShop(); saveGame(); } else if (!translations.greetingBase[lang]) { console.warn(`Language "${lang}" not found.`); } }
    function applyTranslations() { if (userGreetingElement) { let g = translations.greetingBase[currentLanguage] || "Лаборатория"; if (userName) g += ` ${userName}`; userGreetingElement.textContent = g; } document.querySelectorAll('[data-translate]').forEach(el => { const k = el.dataset.translate; const t = translations[k]?.[currentLanguage]; if (t && el.textContent !== t) el.textContent = t; else if (!t && k) console.warn(`Translation key "${k}" not found for lang "${currentLanguage}".`); }); const ps = perSecondDisplayDiv?.querySelector('span[data-translate="perSec"]'); if(ps) { const pt = translations.perSec?.[currentLanguage] || '/ sec'; if (ps.textContent !== pt) ps.textContent = pt; } }
    function updateAppVersionDisplay() { if (appVersionElement) { const prefix = translations.versionPrefix?.[currentLanguage] || "Version:"; appVersionElement.textContent = `${prefix} ${APP_VERSION}`; } }
    function updateActiveLangButton() { if (!languageOptionsContainer) return; languageOptionsContainer.querySelectorAll('.lang-btn').forEach(b => { if (b.dataset.lang) b.classList.toggle('active', b.dataset.lang === currentLanguage); }); }
    if (languageOptionsContainer) { languageOptionsContainer.addEventListener('click', (e) => { if (e.target instanceof HTMLElement && e.target.classList.contains('lang-btn')) { const l = e.target.dataset.lang; if (l) setLanguage(l); } }); } else { console.error("Language options container not found."); }

    // Обработчик слайдера громкости
    if (volumeSlider && volumeValueElement) {
        volumeSlider.addEventListener('input', () => {
            const newVolume = parseFloat(volumeSlider.value);
            if (!isNaN(newVolume) && newVolume >= 0 && newVolume <= 1) {
                currentVolume = newVolume;
                volumeValueElement.textContent = `${Math.round(currentVolume * 100)}%`;
                 if (tapSoundElement) { tapSoundElement.volume = currentVolume; }
                saveGame(false); // Сохраняем с debounce
            }
        });
         volumeSlider.addEventListener('change', () => {
             playSound(tapSoundElement); // Тестовый звук при отпускании
             saveGame(true); // Сохраняем немедленно
         });
    } else { console.error("Элементы управления громкостью не найдены!"); }

    // --- Логика реферальной системы ---
    function checkReferralAndBonus() { try { const sp = tg.initDataUnsafe?.start_param; const up = new URLSearchParams(window.location.search); const cp = up.get('claimBonus'); if (cp) { handleBonusClaim(cp); cleanBonusUrlParam(); } else if (sp && !isNaN(parseInt(sp))) { const cuid = tg.initDataUnsafe?.user?.id?.toString(); if (sp !== cuid) { handleNewReferral(sp); } else { console.log("User opened via own ref link."); } } } catch (e) { console.error("Error checking ref/bonus params:", e); } }
    function handleNewReferral(invId) { console.log(`Handling new referral from inviter ID: ${invId}.`); }
    function handleBonusClaim(refId) { console.log(`Handling potential bonus claim for referral ID: ${refId}.`); }
    function cleanBonusUrlParam() { try { const url = new URL(window.location.href); if (url.searchParams.has('claimBonus')) { url.searchParams.delete('claimBonus'); window.history.replaceState({}, document.title, url.toString()); console.log("claimBonus param removed from URL."); } } catch (e) { console.error("Error cleaning URL param:", e); } }

    // --- Обработчик кнопки "Пригласить друзей" ---
    inviteFriendBtn.addEventListener('click', () => { if (isBlocked) { showTemporaryNotification(translations.actionBlocked[currentLanguage], "error"); return; } const versionCheck = tg.isVersionAtLeast('6.1'); if (versionCheck) { const uid = tg.initDataUnsafe?.user?.id; const YOUR_BOT_USERNAME_PLACEHOLDER = 'AlchimLaboratory_Bot'; const botUsername = tg.initDataUnsafe?.bot?.username || YOUR_BOT_USERNAME_PLACEHOLDER; if (!uid || !botUsername || botUsername === 'ВАШ_БОТ_USERNAME') { console.error("[Invite Button] User ID missing or Bot username is missing/not replaced!"); if (botUsername === 'ВАШ_БОТ_USERNAME') { alert("ОШИБКА КОНФИГУРАЦИИ: Имя пользователя бота не задано в коде script.js! Обратитесь к разработчику."); } showTemporaryNotification(translations.inviteLinkError[currentLanguage], "error"); return; } const url = `https://t.me/${botUsername}?startapp=${uid}`; const txt = translations.shareText?.[currentLanguage] || 'Присоединяйся к моей Алхимической Лаборатории в Telegram! 🧪⚗️ Кликай и создавай эликсиры!'; try { tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(txt)}`); tg.HapticFeedback?.impactOccurred('light'); } catch (e) { console.error("[Invite Button] Error calling openTelegramLink for sharing:", e); showTemporaryNotification(translations.inviteLinkError[currentLanguage], "error"); } } else { console.warn("[Invite Button] Version check failed."); const errMsg = (translations.referralRegErrorFunc?.[currentLanguage] || "Feature unavailable") + " (v6.1+)"; showTemporaryNotification(errMsg, "warning"); } });

    // --- Сохранение/Загрузка ---
    let saveTimeout = null;
    function saveGame(immediate = false) { if (typeof tg?.CloudStorage?.setItem !== 'function') { return; } const saveData = () => { let dataValid = true; if (!Number.isFinite(essence) || essence < 0) { essence = 0; dataValid = false; } if (!Number.isFinite(gems) || gems < 0) { gems = 0; dataValid = false; } if (!Array.isArray(ownedSkins) || !ownedSkins.includes('default')) { ownedSkins = ['default']; activeSkinId = 'default'; dataValid = false; } if (typeof activeSkinId !== 'string' || !ownedSkins.includes(activeSkinId)) { activeSkinId = 'default'; dataValid = false; } if (!Array.isArray(ownedAccessories)) { ownedAccessories = []; activeAccessoryId = null; dataValid = false; } if (activeAccessoryId !== null && (typeof activeAccessoryId !== 'string' || !ownedAccessories.includes(activeAccessoryId))) { activeAccessoryId = null; dataValid = false; } upgrades.forEach(u => { if (!Number.isFinite(u.currentLevel) || u.currentLevel < 0) { u.currentLevel = 0; dataValid = false; } }); if (typeof bonusClaimed !== 'boolean') { bonusClaimed = false; dataValid = false; } if (typeof currentVolume !== 'number' || currentVolume < 0 || currentVolume > 1) { currentVolume = DEFAULT_VOLUME; dataValid = false;} if (!dataValid) console.warn("[Save] Данные были исправлены перед сохранением."); const gameState = { essence, gems, upgrades: upgrades.map(u => ({ id: u.id, level: u.currentLevel })), language: currentLanguage, ownedSkins, activeSkinId, ownedAccessories, activeAccessoryId, bonusClaimed, volume: currentVolume, saveVersion: 3 }; try { const gameStateString = JSON.stringify(gameState); tg.CloudStorage.setItem('gameState', gameStateString, (err, ok) => { if (err) { console.error("[Save Callback] Ошибка при вызове setItem:", err); } }); } catch (e) { console.error("[Save] Ошибка при JSON.stringify или CloudStorage.setItem:", e); try { const errMsg = translations?.saveCritError?.[currentLanguage] ?? "Критическая ошибка сохранения!"; showTemporaryNotification(errMsg, "error"); } catch (notifyError) { console.error("[Save] Ошибка при показе уведомления об ошибке:", notifyError); } } saveTimeout = null; }; if (saveTimeout) clearTimeout(saveTimeout); if (immediate) { saveData(); } else { saveTimeout = setTimeout(saveData, 1000); } }
    function loadGame() { console.log("[Load] Попытка загрузки данных..."); isBlocked = false; warningCount = 0; if (cauldronElement) cauldronElement.classList.remove('blocked-cauldron'); let postSetupCalled = false; const performPostSetup = (startNewGame = false) => { if (postSetupCalled) return; console.log(`[Load] Выполнение пост-загрузочной настройки (Новая игра: ${startNewGame})...`); if (startNewGame) { resetGameData(); } recalculateBonuses(); applyTranslations(); updateAppVersionDisplay(); updateLiquidColor(); visualLiquidLevel = LIQUID_MIN_LEVEL; lastInteractionTime = Date.now(); applyCauldronSkin(); applyAccessoryVisuals(); if (tapSoundElement) { tapSoundElement.volume = currentVolume; } if (volumeSlider) { volumeSlider.value = currentVolume; } if (volumeValueElement) { volumeValueElement.textContent = `${Math.round(currentVolume * 100)}%`; } updateDisplay(); checkReferralAndBonus(); updateBonusButtonVisibility(); console.log(`[Load] Пост-настройка завершена. State: E:${formatNumber(essence)}, G:${gems}, Lng:${currentLanguage}, Skin:${activeSkinId}, Acc:${activeAccessoryId}, Vol:${currentVolume}, Bonus:${bonusClaimed}`); postSetupCalled = true; }; if (typeof tg?.CloudStorage?.getItem !== 'function') { console.warn("[Load] CloudStorage.getItem недоступен. Начало новой игры."); performPostSetup(true); showTemporaryNotification("Прогресс не будет сохранен.", "warning"); return; } try { tg.CloudStorage.getItem('gameState', (err, value) => { console.log("[Load Callback] Ответ от CloudStorage получен."); let needsReset = false; if (err) { console.error("[Load Callback] Ошибка получения данных:", err); needsReset = true; } else if (value) { console.log(`[Load Callback] Данные получены (${value.length} байт). Парсинг...`); try { const savedState = JSON.parse(value); console.log("[Load Parse] Успешно:", savedState); essence = Number(savedState.essence) || 0; if (!Number.isFinite(essence) || essence < 0) essence = 0; gems = Number(savedState.gems) || 0; if (!Number.isFinite(gems) || gems < 0) gems = 0; currentLanguage = savedState.language || 'ru'; if (!translations.greetingBase[currentLanguage]) currentLanguage = 'ru'; ownedSkins = Array.isArray(savedState.ownedSkins) ? savedState.ownedSkins : ['default']; if (!ownedSkins.includes('default')) ownedSkins.push('default'); activeSkinId = (typeof savedState.activeSkinId === 'string' && ownedSkins.includes(savedState.activeSkinId)) ? savedState.activeSkinId : 'default'; ownedAccessories = Array.isArray(savedState.ownedAccessories) ? savedState.ownedAccessories : []; ownedAccessories = ownedAccessories.filter(accId => availableAccessories.some(availAcc => availAcc.id === accId)); activeAccessoryId = (typeof savedState.activeAccessoryId === 'string' && ownedAccessories.includes(savedState.activeAccessoryId)) ? savedState.activeAccessoryId : null; if (Array.isArray(savedState.upgrades)) { upgrades.forEach(u => { const savedUpg = savedState.upgrades.find(s => s.id === u.id); const lvl = Number(savedUpg?.level); u.currentLevel = (Number.isFinite(lvl) && lvl >= 0) ? lvl : 0; }); } else { upgrades.forEach(u => u.currentLevel = 0); } bonusClaimed = savedState.bonusClaimed === true; const loadedVolume = parseFloat(savedState.volume); if (!isNaN(loadedVolume) && loadedVolume >= 0 && loadedVolume <= 1) { currentVolume = loadedVolume; } else { currentVolume = DEFAULT_VOLUME; if (savedState.volume !== undefined) { console.warn(`[Load Valid] Неверное значение громкости (${savedState.volume}). Сброс до ${DEFAULT_VOLUME}.`); } } console.log("[Load] Данные успешно загружены и проверены."); } catch (parseError) { console.error("[Load Parse] Ошибка парсинга JSON:", parseError, "Данные:", value); showTemporaryNotification(translations.readError[currentLanguage] || "Ошибка чтения данных!", "error"); needsReset = true; } } else { console.log("[Load Callback] Пустое значение от CloudStorage. Начало новой игры."); needsReset = true; } performPostSetup(needsReset); }); } catch (getItemError) { console.error("[Load Try] Критическая ошибка вызова CloudStorage.getItem:", getItemError); showTemporaryNotification("Ошибка доступа к хранилищу.", "error"); performPostSetup(true); } }
    function resetGameData() { console.warn("Сброс игровых данных к значениям по умолчанию!"); essence = 0; gems = 0; upgrades.forEach(u => u.currentLevel = 0); ownedSkins = ['default']; activeSkinId = 'default'; ownedAccessories = []; activeAccessoryId = null; bonusClaimed = false; isBlocked = false; warningCount = 0; currentVolume = DEFAULT_VOLUME; recalculateBonuses(); }

    // --- Функция уведомлений ---
    function showTemporaryNotification(message, type = "info", duration = 2500) { const oldNotification = document.querySelector('.notification'); if (oldNotification) oldNotification.remove(); const notification = document.createElement('div'); notification.className = `notification ${type}`; notification.textContent = message; document.body.appendChild(notification); requestAnimationFrame(() => { notification.style.opacity = '1'; notification.style.transform = 'translate(-50%, 0)'; }); setTimeout(() => { notification.style.opacity = '0'; notification.style.transform = 'translate(-50%, 10px)'; setTimeout(() => { if (notification.parentNode) notification.remove(); }, 500); }, duration); }

    // --- Функция: Управляет видимостью кнопки бонуса ---
    function updateBonusButtonVisibility() { if (!oneTimeBonusBtn) return; if (bonusClaimed) { oneTimeBonusBtn.classList.add('hidden'); } else { oneTimeBonusBtn.classList.remove('hidden'); } }

    // --- Первоначальная инициализация ---
    loadGame();

    // --- Автосохранение и обработчики событий ---
    setInterval(() => saveGame(false), 3000);
    window.addEventListener('beforeunload', () => saveGame(true));
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveGame(true); });
    if (tg?.onEvent) { tg.onEvent('viewportChanged', (e) => { if (e && e.isStateStable) { saveGame(false); } }); }
    let liquidColorInterval = setInterval(updateLiquidColor, 5 * 60 * 1000);

    // --- Обработчик кнопки одноразового бонуса ---
    if (oneTimeBonusBtn) { oneTimeBonusBtn.addEventListener('click', () => { if (isBlocked) { const message = translations.actionBlocked?.[currentLanguage] ?? "Действие заблокировано."; showTemporaryNotification(message, "error"); return; } if (!bonusClaimed) { console.log("Получение одноразового бонуса!"); tg.HapticFeedback?.notificationOccurred('success'); essence += 100000; bonusClaimed = true; const successMessage = translations.bonusClaimSuccess?.[currentLanguage] ?? "+100K 🧪 Бонус получен!"; showTemporaryNotification(successMessage, "success", 3000); updateBonusButtonVisibility(); updateDisplay(); saveGame(true); } else { console.log("Бонус уже был получен ранее."); tg.HapticFeedback?.notificationOccurred('warning'); const alreadyClaimedMsg = translations.bonusClaimedAlready?.[currentLanguage] ?? "Бонус уже получен."; showTemporaryNotification(alreadyClaimedMsg, "warning"); } }); }

    // --- Очистка интервалов при выгрузке страницы ---
     window.addEventListener('unload', () => {
         if (bubbleInterval) clearInterval(bubbleInterval);
         if (autoClickInterval) clearInterval(autoClickInterval);
         if (uiInterval) clearInterval(uiInterval);
         if (liquidColorInterval) clearInterval(liquidColorInterval);
         if (saveTimeout) { clearTimeout(saveTimeout); saveGame(true); }
         console.log("Intervals cleared on unload.");
     });

     // --- ФУНКЦИЯ ДЛЯ ТЕСТИРОВАНИЯ: Добавление гемов ---
     // Оставьте эту функцию для тестов, но закомментируйте строку window.addGemsForTesting перед релизом
     function addGemsForTesting(amountToAdd) {
         const amount = parseInt(amountToAdd, 10);
         if (isNaN(amount) || amount <= 0) { console.error("Неверное количество гемов. Укажите положительное число."); return; }
         gems += amount;
         console.log(`[ТЕСТ] Добавлено ${amount} гемов. Текущий баланс: ${gems}`);
         updateDisplay();
         saveGame(true);
          if (tg && tg.HapticFeedback) { tg.HapticFeedback.notificationOccurred('success'); }
     }
     // window.addGemsForTesting = addGemsForTesting; // <-- ЗАКОММЕНТИРУЙТЕ ЭТУ СТРОКУ ПЕРЕД РЕЛИЗОМ

}); // --- КОНЕЦ DOMContentLoaded ---