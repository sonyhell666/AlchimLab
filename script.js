// Файл: script.js
// Финальная проверка и очистка
document.addEventListener('DOMContentLoaded', () => {
    // Инициализация Telegram Web App
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

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

    // Проверка критически важных элементов
    if (!essenceCountElement || !cauldronElement || !openUpgradesBtn || !upgradesPanel || !settingsPanel || !shopPanel || !inviteFriendBtn) {
        console.error("КРИТИЧЕСКАЯ ОШИБКА: Не найдены один или несколько основных элементов DOM. Работа скрипта невозможна.");
        // Можно добавить уведомление для пользователя
        alert("Произошла ошибка при загрузке интерфейса. Пожалуйста, попробуйте перезапустить приложение.");
        return; // Прекращаем выполнение скрипта
    }

    // --- Игровые переменные (состояние) ---
    let essence = 0;
    let essencePerClick = 1;
    let essencePerSecond = 0;
    let gems = 0;
    let ownedSkins = ['default'];
    let activeSkinId = 'default';
    const GEM_AWARD_CHANCE = 0.03; // 3% шанс получить кристалл
    const GEMS_PER_AWARD = 1;
    let currentLanguage = 'ru'; // Язык по умолчанию
    let userName = tg.initDataUnsafe?.user?.first_name || null;

    // --- Переменные для защиты от автокликера ---
    let lastClickTime = 0;
    const MIN_CLICK_INTERVAL = 60; // Минимальный интервал между кликами в мс (чуть увеличен)
    const MAX_WARNINGS = 5; // Больше предупреждений перед блокировкой
    let warningCount = 0;
    let isBlocked = false;

    // --- Переменные для динамического уровня жидкости ---
    let visualLiquidLevel = 10; // Начальный уровень в %
    const LIQUID_MIN_LEVEL = 10;
    const LIQUID_MAX_LEVEL = 95;
    const LIQUID_INCREASE_PER_CLICK = 1.0; // На сколько % поднимается за клик
    const LIQUID_DECAY_RATE = 0.15; // На сколько % падает за интервал бездействия
    const LIQUID_UPDATE_INTERVAL = 100; // Как часто проверять/обновлять уровень (мс)
    const IDLE_TIMEOUT = 500; // Время бездействия для начала спада уровня (мс)
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
        saveSuccess: { ru: "Прогресс сохранен", en: "Progress saved" }, // Добавлено
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
        cauldronElement.style.setProperty('--liquid-level', `${l}%`);
        if(bubblesContainer) {
            bubblesContainer.style.height = `${l}%`;
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

        if (hour >= 22 || hour < 5) return `rgba(40, 40, 100, ${alpha})`; // Ночь
        if (hour >= 5 && hour < 7)  return `rgba(255, 150, 100, ${alpha})`; // Рассвет
        if (hour >= 7 && hour < 11) return `rgba(100, 180, 220, ${alpha})`; // Утро
        if (hour >= 11 && hour < 17) return `rgba(220, 220, 100, ${alpha})`; // День
        if (hour >= 17 && hour < 20) return `rgba(255, 120, 50, ${alpha})`; // Закат
        return `rgba(70, 70, 150, ${alpha})`; // Вечер (20:00 - 21:59 UTC)
    }

    function updateLiquidColor() {
        const color = getLiquidColorByLondonTime();
        cauldronElement.style.setProperty('--liquid-color', color);
    }
    // --- Конец функций для динамического цвета жидкости ---

    // --- Общая функция обновления UI ---
    function updateDisplay() {
        essenceCountElement.textContent = formatNumber(Math.floor(essence));
        if (essencePerSecondElement && perSecondDisplayDiv) {
            essencePerSecondElement.textContent = formatNumber(essencePerSecond);
            perSecondDisplayDiv.style.display = essencePerSecond > 0 ? 'block' : 'none';
        }
        if (gemCountElement) gemCountElement.textContent = formatNumber(gems);

        updateLiquidLevelVisual(visualLiquidLevel);

        if (!upgradesPanel.classList.contains('hidden')) {
            updateUpgradeButtonStates();
        }
        if (!shopPanel.classList.contains('hidden')) {
            updateSkinButtonStates();
        }
    }

    // --- Функция форматирования чисел ---
    function formatNumber(num) {
        if (isNaN(num) || !Number.isFinite(num)) { console.warn("formatNumber получено некорректное значение:", num); return "ERR"; }
        if (num < 1000) return num.toString();
        const abbreviations = ["", "K", "M", "B", "T", "q", "Q", "s", "S", "O", "N", "d", "U"]; // Достаточно сокращений
        let i = 0;
        let tempNum = num; // Используем временную переменную
        while (tempNum >= 1000 && i < abbreviations.length - 1) {
            tempNum /= 1000;
            i++;
        }
        // Округляем до 1 знака после запятой, если есть дробная часть
        const formattedNum = tempNum % 1 === 0 ? tempNum.toString() : tempNum.toFixed(1);
        return formattedNum + abbreviations[i];
    }


    // --- Функция для отображения "+N" при клике ---
    function showClickFeedback(amount, type = 'essence') {
        if (isBlocked || !clickFeedbackContainer) return;
        const feedbackElement = document.createElement('div');
        feedbackElement.className = 'click-feedback';
        const formattedAmount = formatNumber(amount);
        if (type === 'gem') {
            const svgIconHtml = `<span class="gem-icon" style="display:inline-flex; vertical-align: middle; margin-left: 4px;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" fill="var(--gem-color)"><path d="M12 1.68l-8 8.42L12 22.32l8-8.42L12 1.68zm0 2.1l5.95 6.27L12 18.54l-5.95-6.27L12 3.78z M6.4 10.1L12 16.1l5.6-6H6.4z"></path></svg></span>`;
            feedbackElement.innerHTML = `+${formattedAmount}${svgIconHtml}`;
            feedbackElement.style.fontSize = '1.3em';
            feedbackElement.style.fontWeight = 'bold';
            feedbackElement.style.color = 'var(--gem-color)';
        } else {
            feedbackElement.textContent = `+${formattedAmount} 🧪`;
            feedbackElement.style.color = 'var(--accent-color)'; // Используем цвет акцента для эссенции
        }
        // Случайное смещение для эффекта разлетания
        const offsetX = Math.random() * 60 - 30;
        const offsetY = (type === 'gem') ? (Math.random() * 20 + 15) : (Math.random() * 20 - 10); // Гемы чуть выше
        feedbackElement.style.left = `calc(50% + ${offsetX}px)`;
        feedbackElement.style.top = `calc(50% + ${offsetY}px)`; // Рассчитываем от центра контейнера

        clickFeedbackContainer.appendChild(feedbackElement);
        // Удаляем элемент после завершения анимации
        setTimeout(() => { feedbackElement.remove(); }, 950); // Время должно совпадать с длительностью анимации fadeUp
    }


    // --- Логика клика по котлу ---
    cauldronElement.addEventListener('click', () => {
        const currentTime = Date.now();
        // Haptic feedback
        tg.HapticFeedback?.impactOccurred('light');

        if (isBlocked) {
            showTemporaryNotification(translations.autoclickerBlocked[currentLanguage], "error");
            return;
        }

        // Проверка интервала клика
        if (currentTime - lastClickTime >= MIN_CLICK_INTERVAL) {
            warningCount = 0; // Сбрасываем предупреждения при нормальном клике
            lastInteractionTime = currentTime; // Обновляем время взаимодействия

            // Добавляем эссенцию
            const clickAmount = essencePerClick;
            if (Number.isFinite(clickAmount) && clickAmount > 0) {
                essence += clickAmount;
                if (clickFeedbackContainer) showClickFeedback(clickAmount, 'essence');
            } else {
                console.error("Некорректное значение essencePerClick:", essencePerClick);
            }

            // Шанс получить кристалл
            if (Math.random() < GEM_AWARD_CHANCE) {
                gems += GEMS_PER_AWARD;
                console.log(`+${GEMS_PER_AWARD} кристалл! Всего: ${gems}`);
                if (clickFeedbackContainer) showClickFeedback(GEMS_PER_AWARD, 'gem');
                tg.HapticFeedback?.impactOccurred('medium'); // Более сильная вибрация за кристалл
            }

            // Увеличиваем уровень жидкости
            visualLiquidLevel = Math.min(visualLiquidLevel + LIQUID_INCREASE_PER_CLICK, LIQUID_MAX_LEVEL);

            updateDisplay(); // Обновляем UI (включая счетчики и уровень жидкости)

            // Анимация нажатия
            cauldronElement.style.transform = 'scale(0.95)';
            setTimeout(() => { cauldronElement.style.transform = 'scale(1)'; }, 80);

            lastClickTime = currentTime;
        } else {
            // Слишком частый клик
            warningCount++;
            lastInteractionTime = currentTime; // Все равно обновляем, чтобы жидкость не падала
            console.warn(`Быстрый клик ${warningCount}/${MAX_WARNINGS}`);
            showTemporaryNotification(`${translations.tooFastClick[currentLanguage]} (${warningCount}/${MAX_WARNINGS})`, "warning");
            tg.HapticFeedback?.impactOccurred('medium');

            // Блокировка при превышении лимита
            if (warningCount >= MAX_WARNINGS) {
                isBlocked = true;
                console.error("Автокликер заблокирован.");
                showTemporaryNotification(translations.autoclickerBlocked[currentLanguage], "error");
                tg.HapticFeedback?.notificationOccurred('error');
                cauldronElement.classList.add('blocked-cauldron');
                // Можно добавить таймер разблокировки через некоторое время, если нужно
                // setTimeout(() => {
                //     isBlocked = false;
                //     warningCount = 0;
                //     cauldronElement.classList.remove('blocked-cauldron');
                //     showTemporaryNotification("Блокировка снята.", "info");
                // }, 30000); // Например, разблокировка через 30 секунд
            }
        }
    });


    // --- Логика авто-клика ---
    try {
        setInterval(() => {
            if (!isBlocked && essencePerSecond > 0 && Number.isFinite(essencePerSecond)) {
                const essenceToAdd = essencePerSecond / 10; // Добавляем 10 раз в секунду для плавности
                if (Number.isFinite(essenceToAdd) && essenceToAdd > 0) {
                    essence += essenceToAdd;
                    // Обновляем дисплей реже, чтобы не нагружать систему
                    // Обновление будет происходить через основной цикл updateDisplay или клики
                } else if (essenceToAdd !== 0) { // Логируем только если не 0
                    console.warn("Рассчитана некорректная порция эссенции для автоклика:", essenceToAdd);
                }
            }
        }, 100); // Интервал 100мс = 10 раз в секунду
    } catch(e) { console.error("Ошибка в интервале автоклика:", e); }

    // --- Интервал для уменьшения уровня жидкости и основного обновления UI ---
    try {
        setInterval(() => {
            const currentTime = Date.now();
            // Уменьшение уровня жидкости при бездействии
            if (!isBlocked && currentTime - lastInteractionTime > IDLE_TIMEOUT && visualLiquidLevel > LIQUID_MIN_LEVEL) {
                visualLiquidLevel = Math.max(visualLiquidLevel - LIQUID_DECAY_RATE, LIQUID_MIN_LEVEL);
            }
            // Обновляем основной дисплей регулярно
            updateDisplay();
        }, LIQUID_UPDATE_INTERVAL);
    } catch(e) { console.error("Ошибка в интервале обновления UI/жидкости:", e); }


    // --- Логика улучшений ---
    function calculateCost(upgrade) {
        if (!upgrade || typeof upgrade.baseCost !== 'number' || typeof upgrade.costMultiplier !== 'number' || typeof upgrade.currentLevel !== 'number') {
            console.error("Некорректные данные улучшения для расчета стоимости:", upgrade);
            return Infinity; // Возвращаем бесконечность, чтобы покупка была невозможна
        }
        // Используем BigInt для промежуточных вычислений, если уровни могут быть очень большими
        // Но для текущих множителей и цен Number должен справиться
        return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.currentLevel));
    }


    function renderUpgrades() {
        if (!upgradesListElement) { console.error("Элемент #upgrades-list не найден!"); return; }
        upgradesListElement.innerHTML = ''; // Очищаем перед заполнением

        // Сортировка для логичного отображения (необязательно, но полезно)
        upgrades.sort((a, b) => (a.requiredEssence || 0) - (b.requiredEssence || 0));

        if (upgrades.length === 0) { upgradesListElement.innerHTML = `<li><p>Улучшения не определены.</p></li>`; return; }

        const currentEssenceFloored = Math.floor(essence);

        upgrades.forEach(upgrade => {
            const cost = calculateCost(upgrade);
            if (!Number.isFinite(cost)) {
                console.error("Пропуск рендера улучшения с неверной стоимостью:", upgrade.id, cost);
                return;
            }

            const required = upgrade.requiredEssence || 0;
            const isLocked = currentEssenceFloored < required; // Заблокировано по требованию эссенции
            const canAfford = currentEssenceFloored >= cost; // Хватает ли средств

            const listItem = document.createElement('li');
            listItem.dataset.upgradeId = upgrade.id; // Для легкого доступа при обновлении

            listItem.classList.toggle('locked', isLocked);
            listItem.classList.toggle('cannot-afford', !isLocked && !canAfford); // Не хватает средств, но не заблокировано

            const translatedName = translations[upgrade.nameKey]?.[currentLanguage] || upgrade.nameKey;
            const translatedDesc = translations[upgrade.descKey]?.[currentLanguage] || upgrade.descKey;
            const buyButtonText = translations.buyButton?.[currentLanguage] || "Купить";
            const requirementPrefix = translations.requirementPrefix?.[currentLanguage] || "Нужно";
            const requirementInfoPrefix = translations.requirementInfoPrefix?.[currentLanguage] || "Требуется";

            let buttonText = buyButtonText;
            let isButtonDisabled = isLocked || !canAfford; // Кнопка неактивна, если залочено или не хватает средств

            if (isLocked) {
                buttonText = `${requirementPrefix} ${formatNumber(required)} 🧪`;
            }

            // Создаем HTML для элемента списка
            listItem.innerHTML = `
                <div class="upgrade-info">
                    <h3>${translatedName} (Ур. ${upgrade.currentLevel})</h3>
                    <p>${translatedDesc}</p>
                    <p class="upgrade-cost">Цена: ${formatNumber(cost)} 🧪</p>
                    <p class="requirement-info" style="display: ${isLocked ? 'block' : 'none'};">
                        ${requirementInfoPrefix}: ${formatNumber(required)} 🧪
                    </p>
                </div>
                <button class="buy-upgrade-btn" data-upgrade-id="${upgrade.id}">${buttonText}</button>
            `;

            const buyButton = listItem.querySelector('.buy-upgrade-btn');
            if (buyButton) {
                buyButton.disabled = isButtonDisabled;
                // Добавляем слушатель клика ВСЕГДА, но проверяем disabled внутри
                buyButton.addEventListener('click', (event) => {
                    event.stopPropagation(); // Предотвращаем всплытие события
                    if (!buyButton.disabled) { // Дополнительная проверка перед покупкой
                        buyUpgrade(upgrade.id);
                    } else {
                         console.log("Попытка клика по неактивной кнопке улучшения:", upgrade.id);
                         tg.HapticFeedback?.notificationOccurred('warning'); // Легкий фидбек о неудаче
                         // Показать уведомление о причине неактивности?
                         if (isLocked) {
                             showTemporaryNotification(`${translations.requirementInfoPrefix[currentLanguage]}: ${formatNumber(required)} 🧪`, "warning");
                         } else if (!canAfford) {
                            showTemporaryNotification(translations.notEnoughEssence[currentLanguage], "warning");
                         }
                    }
                });
            }
            upgradesListElement.appendChild(listItem);
        });
    }


    function buyUpgrade(upgradeId) {
        if (isBlocked) { showTemporaryNotification(translations.actionBlocked[currentLanguage], "error"); return; }
        const upgrade = upgrades.find(up => up.id === upgradeId);
        if (!upgrade) { console.error("Улучшение не найдено:", upgradeId); return; }

        const required = upgrade.requiredEssence || 0;
        // Повторная проверка на всякий случай
        if (Math.floor(essence) < required) {
            showTemporaryNotification(`${translations.requirementInfoPrefix[currentLanguage]}: ${formatNumber(required)} 🧪`, "warning");
            tg.HapticFeedback?.notificationOccurred('warning');
            return;
        }

        const cost = calculateCost(upgrade);
        if (!Number.isFinite(cost)) {
            showTemporaryNotification(translations.invalidCostError[currentLanguage], "error");
            console.error("Попытка купить улучшение с невалидной стоимостью:", upgradeId, cost);
            return;
        }

        if (essence >= cost) {
            essence -= cost;
            upgrade.currentLevel++;
            recalculateBonuses(); // Пересчитываем бонусы после изменения уровня
            // Не нужно вызывать updateDisplay() здесь, т.к. renderUpgrades его вызовет через updateUpgradeButtonStates
            renderUpgrades(); // Перерисовываем панель, чтобы показать новый уровень, цену и обновить состояния кнопок
            saveGame(); // Сохраняем прогресс
            tg.HapticFeedback?.impactOccurred('light'); // Фидбек об успешной покупке
        } else {
            // Эта проверка дублирует проверку canAfford, но оставим на всякий случай
            showTemporaryNotification(translations.notEnoughEssence[currentLanguage], "warning");
            tg.HapticFeedback?.notificationOccurred('warning');
        }
    }


    function recalculateBonuses() {
        let clickBonus = 0;
        let autoBonus = 0;
        upgrades.forEach(upgrade => {
            if (upgrade.currentLevel > 0 && Number.isFinite(upgrade.value) && typeof upgrade.type === 'string') {
                const bonusFromUpgrade = upgrade.value * upgrade.currentLevel;
                if (upgrade.type === 'click') {
                    clickBonus += bonusFromUpgrade;
                } else if (upgrade.type === 'auto') {
                    autoBonus += bonusFromUpgrade;
                }
            } else if (upgrade.currentLevel > 0) { // Логируем только если уровень > 0, но данные неверны
                console.warn("Улучшение с уровнем > 0 имеет некорректные данные для расчета бонуса:", upgrade);
            }
        });

        // Устанавливаем базовое значение + бонусы
        essencePerClick = 1 + clickBonus;
        essencePerSecond = autoBonus;

        // Дополнительная проверка на корректность итоговых значений
        if (!Number.isFinite(essencePerClick) || essencePerClick < 1) {
            console.error("Некорректное итоговое значение essencePerClick после пересчета:", essencePerClick, "Установлено в 1.");
            essencePerClick = 1;
        }
        if (!Number.isFinite(essencePerSecond) || essencePerSecond < 0) {
             console.error("Некорректное итоговое значение essencePerSecond после пересчета:", essencePerSecond, "Установлено в 0.");
            essencePerSecond = 0;
        }
        // console.log(`Бонусы пересчитаны: Click=${essencePerClick}, Auto=${essencePerSecond}`); // Для отладки
    }


    // --- Оптимизированное обновление состояния кнопок улучшений ---
    function updateUpgradeButtonStates() {
        if (!upgradesListElement || upgradesPanel.classList.contains('hidden')) {
            return; // Не обновляем, если панель скрыта
        }

        const currentEssenceFloored = Math.floor(essence);
        const upgradeListItems = upgradesListElement.querySelectorAll('li[data-upgrade-id]');

        upgradesListItems.forEach(listItem => {
            const button = listItem.querySelector('.buy-upgrade-btn');
            const upgradeId = listItem.dataset.upgradeId;
            if (!button || !upgradeId) return;

            const upgrade = upgrades.find(up => up.id === upgradeId);
            if (!upgrade) return;

            const cost = calculateCost(upgrade);
            const required = upgrade.requiredEssence || 0;
            const isLocked = currentEssenceFloored < required;
            const canAfford = currentEssenceFloored >= cost;
            const isButtonDisabled = isLocked || !canAfford;

            // Обновляем классы для визуального отображения состояния
            listItem.classList.toggle('locked', isLocked);
            listItem.classList.toggle('cannot-afford', !isLocked && !canAfford);

            // Обновляем состояние disabled кнопки
            if (button.disabled !== isButtonDisabled) {
                button.disabled = isButtonDisabled;
            }

            // Обновляем текст кнопки, если он изменился (например, с "Купить" на "Нужно N")
            let buttonText = translations.buyButton[currentLanguage];
            if (isLocked) {
                 buttonText = `${translations.requirementPrefix[currentLanguage]} ${formatNumber(required)} 🧪`;
            }
             // Сравниваем с текущим текстом, чтобы избежать лишних перерисовок
            if (button.textContent !== buttonText && !isButtonDisabled) { // Обновляем текст только если кнопка активна и текст отличается
                button.textContent = buttonText;
            } else if (isLocked && button.textContent !== buttonText) { // Обновляем текст для заблокированной кнопки
                 button.textContent = buttonText;
            }


            // Обновляем текст цены, если он изменился
            const costElement = listItem.querySelector('.upgrade-cost');
            if (costElement) {
                 const costText = `Цена: ${formatNumber(cost)} 🧪`;
                 if (costElement.textContent !== costText) {
                     costElement.textContent = costText;
                 }
            }

            // Обновляем текст требования, если он изменился
            const requirementInfoElement = listItem.querySelector('.requirement-info');
            if (requirementInfoElement) {
                const requirementText = `${translations.requirementInfoPrefix[currentLanguage]}: ${formatNumber(required)} 🧪`;
                if (requirementInfoElement.textContent !== requirementText) {
                     requirementInfoElement.textContent = requirementText;
                }
                // Обновляем видимость текста требования
                const shouldBeVisible = isLocked;
                if ((requirementInfoElement.style.display === 'none') === shouldBeVisible) {
                    requirementInfoElement.style.display = shouldBeVisible ? 'block' : 'none';
                }
            }
        });
    }


    // --- Оптимизированное обновление состояния кнопок скинов ---
    function updateSkinButtonStates() {
        if (!skinsListElement || shopPanel.classList.contains('hidden')) {
            return; // Не обновляем, если панель скрыта
        }

        // Обновляем счетчик гемов в шапке магазина
        if (shopGemCountElement) {
            const formattedGems = formatNumber(gems);
            if (shopGemCountElement.textContent !== formattedGems) {
                shopGemCountElement.textContent = formattedGems;
            }
        }

        const skinListItems = skinsListElement.querySelectorAll('li[data-skin-id]');

        skinListItems.forEach(listItem => {
            const skinId = listItem.dataset.skinId;
            if (!skinId) return;
            const skin = availableSkins.find(s => s.id === skinId);
            if (!skin) return;

            const buyButton = listItem.querySelector('.skin-action-btn.buy-btn');
            const selectButton = listItem.querySelector('.skin-action-btn.select-btn');
            const selectedButton = listItem.querySelector('.skin-action-btn.selected-btn');

            const isOwned = ownedSkins.includes(skinId);
            const isActive = activeSkinId === skinId;

            // Обновляем состояние активности элемента списка
            listItem.classList.toggle('active-skin', isActive);

            // Обновляем состояние кнопки "Купить", если она есть
            if (buyButton && !isOwned) {
                const canAfford = gems >= skin.cost;
                if (buyButton.disabled === canAfford) { // Обновляем только если состояние изменилось
                     buyButton.disabled = !canAfford;
                }
            }

            // Проверяем, соответствует ли отображаемая кнопка текущему состоянию (куплен/не куплен/активен)
            // Это более сложная логика, чем просто обновление disabled, т.к. тип кнопки меняется.
            // Проще перерисовать список скинов при покупке/выборе, как это сделано сейчас в buySkin/setActiveSkin.
            // Поэтому здесь обновляем только disabled для кнопки "Купить".
        });
    }


    // --- Открытие/Закрытие панелей ---
    function closeAllPanels() {
        if (settingsPanel && !settingsPanel.classList.contains('hidden')) settingsPanel.classList.add('hidden');
        if (upgradesPanel && !upgradesPanel.classList.contains('hidden')) upgradesPanel.classList.add('hidden');
        if (shopPanel && !shopPanel.classList.contains('hidden')) shopPanel.classList.add('hidden');
    }

    function openPanel(panelElement) {
        if (!panelElement) return;
        closeAllPanels(); // Закрываем все остальные перед открытием новой
        panelElement.classList.remove('hidden');
        tg.HapticFeedback?.impactOccurred('light');
    }

    // Слушатели для кнопок открытия панелей
    openUpgradesBtn.addEventListener('click', () => {
        renderUpgrades(); // Перерисовываем содержимое перед показом
        openPanel(upgradesPanel);
    });

    settingsBtn.addEventListener('click', () => {
        updateActiveLangButton(); // Обновляем активную кнопку языка
        openPanel(settingsPanel);
    });

    shopBtn.addEventListener('click', () => {
        renderSkins(); // Перерисовываем скины перед показом
        openPanel(shopPanel);
    });

    // Слушатели для кнопок закрытия панелей
    if (closeUpgradesBtn) closeUpgradesBtn.addEventListener('click', closeAllPanels);
    if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', closeAllPanels);
    if (closeShopBtn) closeShopBtn.addEventListener('click', closeAllPanels);

    // Закрытие панели настроек по клику на фон
    if (settingsPanel) {
        settingsPanel.addEventListener('click', (e) => {
            if (e.target === settingsPanel) { // Клик именно по фону, а не по содержимому
                closeAllPanels();
            }
        });
    }


    // --- Логика Настроек (только язык) ---
    function setLanguage(lang) {
        if (translations.greetingBase[lang] && lang !== currentLanguage) {
            currentLanguage = lang;
            console.log(`Язык изменен на: ${currentLanguage}`);
            applyTranslations();
            updateActiveLangButton();
            saveGame();
            // Обновляем открытые панели, если они есть
            if (upgradesPanel && !upgradesPanel.classList.contains('hidden')) renderUpgrades();
            if (shopPanel && !shopPanel.classList.contains('hidden')) renderSkins();
        } else if (!translations.greetingBase[lang]) {
             console.warn(`Язык "${lang}" не найден в переводах.`);
        }
    }

    function applyTranslations() {
        // Приветствие
        if (userGreetingElement) {
            let greeting = translations.greetingBase[currentLanguage] || "Лаборатория";
            if (userName) {
                greeting += ` ${userName}`;
            }
            userGreetingElement.textContent = greeting;
        }
        // Элементы с data-translate
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.dataset.translate;
            const translation = translations[key]?.[currentLanguage];
            if (translation && element.textContent !== translation) {
                element.textContent = translation;
            } else if (!translation) {
                 console.warn(`Ключ перевода "${key}" не найден для языка "${currentLanguage}".`);
            }
        });
        // Текст "в сек"
        const perSecSpan = perSecondDisplayDiv?.querySelector('span[data-translate="perSec"]');
        if(perSecSpan) {
            const perSecText = translations.perSec?.[currentLanguage] || '/ sec';
            if (perSecSpan.textContent !== perSecText) {
                perSecSpan.textContent = perSecText;
            }
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
                if (lang) {
                    setLanguage(lang);
                }
            }
        });
    } else { console.error("Контейнер выбора языка '.language-options' не найден внутри панели настроек."); }


    // --- Логика магазина ---
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
            listItem.dataset.skinId = skin.id;
            listItem.classList.toggle('active-skin', isActive); // Сразу устанавливаем класс активности

            const translatedName = translations[skin.nameKey]?.[currentLanguage] || skin.nameKey;
            const buyButtonText = translations.buyButton?.[currentLanguage] || "Купить";
            const selectButtonText = translations.selectButton?.[currentLanguage] || "Выбрать";
            const selectedButtonText = translations.selectedButton?.[currentLanguage] || "Выбрано";
            const gemIconSvg = `<span class="gem-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em"><path d="M12 1.68l-8 8.42L12 22.32l8-8.42L12 1.68zm0 2.1l5.95 6.27L12 18.54l-5.95-6.27L12 3.78z M6.4 10.1L12 16.1l5.6-6H6.4z"/></svg></span>`;

            let actionButtonHtml = '';
            if (isActive) {
                actionButtonHtml = `<button class="skin-action-btn selected-btn" disabled>${selectedButtonText}</button>`;
            } else if (isOwned) {
                actionButtonHtml = `<button class="skin-action-btn select-btn" data-skin-id="${skin.id}">${selectButtonText}</button>`; // Добавлен data-skin-id
            } else {
                // Кнопка "Купить"
                actionButtonHtml = `<button class="skin-action-btn buy-btn" data-skin-id="${skin.id}" ${!canAfford ? 'disabled' : ''}>${buyButtonText}</button>`; // Добавлен data-skin-id
            }

            listItem.innerHTML = `
                <div class="skin-preview ${skin.cssClass || ''}"></div>
                <div class="skin-info">
                    <h3>${translatedName}</h3>
                    ${skin.cost > 0 ? `<p class="skin-cost">${gemIconSvg} ${formatNumber(skin.cost)}</p>` : '<p class="skin-cost"> </p>'} <!-- Placeholder для выравнивания -->
                </div>
                ${actionButtonHtml}
            `;

            // Добавляем слушатель только на кнопки, которые требуют действия (Купить/Выбрать)
             const actionButton = listItem.querySelector('.skin-action-btn:not(.selected-btn)');
             if (actionButton) {
                 actionButton.addEventListener('click', (event) => {
                    // Проверяем disabled еще раз перед действием
                    if (!event.currentTarget.disabled) { // Используем currentTarget
                         handleSkinAction(skin.id);
                    } else {
                        console.log("Попытка клика по неактивной кнопке скина:", skin.id);
                        tg.HapticFeedback?.notificationOccurred('warning');
                        if (!isOwned && !canAfford) {
                            showTemporaryNotification(translations.notEnoughGems[currentLanguage], "warning");
                        }
                    }
                 });
             }
            skinsListElement.appendChild(listItem);
        });
    }


    function handleSkinAction(skinId) {
        if (isBlocked) { showTemporaryNotification(translations.actionBlocked[currentLanguage], "error"); return; }
        const skin = availableSkins.find(s => s.id === skinId);
        if (!skin) { console.error("Скин не найден:", skinId); return; }

        const isOwned = ownedSkins.includes(skinId);

        if (isOwned) {
            // Если скин уже куплен, выбираем его (если он не активен)
            if (activeSkinId !== skinId) {
                setActiveSkin(skinId);
            }
        } else {
            // Если скин не куплен, пытаемся купить
            buySkin(skinId);
        }
    }


    function buySkin(skinId) {
        const skin = availableSkins.find(s => s.id === skinId);
        // Проверки перед покупкой
        if (!skin || ownedSkins.includes(skinId) || skin.cost <= 0) {
            console.warn("Покупка скина невозможна (не найден, уже куплен или бесплатен):", skinId);
            return;
        }

        if (gems >= skin.cost) {
            gems -= skin.cost;
            ownedSkins.push(skinId); // Добавляем в список купленных
            console.log(`Скин куплен: ${skinId}. Осталось кристаллов: ${gems}`);
            showTemporaryNotification(translations.skinPurchaseSuccess[currentLanguage], "success");
            tg.HapticFeedback?.notificationOccurred('success');

            // Не вызываем updateDisplay() напрямую, т.к. renderSkins его вызовет через updateSkinButtonStates

            renderSkins(); // Перерисовываем магазин, кнопка сменится на "Выбрать"
            setActiveSkin(skinId); // Сразу активируем купленный скин (setActiveSkin вызовет saveGame)
        } else {
            console.log(`Недостаточно кристаллов для покупки скина: ${skinId}. Нужно: ${skin.cost}, Есть: ${gems}`);
            showTemporaryNotification(translations.notEnoughGems[currentLanguage], "warning");
            tg.HapticFeedback?.notificationOccurred('warning');
        }
    }


    function setActiveSkin(skinId) {
        // Проверяем, куплен ли скин перед активацией
        if (!ownedSkins.includes(skinId)) {
            console.error(`Попытка активировать не купленный скин: ${skinId}`);
            return;
        }
        // Активируем только если он еще не активен
        if (activeSkinId !== skinId) {
            activeSkinId = skinId;
            console.log(`Активный скин изменен на: ${skinId}`);
            applyCauldronSkin(); // Применяем CSS класс к колбе

            // Обновляем отображение в магазине, если он открыт
            if (shopPanel && !shopPanel.classList.contains('hidden')) {
                renderSkins();
            }

            saveGame(); // Сохраняем изменение активного скина
            showTemporaryNotification(translations.skinSelected[currentLanguage], "info");
            tg.HapticFeedback?.impactOccurred('light');
        }
    }

    function applyCauldronSkin() {
        const activeSkinDefinition = availableSkins.find(s => s.id === activeSkinId);
        const skinClass = activeSkinDefinition?.cssClass;

        // Удаляем все классы скинов перед добавлением нужного
        availableSkins.forEach(skin => {
            if (skin.cssClass) {
                cauldronElement.classList.remove(skin.cssClass);
            }
        });

        // Добавляем класс активного скина, если он есть
        if (skinClass) {
            cauldronElement.classList.add(skinClass);
            console.log(`Применен CSS класс скина: ${skinClass}`);
        } else {
            // Если у активного скина нет класса (маловероятно, но возможно),
            // убеждаемся, что применен класс по умолчанию или базовый вид
            cauldronElement.classList.add('skin-default'); // Гарантируем наличие дефолтного класса
            console.warn(`Не найден CSS класс для активного скина: ${activeSkinId}. Применен 'skin-default'.`);
        }
    }


    // --- Логика реферальной системы (Заглушки и кнопка) ---
    function checkReferralAndBonus() {
        try {
            const startParam = tg.initDataUnsafe?.start_param;
            const urlParams = new URLSearchParams(window.location.search);
            const claimBonusParam = urlParams.get('claimBonus');
            console.log("Параметры запуска:", { startParam, claimBonusParam });

            if (claimBonusParam) {
                handleBonusClaim(claimBonusParam);
                cleanBonusUrlParam(); // Очищаем URL после обработки
            } else if (startParam && !isNaN(parseInt(startParam))) {
                // Проверяем, не является ли startParam ID текущего пользователя
                const currentUserId = tg.initDataUnsafe?.user?.id?.toString();
                if (startParam !== currentUserId) {
                     handleNewReferral(startParam);
                } else {
                    console.log("Пользователь открыл приложение по своей реферальной ссылке.");
                }
            }
        } catch (e) {
            console.error("Ошибка при проверке реферальных параметров:", e);
        }
    }

    function handleNewReferral(inviterId) {
        console.log(`Обработка нового реферала от пользователя ${inviterId}.`);
        // Здесь должна быть логика:
        // 1. Проверить, заходил ли пользователь раньше.
        // 2. Если нет, сохранить ID пригласившего (inviterId) где-то (например, в CloudStorage или отправить на бэкенд).
        // 3. Возможно, выдать приветственный бонус новому пользователю.
        // 4. Отправить информацию на бэкенд, чтобы он выдал бонус пригласившему.
        // Пример:
        // if (!localStorage.getItem('inviterId')) { // Простая проверка, лучше использовать CloudStorage
        //     localStorage.setItem('inviterId', inviterId);
        //     showTemporaryNotification(translations.welcomeReferral[currentLanguage], "success");
        //     // Отправка запроса на бэкенд для бонуса пригласившему
        //     // fetch('/api/register-referral', { method: 'POST', body: JSON.stringify({ inviter: inviterId, referee: tg.initDataUnsafe?.user?.id }) });
        // }
    }

    function handleBonusClaim(referralId) {
        console.log(`Обработка запроса на получение бонуса за реферала ${referralId}.`);
        // Здесь должна быть логика (скорее всего, на бэкенде):
        // 1. Проверить на бэкенде, действительно ли пользователь с ID `tg.initDataUnsafe?.user?.id`
        //    пригласил пользователя `referralId`.
        // 2. Проверить, не был ли бонус за этого реферала уже выдан.
        // 3. Если все ок, выдать бонус (кристаллы?) текущему пользователю и отметить бонус как выданный.
        // Пример (упрощенно):
        // fetch(`/api/claim-bonus?refereeId=${referralId}`, { headers: { 'Authorization': `Bearer ${tg.initData}` }})
        // .then(res => res.json())
        // .then(data => {
        //      if(data.success) {
        //          gems += data.bonusAmount || 5; // Пример бонуса
        //          showTemporaryNotification(`+${data.bonusAmount || 5} ${translations.bonusReasonFriend[currentLanguage]}`, "success");
        //          updateDisplay();
        //          saveGame();
        //      } else {
        //          showTemporaryNotification(data.message || translations.bonusCheckError[currentLanguage], "warning");
        //      }
        // })
        // .catch(err => {
        //      console.error("Ошибка запроса бонуса:", err);
        //      showTemporaryNotification(translations.bonusCheckError[currentLanguage], "error");
        // });
    }

    function cleanBonusUrlParam() {
        try {
            const url = new URL(window.location);
            if (url.searchParams.has('claimBonus')) {
                url.searchParams.delete('claimBonus');
                // Обновляем URL без перезагрузки страницы
                window.history.replaceState({}, document.title, url);
                console.log("Параметр claimBonus удален из URL.");
            }
        } catch (e) {
            console.error("Ошибка при очистке URL:", e);
        }
    }

    // Кнопка "Пригласить друзей"
    inviteFriendBtn.addEventListener('click', () => {
        if (isBlocked) { showTemporaryNotification(translations.actionBlocked[currentLanguage], "error"); return; }
        // Проверяем доступность метода WebApp API
        if (tg.isVersionAtLeast('6.1') && tg.CloudStorage) { // Примерная проверка версии, можно использовать tg.share просто
            const userId = tg.initDataUnsafe?.user?.id;
            const botUsername = tg.initDataUnsafe?.bot?.username; // Пытаемся получить имя бота

            if (!userId || !botUsername) {
                console.error("Не удалось получить ID пользователя или имя бота для реферальной ссылки.");
                showTemporaryNotification(translations.inviteLinkError[currentLanguage], "error");
                return;
            }

            // Формируем ссылку на приложение внутри Telegram
            // Формат может немного отличаться, уточните в документации Telegram
            const shareUrl = `https://t.me/${botUsername}/${tg.WebApp.name}?startapp=${userId}`;

            const textToShare = translations.shareText?.[currentLanguage] || 'Присоединяйся к моей Алхимической Лаборатории!';

            console.log("Попытка поделиться:", { url: shareUrl, text: textToShare });

            // Используем стандартный метод share окна Telegram
            tg.openTelegramLink(
                `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(textToShare)}`
            );

            tg.HapticFeedback?.impactOccurred('light');

        } else {
            console.warn("Метод для создания ссылки-приглашения недоступен.");
            showTemporaryNotification(translations.referralRegErrorFunc[currentLanguage], "warning");
        }
    });


    // --- Сохранение/Загрузка ---
    let saveTimeout = null; // Для предотвращения слишком частых сохранений
    function saveGame(immediate = false) {
        // Проверяем доступность CloudStorage
        if (!tg?.CloudStorage || typeof tg.CloudStorage.setItem !== 'function') {
            // console.log("[Save] CloudStorage недоступен, сохранение невозможно."); // Можно включить для отладки
            return;
        }

        const saveData = () => {
            console.log("[Save] Попытка сохранения...");
            let isValid = true;
            // Валидация данных перед сохранением
            if (!Number.isFinite(essence) || essence < 0) { console.warn(`[Save Valid] Некорректная эссенция ${essence}. Сброс в 0.`); essence = 0; isValid = false; }
            if (!Number.isFinite(gems) || gems < 0) { console.warn(`[Save Valid] Некорректные кристаллы ${gems}. Сброс в 0.`); gems = 0; isValid = false; }
            if (!Array.isArray(ownedSkins) || !ownedSkins.includes('default')) { console.warn(`[Save Valid] Некорректный массив скинов ${ownedSkins}. Сброс в ['default'].`); ownedSkins = ['default']; if (activeSkinId !== 'default') activeSkinId = 'default'; isValid = false; }
            if (typeof activeSkinId !== 'string' || !ownedSkins.includes(activeSkinId)) { console.warn(`[Save Valid] Некорректный активный скин ${activeSkinId}. Сброс в 'default'.`); activeSkinId = 'default'; isValid = false; }
            upgrades.forEach(upg => { if (!Number.isFinite(upg.currentLevel) || upg.currentLevel < 0) { console.warn(`[Save Valid] Некорректный уровень апгрейда ${upg.id}: ${upg.currentLevel}. Сброс в 0.`); upg.currentLevel = 0; isValid = false; } });
            if (!isValid) { console.warn("[Save] Данные были скорректированы перед сохранением."); }

            const gameState = {
                essence: essence,
                gems: gems,
                upgrades: upgrades.map(u => ({ id: u.id, level: u.currentLevel })),
                language: currentLanguage,
                ownedSkins: ownedSkins,
                activeSkinId: activeSkinId,
                // Добавляем версию сохранения для будущих миграций, если понадобится
                saveVersion: 1
            };

            try {
                const gameStateString = JSON.stringify(gameState);
                // console.log(`[Save] Сохранение данных (${gameStateString.length} байт)...`); // Отладка
                tg.CloudStorage.setItem('gameState', gameStateString, (error, success) => {
                    if (error) {
                        console.error("[Save Callback] Ошибка сохранения:", error);
                        // Не показываем уведомление пользователю при каждой ошибке автосохранения, чтобы не спамить
                    } else if (success) {
                         console.log("[Save Callback] Прогресс успешно сохранен.");
                         // Можно показать уведомление об успехе при ручном сохранении (если будет)
                         // if (immediate) showTemporaryNotification(translations.saveSuccess[currentLanguage], "success");
                    } else {
                        console.warn("[Save Callback] Неопределенный результат сохранения (success=false, но нет ошибки).");
                    }
                });
            } catch (stringifyError) {
                console.error("[Save] Ошибка JSON.stringify при сохранении:", stringifyError);
                showTemporaryNotification(translations.saveCritError[currentLanguage], "error");
            }
            saveTimeout = null; // Сбрасываем таймаут после выполнения
        };

        // Логика отложенного сохранения (debounce)
        if (saveTimeout) {
            clearTimeout(saveTimeout); // Отменяем предыдущий запланированный вызов
        }
        if (immediate) {
            saveData(); // Сохраняем немедленно (например, при закрытии)
        } else {
             // Запланировать сохранение через 1 секунду после последнего вызова
            saveTimeout = setTimeout(saveData, 1000);
        }
    }


    function loadGame() {
        console.log("[Load] Попытка загрузки данных...");
        isBlocked = false; // Сбрасываем блокировку при загрузке
        warningCount = 0;
        if (cauldronElement) cauldronElement.classList.remove('blocked-cauldron');

        let postSetupDone = false;
        const performPostLoadSetup = (isNewGame = false) => {
            if (postSetupDone) return;
            console.log("[Load] Выполнение пост-загрузочных настроек...");
            if (isNewGame) {
                console.log("[Load] Начата новая игра.");
                resetGameData(); // Гарантируем сброс данных для новой игры
            }
            recalculateBonuses(); // Пересчитываем бонусы на основе загруженных/сброшенных уровней
            applyTranslations(); // Применяем язык
            updateLiquidColor(); // Устанавливаем цвет жидкости по времени
            visualLiquidLevel = LIQUID_MIN_LEVEL; // Устанавливаем начальный уровень жидкости
            lastInteractionTime = Date.now(); // Сбрасываем таймер бездействия
            applyCauldronSkin(); // Применяем скин
            updateDisplay(); // Финальное обновление всего UI
            checkReferralAndBonus(); // Проверяем реферальные параметры
            console.log(`[Load] Пост-настройки завершены. Состояние: E:${formatNumber(essence)}, G:${gems}, Lng:${currentLanguage}, Skin:${activeSkinId}`);
            postSetupDone = true;
        };

        // Проверяем доступность CloudStorage
        if (!tg?.CloudStorage || typeof tg.CloudStorage.getItem !== 'function') {
            console.warn("[Load] CloudStorage недоступен. Начинаем новую игру.");
            performPostLoadSetup(true); // Новая игра
            showTemporaryNotification("Прогресс не будет сохранен.", "warning");
            return;
        }

        // Пытаемся загрузить данные
        try {
            tg.CloudStorage.getItem('gameState', (error, value) => {
                console.log("[Load Callback] Ответ от CloudStorage.getItem.");
                let needsReset = false;
                if (error) {
                    console.error("[Load Callback] Ошибка получения данных из CloudStorage:", error);
                    if (error.message && error.message.includes("STORAGE_KEY_CLOUD_NOT_FOUND")) {
                        console.log("[Load Callback] Ключ 'gameState' не найден. Новая игра.");
                    } else if (error.message && error.message.includes("Unsupported")) {
                         console.warn("[Load Callback] CloudStorage.getItem не поддерживается клиентом Telegram.");
                         showTemporaryNotification("Сохранение/загрузка недоступны в этой версии Telegram.", "warning");
                    } else {
                         showTemporaryNotification(translations.loadError[currentLanguage], "error");
                    }
                    needsReset = true;
                } else if (value) {
                    console.log(`[Load Callback] Данные получены (${value.length} байт). Попытка парсинга...`);
                    try {
                        const savedState = JSON.parse(value);
                        console.log("[Load Parse] Успешно распарсено:", savedState);

                        // Применяем загруженные данные с валидацией
                        essence = Number(savedState.essence) || 0; if (!Number.isFinite(essence) || essence < 0) { console.warn("[Load Valid] Эссенция -> 0"); essence = 0; }
                        gems = Number(savedState.gems) || 0; if (!Number.isFinite(gems) || gems < 0) { console.warn("[Load Valid] Кристаллы -> 0"); gems = 0; }
                        currentLanguage = savedState.language || 'ru'; if (!translations.greetingBase[currentLanguage]) { console.warn(`[Load Valid] Неизвестный язык '${savedState.language}' -> ru`); currentLanguage = 'ru'; }

                        // Загрузка уровней улучшений
                        if (Array.isArray(savedState.upgrades)) {
                            upgrades.forEach(u => {
                                const savedUpgrade = savedState.upgrades.find(su => su.id === u.id);
                                const savedLevel = Number(savedUpgrade?.level);
                                u.currentLevel = (Number.isFinite(savedLevel) && savedLevel >= 0) ? savedLevel : 0;
                                if (u.currentLevel !== 0 && !(Number.isFinite(savedLevel) && savedLevel >= 0)) {
                                    console.warn(`[Load Valid] Некорректный уровень ${savedLevel} для апгрейда ${u.id} -> 0`);
                                }
                            });
                        } else {
                            console.warn("[Load Valid] Отсутствует или некорректен массив апгрейдов -> все уровни 0");
                            upgrades.forEach(u => u.currentLevel = 0);
                        }

                        // Загрузка скинов
                        ownedSkins = Array.isArray(savedState.ownedSkins) ? savedState.ownedSkins : ['default'];
                        if (!ownedSkins.includes('default')) {
                            ownedSkins.push('default'); // Гарантируем наличие дефолтного скина
                            console.warn("[Load Valid] Скин 'default' добавлен в список купленных.");
                        }
                        activeSkinId = (typeof savedState.activeSkinId === 'string' && ownedSkins.includes(savedState.activeSkinId)) ? savedState.activeSkinId : 'default';
                        if (savedState.activeSkinId && !ownedSkins.includes(savedState.activeSkinId)) {
                            console.warn(`[Load Valid] Активный скин '${savedState.activeSkinId}' не найден в купленных -> 'default'`);
                        }

                        console.log("[Load] Данные успешно загружены и применены.");

                    } catch (parseError) {
                        console.error("[Load Parse] Ошибка парсинга JSON:", parseError, "Полученные данные:", value);
                        showTemporaryNotification(translations.readError[currentLanguage], "error");
                        needsReset = true;
                    }
                } else {
                    // Значение пустое (null или ''), считаем новой игрой
                    console.log("[Load Callback] Получено пустое значение из CloudStorage. Новая игра.");
                    needsReset = true;
                }

                // Выполняем пост-настройки после обработки ответа
                performPostLoadSetup(needsReset);

            });
        } catch (storageError) {
            // Ошибка самого вызова CloudStorage.getItem
            console.error("[Load Try] Критическая ошибка при вызове CloudStorage.getItem:", storageError);
            showTemporaryNotification("Ошибка доступа к хранилищу.", "error");
            performPostLoadSetup(true); // Начинаем новую игру при ошибке доступа
        }
    }

    function resetGameData() {
        console.warn("Сброс данных игры к значениям по умолчанию!");
        essence = 0;
        gems = 0;
        upgrades.forEach(upgrade => upgrade.currentLevel = 0);
        ownedSkins = ['default'];
        activeSkinId = 'default';
        isBlocked = false; // Сбрасываем блокировку
        warningCount = 0;
        // Не нужно вызывать recalculateBonuses здесь, т.к. performPostLoadSetup его вызовет
    }

    // --- Функция уведомлений ---
    function showTemporaryNotification(message, type = "info", duration = 2500) {
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove(); // Удаляем старое уведомление, если оно есть
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`; // info, error, warning, success
        notification.textContent = message;
        document.body.appendChild(notification);

        // Анимация появления
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translate(-50%, 0)'; // Поднимаем на позицию
        });

        // Анимация исчезновения и удаление
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translate(-50%, 10px)'; // Сдвигаем вниз при исчезновении
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 500); // Ждем завершения анимации исчезновения
        }, duration);
    }


    // --- Первоначальная инициализация ---
    loadGame(); // Загружаем игру при старте


    // --- Автосохранение и обработчики событий ---
    // Используем отложенное сохранение для частых событий
    setInterval(() => saveGame(false), 15000); // Регулярное автосохранение каждые 15 сек (с debounce)

    // Немедленное сохранение при уходе со страницы
    window.addEventListener('beforeunload', () => saveGame(true));
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            saveGame(true); // Немедленное сохранение при сворачивании
        }
    });
    if (tg?.onEvent) {
        tg.onEvent('viewportChanged', (event) => {
            if (event && event.isStateStable) {
                console.log("Viewport stable, triggering save.");
                saveGame(false); // Отложенное сохранение при стабилизации viewport
            }
        });
        // Можно добавить обработчик закрытия Mini App, если он появится в API
        // tg.onEvent('close', () => saveGame(true));
    }

    // --- Интервал для обновления цвета жидкости ---
    setInterval(updateLiquidColor, 5 * 60 * 1000); // Обновлять каждые 5 минут

}); // --- КОНЕЦ ОБРАБОТЧИКА DOMContentLoaded ---