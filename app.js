(function() {
  'use strict';

  // DOM Elements
  const themeToggle = document.getElementById('theme-toggle');
  const slotWindow = document.querySelector('.slot-window');

  // State
  let currentIndex = 0;
  let intervalId = null;
  let isAnimating = false;

  // Animation duration (must match CSS)
  const ANIMATION_DURATION = 800;

  // Shuffle array using Fisher-Yates
  function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Shuffled ideas for variety
  let shuffledIdeas = shuffleArray(IDEAS);
  currentIndex = Math.floor(Math.random() * shuffledIdeas.length);

  // Toggle theme
  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  }

  // Get next idea index
  function getNextIndex() {
    const next = (currentIndex + 1) % shuffledIdeas.length;
    if (next === 0) {
      shuffledIdeas = shuffleArray(IDEAS);
    }
    return next;
  }

  // Create an idea element
  function createIdea(text, className) {
    const el = document.createElement('div');
    el.className = `idea ${className}`;
    el.textContent = text;
    return el;
  }

  // Animate to next idea
  function showNextIdea() {
    if (isAnimating) return;
    isAnimating = true;

    const nextIndex = getNextIndex();
    const currentEl = slotWindow.querySelector('.idea.current');

    // Create the incoming idea (starts above viewport)
    const enteringEl = createIdea(shuffledIdeas[nextIndex], 'entering');
    slotWindow.appendChild(enteringEl);

    // Mark current as leaving
    if (currentEl) {
      currentEl.classList.remove('current');
      currentEl.classList.add('leaving');
    }

    // After animation completes
    setTimeout(() => {
      // Remove the old element
      if (currentEl) {
        currentEl.remove();
      }

      // Update entering to current
      enteringEl.classList.remove('entering');
      enteringEl.classList.add('current');

      // Update state
      currentIndex = nextIndex;
      isAnimating = false;
    }, ANIMATION_DURATION);
  }

  // Reset timer
  function resetTimer() {
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(showNextIdea, 3500);
  }

  // Initialize
  function init() {
    // Clear and show first idea
    slotWindow.innerHTML = '';
    const firstIdea = createIdea(shuffledIdeas[currentIndex], 'current');
    slotWindow.appendChild(firstIdea);

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
})();
