# Human Downtime Website - Implementation Plan

## Project Status
- **Total Tasks:** 25
- **Completed:** 16
- **In Progress:** 0
- **Remaining:** 9
- **Last Updated:** 2025-12-27

---

## Phase 1: Ideas Generation & Data Structure [3/3] ✅

### Task 1.1: Review existing 200 ideas
- [x] Audit current ideas for quality
- [x] Categorize existing ideas mentally
- [x] Identify weak/boring ideas to replace (~25 removed)
- [x] Note gaps in categories (cursed, existential needed more)
- **Status:** COMPLETE

### Task 1.2: Create ideas.json with proper structure
- [x] Create new JSON structure with id, text, category, rarity, sound, timeRestriction
- [x] Migrate quality existing ideas to new format
- [x] Ensure proper categorization
- **Status:** COMPLETE

### Task 1.3: Generate 500+ high-quality ideas
- [x] physical (60 ideas) - body-based activities
- [x] creative (80 ideas) - artistic/creative activities
- [x] learning (100 ideas) - quick knowledge acquisition
- [x] social (40 ideas) - human connection
- [x] mindful (50 ideas) - reflection/meditation
- [x] fun (80 ideas) - pure entertainment
- [x] meta (30 ideas) - self-referential about waiting/AI
- [x] cursed (40 ideas) - weird/unhinged for desperate mode
- [x] existential (20 ideas) - deep/philosophical
- [x] Special IDs: #13 (unlucky), #77 (lucky), #256 (programmer)
- [x] Assign rarity: common (90%), uncommon (8%), rare (1.5%), very_rare (0.4%), lucky (3 specific)
- [x] Assign time restrictions to 20-30 ideas (midnight mode)
- **Status:** COMPLETE - 508 ideas total

---

## Phase 2: High Priority Tasks [6/6] ✅

### Task 2.1: Implement localStorage tracking system
- [x] Create tracking object structure
- [x] Implement incrementIdeaCounter()
- [x] Implement checkAchievements() (stub for now)
- [x] Implement getSessionDuration()
- [x] Implement isReturningUser()
- [x] Persist data across sessions
- **Status:** COMPLETE

### Task 2.2: Update app.js to use new ideas.json
- [x] Load ideas from JSON (async fetch)
- [x] Implement weighted randomness based on rarity
- [x] Respect time restrictions (midnight, friday, hour)
- [x] Track clicked idea IDs
- [x] Midnight mode boosts cursed/existential
- [x] Desperate mode filtering
- **Status:** COMPLETE

### Task 2.3: Milestone achievements - 10 ideas
- [x] Toast notification: "Still waiting? Claude must be building something epic"
- [x] Minimal toast design matching site aesthetic
- **Status:** COMPLETE

### Task 2.4: Milestone achievements - 50 ideas
- [x] Unlock "Desperate Mode" text button in footer
- [x] Desperate mode shows only "cursed" category
- [x] Toggle on/off functionality
- **Status:** COMPLETE

### Task 2.5: Milestone achievements - 100 ideas
- [x] Achievement popup with confetti (minimal style)
- [x] Badge: "🏆 Terminal Velocity"
- [x] Message about checking if Claude finished
- **Status:** COMPLETE

### Task 2.6: Time-based behaviors
- [x] Midnight mode (12am-3am): boost cursed/existential (already in 2.2)
- [x] Hour marks: toast notifications at 1, 2, 3 hours
- [x] 30 min on site: notification "Claude probably finished btw"
- **Status:** COMPLETE

---

## Phase 3: Medium Priority Tasks [6/6] ✅

### Task 3.1: Konami code easter egg
- [x] Detect ↑↑↓↓←→←→BA sequence
- [x] Retro mode: green terminal text
- [x] CRT scanlines effect
- [x] Persist preference in localStorage
- **Status:** COMPLETE

### Task 3.2: Triple-click logo easter egg
- [x] Detect triple click on header
- [x] Cycle taglines: "Procrastination as a Service", etc.
- **Status:** COMPLETE

### Task 3.3: Type "help" easter egg
- [x] Detect "help" typed anywhere
- [x] Show toast with keyboard shortcuts
- **Status:** COMPLETE

### Task 3.4: Click same idea 3 times
- [x] Track consecutive clicks on same idea
- [x] Show message: "Really? This one again?"
- **Status:** COMPLETE

### Task 3.5: Rare random events
- [x] ID #77: celebration sound + sparkles
- [x] ID #256: special programmer message
- [x] ID #13: unlucky sound + screen shake
- [x] 0.1% chance: "ERROR: Idea generator is now self-aware"
- **Status:** COMPLETE

### Task 3.6: Audio system
- [x] Web Audio API synthesized sounds (no files needed)
- [x] Celebration sound for lucky events
- [x] Retro beep for Konami code
- [x] Unlucky descending tone
- [x] Toggle with 'S' key, persisted in localStorage
- **Status:** COMPLETE

---

## Phase 4: Low Priority Tasks [1/5]

### Task 4.1: Visual quirks
- [ ] Hover >5 seconds: idea drifts upward
- [ ] Idle 5 minutes: "Hello? You still there? 👋"
- [ ] Cursed ideas: subtle screen shake
- **Status:** Not started

### Task 4.2: Returning user features
- [ ] After 5 visits: welcome back message
- [ ] Same day return: special message
- **Status:** Not started

### Task 4.3: Footer easter egg
- [ ] Click to cycle messages
- [ ] "Made while Claude worked"
- [ ] "Procrastination as a Service"
- [ ] "No AIs were harmed in making this"
- [ ] "Still loading... just like your project"
- **Status:** Not started

### Task 4.4: Milestone - 420 ideas
- [x] Toast: "Okay you're just procrastinating now"
- [x] Increase meta category probability
- **Status:** COMPLETE

### Task 4.5: Polish and testing
- [ ] Test all easter eggs
- [ ] Test on mobile
- [ ] Performance check
- [ ] Final UI polish
- **Status:** Not started

---

## Commit Log

| Commit | Task | Description | Date |
|--------|------|-------------|------|
| 668dca7 | 1.1-1.3 | Add ideas.json with 508 categorized ideas | 2025-12-27 |
| TBD | 2.1-2.2 | localStorage tracking + ideas.json integration | 2025-12-27 |
| TBD | 2.3-2.5, 4.4 | Milestone achievements: toasts, desperate mode, confetti | 2025-12-27 |
| TBD | 2.6 | Time-based behaviors: 30min and hourly notifications | 2025-12-27 |
| TBD | 3.1-3.6 | Easter eggs: Konami, triple-click, help, rare events, audio | 2025-12-27 |

---

## Notes

- Every completed task = atomic working commit
- Keep minimal aesthetic throughout
- Quality of ideas is paramount
- Audio should enhance, not annoy

## Idea Statistics (508 total)
- physical: ~60
- creative: ~80
- learning: ~100
- social: ~40
- mindful: ~50
- fun: ~80
- meta: ~30
- cursed: ~40
- existential: ~20
- Special IDs: 13 (unlucky), 77 (lucky), 256 (programmer)
- Rarity: ~460 common, ~40 uncommon, ~8 rare, ~2 very_rare, 3 lucky
- Time restrictions: ~20 midnight-only ideas
