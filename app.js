(function() {
  'use strict';

  // ===== CONFIGURATION =====
  const ANIMATION_DURATION = 800;
  const CYCLE_INTERVAL = 3500;
  const STORAGE_KEY = 'claudeIsClauding';

  // Rarity weights (higher = more likely)
  const RARITY_WEIGHTS = {
    common: 100,
    uncommon: 8,
    rare: 1.5,
    very_rare: 0.4,
    lucky: 0.5
  };

  // ===== DOM ELEMENTS =====
  const themeToggle = document.getElementById('theme-toggle');
  const slotWindow = document.querySelector('.slot-window');

  // ===== STATE =====
  let ideas = [];
  let currentIdea = null;
  let intervalId = null;
  let isAnimating = false;

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
      return true; // New achievement
    }
    return false; // Already unlocked
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
    // Calculate total weight
    let totalWeight = 0;
    const weightedIdeas = ideasList.map(idea => {
      const weight = RARITY_WEIGHTS[idea.rarity] || RARITY_WEIGHTS.common;
      totalWeight += weight;
      return { idea, weight };
    });

    // Pick random
    let random = Math.random() * totalWeight;
    for (const { idea, weight } of weightedIdeas) {
      random -= weight;
      if (random <= 0) return idea;
    }

    // Fallback
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
      // 40% chance to pick from boosted categories
      if (boostedIdeas.length > 0 && Math.random() < 0.4) {
        availableIdeas = boostedIdeas;
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

    // Create the incoming idea
    const enteringEl = createIdeaElement(nextIdea, 'entering');
    slotWindow.appendChild(enteringEl);

    // Mark current as leaving
    if (currentEl) {
      currentEl.classList.remove('current');
      currentEl.classList.add('leaving');
    }

    // After animation completes
    setTimeout(() => {
      if (currentEl) {
        currentEl.remove();
      }

      enteringEl.classList.remove('entering');
      enteringEl.classList.add('current');

      currentIdea = nextIdea;
      isAnimating = false;

      // Track this idea
      const storage = incrementIdeaCounter(nextIdea.id);

      // Check achievements after showing idea
      checkAchievements(storage);
    }, ANIMATION_DURATION);
  }

  // ===== ACHIEVEMENTS =====
  function checkAchievements(storage) {
    // Will be implemented in Task 2.3-2.5
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
      // Fallback to empty array
      ideas = [];
      return false;
    }
  }

  async function init() {
    // Load ideas from JSON
    await loadIdeas();

    if (ideas.length === 0) {
      slotWindow.innerHTML = '<div class="idea current">Failed to load ideas. Please refresh.</div>';
      return;
    }

    // Initialize session tracking
    initSession();

    // Show first idea
    slotWindow.innerHTML = '';
    const firstIdea = selectNextIdea();
    currentIdea = firstIdea;
    const firstEl = createIdeaElement(firstIdea, 'current');
    slotWindow.appendChild(firstEl);

    // Track first idea
    incrementIdeaCounter(firstIdea.id);

    // Start auto-cycling
    resetTimer();

    // Event listeners
    themeToggle.addEventListener('click', toggleTheme);

    // Keyboard support
    document.addEventListener('keydown', (e) => {
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
    isReturningUser
  };
})();
