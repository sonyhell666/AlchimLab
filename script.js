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

    // --- Игровые переменные (состояние) ---
    let essence = 0;
    let essencePerClick = 1;
    let essencePerSecond = 0;
    let gems = 0;
    const GEM_AWARD_CHANCE = 0.03;
    const GEMS_PER_AWARD = 1;
    let currentLanguage = 'ru'; // Язык по умолчанию
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
        friendsButton: { ru: "Друзья", en: "Friends" },
        upgradesTitle: { ru: "Улучшения", en: "Upgrades" },
        settingsTitle: { ru: "Настройки", en: "Settings" },
        languageTitle: { ru: "Язык", en: "Language" },
        buyButton: { ru: "Купить", en: "Buy" },
        requirementPrefix: { ru: "Нужно", en: "Need" },
        requirementInfoPrefix: { ru: "Требуется", en: "Requires" },
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

    // --- Определения улучшений с ключами перевода ---
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

    // --- Функции для пузырьков ---
    function createBubble() { if (!bubblesContainer) return; const b = document.createElement('div'); b.classList.add('bubble'); const s = Math.random() * 8 + 6; const d = Math.random() * 2.5 + 3; const l = Math.random() * 1.5; const h = Math.random() * 90 + 5; b.style.width = `${s}px`; b.style.height = `${s}px`; b.style.left = `${h}%`; b.style.animationDuration = `${d}s`; b.style.animationDelay = `${l}s`; bubblesContainer.appendChild(b); setTimeout(() => { b.remove(); }, (d + l) * 1000 + 100); }
    setInterval(createBubble, 500);

    // --- Функция обновления визуала жидкости и пузырьков ---
    function updateLiquidLevelVisual(percentage) { const l = Math.max(LIQUID_MIN_LEVEL, Math.min(LIQUID_MAX_LEVEL, percentage)); if (cauldronElement) { cauldronElement.style.setProperty('--liquid-level', `${l}%`); if(bubblesContainer) { bubblesContainer.style.height = `${l}%`; } } else { console.warn("Cauldron !found."); } }

    // --- Общая функция обновления UI ---
    function updateDisplay() { if (essenceCountElement) essenceCountElement.textContent = formatNumber(Math.floor(essence)); if (essencePerSecondElement && perSecondDisplayDiv) { essencePerSecondElement.textContent = formatNumber(essencePerSecond); perSecondDisplayDiv.style.display = essencePerSecond > 0 ? 'block' : 'none'; } if (gemCountElement) gemCountElement.textContent = formatNumber(gems); if (upgradesPanel && !upgradesPanel.classList.contains('hidden')) renderUpgrades(); }

    // --- Функция форматирования чисел ---
    function formatNumber(num) { if (isNaN(num)||!Number.isFinite(num)) { console.warn("formatNum invalid:", num); return "ERR"; } if (num < 1000) return num.toString(); if (num < 1e6) return (num/1e3).toFixed(1).replace('.0','')+'K'; if (num < 1e9) return (num/1e6).toFixed(1).replace('.0','')+'M'; return (num/1e9).toFixed(1).replace('.0','')+'B'; }

    // --- Функция для отображения "+N" при клике ---
    function showClickFeedback(amount, type = 'essence') { if (isBlocked||!clickFeedbackContainer) return; const f=document.createElement('div'); f.className='click-feedback'; const fmt=formatNumber(amount); if (type==='gem'){ const i=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" fill="var(--gem-color)" style="vertical-align:middle;margin-left:4px;"><path d="M12 1.68l-8 8.42L12 22.32l8-8.42L12 1.68zm0 2.1l5.95 6.27L12 18.54l-5.95-6.27L12 3.78z M6.4 10.1L12 16.1l5.6-6H6.4z"/></svg>`; f.innerHTML=`+${fmt}${i}`; f.style.fontSize='1.3em'; f.style.fontWeight='bold'; f.style.color='#f0f0f0';} else { f.textContent=`+${fmt} 🧪`; f.style.color='var(--accent-color)';} const ox=Math.random()*60-30; const oy=(type==='gem')?(Math.random()*20+15):(Math.random()*20-10); f.style.left=`calc(50% + ${ox}px)`; f.style.top=`calc(50% + ${oy}px)`; clickFeedbackContainer.appendChild(f); setTimeout(()=>{f.remove();},950); }

    // --- Логика клика по котлу ---
    if (cauldronElement) { cauldronElement.addEventListener('click', ()=>{ const cT=Date.now(); if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light'); if (isBlocked) { showTemporaryNotification(translations.autoclickerBlocked?.[currentLanguage]||"Autoclicker detected! Clicking blocked.", "error"); return; } if(cT-lastClickTime>=MIN_CLICK_INTERVAL){ warningCount=0; lastInteractionTime=cT; let clA=essencePerClick; if(Number.isFinite(clA)){ essence+=clA; if(clickFeedbackContainer) showClickFeedback(clA,'essence');} else { console.error("Invalid E/Click:", essencePerClick);} if(Math.random()<GEM_AWARD_CHANCE){ gems+=GEMS_PER_AWARD; console.log(`Got gem! Total: ${gems}`); if(clickFeedbackContainer) showClickFeedback(GEMS_PER_AWARD,'gem'); if(tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');} visualLiquidLevel+=LIQUID_INCREASE_PER_CLICK; visualLiquidLevel=Math.min(visualLiquidLevel,LIQUID_MAX_LEVEL); updateLiquidLevelVisual(visualLiquidLevel); updateDisplay(); cauldronElement.style.transform='scale(0.95)'; setTimeout(()=>{if(cauldronElement) cauldronElement.style.transform='scale(1)';},80); lastClickTime=cT;} else { warningCount++; lastInteractionTime=cT; console.warn(`Warn ${warningCount}/${MAX_WARNINGS}`); showTemporaryNotification(`${translations.tooFastClick?.[currentLanguage]||"Clicking too fast!"} Warn ${warningCount}/${MAX_WARNINGS}`, "warning"); if(tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('medium'); if(warningCount>=MAX_WARNINGS){ isBlocked=true; console.error("Blocked."); showTemporaryNotification(translations.autoclickerBlocked?.[currentLanguage]||"Autoclicker detected! Clicking blocked.", "error"); if(tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('error'); if(cauldronElement) cauldronElement.classList.add('blocked-cauldron');}}}); } else { console.error("Cauldron !found!"); }

    // --- Логика авто-клика ---
    setInterval(() => { if (!isBlocked && essencePerSecond > 0 && Number.isFinite(essencePerSecond)) { const eA = essencePerSecond / 10; if (Number.isFinite(eA)) { essence += eA; updateDisplay(); } else { console.warn("..."); } } }, 100);

    // --- Интервал для уменьшения уровня жидкости ---
    setInterval(() => { const cT = Date.now(); if (cT - lastInteractionTime > IDLE_TIMEOUT && visualLiquidLevel > LIQUID_MIN_LEVEL) { visualLiquidLevel -= LIQUID_DECAY_RATE; visualLiquidLevel = Math.max(visualLiquidLevel, LIQUID_MIN_LEVEL); } updateLiquidLevelVisual(visualLiquidLevel); }, LIQUID_UPDATE_INTERVAL);

    // --- Логика улучшений ---
    function calculateCost(u) { if(!u||typeof u.baseCost!=='number'||typeof u.costMultiplier!=='number'||typeof u.currentLevel!=='number'){console.error("Invalid calcCost:",u);return Infinity;} return Math.floor(u.baseCost*Math.pow(u.costMultiplier,u.currentLevel));}
    function renderUpgrades() { if(!upgradesListElement){console.error("Upgrades list !found!");return;} upgradesListElement.innerHTML=''; upgrades.sort((a,b)=>(a.requiredEssence||0)-(b.requiredEssence||0)); if(upgrades.length===0){upgradesListElement.innerHTML=`<li><p>No upgrades defined.</p></li>`;return;} const cEF=Math.floor(essence); upgrades.forEach(u=>{ const cost=calculateCost(u); if(!Number.isFinite(cost)){console.error("Skip render invalid cost:",u.id);return;} const req=u.requiredEssence||0; const isL=cEF<req; const canA=cEF>=cost; const li=document.createElement('li'); if(isL)li.classList.add('locked'); else if(!canA)li.classList.add('cannot-afford'); const tN=translations[u.nameKey]?.[currentLanguage]||u.nameKey; const tD=translations[u.descKey]?.[currentLanguage]||u.descKey; const bT=translations.buyButton?.[currentLanguage]||"Buy"; const rP=translations.requirementPrefix?.[currentLanguage]||"Need"; const rIP=translations.requirementInfoPrefix?.[currentLanguage]||"Requires"; let btnTxt=bT; let btnDis=false; if(isL){btnDis=true;btnTxt=`${rP} ${formatNumber(req)} 🧪`;}else if(!canA){btnDis=true;} li.innerHTML=`<div class="upgrade-info"><h3>${tN} (Lv. ${u.currentLevel})</h3><p>${tD}</p><p class="upgrade-cost">Cost: ${formatNumber(cost)} 🧪</p>${isL?`<p class="requirement-info">${rIP}: ${formatNumber(req)} 🧪</p>`:''}</div><button class="buy-upgrade-btn" data-upgrade-id="${u.id}">${btnTxt}</button>`; const btn=li.querySelector('.buy-upgrade-btn'); if(btn){btn.disabled=btnDis; if(!isL){btn.addEventListener('click',(e)=>{e.stopPropagation(); if(!btn.disabled)buyUpgrade(u.id);});}} upgradesListElement.appendChild(li);});}
    function buyUpgrade(id) { if(isBlocked){showTemporaryNotification(translations.actionBlocked?.[currentLanguage]||"Action blocked.", "error");return;} const u=upgrades.find(up=>up.id===id); if(!u){console.error("Upgrade !found:",id);return;} const req=u.requiredEssence||0; if(Math.floor(essence)<req){showTemporaryNotification(`${translations.needMoreEssence?.[currentLanguage]||"Need more essence!"} ${formatNumber(req)} 🧪`, "error");return;} const cost=calculateCost(u); if(!Number.isFinite(cost)){showTemporaryNotification(translations.invalidCostError?.[currentLanguage]||"Error: Invalid upgrade cost!", "error");return;} if(essence>=cost){essence-=cost; u.currentLevel++; recalculateBonuses(); updateDisplay(); if(tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');} else {showTemporaryNotification(translations.notEnoughEssence?.[currentLanguage]||"Not enough essence!", "error"); if(tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('warning');}}
    function recalculateBonuses() { essencePerClick=1; essencePerSecond=0; upgrades.forEach(u=>{ if(u.currentLevel>0 && Number.isFinite(u.value) && typeof u.type==='string'){ if(u.type==='click')essencePerClick+=u.value*u.currentLevel; else if(u.type==='auto')essencePerSecond+=u.value*u.currentLevel;} else if(u.currentLevel>0){console.warn("Invalid bonus data:",u);}}); if(!Number.isFinite(essencePerClick)){console.error("Invalid E/Click");essencePerClick=1;} if(!Number.isFinite(essencePerSecond)){console.error("Invalid E/Sec");essencePerSecond=0;} }

    // --- Открытие/Закрытие панелей ---
    if(openUpgradesBtn&&upgradesPanel){openUpgradesBtn.addEventListener('click',()=>{renderUpgrades();upgradesPanel.classList.remove('hidden');});}else{console.error("...");}
    if(closeUpgradesBtn&&upgradesPanel){closeUpgradesBtn.addEventListener('click',()=>{upgradesPanel.classList.add('hidden');});}else{console.error("...");}
    if(settingsBtn){settingsBtn.addEventListener('click', openSettings);} else {console.error("...");}
    if(closeSettingsBtn){closeSettingsBtn.addEventListener('click', closeSettings);} else {console.error("...");}
    if(settingsPanel){settingsPanel.addEventListener('click',(e)=>{if(e.target===settingsPanel)closeSettings();});}

    // --- Логика настроек ---
    function openSettings() { if (settingsPanel) { updateActiveLangButton(); settingsPanel.classList.remove('hidden'); } }
    function closeSettings() { if (settingsPanel) { settingsPanel.classList.add('hidden'); } }
    function setLanguage(lang) { if (translations.greetingBase[lang]) { currentLanguage = lang; console.log(`Lang: ${currentLanguage}`); applyTranslations(); updateActiveLangButton(); saveGame(); if (upgradesPanel && !upgradesPanel.classList.contains('hidden')) { renderUpgrades(); } } else { console.warn(`Lang "${lang}" !found.`); } }
    function applyTranslations() { if (userGreetingElement) { let g = translations.greetingBase[currentLanguage] || "Laboratory"; if (userName) { g += ` ${userName}`; } userGreetingElement.textContent = g; } document.querySelectorAll('[data-translate]').forEach(el => { const k = el.dataset.translate; if (translations[k]?.[currentLanguage]) { if(el.tagName === 'BUTTON' || el.tagName === 'H2' || el.tagName === 'H3' || el.parentElement?.id === 'per-second-display') { el.textContent = translations[k][currentLanguage]; } else { el.textContent = translations[k][currentLanguage]; } } else { console.warn(`Trans key "${k}"/${currentLanguage} !found.`); } }); }
    function updateActiveLangButton() { if (!languageOptionsContainer) return; languageOptionsContainer.querySelectorAll('.lang-btn').forEach(b => { b.classList.toggle('active', b.dataset.lang === currentLanguage); }); }
    if (languageOptionsContainer) { languageOptionsContainer.addEventListener('click', (e) => { if (e.target.classList.contains('lang-btn')) { const l = e.target.dataset.lang; if (l) setLanguage(l); } }); } else { console.error("..."); }

    // --- Логика реферальной системы ---
    function checkReferralAndBonus() { const sP=tg.initDataUnsafe?.start_param; const uP=new URLSearchParams(window.location.search); const cBP=uP.get('claimBonus'); console.log("Params:",window.location.search,"Start:",sP); if(sP&&!isNaN(parseInt(sP))){handleNewReferral(sP);} else if(cBP){handleBonusClaim(cBP);}}
    function handleNewReferral(invId) { tg.CloudStorage.getItem('gameState',(err,val)=>{ if(err){console.error("CS err referral:",err);return;} let isNew=true; if(val){try{const sS=JSON.parse(val);if((sS.essence&&sS.essence>0)||(sS.upgrades&&sS.upgrades.some(u=>u.level>0))||(sS.gems&&sS.gems>0)){isNew=false;console.log("Old player.");}}catch(e){console.error("Parse err ref check",e);}}else{console.log("New player.");} if(isNew){console.log(`New! Inviter: ${invId}. Send...`);saveGame();if(tg.sendData){const dS=JSON.stringify({type:'referral_registered',inviter_id:invId});try{tg.sendData(dS);console.log("Sent ref data:",dS);showTemporaryNotification(translations.welcomeReferral?.[currentLanguage]||"Welcome! Inviter gets bonus.", "success");}catch(sendErr){console.error("Send data err:",sendErr);showTemporaryNotification(translations.referralRegErrorBot?.[currentLanguage]||"Could not register invite (bot error).", "error");}}else{console.error("tg.sendData N/A.");showTemporaryNotification(translations.referralRegErrorFunc?.[currentLanguage]||"Could not register invite (N/A).", "error");}}else{console.log("Not new, no bonus.");}}); }
    function handleBonusClaim(refId) { console.log(`Claim bonus: ${refId}`); if(!refId||typeof refId!=='string'||refId.trim()===''){console.warn("Invalid refId.");return;} tg.CloudStorage.getItem('claimed_bonuses',(err,val)=>{ if(err){console.error("CS err get claimed:",err);showTemporaryNotification(translations.bonusCheckError?.[currentLanguage]||"Bonus check error!", "error");return;} let cB=[]; if(val){try{cB=JSON.parse(val);if(!Array.isArray(cB))cB=[];}catch(e){console.error("Parse claimed:",e);cB=[];}} if(cB.includes(refId)){console.log(`Bonus ${refId} claimed.`);showTemporaryNotification(translations.bonusAlreadyClaimed?.[currentLanguage]||"Bonus already claimed.", "warning");} else { const bA=50000; if(Number.isFinite(essence)){essence+=bA;console.log(`Claimed ${refId}! +${bA} E.`);showTemporaryNotification(`+${formatNumber(bA)} 🧪 ${translations.bonusReasonFriend?.[currentLanguage]||"for invited friend!"}`, "success");updateDisplay();cB.push(refId);tg.CloudStorage.setItem('claimed_bonuses',JSON.stringify(cB),(setErr)=>{if(setErr)console.error("Save claimed err:",setErr);else{console.log("Claimed updated.");saveGame();}}); } else { console.error("Cannot add bonus, essence invalid:",essence);showTemporaryNotification(translations.bonusAddError?.[currentLanguage]||"Bonus add error!", "error");}} try{const url=new URL(window.location);url.searchParams.delete('claimBonus');window.history.replaceState({},document.title,url.toString());}catch(e){console.warn("Could not clean URL",e);}}); }
    if (inviteFriendBtn) { inviteFriendBtn.addEventListener('click', () => { if (tg?.initDataUnsafe?.user?.id) { const bot='AlchimLaboratory_Bot'; const app='AlchimLab'; const uid=tg.initDataUnsafe.user.id; const url=`https://t.me/${bot}/${app}?start=${uid}`; const txt=translations.shareText?.[currentLanguage]||'Join my Alchemy Lab in Telegram! 🧪⚗️ Click and create elixirs!'; tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(txt)}`); console.log('Share link:',url); } else { console.error('Cannot get user ID/API.'); showTemporaryNotification(translations.inviteLinkError?.[currentLanguage]||'Failed to create invite link.', 'error'); } }); } else { console.error("..."); }

    // --- Сохранение/Загрузка ---
    function saveGame() { if (!tg?.CloudStorage) { console.error("..."); return; } if (!Number.isFinite(essence)) essence = 0; if (!Number.isFinite(gems)) gems = 0; const gS = { essence: essence, gems: gems, upgrades: upgrades.map(u => ({ id: u.id, level: u.currentLevel })), language: currentLanguage }; try { const gSS = JSON.stringify(gS); tg.CloudStorage.setItem('gameState', gSS, (err) => { if (err) console.error("Save err:", err); }); } catch (e) { console.error("Stringify err:", e); showTemporaryNotification(translations.saveCritError?.[currentLanguage]||"Critical save error!", "error"); } }
    function loadGame() { isBlocked=false; warningCount=0; if(cauldronElement) cauldronElement.classList.remove('blocked-cauldron'); if (!tg?.CloudStorage) { console.error("..."); resetGameData(); applyTranslations(); updateDisplay(); updateLiquidLevelVisual(LIQUID_MIN_LEVEL); showTemporaryNotification(translations.loadErrorStartNew?.[currentLanguage]||"Failed to load progress. Starting new game.", "warning"); return; } console.log("Loading..."); tg.CloudStorage.getItem('gameState', (err, val) => { let loadedOk = false; if (err) { console.error("Load err:", err); showTemporaryNotification(translations.loadError?.[currentLanguage]||"Error loading progress!", "error"); resetGameData(); } else if (val) { console.log("Data recv:", val.length); try { const gS = JSON.parse(val); essence = Number(gS.essence) || 0; if (!Number.isFinite(essence)) essence = 0; gems = Number(gS.gems) || 0; if (!Number.isFinite(gems)) gems = 0; currentLanguage = gS.language || 'ru'; if (!translations.greetingBase[currentLanguage]) { console.warn(`Lang "${currentLanguage}" !supported, -> 'ru'.`); currentLanguage = 'ru'; } upgrades.forEach(u => { const s = gS.upgrades?.find(su => su.id === u.id); u.currentLevel = (s && Number.isFinite(Number(s.level))) ? Number(s.level) : 0; }); recalculateBonuses(); console.log("Loaded OK."); loadedOk = true; } catch (e) { console.error("Parse err:", e); showTemporaryNotification(translations.readError?.[currentLanguage]||"Error reading data!", "error"); resetGameData(); } } else { console.log("No save data."); resetGameData(); } checkReferralAndBonus(); applyTranslations(); updateDisplay(); visualLiquidLevel = LIQUID_MIN_LEVEL; lastInteractionTime = Date.now(); updateLiquidLevelVisual(visualLiquidLevel); }); }
    function resetGameData() { isBlocked=false; warningCount=0; if(cauldronElement) cauldronElement.classList.remove('blocked-cauldron'); essence=0; gems=0; upgrades.forEach(u=>u.currentLevel=0); currentLanguage='ru'; recalculateBonuses(); visualLiquidLevel=LIQUID_MIN_LEVEL; lastInteractionTime=Date.now(); console.log("Reset OK."); }

    // --- Функция уведомлений ---
    function showTemporaryNotification(message, type = "info") { const n=document.createElement('div'); n.className=`notification ${type}`; n.textContent=message; document.body.appendChild(n); setTimeout(()=>{n.style.opacity='1'; n.style.bottom='80px';},10); setTimeout(()=>{n.style.opacity='0'; n.style.bottom='70px'; setTimeout(()=>{n.remove();},500);},2500); }

    // --- Первоначальная инициализация ---
    loadGame();

    // --- Автосохранение и обработчики событий ---
    setInterval(saveGame, 15000);
    window.addEventListener('beforeunload', saveGame);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveGame(); });
    if (tg?.onEvent) { tg.onEvent('viewportChanged', (e) => { if (!e.isStateStable) saveGame(); }); }

}); // Конец DOMContentLoaded