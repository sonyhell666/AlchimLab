document.addEventListener('DOMContentLoaded', () => {
    // Инициализация Telegram Web App
    const tg = window.Telegram.WebApp;
    tg.ready(); // Сообщаем Telegram, что приложение готово
    tg.expand(); // Попытка раскрыть Mini App на весь экран

    // Получаем ссылки на элементы DOM
    const essenceCountElement = document.getElementById('essence-count');
    const essencePerSecondElement = document.getElementById('essence-per-second');
    const cauldronElement = document.getElementById('cauldron');
    const clickFeedbackContainer = document.getElementById('click-feedback-container');
    const openUpgradesBtn = document.getElementById('open-upgrades-btn');
    const closeUpgradesBtn = document.getElementById('close-upgrades-btn');
    const upgradesPanel = document.getElementById('upgrades-panel');
    const upgradesListElement = document.getElementById('upgrades-list');
    const userGreetingElement = document.getElementById('user-greeting');
    const inviteFriendBtn = document.getElementById('invite-friend-btn');

    // Игровые переменные (состояние)
    let essence = 0;
    let essencePerClick = 1;
    let essencePerSecond = 0;

    // --- Отображение имени пользователя (опционально) ---
    if (tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.first_name) {
        userGreetingElement.textContent = `Лаборатория ${tg.initDataUnsafe.user.first_name}`;
    }

    // --- Определения улучшений ---
    // Структура:
    // id: уникальный идентификатор
    // name: Название улучшения
    // description: Описание эффекта
    // baseCost: Начальная стоимость
    // costMultiplier: Множитель стоимости для следующего уровня
    // type: 'click' или 'auto' - тип улучшения
    // value: На сколько увеличивается клик или авто-клик за уровень
    // maxLevel: Максимальный уровень (опционально)
    const upgrades = [
        { id: 'click1', name: 'Улучшенный рецепт', description: '+1 к клику', baseCost: 10, costMultiplier: 1.5, type: 'click', value: 1, currentLevel: 0 },
        { id: 'auto1', name: 'Гомункул-Помощник', description: '+1 в секунду', baseCost: 50, costMultiplier: 1.8, type: 'auto', value: 1, currentLevel: 0 },
        { id: 'click2', name: 'Зачарованная ступка', description: '+5 к клику', baseCost: 200, costMultiplier: 1.6, type: 'click', value: 5, currentLevel: 0 },
        { id: 'auto2', name: 'Автоматический перегонный куб', description: '+8 в секунду', baseCost: 1000, costMultiplier: 2.0, type: 'auto', value: 8, currentLevel: 0 },
    ];

    // --- Функции обновления UI ---
    function updateEssenceDisplay() {
        essenceCountElement.textContent = formatNumber(Math.floor(essence));
        essencePerSecondElement.textContent = formatNumber(essencePerSecond);
    }

    // Форматирование больших чисел (для наглядности)
    function formatNumber(num) {
        if (num < 1000) return num.toString();
        if (num < 1000000) return (num / 1000).toFixed(1).replace('.0', '') + 'K';
        if (num < 1000000000) return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
        return (num / 1000000000).toFixed(1).replace('.0', '') + 'B';
    }

    // --- Логика клика по котлу ---
    cauldronElement.addEventListener('click', () => {
        essence += essencePerClick;
        updateEssenceDisplay();
        showClickFeedback(`+${formatNumber(essencePerClick)}`);
        // Можно добавить анимацию котла при клике
        cauldronElement.style.transform = 'scale(0.95)';
        setTimeout(() => {
            cauldronElement.style.transform = 'scale(1)';
        }, 80); // Короткая анимация
    });

    // --- Функция для отображения "+1" при клике ---
    function showClickFeedback(text) {
        const feedback = document.createElement('div');
        feedback.className = 'click-feedback';
        feedback.textContent = text;

        // Случайное смещение для естественности
        const offsetX = Math.random() * 40 - 20; // от -20px до +20px
        const offsetY = Math.random() * 20 - 10; // от -10px до +10px
        feedback.style.left = `calc(50% + ${offsetX}px)`;
        feedback.style.top = `calc(50% + ${offsetY}px)`;

        clickFeedbackContainer.appendChild(feedback);

        // Удалить элемент после завершения анимации
        setTimeout(() => {
            feedback.remove();
        }, 950); // Чуть меньше времени анимации (1s)
    }

    // --- Логика авто-клика (пассивный доход) ---
    setInterval(() => {
        essence += essencePerSecond / 10; // Начисляем 10 раз в секунду для плавности
        updateEssenceDisplay();
    }, 100); // Интервал 100мс

    // --- Логика улучшений ---
    function calculateCost(upgrade) {
        return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.currentLevel));
    }

    function renderUpgrades() {
        upgradesListElement.innerHTML = ''; // Очищаем список перед рендером
        upgrades.forEach(upgrade => {
            const cost = calculateCost(upgrade);
            const li = document.createElement('li');

            const canAfford = essence >= cost;

            li.innerHTML = `
                <div class="upgrade-info">
                    <h3>${upgrade.name} (Ур. ${upgrade.currentLevel})</h3>
                    <p>${upgrade.description}</p>
                    <p class="upgrade-cost">Стоимость: ${formatNumber(cost)} 🧪</p>
                </div>
                <button class="buy-upgrade-btn" data-upgrade-id="${upgrade.id}" ${!canAfford ? 'disabled' : ''}>
                    Купить
                </button>
            `;

            // Добавляем обработчик на кнопку "Купить"
            li.querySelector('.buy-upgrade-btn').addEventListener('click', () => {
                buyUpgrade(upgrade.id);
            });

            upgradesListElement.appendChild(li);
        });
    }

    function buyUpgrade(upgradeId) {
        const upgrade = upgrades.find(u => u.id === upgradeId);
        if (!upgrade) return;

        const cost = calculateCost(upgrade);
        if (essence >= cost) {
            essence -= cost;
            upgrade.currentLevel++;

            // Применяем эффект улучшения
            if (upgrade.type === 'click') {
                essencePerClick += upgrade.value;
            } else if (upgrade.type === 'auto') {
                essencePerSecond += upgrade.value;
            }

            // Обновляем UI
            updateEssenceDisplay();
            renderUpgrades(); // Перерисовываем панель улучшений с новыми ценами и состояниями
        } else {
            console.log("Недостаточно эссенции!"); // Можно добавить уведомление
        }
    }

    // --- Открытие/Закрытие панели улучшений ---
    openUpgradesBtn.addEventListener('click', () => {
        renderUpgrades(); // Обновляем список перед показом
        upgradesPanel.classList.remove('hidden');
    });

    closeUpgradesBtn.addEventListener('click', () => {
        upgradesPanel.classList.add('hidden');
    });

    // --- Логика кнопки "Друзья" (заглушка) ---
    inviteFriendBtn.addEventListener('click', () => {
        // Здесь должна быть логика интеграции с Telegram API
        // Например, генерация реферальной ссылки и шаринг
        // tg.share(...) или tg.openTelegramLink(...)
        console.log('Кнопка "Друзья" нажата. Нужна интеграция с Telegram API.');
        // Простое уведомление для демонстрации
        tg.showPopup({
            title: 'Пригласить друзей',
            message: 'Эта функция пока в разработке. Вы сможете приглашать друзей и получать бонусы!',
            buttons: [{ type: 'ok' }]
        });
    });

    // --- Первоначальная отрисовка ---
    updateEssenceDisplay();
    // renderUpgrades(); // Можно отрисовать сразу, но лучше при открытии панели

    // --- Сохранение/Загрузка (Очень простой пример с localStorage) ---
    function saveGame() {
        const gameState = {
            essence: essence,
            upgrades: upgrades.map(u => ({ id: u.id, level: u.currentLevel }))
        };
        localStorage.setItem('alchemistClickerSave', JSON.stringify(gameState));
        console.log("Игра сохранена");
    }

    function loadGame() {
        const savedState = localStorage.getItem('alchemistClickerSave');
        if (savedState) {
            try {
                const gameState = JSON.parse(savedState);
                essence = gameState.essence || 0;

                // Восстанавливаем уровни улучшений и пересчитываем бонусы
                essencePerClick = 1; // Сбрасываем базовые значения перед пересчетом
                essencePerSecond = 0;
                upgrades.forEach(upgrade => {
                    const savedUpgrade = gameState.upgrades.find(su => su.id === upgrade.id);
                    if (savedUpgrade) {
                        upgrade.currentLevel = savedUpgrade.level || 0;
                        // Применяем эффекты от загруженных уровней
                        if (upgrade.type === 'click') {
                            essencePerClick += upgrade.value * upgrade.currentLevel;
                        } else if (upgrade.type === 'auto') {
                            essencePerSecond += upgrade.value * upgrade.currentLevel;
                        }
                    } else {
                         upgrade.currentLevel = 0; // Если улучшение не найдено в сохранении
                    }
                });

                console.log("Игра загружена");
            } catch (e) {
                console.error("Ошибка загрузки сохранения:", e);
                // Если ошибка - начинаем новую игру
                resetGameData();
            }
        } else {
             console.log("Сохранение не найдено, начинаем новую игру.");
             resetGameData();
        }
        updateEssenceDisplay(); // Обновляем UI после загрузки
    }

    function resetGameData() {
        essence = 0;
        essencePerClick = 1;
        essencePerSecond = 0;
        upgrades.forEach(u => u.currentLevel = 0);
    }

    // Загружаем игру при старте
    loadGame();

    // Автосохранение каждые 30 секунд
    setInterval(saveGame, 30000);

     // Сохраняем перед закрытием (может не всегда срабатывать в Mini Apps)
    window.addEventListener('beforeunload', saveGame);
    // Для Mini Apps более надежно использовать события видимости, если API позволяет
     document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            saveGame();
        }
    });


}); // Конец DOMContentLoaded