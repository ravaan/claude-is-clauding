# What To Do When Claude Is Clauding

A fun, minimalist website that displays creative ideas for what to do while waiting for Claude AI to complete tasks.

## Features

- 500+ curated ideas across multiple categories
- Smooth slot machine-style animation
- Dark/light theme toggle
- Auto-cycles every 3.5 seconds
- Keyboard shortcuts (Space/Enter to skip, T for theme, S for sound)
- Fully responsive design
- Easter eggs for the curious...

## Setup

No build step required. Just serve the files:

```bash
# Using Python
python -m http.server 8000

# Using Node
npx serve

# Or just open index.html in a browser
```

## Files

```
index.html    - Main HTML structure
styles.css    - All styling and animations
app.js        - Application logic
ideas.json    - 500+ categorized ideas
```

## How It Works

1. Ideas are loaded from `ideas.json` on page load
2. Each idea has a category, rarity, and optional time restrictions
3. Weighted randomness determines which idea appears next
4. Progress and preferences are stored in localStorage

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space / Enter | Next idea |
| T | Toggle theme |
| S | Toggle sound |
| ? | Show help |

## License

MIT
