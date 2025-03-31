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

    // --- Переменные для защиты от автокликера ---
    let lastClickTime = 0; // Время последнего ЗАСЧИТАННОГО клика
    const MIN_CLICK_INTERVAL = 67; // 1000 / 15 ≈ 67 мс
    const MAX_WARNINGS = 3; // Количество предупреждений до блокировки
    let warningCount = 0; // Текущий счетчик предупреждений
    let isBlocked = false; // Флаг блокировки игрока

    // --- Отображение имени пользователя (опционально) ---
    if (tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.first_name) {
        userGreetingElement.textContent = `Лаборатория ${tg.initDataUnsafe.user.first_name}`;
    }

    // --- Определения улучшений ---
    const upgrades = [
        // ... (ваш массив upgrades остается без изменений) ...
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

    // --- Логика клика по котлу (с защитой) ---
    if (cauldronElement) {
        cauldronElement.addEventListener('click', () => {
             // Вибрация при клике (легкая)
             if (tg && tg.HapticFeedback) {
                tg.HapticFeedback.impactOccurred('light');
            }

            if (isBlocked) {
                showTemporaryNotification("Автокликер обнаружен! Возможность кликать заблокирована.", "error");
                return;
            }

            const currentTime = Date.now();

            if (currentTime - lastClickTime >= MIN_CLICK_INTERVAL) {
                warningCount = 0;
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
                    lastClickTime = currentTime;
                } else {
                    console.error("Invalid essencePerClick value:", essencePerClick);
                }
            } else {
                warningCount++;
                console.warn(`Autoclicker warning ${warningCount}/${MAX_WARNINGS}`);
                showTemporaryNotification(`Слишком частый клик! Предупреждение ${warningCount}/${MAX_WARNINGS}`, "warning");
                 // Вибрация при предупреждении (средняя)
                 if (tg && tg.HapticFeedback) {
                    tg.HapticFeedback.impactOccurred('medium');
                }
                if (warningCount >= MAX_WARNINGS) {
                    isBlocked = true;
                    console.error("Player blocked due to suspected autoclicker.");
                    showTemporaryNotification("Автокликер обнаружен! Возможность кликать заблокирована.", "error");
                     // Вибрация при блокировке (сильная)
                    if (tg && tg.HapticFeedback) {
                        tg.HapticFeedback.notificationOccurred('error');
                    }
                    if(cauldronElement) {
                        cauldronElement.classList.add('blocked-cauldron');
                        cauldronElement.style.cursor = 'not-allowed';
                    }
                }
            }
        });
    } else {
        console.error("Cauldron element not found!");
    }

    // --- Функция для отображения "+1" при клике ---
    function showClickFeedback(text) {
        if (isBlocked || !clickFeedbackContainer) return;
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
        if (!isBlocked && essencePerSecond > 0 && Number.isFinite(essencePerSecond)) { // Добавил проверку !isBlocked
            const essenceToAdd = essencePerSecond / 10; // Начисляем 10 раз в секунду
            if (Number.isFinite(essenceToAdd)) {
                essence += essenceToAdd;
                updateEssenceDisplay(); // Обновляем чаще для плавной анимации счета
            } else {
                 console.warn("Skipping auto-click: essenceToAdd resulted in invalid number", essenceToAdd);
            }
        }
    }, 100); // Интервал 100мс = 10 раз в секунду

    // --- Логика улучшений ---
    function calculateCost(upgrade) {
        if (!upgrade || typeof upgrade.baseCost !== 'number' || typeof upgrade.costMultiplier !== 'number' || typeof upgrade.currentLevel !== 'number') {
             console.error("Invalid upgrade data in calculateCost:", upgrade);
             return Infinity;
        }
        return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.currentLevel));
    }

    function renderUpgrades() {
        if (!upgradesListElement) {
             console.error("Upgrades list element not found!");
             return;
        }
        upgradesListElement.innerHTML = '';
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
            // Используем Math.floor(essence) для сравнения с требованием
            const isLocked = Math.floor(essence) < requirement;
            const canAfford = essence >= cost;

            const li = document.createElement('li');
            if (isLocked) {
                li.classList.add('locked'); // Класс для серых/недоступных улучшений
            } else if (!canAfford) {
                 li.classList.add('cannot-afford'); // Доп. класс для тех, что доступны, но не хватает средств
            }

            let buttonText = 'Купить';
            let buttonDisabled = '';

            if (isLocked) {
                buttonDisabled = 'disabled';
                buttonText = `Нужно ${formatNumber(requirement)} 🧪`;
            } else if (!canAfford) {
                buttonDisabled = 'disabled'; // Кнопка неактивна, если не хватает средств
            }

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

            const buyButton = li.querySelector('.buy-upgrade-btn');
            if (buyButton && !isLocked) { // Вешаем обработчик только если улучшение не заблокировано по требованию
                buyButton.addEventListener('click', () => {
                    if (!buyButton.disabled) { // Доп. проверка, что кнопка активна
                       buyUpgrade(upgrade.id);
                    }
                });
            }
            upgradesListElement.appendChild(li);
        });
    }

    function buyUpgrade(upgradeId) {
        if (isBlocked) {
             showTemporaryNotification("Действие заблокировано из-за подозрений.", "error");
             return;
        }

        const upgrade = upgrades.find(u => u.id === upgradeId);
        if (!upgrade) {
             console.error("Upgrade not found:", upgradeId);
             return;
        }

        const requirement = upgrade.requiredEssence || 0;
        // Повторная проверка на всякий случай
        if (Math.floor(essence) < requirement) {
            console.log("Attempted to buy a locked upgrade (should not happen if UI is correct):", upgradeId);
            showTemporaryNotification(`Сначала накопите ${formatNumber(requirement)} эссенции!`, "error");
            return;
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
            renderUpgrades(); // Перерисовываем улучшения, чтобы обновить стоимость и, возможно, доступность следующих
             // Вибрация при успешной покупке
            if (tg && tg.HapticFeedback) {
                tg.HapticFeedback.impactOccurred('light');
            }
        } else {
            console.log("Недостаточно эссенции!");
            showTemporaryNotification("Недостаточно эссенции!", "error");
             // Вибрация при неудачной покупке
            if (tg && tg.HapticFeedback) {
                tg.HapticFeedback.notificationOccurred('warning');
            }
        }
    }

    function recalculateBonuses() {
        essencePerClick = 1; // Начинаем с базового клика
        essencePerSecond = 0; // Начинаем с нуля пассивного дохода

        upgrades.forEach(upgrade => {
            // Учитываем только улучшения с уровнем > 0
            if (upgrade.currentLevel > 0 && Number.isFinite(upgrade.value) && typeof upgrade.type === 'string') {
                // Применяем бонус за КАЖДЫЙ уровень улучшения
                if (upgrade.type === 'click') {
                    essencePerClick += upgrade.value * upgrade.currentLevel;
                } else if (upgrade.type === 'auto') {
                    essencePerSecond += upgrade.value * upgrade.currentLevel;
                }
            } else if (upgrade.currentLevel > 0) {
                 // Предупреждение, если данные улучшения некорректны, но уровень > 0
                 console.warn("Invalid upgrade data in recalculateBonuses for active upgrade:", upgrade);
            }
        });

        // Дополнительные проверки на NaN/Infinity после всех расчетов
        if (!Number.isFinite(essencePerClick)) {
             console.error("recalculateBonuses resulted in invalid essencePerClick:", essencePerClick);
             essencePerClick = 1; // Сброс к безопасному значению
        }
        if (!Number.isFinite(essencePerSecond)) {
             console.error("recalculateBonuses resulted in invalid essencePerSecond:", essencePerSecond);
             essencePerSecond = 0; // Сброс к безопасному значению
        }

         // Обновляем отображение дохода в секунду сразу после пересчета
         if (essencePerSecondElement) {
             essencePerSecondElement.textContent = formatNumber(essencePerSecond);
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

    // --- Логика кнопки "Друзья" (С ВАШИМИ ДАННЫМИ) ---
    if (inviteFriendBtn) {
        inviteFriendBtn.addEventListener('click', () => {
            if (tg) {
                 // Простой вариант: предложить поделиться ссылкой на ваше WebApp
                 // Используем ваши данные из скриншота:
                 const botUsername = 'AlchimLaboratory_Bot'; // Ваше имя пользователя бота (без @)
                 const appName = 'AlchimLab';              // Короткое имя вашего WebApp
                 // Добавляем ID пользователя для возможной реферальной системы
                 const userId = (tg.initDataUnsafe?.user?.id) ? `?start=${tg.initDataUnsafe.user.id}` : '';
                 const shareUrl = `https://t.me/${botUsername}/${appName}${userId}`;
                 const shareText = 'Заходи в мою Алхимическую Лабораторию в Telegram! 🧪⚗️ Кликай и создавай эликсиры!';

                // Используем метод Telegram для шаринга
                tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`);

                console.log('Предложено поделиться ссылкой:', shareUrl);
            } else {
                 console.error('Не удалось получить доступ к функциям Telegram для шаринга.');
                 // Можно показать уведомление пользователю
                 showTemporaryNotification('Не удалось создать ссылку для приглашения.', 'error');
            }
        });
    } else {
         console.error("Invite friend button not found!");
    }


    // --- Сохранение/Загрузка через CloudStorage ---

    // НОВАЯ ФУНКЦИЯ saveGame (для CloudStorage)
    function saveGame() {
        // Проверяем доступность CloudStorage
        if (!tg || !tg.CloudStorage) {
            console.error("Telegram CloudStorage is not available for saving.");
            return; // Не можем сохранить
        }

        if (!Number.isFinite(essence)) {
            console.error("Attempting to save invalid essence value:", essence);
            essence = 0; // Безопасное значение по умолчанию
        }

        const gameState = {
            essence: essence,
            // Сохраняем только необходимые данные из улучшений
            upgrades: upgrades.map(u => ({ id: u.id, level: u.currentLevel }))
            // Добавьте сюда другие важные переменные состояния, если они появятся (например, время последнего визита для оффлайн прогресса)
        };

        try {
            const gameStateString = JSON.stringify(gameState);
            // Ограничим частоту вывода в консоль, чтобы не засорять при частых сохранениях
            // if (Math.random() < 0.1) { // Примерно раз в 10 сохранений
            //      console.log("Attempting to save to CloudStorage:", gameStateString.length + " bytes");
            // }

            // Используем CloudStorage.setItem с ключом 'gameState'
            tg.CloudStorage.setItem('gameState', gameStateString, (error) => {
                if (error) {
                    console.error("Ошибка сохранения в CloudStorage:", error);
                    // Можно добавить логику повторной попытки или уведомление пользователя при критических ошибках
                    // showTemporaryNotification("Ошибка сохранения прогресса!", "error");
                } else {
                    // Успешное сохранение обычно не требует вывода в консоль или уведомления
                    // console.log("Игра успешно сохранена в CloudStorage");
                }
            });

        } catch (e) {
            // Ошибка при JSON.stringify
            console.error("Ошибка при подготовке данных для сохранения (JSON.stringify):", e);
            showTemporaryNotification("Критическая ошибка сохранения!", "error");
        }
    }

    // НОВАЯ ФУНКЦИЯ loadGame (для CloudStorage)
    function loadGame() {
        // Сброс состояния блокировки при загрузке
        isBlocked = false;
        warningCount = 0;
        if(cauldronElement) {
             cauldronElement.classList.remove('blocked-cauldron');
             cauldronElement.style.cursor = 'pointer';
         }

        // Проверяем доступность CloudStorage
        if (!tg || !tg.CloudStorage) {
            console.error("Telegram CloudStorage is not available for loading. Loading defaults.");
            resetGameData(); // Загружаем стандартные значения
            updateEssenceDisplay(); // Обновляем UI
            showTemporaryNotification("Не удалось загрузить прогресс. Начинаем новую игру.", "warning");
            return;
        }

        console.log("Attempting to load from CloudStorage with key 'gameState'...");

        // Используем CloudStorage.getItem с ключом 'gameState'
        tg.CloudStorage.getItem('gameState', (error, value) => {
            let loadedSuccessfully = false;
            if (error) {
                console.error("Ошибка загрузки из CloudStorage:", error);
                showTemporaryNotification("Ошибка загрузки прогресса! Начинаем новую игру.", "error");
                resetGameData(); // Сброс к начальным значениям при ошибке
            } else if (value) {
                // Данные получены
                console.log("Data received from CloudStorage:", value.length + " bytes");
                try {
                    const gameState = JSON.parse(value);

                    // Применяем загруженное состояние
                    // Используем || 0 для подстраховки от undefined/null/NaN
                    essence = Number(gameState.essence) || 0;
                    if (!Number.isFinite(essence)) essence = 0; // Доп. проверка на конечность числа

                    // Обновляем уровни улучшений
                    upgrades.forEach(upgrade => {
                        // Ищем сохраненное улучшение по ID
                        const savedUpgrade = gameState.upgrades?.find(su => su.id === upgrade.id); // gameState.upgrades может отсутствовать в старых сохранениях
                        // Применяем уровень, если он найден и валиден, иначе 0
                        upgrade.currentLevel = (savedUpgrade && Number.isFinite(Number(savedUpgrade.level))) ? Number(savedUpgrade.level) : 0;
                    });

                    recalculateBonuses(); // Пересчитываем бонусы на основе загруженных уровней
                    console.log("Игра успешно загружена из CloudStorage");
                    loadedSuccessfully = true; // Флаг успешной загрузки

                } catch (e) {
                    // Ошибка парсинга JSON (данные повреждены или несовместимый формат)
                    console.error("Ошибка парсинга данных из CloudStorage:", e);
                    showTemporaryNotification("Ошибка чтения сохраненных данных! Начинаем новую игру.", "error");
                    resetGameData(); // Сброс к начальным значениям
                }
            } else {
                // Ключ 'gameState' не найден (первый запуск или данные были удалены)
                console.log("Сохранение 'gameState' в CloudStorage не найдено, начинаем новую игру.");
                resetGameData(); // Начинаем с начальных значений
            }

            // Обновляем интерфейс ПОСЛЕ завершения асинхронной операции загрузки или сброса
            updateEssenceDisplay();
            // renderUpgrades(); // Можно раскомментировать, если панель улучшений видна по умолчанию

             // Опциональное уведомление об успешной загрузке (возможно, излишне)
             // if (loadedSuccessfully) {
             //    showTemporaryNotification("Прогресс загружен", "info");
             // }
        });

        // ВАЖНО: Код здесь выполнится ДО того, как данные будут фактически загружены из CloudStorage.
        // Вся логика, зависящая от загруженных данных, должна быть ВНУТРИ callback-функции getItem.
    }

    // Функция сброса данных игры к начальным значениям
    function resetGameData() {
        isBlocked = false;
        warningCount = 0;
        if(cauldronElement) {
             cauldronElement.classList.remove('blocked-cauldron');
             cauldronElement.style.cursor = 'pointer';
         }

        essence = 0;
        upgrades.forEach(u => u.currentLevel = 0); // Сбрасываем уровни всех улучшений
        recalculateBonuses(); // Пересчитываем бонусы (они станут базовыми)
        console.log("Game data reset to default values.");
    }

    // --- Функция для временных уведомлений ---
    function showTemporaryNotification(message, type = "info") {
        // ... (код функции showTemporaryNotification остается без изменений) ...
         const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.position = 'fixed';
        notification.style.bottom = '70px'; // Положение над нижними кнопками
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '8px';
        notification.style.backgroundColor = '#333'; // Темный фон по умолчанию
        notification.style.color = 'white';
        notification.style.zIndex = '1000';
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s ease, bottom 0.3s ease'; // Плавное появление/исчезание
        notification.style.textAlign = 'center';
        notification.style.maxWidth = '80%';

        // Задаем цвет фона в зависимости от типа
        if (type === 'error') {
            notification.style.backgroundColor = '#e74c3c'; // Красный
        } else if (type === 'warning') {
            notification.style.backgroundColor = '#f39c12'; // Оранжевый
        } else if (type === 'success') { // Добавим тип "success"
            notification.style.backgroundColor = '#2ecc71'; // Зеленый
        } else { // info
             notification.style.backgroundColor = '#3498db'; // Синий
        }

        document.body.appendChild(notification);

        // Анимация появления
        setTimeout(() => {
             notification.style.opacity = '1';
             notification.style.bottom = '80px'; // Немного приподнять
        }, 10); // Небольшая задержка для срабатывания transition

        // Анимация исчезновения
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.bottom = '70px'; // Опустить обратно
            setTimeout(() => { notification.remove(); }, 500); // Удалить из DOM после завершения анимации
        }, 2500); // Уведомление видно 2.5 секунды
    }


    // --- Первоначальная инициализация ---
    loadGame(); // Загружаем игру ИЗ CloudStorage (асинхронно!)
    // updateEssenceDisplay(); // НЕ вызываем здесь, т.к. loadGame сделает это внутри callback

    // --- Автосохранение и обработчики событий видимости/закрытия ---
    // Сохраняем чаще, но CloudStorage может троттлить запросы, если они слишком частые
    setInterval(saveGame, 15000); // Сохраняем каждые 15 секунд

    // Сохранение при сворачивании или закрытии вкладки/приложения
    window.addEventListener('beforeunload', saveGame);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            saveGame();
        }
    });

     // --- Дополнительно: Сохранение при закрытии WebApp через Telegram ---
     // Этот обработчик может сработать не на всех платформах/версиях ТГ, но стоит добавить
     if (tg && tg.onEvent) {
        tg.onEvent('viewportChanged', (event) => {
            // Проверяем, не закрывается ли окно WebApp
            if (!event.isStateStable) {
                // Состояние меняется, возможно, окно сворачивается или закрывается
                // На всякий случай сохраняем
                 saveGame();
            }
        });
         // Также можно попробовать событие 'mainButtonClicked', если у вас есть MainButton
         // tg.onEvent('mainButtonClicked', saveGame);
     }


}); // Конец DOMContentLoaded