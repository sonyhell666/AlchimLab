// --- Определения улучшений ---
// Добавляем поле requiredEssence: сколько нужно эссенции, чтобы увидеть улучшение
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
// ... (остальные функции остаются как были: updateEssenceDisplay, formatNumber, showClickFeedback) ...

// --- Логика клика по котлу ---
// ... (остается как была) ...

// --- Функция для отображения "+1" при клике ---
// ... (остается как была) ...

// --- Логика авто-клика (пассивный доход) ---
// ... (остается как была) ...

// --- Логика улучшений ---
function calculateCost(upgrade) {
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.currentLevel));
}

// !!! --- ИЗМЕНЕННАЯ ФУНКЦИЯ renderUpgrades --- !!!
function renderUpgrades() {
    upgradesListElement.innerHTML = ''; // Очищаем список перед рендером

    // Фильтруем улучшения: показываем только те, для которых достигнут порог requiredEssence
    const availableUpgrades = upgrades.filter(upgrade => {
        // Если у улучшения нет requiredEssence, считаем его 0 (доступно всегда)
        const requirement = upgrade.requiredEssence || 0;
        // Используем Math.floor(essence), чтобы избежать проблем с дробными числами при сравнении
        return Math.floor(essence) >= requirement;
    });

    // Сортируем доступные улучшения по требуемой эссенции (или по цене, если хотите)
    availableUpgrades.sort((a, b) => (a.requiredEssence || 0) - (b.requiredEssence || 0));

    if (availableUpgrades.length === 0) {
         upgradesListElement.innerHTML = '<li><p>Пока нет доступных улучшений. Копите эссенцию!</p></li>';
         return;
    }

    availableUpgrades.forEach(upgrade => {
        const cost = calculateCost(upgrade);
        const li = document.createElement('li');

        // Проверяем, хватает ли эссенции на ПОКУПКУ (не на открытие)
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
// !!! --- КОНЕЦ ИЗМЕНЕННОЙ ФУНКЦИИ renderUpgrades --- !!!


function buyUpgrade(upgradeId) {
    // Находим улучшение в *полном* списке, а не только в доступных
    const upgrade = upgrades.find(u => u.id === upgradeId);
    if (!upgrade) return;

    const cost = calculateCost(upgrade);
    if (essence >= cost) {
        essence -= cost;
        upgrade.currentLevel++;

        // Пересчитываем бонусы после покупки
        recalculateBonuses();

        // Обновляем UI
        updateEssenceDisplay();
        renderUpgrades(); // Перерисовываем панель улучшений
    } else {
        console.log("Недостаточно эссенции!");
        // Можно показать временное уведомление игроку
        showTemporaryNotification("Недостаточно эссенции!", "error");
    }
}

// --- Функция для пересчета всех бонусов ---
// Важно вызывать ее после покупки/загрузки, чтобы бонусы были актуальны
function recalculateBonuses() {
    essencePerClick = 1; // Начинаем с базового значения
    essencePerSecond = 0; // Начинаем с нуля

    upgrades.forEach(upgrade => {
        if (upgrade.currentLevel > 0) {
            if (upgrade.type === 'click') {
                essencePerClick += upgrade.value * upgrade.currentLevel;
            } else if (upgrade.type === 'auto') {
                essencePerSecond += upgrade.value * upgrade.currentLevel;
            }
        }
    });
}

// --- Открытие/Закрытие панели улучшений ---
// ... (остается как была) ...

// --- Логика кнопки "Друзья" (заглушка) ---
// ... (остается как была) ...

// --- Сохранение/Загрузка ---
function saveGame() {
    const gameState = {
        essence: essence,
        upgrades: upgrades.map(u => ({ id: u.id, level: u.currentLevel }))
        // Важно: Не сохраняем essencePerClick и essencePerSecond,
        // так как они будут пересчитаны при загрузке на основе уровней улучшений.
    };
    try {
        localStorage.setItem('alchemistClickerSave', JSON.stringify(gameState));
         console.log("Игра сохранена");
    } catch (e) {
        console.error("Ошибка сохранения в localStorage:", e);
        // Можно уведомить пользователя, что сохранение не удалось
        showTemporaryNotification("Ошибка сохранения прогресса!", "error");
    }
}

function loadGame() {
    const savedState = localStorage.getItem('alchemistClickerSave');
    if (savedState) {
        try {
            const gameState = JSON.parse(savedState);
            // Загружаем эссенцию, убеждаемся что это число
            essence = Number(gameState.essence) || 0;

            // Восстанавливаем уровни улучшений
            upgrades.forEach(upgrade => {
                const savedUpgrade = gameState.upgrades.find(su => su.id === upgrade.id);
                upgrade.currentLevel = savedUpgrade ? (Number(savedUpgrade.level) || 0) : 0;
            });

            // Пересчитываем бонусы на основе загруженных уровней
            recalculateBonuses();

            console.log("Игра загружена");
        } catch (e) {
            console.error("Ошибка загрузки сохранения:", e);
            localStorage.removeItem('alchemistClickerSave'); // Очищаем битое сохранение
            resetGameData(); // Начинаем новую игру
        }
    } else {
         console.log("Сохранение не найдено, начинаем новую игру.");
         resetGameData(); // Убедимся, что бонусы сброшены
    }
    updateEssenceDisplay(); // Обновляем UI после загрузки/сброса
}

function resetGameData() {
    essence = 0;
    upgrades.forEach(u => u.currentLevel = 0);
    recalculateBonuses(); // Сбрасываем бонусы
}

// --- Добавим функцию для временных уведомлений (опционально) ---
function showTemporaryNotification(message, type = "info") {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`; // Добавим классы для стилизации
    notification.textContent = message;

    // Стилизуем уведомление (можно вынести в CSS)
    notification.style.position = 'fixed';
    notification.style.bottom = '70px'; // Чуть выше кнопок
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

    // Анимация появления и исчезновения
    setTimeout(() => { notification.style.opacity = '1'; }, 10); // Появление
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => { notification.remove(); }, 500); // Удалить после исчезновения
    }, 2500); // Показать на 2.5 секунды
}


// --- Первоначальная инициализация ---
loadGame(); // Загружаем игру
// renderUpgrades(); // Убрали отсюда, вызывается при открытии панели
updateEssenceDisplay(); // Первичная отрисовка счета

// --- Автосохранение и обработчики событий ---
// ... (остаются как были) ...

; // Конец DOMContentLoaded