# 找谁玩 — Project Progress

## Last Updated
2026-04-28 21:03

## Current Status

### ✅ Completed
- SPEC.md written and pushed
- README.md written
- GitHub repo created: znding04/zane-wechat-miniapp
- Vue 3 + Vite + Tailwind project scaffolded
- Demo seed data (4 friends, 7 hangouts)
- WeChat miniapp wrapper layer (wechat/ directory)
- WeChat build script (npm run build:wechat)
- Safe-area mobile polish
- All 5 pages built and verified: Home, Friends List, Friend Detail, Log Hangout, Stats
- ScatterPlot SVG component with color-coded gap dots
- InsightsPanel with 4 insight types
- Friends list now sorted by gap (most negative first) with gap indicators
- `npm run build` succeeds with no errors
- **2026-04-28 User Feedback v2 — All improvements implemented:**
  - ✅ 20 friends with realistic hangout histories replacing 4-friend demo
  - ✅ Z-score normalization: global mean at (50, 50) on scatter plot, stable as data grows
  - ✅ ScatterPlot: name labels next to dots + popup with friend info/tags/gap on click (no page navigation)
  - ✅ Enhanced friend model: phone, birthday, location, howWeMet, importantEvents[], values[]
  - ✅ FriendDetail page updated to show all new fields (basic info, TA的价值, 重要时刻)
  - ✅ LogHangout page shows friend tags next to names

### 🚧 In Progress
- WebView placeholder URL needs real deployed URL

### ⏳ Pending
- Deploy Vue app to get real WebView URL
- Test in WeChat DevTools with real appid
- Get WeChat account app ID

## Architecture
wechat/           → WeChat miniapp wrapper
wechat/h5/        → Built Vue app (WebView asset host)
src/pages/        → Vue page components
src/composables/  → Shared logic (useSeedData, etc.)
src/components/  → ScatterPlot, InsightsPanel

## Scoring Model
- Quantity: log(1 + total_hangouts) × decay(days_since_last ~60 days)
- Quality: weighted_average(quality × type_weight)
- Type weights: trip 2.0, activity 1.2, meal 1.0, hangout 1.0, call 0.6, online 0.3, other 0.5
- Gap = quality - quantity; positive = rewarding, negative = unbalanced

## Recommendation Logic
1. Negative gap + active in last 30 days → "reconnect meaningfully or pull back"
2. Positive gap but no contact in 14+ days → "these hangouts always feel great but you haven't seen them"
3. Lowest quantity overall → "check in, might be drifting"
