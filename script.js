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
    const upgrades = [
        // --- Начальный Тир (Доступны сразу) ---
        { id: 'click1', name: 'Улучшенный рецепт', description: '+1 к клику', baseCost: 15, costMultiplier: 1.4, type: 'click', value: 1, currentLevel: 0, requiredEssence: 0 },
        { id: 'auto1', name: 'Гомункул-Помощник', description: '+1 в секунду', baseCost: 60, costMultiplier: 1.6, type: 'auto', value: 1, currentLevel: 0, requiredEssence: 0 },

        // --- Тир 2 (Требуется ~500+ Эссенции) ---
        { id: 'click2', name: 'Зачарованная ступка', description: '+5 к клику', baseCost: 300, costMultiplier: 1.5, type: 'click', value: 5, currentLevel: 0, requiredEssence: 500 },
        { id: 'auto2', name: 'Пузырящийся котел', description: '+4 в секунду', baseCost: 750, costMultiplier: 1.7, type: 'auto', value: 4, currentLevel: 0, requiredEssence: 700 },

        // --- Тир 3 (Требуется ~10,000+ Эссенции) ---
        { id: 'click3', name: 'Алембик Мастера', description: '+25 к клику', baseCost: 5000, costMultiplier: 1.6, type: 'click', value: 25, currentLevel: 0, requiredEssence: 10000 },
        { id: 'auto3', name: 'Призванный Ифрит', description: '+20 в секунду', baseCost: 12000, costMultiplier: 1.8, type: 'auto', value: 20, currentLevel: 0, requiredEssence: 15000 },
        { id: 'auto4', name: 'Сад Алхимических Растений', description: '+50 в секунду', baseCost: 30000, costMultiplier: 1.9, type: 'auto', value: 50, currentLevel: 0, requiredEssence: 40000 },


        // --- Тир 4 (Требуется ~500,000+ Эссенции) ---
         { id: 'click4', name: 'Сила Философского Камня (осколок)', description: '+150 к клику', baseCost: 250000, costMultiplier: 1.7, type: 'click', value: 150, currentLevel: 0, requiredEssence: 500000 },
         { id: 'auto5', name: 'Эфирный Концентратор', description: '+250 в секунду', baseCost: 1000000, costMultiplier: 2.0, type: 'auto', value: 250, currentLevel: 0, requiredEssence: 1200000 },
         { id: 'auto6', name: 'Портал в мир Эссенции', description: '+1000 в секунду', baseCost: 5000000, costMultiplier: 2.2, type: 'auto', value: 1000, currentLevel: 0, requiredEssence: 6000000 },

        // --- Тир 5 (Очень дорогой, для эндгейма) ---
         { id: 'click5', name: 'Прикосновение Творца', description: '+1000 к клику', baseCost: 10000000, costMultiplier: 1.8, type: 'click', value: 1000, currentLevel: 0, requiredEssence: 15000000 },
         { id: 'auto7', name: 'Поток Чистой Магии', description: '+5000 в секунду', baseCost: 50000000, costMultiplier: 2.1, type: 'auto', value: 5000, currentLevel: 0, requiredEssence: 60000000 },
    ];


    // --- Функции обновления UI ---
    function updateEssenceDisplay() {
        if (essenceCountElement) {
            essenceCountElement.textContent = formatNumber(Math.floor(essence));
        }
        if (essencePerSecondElement) {
            essencePerSecondElement.textContent = formatNumber(essencePerSecond);
        }
    }

    // Форматирование больших чисел (для наглядности)
    function formatNumber(num) {
        if (isNaN(num) || !Number.isFinite(num)) {
             console.warn("formatNumber received invalid input:", num);
             return "ERR";
        }
        if (num < 1000) return num.toString();
        if (num < 1000000) return (num / 1000).toFixed(1).replace('.0', '') + 'K';
        if (num < 1000000000) return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
        return (num / 1000000000).toFixed(1).replace('.0', '') + 'B';
    }

    // --- Логика клика по котлу ---
    if (cauldronElement) {
        cauldronElement.addEventListener('click', () => {
            if (Number.isFinite(essencePerClick)) {
                essence += essencePerClick;
                updateEssenceDisplay();
                if (clickFeedbackContainer) {
                     showClickFeedback(`+${formatNumber(essencePerClick)}`);
                }
                cauldronElement.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    cauldronElement.style.transform = 'scale(1)';
                }, 80);
            } else {
                 console.error("Invalid essencePerClick value:", essencePerClick);
            }
        });
    } else {
        console.error("Cauldron element not found!");
    }


    // --- Функция для отображения "+1" при клике ---
    function showClickFeedback(text) {
        if (!clickFeedbackContainer) return;
        const feedback = document.createElement('div');
        feedback.className = 'click-feedback';
        feedback.textContent = text;
        const offsetX = Math.random() * 40 - 20;
        const offsetY = Math.random() * 20 - 10;
        feedback.style.left = `calc(50% + ${offsetX}px)`;
        feedback.style.top = `calc(50% + ${offsetY}px)`;
        clickFeedbackContainer.appendChild(feedback);
        setTimeout(() => {
            feedback.remove();
        }, 950);
    }

    // --- Логика авто-клика (пассивный доход) ---
    setInterval(() => {
        if (essencePerSecond > 0 && Number.isFinite(essencePerSecond)) {
            const essenceToAdd = essencePerSecond / 10;
            if (Number.isFinite(essenceToAdd)) {
                essence += essenceToAdd;
                updateEssenceDisplay();
            } else {
                 console.warn("Skipping auto-click: essenceToAdd resulted in invalid number", essenceToAdd);
            }
        }
    }, 100);

    // --- Логика улучшений ---
    function calculateCost(upgrade) {
        if (!upgrade || typeof upgrade.baseCost !== 'number' || typeof upgrade.costMultiplier !== 'number' || typeof upgrade.currentLevel !== 'number') {
             console.error("Invalid upgrade data in calculateCost:", upgrade);
             return Infinity;
        }
        return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.currentLevel));
    }

    // ОБНОВЛЕННАЯ ФУНКЦИЯ RENDERUPGRADES (с показом заблокированных)
    function renderUpgrades() {
        if (!upgradesListElement) {
             console.error("Upgrades list element not found!");
             return;
        }
        upgradesListElement.innerHTML = ''; // Очищаем список

        // Сортируем все улучшения, например, по требуемой эссенции
        upgrades.sort((a, b) => (a.requiredEssence || 0) - (b.requiredEssence || 0));

        if (upgrades.length === 0) {
             upgradesListElement.innerHTML = '<li><p>Улучшения не определены.</p></li>';
             return;
        }

        upgrades.forEach(upgrade => {
            const cost = calculateCost(upgrade);
            if (!Number.isFinite(cost)) {
                 console.error("Skipping render for upgrade with invalid cost:", upgrade.id);
                 return;
            }

            const requirement = upgrade.requiredEssence || 0;
            const isLocked = Math.floor(essence) < requirement; // Проверяем блокировку по требованию
            const canAfford = essence >= cost; // Проверяем доступность по цене

            const li = document.createElement('li');
            if (isLocked) {
                li.classList.add('locked'); // Добавляем класс для заблокированных
            }

            let buttonText = 'Купить';
            let buttonDisabled = '';

            if (isLocked) {
                buttonDisabled = 'disabled';
                buttonText = `Нужно ${formatNumber(requirement)} 🧪`; // Показываем требование
            } else if (!canAfford) {
                buttonDisabled = 'disabled'; // Не хватает эссенции для покупки
            }

            // !!! --- ИСПРАВЛЕНИЕ ЗДЕСЬ --- !!!
            li.innerHTML = `
                <div class="upgrade-info">
                    <h3>${upgrade.name} (Ур. ${upgrade.currentLevel})</h3>
                    <p>${upgrade.description}</p>
                    <p class="upgrade-cost">Стоимость: ${formatNumber(cost)} 🧪</p>
                    ${isLocked ? `<p class="requirement-info">Требуется: ${formatNumber(requirement)} 🧪</p>` : ''}
                </div>
                <button class="buy-upgrade-btn" data-upgrade-id="${upgrade.id}" ${buttonDisabled}>
                    ${buttonText}
                </button>
            `;
            // !!! --- КОНЕЦ ИСПРАВЛЕНИЯ --- !!!

            const buyButton = li.querySelector('.buy-upgrade-btn');
            if (buyButton) {
                // Добавляем обработчик всегда, но сработает только если кнопка не 'disabled'
                buyButton.addEventListener('click', () => {
                    buyUpgrade(upgrade.id);
                });
            }

            upgradesListElement.appendChild(li);
        });
    }


    function buyUpgrade(upgradeId) {
        const upgrade = upgrades.find(u => u.id === upgradeId);
        if (!upgrade) {
             console.error("Upgrade not found:", upgradeId);
             return;
        }

        // Дополнительная проверка: не пытаемся ли купить заблокированное улучшение?
        const requirement = upgrade.requiredEssence || 0;
        if (Math.floor(essence) < requirement) {
            console.log("Attempted to buy a locked upgrade:", upgradeId);
            showTemporaryNotification(`Сначала накопите ${formatNumber(requirement)} эссенции!`, "error");
            return; // Выходим, не даем купить
        }

        const cost = calculateCost(upgrade);
         if (!Number.isFinite(cost)) {
             console.error("Cannot buy upgrade with invalid cost:", upgradeId);
             showTemporaryNotification("Ошибка: неверная стоимость улучшения!", "error");
             return;
         }

        if (essence >= cost) {
            essence -= cost;
            upgrade.currentLevel++;
            recalculateBonuses();
            updateEssenceDisplay();
            renderUpgrades(); // Перерисовываем панель улучшений
        } else {
            console.log("Недостаточно эссенции!");
            showTemporaryNotification("Недостаточно эссенции!", "error");
        }
    }

    function recalculateBonuses() {
        essencePerClick = 1;
        essencePerSecond = 0;

        upgrades.forEach(upgrade => {
            if (upgrade.currentLevel > 0 && Number.isFinite(upgrade.value) && typeof upgrade.type === 'string') {
                if (upgrade.type === 'click') {
                    essencePerClick += upgrade.value * upgrade.currentLevel;
                } else if (upgrade.type === 'auto') {
                    essencePerSecond += upgrade.value * upgrade.currentLevel;
                }
            } else if (upgrade.currentLevel > 0) {
                 console.warn("Invalid upgrade data in recalculateBonuses:", upgrade);
            }
        });

        if (!Number.isFinite(essencePerClick)) {
             console.error("recalculateBonuses resulted in invalid essencePerClick:", essencePerClick);
             essencePerClick = 1;
        }
         if (!Number.isFinite(essencePerSecond)) {
             console.error("recalculateBonuses resulted in invalid essencePerSecond:", essencePerSecond);
             essencePerSecond = 0;
        }
    }

    // --- Открытие/Закрытие панели улучшений ---
     if (openUpgradesBtn && upgradesPanel) {
        openUpgradesBtn.addEventListener('click', () => {
            renderUpgrades(); // Обновляем список перед показом
            upgradesPanel.classList.remove('hidden');
        });
     } else {
         console.error("Open upgrades button or panel not found!");
     }

     if (closeUpgradesBtn && upgradesPanel) {
        closeUpgradesBtn.addEventListener('click', () => {
            upgradesPanel.classList.add('hidden');
        });
     } else {
         console.error("Close upgrades button or panel not found!");
     }

    // --- Логика кнопки "Друзья" (заглушка) ---
    if (inviteFriendBtn) {
        inviteFriendBtn.addEventListener('click', () => {
            console.log('Кнопка "Друзья" нажата. Нужна интеграция с Telegram API.');
            if (tg && tg.showPopup) {
                tg.showPopup({
                    title: 'Пригласить друзей',
                    message: 'Эта функция пока в разработке. Вы сможете приглашать друзей и получать бонусы!',
                    buttons: [{ type: 'ok' }]
                });
            } else {
                 alert('Эта функция пока в разработке.');
            }
        });
    } else {
         console.error("Invite friend button not found!");
    }


    // --- Сохранение/Загрузка ---
    function saveGame() {
        if (!Number.isFinite(essence)) {
             console.error("Attempting to save invalid essence value:", essence);
             essence = 0;
        }
        const gameState = {
            essence: essence,
            upgrades: upgrades.map(u => ({ id: u.id, level: u.currentLevel }))
        };
        try {
            localStorage.setItem('alchemistClickerSave', JSON.stringify(gameState));
             console.log("Игра сохранена");
        } catch (e) {
            console.error("Ошибка сохранения в localStorage:", e);
            showTemporaryNotification("Ошибка сохранения прогресса!", "error");
        }
    }

    function loadGame() {
        const savedState = localStorage.getItem('alchemistClickerSave');
        if (savedState) {
            try {
                const gameState = JSON.parse(savedState);
                essence = Number(gameState.essence) || 0;
                 if (!Number.isFinite(essence)) essence = 0;

                upgrades.forEach(upgrade => {
                    const savedUpgrade = gameState.upgrades.find(su => su.id === upgrade.id);
                    upgrade.currentLevel = savedUpgrade ? (Number(savedUpgrade.level) || 0) : 0;
                    if (!Number.isFinite(upgrade.currentLevel)) upgrade.currentLevel = 0;
                });

                recalculateBonuses();
                console.log("Игра загружена");

            } catch (e) {
                console.error("Ошибка загрузки сохранения:", e);
                localStorage.removeItem('alchemistClickerSave');
                resetGameData();
            }
        } else {
             console.log("Сохранение не найдено, начинаем новую игру.");
             resetGameData();
        }
    }

    function resetGameData() {
        essence = 0;
        upgrades.forEach(u => u.currentLevel = 0);
        recalculateBonuses();
    }

    // --- Функция для временных уведомлений ---
    function showTemporaryNotification(message, type = "info") {
         const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.position = 'fixed';
        notification.style.bottom = '70px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '8px';
        notification.style.backgroundColor = type === 'error' ? '#e74c3c' : '#3498db';
        notification.style.color = 'white';
        notification.style.zIndex = '1000';
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s ease';
        document.body.appendChild(notification);
        setTimeout(() => { notification.style.opacity = '1'; }, 10);
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => { notification.remove(); }, 500);
        }, 2500);
    }


    // --- Первоначальная инициализация ---
    loadGame(); // Загружаем игру (пересчитывает бонусы)
    updateEssenceDisplay(); // Первичная отрисовка счета и дохода в сек

    // --- Автосохранение и обработчики событий видимости ---
    setInterval(saveGame, 30000); // Сохраняем каждые 30 секунд

    window.addEventListener('beforeunload', saveGame); // Попытка сохранить перед закрытием
     document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            saveGame(); // Сохраняем при сворачивании/переключении вкладок
        }
    });


}); // Конец DOMContentLoaded