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

  // Footer messages for easter egg
  const FOOTER_MESSAGES = [
    "Made with love while Claude was clauding",
    "Procrastination as a Service",
    "No AIs were harmed making this",
    "Time flies when you're avoiding work",
    "Your future self will thank you... maybe",
    "Productivity is overrated anyway",
    "Claude is still thinking...",
    "404: Motivation not found"
  ];

  // ===== DOM ELEMENTS =====
  const themeToggle = document.getElementById('theme-toggle');
  const soundToggle = document.getElementById('sound-toggle');
  const slotWindow = document.querySelector('.slot-window');
  const toastEl = document.getElementById('toast');
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
  let idleCheckIntervalId = null;
  let lastActivityTime = Date.now();
  let footerClickCount = 0;

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
    storage.desperateModeActive = false;  // Reset desperate mode each session

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
    const canvas = confettiCanvas;
    const ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Make canvas visible
    canvas.style.display = 'block';

    const particles = [];
    const colors = ['#fafafa', '#888', '#666', '#aaa', '#fff', '#ccc'];
    const totalParticles = 150;

    // Create all particles immediately
    for (let i = 0; i < totalParticles; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 200, // Spread start positions
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 2 + 1,
        size: Math.random() * 10 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.03 + Math.random() * 0.03
      });
    }

    let animationFrame;
    let startTime = Date.now();
    const duration = 8000; // 8 seconds

    function animate() {
      const elapsed = Date.now() - startTime;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let stillVisible = false;

      for (const p of particles) {
        // Wobble side to side
        p.wobble += p.wobbleSpeed;
        p.x += p.vx + Math.sin(p.wobble) * 1.5;
        p.y += p.vy;
        p.vy += 0.05; // gravity
        p.rotation += p.rotationSpeed;

        // Check if still on screen
        if (p.y < canvas.height + 50) {
          stillVisible = true;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation * Math.PI / 180);
          ctx.fillStyle = p.color;
          // Draw rectangle confetti
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          ctx.restore();
        }
      }

      if (stillVisible && elapsed < duration) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        // Clean up
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.style.display = '';
      }
    }

    // Start animation
    animationFrame = requestAnimationFrame(animate);

    // Safety cleanup
    setTimeout(() => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.display = '';
    }, duration + 1000);
  }

  // ===== DESPERATE MODE =====
  function updateDesperateModeUI(storage) {
    const indicator = document.getElementById('desperate-indicator');
    if (indicator) {
      if (storage.desperateModeActive) {
        indicator.classList.add('visible');
      } else {
        indicator.classList.remove('visible');
      }
    }
  }

  function activateDesperateMode() {
    const storage = getStorage();
    if (!storage.desperateModeActive) {
      storage.desperateModeActive = true;
      setStorage(storage);
      updateDesperateModeUI(storage);
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
    updateSoundToggleUI();
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

      // Different sounds for different events
      switch (type) {
        case 'celebration': {
          // Longer, richer celebration with multiple oscillators
          const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
          notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
            gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
            gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + i * 0.15 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.4);
            osc.start(ctx.currentTime + i * 0.15);
            osc.stop(ctx.currentTime + i * 0.15 + 0.5);
          });
          // Add a shimmer
          const shimmer = ctx.createOscillator();
          const shimmerGain = ctx.createGain();
          shimmer.type = 'sine';
          shimmer.frequency.setValueAtTime(2000, ctx.currentTime);
          shimmer.frequency.exponentialRampToValueAtTime(4000, ctx.currentTime + 0.8);
          shimmer.connect(shimmerGain);
          shimmerGain.connect(ctx.destination);
          shimmerGain.gain.setValueAtTime(0.02, ctx.currentTime);
          shimmerGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
          shimmer.start(ctx.currentTime);
          shimmer.stop(ctx.currentTime + 1);
          break;
        }

        case 'unlock': {
          // Satisfying unlock sound - longer
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);
          osc1.frequency.setValueAtTime(600, ctx.currentTime);
          osc1.frequency.setValueAtTime(900, ctx.currentTime + 0.1);
          osc1.frequency.setValueAtTime(1200, ctx.currentTime + 0.2);
          osc2.frequency.setValueAtTime(300, ctx.currentTime);
          osc2.frequency.setValueAtTime(450, ctx.currentTime + 0.1);
          osc2.frequency.setValueAtTime(600, ctx.currentTime + 0.2);
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
          osc1.start(ctx.currentTime);
          osc2.start(ctx.currentTime);
          osc1.stop(ctx.currentTime + 0.5);
          osc2.stop(ctx.currentTime + 0.5);
          break;
        }

        case 'retro': {
          // 8-bit style melody - longer
          const melody = [440, 554, 659, 880, 659, 554, 440];
          melody.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
            gain.gain.setValueAtTime(0.04, ctx.currentTime + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.1);
            osc.start(ctx.currentTime + i * 0.08);
            osc.stop(ctx.currentTime + i * 0.08 + 0.12);
          });
          break;
        }

        case 'unlucky': {
          // Longer descending ominous tone
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(400, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.8);
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 1);
          // Add rumble
          const rumble = ctx.createOscillator();
          const rumbleGain = ctx.createGain();
          rumble.type = 'sawtooth';
          rumble.frequency.setValueAtTime(50, ctx.currentTime);
          rumble.connect(rumbleGain);
          rumbleGain.connect(ctx.destination);
          rumbleGain.gain.setValueAtTime(0.05, ctx.currentTime);
          rumbleGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
          rumble.start(ctx.currentTime);
          rumble.stop(ctx.currentTime + 0.6);
          break;
        }

        case 'flip': {
          // Soft, muted thump - like a book page settling
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(200, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);

          gain.gain.setValueAtTime(0.032, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.15);
          break;
        }
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
    updateSoundToggleUI();
    showToast(soundsEnabled ? "Sounds on" : "Sounds off");
  }

  function updateSoundToggleUI() {
    if (soundToggle) {
      if (soundsEnabled) {
        soundToggle.classList.remove('muted');
      } else {
        soundToggle.classList.add('muted');
      }
    }
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

  // ===== TYPE "HELP" OR "?" EASTER EGG =====
  function checkTypedWord(key) {
    // Show help on "?" key
    if (key === '?') {
      showHelpToast();
      return;
    }

    // Track letter keys for "help" word
    if (key.length === 1 && /[a-z]/i.test(key)) {
      typedKeys += key.toLowerCase();
      // Keep only last 10 characters
      if (typedKeys.length > 10) {
        typedKeys = typedKeys.slice(-10);
      }

      if (typedKeys.includes('help')) {
        typedKeys = '';
        showHelpToast();
      }
    }
  }

  function showHelpToast() {
    showToast("Space/Enter: next | T: theme | S: sound | ?: help");
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
    const canvas = confettiCanvas;
    const ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Make canvas visible
    canvas.style.display = 'block';

    const sparkles = [];
    const colors = ['#ffd700', '#ffec8b', '#fff8dc', '#fffacd', '#ffffff'];
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // Create burst sparkles from center immediately
    for (let i = 0; i < 60; i++) {
      const angle = (Math.PI * 2 * i) / 60 + (Math.random() - 0.5) * 0.3;
      const speed = 2 + Math.random() * 6;
      sparkles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 6 + 3,
        alpha: 1,
        decay: 0.012 + Math.random() * 0.008,
        color: colors[Math.floor(Math.random() * colors.length)],
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.15 + Math.random() * 0.15,
        type: 'burst'
      });
    }

    // Create random twinkling sparkles across screen
    for (let i = 0; i < 40; i++) {
      sparkles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: 0,
        vy: 0,
        size: Math.random() * 5 + 2,
        alpha: Math.random(), // Start at random alpha
        decay: 0.02 + Math.random() * 0.01,
        color: colors[Math.floor(Math.random() * colors.length)],
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.2 + Math.random() * 0.2,
        type: 'static',
        delay: Math.random() * 500 // Stagger appearance
      });
    }

    let animationFrame;
    let startTime = Date.now();
    const duration = 3000;

    function animate() {
      const elapsed = Date.now() - startTime;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let stillActive = false;

      for (const s of sparkles) {
        // Skip if delayed
        if (s.delay && elapsed < s.delay) {
          stillActive = true;
          continue;
        }

        // Update position for burst sparkles
        if (s.type === 'burst') {
          s.x += s.vx;
          s.y += s.vy;
          s.vx *= 0.96;
          s.vy *= 0.96;
        }

        s.twinkle += s.twinkleSpeed;
        s.alpha -= s.decay;

        if (s.alpha > 0) {
          stillActive = true;

          // Twinkle effect
          const twinkleFactor = 0.6 + 0.4 * Math.sin(s.twinkle);
          const displayAlpha = Math.max(0, s.alpha * twinkleFactor);

          // Outer glow
          ctx.save();
          ctx.globalAlpha = displayAlpha * 0.5;
          ctx.fillStyle = s.color;
          ctx.shadowColor = s.color;
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size * 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Draw 4-point star
          ctx.save();
          ctx.globalAlpha = displayAlpha;
          ctx.fillStyle = s.color;
          ctx.translate(s.x, s.y);

          const starSize = s.size * (1 + 0.2 * Math.sin(s.twinkle * 2));
          ctx.beginPath();
          for (let j = 0; j < 4; j++) {
            const angle = (j * Math.PI) / 2;
            ctx.lineTo(Math.cos(angle) * starSize, Math.sin(angle) * starSize);
            ctx.lineTo(Math.cos(angle + Math.PI / 4) * starSize * 0.4, Math.sin(angle + Math.PI / 4) * starSize * 0.4);
          }
          ctx.closePath();
          ctx.fill();

          // Bright white center
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = displayAlpha;
          ctx.beginPath();
          ctx.arc(0, 0, s.size * 0.3, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      }

      if (stillActive && elapsed < duration) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.style.display = '';
      }
    }

    // Start animation
    animationFrame = requestAnimationFrame(animate);

    // Safety cleanup
    setTimeout(() => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.display = '';
    }, duration + 500);
  }

  // ===== VISUAL QUIRKS =====

  // Idle 5 minutes: show message
  function resetActivity() {
    lastActivityTime = Date.now();
  }

  function checkIdle() {
    const idleTime = Date.now() - lastActivityTime;
    const fiveMinutes = 5 * 60 * 1000;

    if (idleTime >= fiveMinutes && !hasAchievement('idle_5min')) {
      unlockAchievement('idle_5min');
      showToast("Hello? You still there?");
    }
  }

  function startIdleCheck() {
    idleCheckIntervalId = setInterval(checkIdle, 30000); // Check every 30s
  }

  function stopIdleCheck() {
    if (idleCheckIntervalId) {
      clearInterval(idleCheckIntervalId);
    }
  }


  // ===== RETURNING USER FEATURES =====
  function checkReturningUser() {
    const storage = getStorage();

    // After 5 visits: welcome back
    if (storage.siteVisits === 5) {
      setTimeout(() => {
        showToast("Welcome back, procrastinator");
      }, 1500);
    }

    // Same day return
    const today = new Date().toDateString();
    if (storage.siteVisits > 1 && storage.lastVisitDate === today && !hasAchievement('same_day_return')) {
      unlockAchievement('same_day_return');
      setTimeout(() => {
        showToast("Back again? Claude must be working hard");
      }, 2000);
    }
  }

  // ===== FOOTER EASTER EGG =====
  let footerMessageIndex = 0;
  let footerClickTimer = null;
  let footerClicks = 0;

  function handleFooterClick() {
    footerClicks++;

    if (footerClickTimer) {
      clearTimeout(footerClickTimer);
    }

    footerClickTimer = setTimeout(() => {
      // Cycle on 3+ clicks
      if (footerClicks >= 3) {
        cycleFooterMessage();
      }
      footerClicks = 0;
    }, 400);
  }

  function cycleFooterMessage() {
    footerMessageIndex = (footerMessageIndex + 1) % FOOTER_MESSAGES.length;
    const footerSpan = document.querySelector('.made-with-love');
    if (footerSpan) {
      footerSpan.style.opacity = '0';
      setTimeout(() => {
        footerSpan.textContent = FOOTER_MESSAGES[footerMessageIndex];
        footerSpan.style.opacity = '';
      }, 200);
    }
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

  function getWeightedRandomIdea(ideasList, categoryBoosts = {}) {
    let totalWeight = 0;
    const weightedIdeas = ideasList.map(idea => {
      let weight = RARITY_WEIGHTS[idea.rarity] || RARITY_WEIGHTS.common;
      // Apply category boost if specified
      if (categoryBoosts[idea.category]) {
        weight *= categoryBoosts[idea.category];
      }
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
    let categoryBoosts = {};

    // Desperate mode - 5x boost for cursed ideas
    if (storage.desperateModeActive) {
      categoryBoosts.cursed = 5;
    }

    // Midnight mode - boost cursed and existential
    if (isMidnight()) {
      categoryBoosts.cursed = (categoryBoosts.cursed || 1) * 2;
      categoryBoosts.existential = 2;
    }

    // After 420 ideas, boost meta category
    if (storage.totalIdeasSeen >= 420) {
      categoryBoosts.meta = 3;
    }

    // Avoid showing same idea twice in a row
    if (currentIdea) {
      availableIdeas = availableIdeas.filter(i => i.id !== currentIdea.id);
    }

    return getWeightedRandomIdea(availableIdeas, categoryBoosts);
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

    // Play subtle flip sound on idea change
    playSound('flip');

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
      resetActivity(); // Reset idle timer on new idea
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

    // 50 ideas - activate desperate mode
    if (count === MILESTONES.ideas50.count && !hasAchievement(MILESTONES.ideas50.id)) {
      unlockAchievement(MILESTONES.ideas50.id);
      activateDesperateMode();
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
    startIdleCheck();
    initAudio();
    initRetroMode();
    checkReturningUser();

    // Event listeners
    themeToggle.addEventListener('click', toggleTheme);
    soundToggle.addEventListener('click', toggleSound);
    achievementDismiss.addEventListener('click', hideAchievementPopup);

    // Triple-click header easter egg
    const header = document.querySelector('h1');
    if (header) {
      header.addEventListener('click', handleHeaderClick);
    }

    // Footer easter egg - triple-click to cycle messages
    const footerSpan = document.querySelector('.made-with-love');
    if (footerSpan) {
      footerSpan.addEventListener('click', handleFooterClick);
      footerSpan.style.cursor = 'pointer';
    }

    // Close achievement on overlay click
    achievementOverlay.addEventListener('click', (e) => {
      if (e.target === achievementOverlay) {
        hideAchievementPopup();
      }
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
      resetActivity(); // Reset idle timer on any key press

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

    // Reset activity on mouse movement
    document.addEventListener('mousemove', resetActivity);

    // Pause on visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        clearInterval(intervalId);
        stopTimeCheck();
        stopIdleCheck();
      } else {
        resetTimer();
        startTimeCheck();
        startIdleCheck();
        resetActivity();
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
