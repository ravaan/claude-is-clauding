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
    desperateModeActive: false
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

    // Event listeners
    themeToggle.addEventListener('click', toggleTheme);
    desperateModeBtn.addEventListener('click', toggleDesperateMode);
    achievementDismiss.addEventListener('click', hideAchievementPopup);

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

      if (e.key === ' ' || e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        showNextIdea();
        resetTimer();
      }
      if (e.key === 't' || e.key === 'T') {
        toggleTheme();
      }
    });

    // Pause on visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        clearInterval(intervalId);
      } else {
        resetTimer();
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
    triggerConfetti
  };
})();
