# Human Downtime Website - Implementation Plan

## Project Status
- **Total Tasks:** 25
- **Completed:** 3
- **In Progress:** 0
- **Remaining:** 22
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

## Phase 2: High Priority Tasks [0/6]

### Task 2.1: Implement localStorage tracking system
- [ ] Create tracking object structure
- [ ] Implement incrementIdeaCounter()
- [ ] Implement checkAchievements()
- [ ] Implement getSessionDuration()
- [ ] Implement isReturningUser()
- [ ] Persist data across sessions
- **Status:** Not started

### Task 2.2: Update app.js to use new ideas.json
- [ ] Load ideas from JSON
- [ ] Implement weighted randomness based on rarity
- [ ] Respect time restrictions (midnight, friday, hour)
- [ ] Track clicked idea IDs
- **Status:** Not started

### Task 2.3: Milestone achievements - 10 ideas
- [ ] Toast notification: "Still waiting? Wow, Claude must be building something epic 🚀"
- [ ] Minimal toast design matching site aesthetic
- **Status:** Not started

### Task 2.4: Milestone achievements - 50 ideas
- [ ] Unlock "Desperate Mode" text button in footer
- [ ] Desperate mode shows only "cursed" category
- [ ] Toggle on/off functionality
- **Status:** Not started

### Task 2.5: Milestone achievements - 100 ideas
- [ ] Achievement popup with confetti (minimal style)
- [ ] Badge: "🏆 Terminal Velocity"
- [ ] Message about checking if Claude finished
- **Status:** Not started

### Task 2.6: Time-based behaviors
- [ ] Midnight mode (12am-3am): boost cursed/existential, darker theme
- [ ] Hour marks: brief animation + "It's been X hours..."
- [ ] 30 min on site: notification "Claude probably finished btw"
- **Status:** Not started

---

## Phase 3: Medium Priority Tasks [0/6]

### Task 3.1: Konami code easter egg
- [ ] Detect ↑↑↓↓←→←→BA sequence
- [ ] Retro mode: green terminal text
- [ ] CRT scanlines effect
- [ ] Persist preference in localStorage
- **Status:** Not started

### Task 3.2: Triple-click logo easter egg
- [ ] Detect triple click on header
- [ ] Cycle taglines: "Procrastination as a Service", etc.
- **Status:** Not started

### Task 3.3: Type "help" easter egg
- [ ] Detect "help" typed anywhere
- [ ] Show minimal modal with meta-tips
- **Status:** Not started

### Task 3.4: Click same idea 3 times
- [ ] Track consecutive clicks on same idea
- [ ] Show message: "Really? This one again? 🤔"
- **Status:** Not started

### Task 3.5: Rare random events
- [ ] ID #77: celebration sound + sparkles
- [ ] ID #256: special programmer message
- [ ] ID #13: unlucky theme
- [ ] 0.1% chance: "ERROR: Idea generator is now self-aware 🤖"
- **Status:** Not started

### Task 3.6: Audio system
- [ ] Research minimal audio approach (Web Audio API or small files)
- [ ] Celebration sound for lucky events
- [ ] Subtle sounds for achievements
- [ ] Respect user preferences (muted option)
- **Status:** Not started

---

## Phase 4: Low Priority Tasks [0/5]

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
- [ ] Toast: "Okay you're just procrastinating now 😅"
- [ ] Increase meta category probability
- **Status:** Not started

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
| TBD | 1.1-1.3 | Add ideas.json with 508 categorized ideas | 2025-12-27 |

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
