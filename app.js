(function() {
  'use strict';

  // ===== CONFIGURATION =====
  const ANIMATION_DURATION = 800;
  const CYCLE_INTERVAL = 3500;
  const STORAGE_KEY = 'claudeIsClauding';
  const TOAST_DURATION = 3000;

  // Rarity weights (higher = more likely)
  const RARITY_WEIGHTS = {
    common: 100,
    uncommon: 8,
    rare: 1.5,
    very_rare: 0.4,
    lucky: 0.5
  };

  // Achievement milestones
  const MILESTONES = {
    ideas10: { count: 10, id: 'ideas_10', message: "Still waiting? Claude must be building something epic" },
    ideas50: { count: 50, id: 'ideas_50', message: "Desperate mode unlocked" },
    ideas100: { count: 100, id: 'ideas_100', badge: "🏆", title: "Terminal Velocity", message: "100 ideas! Maybe check if Claude finished 30 minutes ago..." },
    ideas420: { count: 420, id: 'ideas_420', message: "Okay you're just procrastinating now" }
  };

  // ===== DOM ELEMENTS =====
  const themeToggle = document.getElementById('theme-toggle');
  const slotWindow = document.querySelector('.slot-window');
  const toastEl = document.getElementById('toast');
  const desperateModeBtn = document.getElementById('desperate-mode');
  const achievementOverlay = document.getElementById('achievement-overlay');
  const achievementBadge = document.getElementById('achievement-badge');
  const achievementTitle = document.getElementById('achievement-title');
  const achievementMessage = document.getElementById('achievement-message');
  const achievementDismiss = document.getElementById('achievement-dismiss');
  const confettiCanvas = document.getElementById('confetti-canvas');

  // ===== STATE =====
  let ideas = [];
  let currentIdea = null;
  let intervalId = null;
  let isAnimating = false;
  let toastTimeout = null;
  let timeCheckIntervalId = null;
  let lastHourNotified = 0;
  let konamiIndex = 0;
  let typedKeys = '';
  let lastClickedIdeaId = null;
  let consecutiveClicks = 0;
  let audioContext = null;
  let soundsEnabled = true;

  // ===== STORAGE SYSTEM =====
  const defaultStorage = {
    totalIdeasSeen: 0,
    sessionIdeasSeen: 0,
    siteVisits: 0,
    lastVisitDate: null,
    ideasSeenToday: 0,
    sessionStartTime: null,
    achievementsUnlocked: [],
    seenIdeaIds: [],
    desperateModeUnlocked: false,
    desperateModeActive: false,
    retroModeActive: false,
    soundsEnabled: true
  };

  function getStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return { ...defaultStorage, ...JSON.parse(data) };
      }
    } catch (e) {
      console.warn('Failed to read localStorage:', e);
    }
    return { ...defaultStorage };
  }

  function setStorage(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to write localStorage:', e);
    }
  }

  function initSession() {
    const storage = getStorage();
    const today = new Date().toDateString();

    // Check if new day
    if (storage.lastVisitDate !== today) {
      storage.ideasSeenToday = 0;
      storage.lastVisitDate = today;
    }

    // Increment visit count
    storage.siteVisits++;
    storage.sessionIdeasSeen = 0;
    storage.sessionStartTime = Date.now();

    setStorage(storage);

    // Update UI based on storage
    updateDesperateModeUI(storage);

    return storage;
  }

  function incrementIdeaCounter(ideaId) {
    const storage = getStorage();
    storage.totalIdeasSeen++;
    storage.sessionIdeasSeen++;
    storage.ideasSeenToday++;

    if (!storage.seenIdeaIds.includes(ideaId)) {
      storage.seenIdeaIds.push(ideaId);
    }

    setStorage(storage);
    return storage;
  }

  function getSessionDuration() {
    const storage = getStorage();
    if (!storage.sessionStartTime) return 0;
    return Date.now() - storage.sessionStartTime;
  }

  function isReturningUser() {
    const storage = getStorage();
    return storage.siteVisits > 1;
  }

  function unlockAchievement(achievementId) {
    const storage = getStorage();
    if (!storage.achievementsUnlocked.includes(achievementId)) {
      storage.achievementsUnlocked.push(achievementId);
      setStorage(storage);
      return true;
    }
    return false;
  }

  function hasAchievement(achievementId) {
    const storage = getStorage();
    return storage.achievementsUnlocked.includes(achievementId);
  }

  // ===== TOAST SYSTEM =====
  function showToast(message) {
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }

    toastEl.textContent = message;
    toastEl.classList.add('show');

    toastTimeout = setTimeout(() => {
      toastEl.classList.remove('show');
    }, TOAST_DURATION);
  }

  // ===== ACHIEVEMENT POPUP =====
  function showAchievementPopup(badge, title, message) {
    achievementBadge.textContent = badge;
    achievementTitle.textContent = title;
    achievementMessage.textContent = message;
    achievementOverlay.classList.add('show');

    // Trigger confetti
    triggerConfetti();
  }

  function hideAchievementPopup() {
    achievementOverlay.classList.remove('show');
  }

  // ===== CONFETTI =====
  function triggerConfetti() {
    const ctx = confettiCanvas.getContext('2d');
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#fafafa', '#888', '#666', '#aaa'];

    // Create particles
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * confettiCanvas.width,
        y: -10 - Math.random() * 100,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        size: Math.random() * 6 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10
      });
    }

    let animationFrame;
    function animate() {
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

      let stillActive = false;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1; // gravity
        p.rotation += p.rotationSpeed;

        if (p.y < confettiCanvas.height + 20) {
          stillActive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation * Math.PI / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        }
      }

      if (stillActive) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      }
    }

    animate();

    // Clean up after 5 seconds max
    setTimeout(() => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }, 5000);
  }

  // ===== DESPERATE MODE =====
  function updateDesperateModeUI(storage) {
    if (storage.desperateModeUnlocked) {
      desperateModeBtn.classList.add('unlocked');
    }
    if (storage.desperateModeActive) {
      desperateModeBtn.classList.add('active');
      desperateModeBtn.textContent = 'desperate mode (on)';
    } else {
      desperateModeBtn.classList.remove('active');
      desperateModeBtn.textContent = 'desperate mode';
    }
  }

  function toggleDesperateMode() {
    const storage = getStorage();
    if (!storage.desperateModeUnlocked) return;

    storage.desperateModeActive = !storage.desperateModeActive;
    setStorage(storage);
    updateDesperateModeUI(storage);

    if (storage.desperateModeActive) {
      showToast("Entering the void...");
    } else {
      showToast("Back to normal");
    }
  }

  // ===== TIME HELPERS =====
  function isMidnight() {
    const hour = new Date().getHours();
    return hour >= 0 && hour < 3;
  }

  function isFriday() {
    return new Date().getDay() === 5;
  }

  // ===== TIME-BASED BEHAVIORS =====
  const TIME_MESSAGES = {
    thirtyMin: "Claude probably finished btw",
    hour1: "It's been an hour... maybe check on Claude?",
    hour2: "Two hours! At this point, you're the one procrastinating",
    hour3: "Three hours. This is a lifestyle now"
  };

  function checkTimeMilestones() {
    const duration = getSessionDuration();
    const minutes = Math.floor(duration / 60000);
    const hours = Math.floor(minutes / 60);

    // 30 minute notification (only once)
    if (minutes >= 30 && !hasAchievement('time_30min')) {
      unlockAchievement('time_30min');
      showToast(TIME_MESSAGES.thirtyMin);
    }

    // Hour milestones
    if (hours >= 1 && hours > lastHourNotified) {
      lastHourNotified = hours;
      if (hours === 1 && !hasAchievement('time_1hour')) {
        unlockAchievement('time_1hour');
        showToast(TIME_MESSAGES.hour1);
      } else if (hours === 2 && !hasAchievement('time_2hours')) {
        unlockAchievement('time_2hours');
        showToast(TIME_MESSAGES.hour2);
      } else if (hours === 3 && !hasAchievement('time_3hours')) {
        unlockAchievement('time_3hours');
        showToast(TIME_MESSAGES.hour3);
      }
    }
  }

  function startTimeCheck() {
    // Check every minute
    timeCheckIntervalId = setInterval(checkTimeMilestones, 60000);
  }

  function stopTimeCheck() {
    if (timeCheckIntervalId) {
      clearInterval(timeCheckIntervalId);
    }
  }

  // ===== AUDIO SYSTEM =====
  function initAudio() {
    const storage = getStorage();
    soundsEnabled = storage.soundsEnabled;
  }

  function getAudioContext() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
  }

  function playSound(type) {
    if (!soundsEnabled) return;

    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Different sounds for different events
      switch (type) {
        case 'celebration':
          // Happy ascending arpeggio
          oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
          oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
          oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
          oscillator.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.3); // C6
          gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.5);
          break;

        case 'unlock':
          // Short blip
          oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
          oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.05);
          gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.15);
          break;

        case 'retro':
          // 8-bit style beep
          oscillator.type = 'square';
          oscillator.frequency.setValueAtTime(440, ctx.currentTime);
          oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
          oscillator.frequency.setValueAtTime(440, ctx.currentTime + 0.2);
          gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.3);
          break;

        case 'unlucky':
          // Descending sad tone
          oscillator.frequency.setValueAtTime(400, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);
          gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.4);
          break;
      }
    } catch (e) {
      // Audio not supported, fail silently
    }
  }

  function toggleSound() {
    soundsEnabled = !soundsEnabled;
    const storage = getStorage();
    storage.soundsEnabled = soundsEnabled;
    setStorage(storage);
    showToast(soundsEnabled ? "Sounds on" : "Sounds off");
  }

  // ===== KONAMI CODE EASTER EGG =====
  const KONAMI_SEQUENCE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

  function checkKonamiCode(key) {
    if (key === KONAMI_SEQUENCE[konamiIndex]) {
      konamiIndex++;
      if (konamiIndex === KONAMI_SEQUENCE.length) {
        konamiIndex = 0;
        activateRetroMode();
      }
    } else {
      konamiIndex = 0;
      // Check if the pressed key is the start of the sequence
      if (key === KONAMI_SEQUENCE[0]) {
        konamiIndex = 1;
      }
    }
  }

  function activateRetroMode() {
    const storage = getStorage();
    storage.retroModeActive = !storage.retroModeActive;
    setStorage(storage);

    if (storage.retroModeActive) {
      document.body.classList.add('retro-mode');
      playSound('retro');
      showToast("RETRO MODE ACTIVATED");
    } else {
      document.body.classList.remove('retro-mode');
      showToast("Retro mode deactivated");
    }
  }

  function initRetroMode() {
    const storage = getStorage();
    if (storage.retroModeActive) {
      document.body.classList.add('retro-mode');
    }
  }

  // ===== TYPE "HELP" EASTER EGG =====
  function checkTypedWord(key) {
    // Only track letter keys
    if (key.length === 1 && /[a-z]/i.test(key)) {
      typedKeys += key.toLowerCase();
      // Keep only last 10 characters
      if (typedKeys.length > 10) {
        typedKeys = typedKeys.slice(-10);
      }

      if (typedKeys.includes('help')) {
        typedKeys = '';
        showHelpModal();
      }
    }
  }

  function showHelpModal() {
    showToast("Space/Enter: next idea | T: toggle theme | S: toggle sound");
  }

  // ===== TRIPLE-CLICK HEADER =====
  const TAGLINES = [
    "While Claude is clauding...",
    "Procrastination as a Service",
    "No AIs were harmed making this",
    "Still loading... just like your project",
    "Made while Claude worked",
    "The waiting room of the future"
  ];
  let taglineIndex = 0;
  let headerClickCount = 0;
  let headerClickTimer = null;

  function handleHeaderClick() {
    headerClickCount++;

    if (headerClickTimer) {
      clearTimeout(headerClickTimer);
    }

    headerClickTimer = setTimeout(() => {
      if (headerClickCount >= 3) {
        cycleTagline();
      }
      headerClickCount = 0;
    }, 400);
  }

  function cycleTagline() {
    taglineIndex = (taglineIndex + 1) % TAGLINES.length;
    const h1 = document.querySelector('h1');
    if (h1) {
      h1.textContent = TAGLINES[taglineIndex];
    }
  }

  // ===== CLICK SAME IDEA 3 TIMES =====
  function trackIdeaClick(ideaId) {
    if (ideaId === lastClickedIdeaId) {
      consecutiveClicks++;
      if (consecutiveClicks === 3) {
        showToast("Really? This one again?");
        consecutiveClicks = 0;
      }
    } else {
      lastClickedIdeaId = ideaId;
      consecutiveClicks = 1;
    }
  }

  // ===== RARE RANDOM EVENTS =====
  const SPECIAL_IDEAS = {
    77: { type: 'lucky', message: "Lucky #77!", sound: 'celebration' },
    256: { type: 'programmer', message: "0x100 - You found the programmer's number!" },
    13: { type: 'unlucky', message: "Unlucky #13...", sound: 'unlucky' }
  };

  function checkSpecialIdea(idea) {
    const special = SPECIAL_IDEAS[idea.id];
    if (special) {
      if (special.sound) {
        playSound(special.sound);
      }
      if (special.type === 'lucky') {
        triggerSparkles();
      }
      if (special.type === 'unlucky') {
        triggerScreenShake();
      }
      showToast(special.message);
      return true;
    }

    // 0.1% chance of self-aware message
    if (Math.random() < 0.001) {
      showToast("ERROR: Idea generator is now self-aware");
      return true;
    }

    return false;
  }

  function triggerSparkles() {
    const ctx = confettiCanvas.getContext('2d');
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;

    const sparkles = [];

    // Create sparkles around center
    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30;
      sparkles.push({
        x: confettiCanvas.width / 2,
        y: confettiCanvas.height / 2,
        vx: Math.cos(angle) * (2 + Math.random() * 3),
        vy: Math.sin(angle) * (2 + Math.random() * 3),
        size: Math.random() * 4 + 2,
        alpha: 1,
        decay: 0.02 + Math.random() * 0.02
      });
    }

    let animationFrame;
    function animate() {
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

      let stillActive = false;
      for (const s of sparkles) {
        s.x += s.vx;
        s.y += s.vy;
        s.alpha -= s.decay;

        if (s.alpha > 0) {
          stillActive = true;
          ctx.save();
          ctx.globalAlpha = s.alpha;
          ctx.fillStyle = '#ffd700';
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      if (stillActive) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      }
    }

    animate();

    setTimeout(() => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }, 2000);
  }

  function triggerScreenShake() {
    document.body.classList.add('screen-shake');
    setTimeout(() => {
      document.body.classList.remove('screen-shake');
    }, 500);
  }

  // ===== IDEA SELECTION =====
  function filterIdeasByTime(ideasList) {
    const midnight = isMidnight();
    const friday = isFriday();

    return ideasList.filter(idea => {
      if (!idea.timeRestriction) return true;
      if (idea.timeRestriction === 'midnight') return midnight;
      if (idea.timeRestriction === 'friday') return friday;
      return true;
    });
  }

  function filterIdeasByCategory(ideasList, category) {
    if (!category) return ideasList;
    return ideasList.filter(idea => idea.category === category);
  }

  function getWeightedRandomIdea(ideasList) {
    let totalWeight = 0;
    const weightedIdeas = ideasList.map(idea => {
      const weight = RARITY_WEIGHTS[idea.rarity] || RARITY_WEIGHTS.common;
      totalWeight += weight;
      return { idea, weight };
    });

    let random = Math.random() * totalWeight;
    for (const { idea, weight } of weightedIdeas) {
      random -= weight;
      if (random <= 0) return idea;
    }

    return ideasList[Math.floor(Math.random() * ideasList.length)];
  }

  function selectNextIdea() {
    const storage = getStorage();
    let availableIdeas = filterIdeasByTime(ideas);

    // Desperate mode - only cursed ideas
    if (storage.desperateModeActive) {
      availableIdeas = filterIdeasByCategory(availableIdeas, 'cursed');
    }

    // Midnight mode - boost cursed and existential
    if (isMidnight() && !storage.desperateModeActive) {
      const boostedCategories = ['cursed', 'existential'];
      const boostedIdeas = availableIdeas.filter(i => boostedCategories.includes(i.category));
      if (boostedIdeas.length > 0 && Math.random() < 0.4) {
        availableIdeas = boostedIdeas;
      }
    }

    // After 420 ideas, boost meta category
    if (storage.totalIdeasSeen >= 420) {
      const metaIdeas = availableIdeas.filter(i => i.category === 'meta');
      if (metaIdeas.length > 0 && Math.random() < 0.3) {
        availableIdeas = metaIdeas;
      }
    }

    // Avoid showing same idea twice in a row
    if (currentIdea) {
      availableIdeas = availableIdeas.filter(i => i.id !== currentIdea.id);
    }

    return getWeightedRandomIdea(availableIdeas);
  }

  // ===== THEME =====
  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  }

  // ===== IDEA DISPLAY =====
  function createIdeaElement(idea, className) {
    const el = document.createElement('div');
    el.className = `idea ${className}`;
    el.textContent = idea.text;
    el.dataset.id = idea.id;
    el.dataset.category = idea.category;
    return el;
  }

  function showNextIdea() {
    if (isAnimating) return;
    isAnimating = true;

    const nextIdea = selectNextIdea();
    const currentEl = slotWindow.querySelector('.idea.current');

    const enteringEl = createIdeaElement(nextIdea, 'entering');
    slotWindow.appendChild(enteringEl);

    if (currentEl) {
      currentEl.classList.remove('current');
      currentEl.classList.add('leaving');
    }

    setTimeout(() => {
      if (currentEl) {
        currentEl.remove();
      }

      enteringEl.classList.remove('entering');
      enteringEl.classList.add('current');

      currentIdea = nextIdea;
      isAnimating = false;

      const storage = incrementIdeaCounter(nextIdea.id);
      checkAchievements(storage);
      checkSpecialIdea(nextIdea);
      trackIdeaClick(nextIdea.id);
    }, ANIMATION_DURATION);
  }

  // ===== ACHIEVEMENTS =====
  function checkAchievements(storage) {
    const count = storage.sessionIdeasSeen;

    // 10 ideas - toast
    if (count === MILESTONES.ideas10.count && !hasAchievement(MILESTONES.ideas10.id)) {
      unlockAchievement(MILESTONES.ideas10.id);
      showToast(MILESTONES.ideas10.message);
    }

    // 50 ideas - unlock desperate mode
    if (count === MILESTONES.ideas50.count && !hasAchievement(MILESTONES.ideas50.id)) {
      unlockAchievement(MILESTONES.ideas50.id);
      const updatedStorage = getStorage();
      updatedStorage.desperateModeUnlocked = true;
      setStorage(updatedStorage);
      updateDesperateModeUI(updatedStorage);
      showToast(MILESTONES.ideas50.message);
    }

    // 100 ideas - achievement popup with confetti
    if (count === MILESTONES.ideas100.count && !hasAchievement(MILESTONES.ideas100.id)) {
      unlockAchievement(MILESTONES.ideas100.id);
      showAchievementPopup(
        MILESTONES.ideas100.badge,
        MILESTONES.ideas100.title,
        MILESTONES.ideas100.message
      );
    }

    // 420 ideas - toast
    if (count === MILESTONES.ideas420.count && !hasAchievement(MILESTONES.ideas420.id)) {
      unlockAchievement(MILESTONES.ideas420.id);
      showToast(MILESTONES.ideas420.message);
    }
  }

  // ===== TIMER =====
  function resetTimer() {
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(showNextIdea, CYCLE_INTERVAL);
  }

  // ===== INITIALIZATION =====
  async function loadIdeas() {
    try {
      const response = await fetch('ideas.json');
      const data = await response.json();
      ideas = data.ideas;
      return true;
    } catch (e) {
      console.error('Failed to load ideas:', e);
      ideas = [];
      return false;
    }
  }

  async function init() {
    await loadIdeas();

    if (ideas.length === 0) {
      slotWindow.innerHTML = '<div class="idea current">Failed to load ideas. Please refresh.</div>';
      return;
    }

    const storage = initSession();

    // Show first idea
    slotWindow.innerHTML = '';
    const firstIdea = selectNextIdea();
    currentIdea = firstIdea;
    const firstEl = createIdeaElement(firstIdea, 'current');
    slotWindow.appendChild(firstEl);

    incrementIdeaCounter(firstIdea.id);
    resetTimer();
    startTimeCheck();
    initAudio();
    initRetroMode();

    // Event listeners
    themeToggle.addEventListener('click', toggleTheme);
    desperateModeBtn.addEventListener('click', toggleDesperateMode);
    achievementDismiss.addEventListener('click', hideAchievementPopup);

    // Triple-click header easter egg
    const header = document.querySelector('h1');
    if (header) {
      header.addEventListener('click', handleHeaderClick);
    }

    // Close achievement on overlay click
    achievementOverlay.addEventListener('click', (e) => {
      if (e.target === achievementOverlay) {
        hideAchievementPopup();
      }
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
      // Close achievement popup on escape
      if (e.key === 'Escape') {
        hideAchievementPopup();
        return;
      }

      // Check for Konami code
      checkKonamiCode(e.key);

      // Check for typed words (like "help")
      checkTypedWord(e.key);

      if (e.key === ' ' || e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        showNextIdea();
        resetTimer();
      }
      if (e.key === 't' || e.key === 'T') {
        toggleTheme();
      }
      if (e.key === 's' || e.key === 'S') {
        toggleSound();
      }
    });

    // Pause on visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        clearInterval(intervalId);
        stopTimeCheck();
      } else {
        resetTimer();
        startTimeCheck();
        // Check immediately when returning
        checkTimeMilestones();
      }
    });
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for debugging
  window.__claudeIsClauding = {
    getStorage,
    getSessionDuration,
    isReturningUser,
    showToast,
    triggerConfetti,
    triggerSparkles,
    playSound,
    toggleSound
  };
})();
