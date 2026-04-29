# 找谁玩 — Project Progress

## Last Updated
2026-04-28 (10-star + view mode + diversified seed)

## Current Status

### ✅ Completed
- SPEC.md written and pushed
- README.md written
- GitHub repo created: znding04/who-to-play-with
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
- **2026-04-28 UX round 1 — post-deploy improvements:**
  - ✅ Fixed `+ 添加` button on Friends page (resetForm bug closed the form immediately)
  - ✅ Tunable balance threshold (`useGapThreshold` composable, default ±12, persisted to localStorage)
  - ✅ Hexagonal balanced band rendered on ScatterPlot (covers corners) + slider tuner
  - ✅ Custom hangout types when picking 其他 (`useCustomTypes` composable; persisted; rendered as picker chips)
  - ✅ Mobile-friendly Edit/Delete buttons in Friends list (proper touch targets and colors)
  - ✅ Edit/Delete buttons added to FriendDetail header (Edit deep-links to `/friends?edit=<id>`)
  - ✅ ScatterPlot popup friend name now a router-link to friend detail
  - ✅ FriendDetail's 记录聚会 button passes `?friend=<id>` to pre-select friend in LogHangout
- **2026-04-28 Scoring fix — type weight removed from quality:**
  - Bug: `quality = avg_rating × avg_type_weight × 20` penalized friends whose hangouts were mostly online (weight 0.3) regardless of how good they felt
  - Fix: `quality = avg_rating × 20`. Type weight no longer enters the quality axis
  - Effect on screenshots: 周杰 (4 online @ 3.75★) moves up on quality; gap goes from −62 toward neutral/positive; recommendation shifts away from him toward 陈思思 (positive-gap stale)
- **2026-04-28 10-star scale + view mode toggle + diversified seed:**
  - Quality rating switched from 1-5 to 1-10 for finer granularity
    - LogHangout picker shows 10 stars (text-xl, gap-0.5 to fit on phone)
    - FriendDetail history shows "★ 8/10" (compact text instead of 10 ★ glyphs)
    - useScoring quality formula: avg × 10 (so 10/10 → raw 100)
    - Migration: existing hangouts with quality ≤ 5 get doubled on app load (schema v1 → v2)
  - useViewMode composable: toggle between **标准化** (z-score normalized, mean at (50,50)) and **绝对值** (raw scores capped to [0,100])
    - Toggle UI lives in ScatterPlot above the threshold tuner
    - Toggle is global: insights/recommendations re-evaluate based on the current mode
  - Seed data v2 — 23 friends with full rating range:
    - 20 existing friends rebalanced to 1-10 scale
    - 3 new "draining" friends with high frequency, low quality:
      - 钱总 (上司, 8 hangouts in 60 days, ratings 1-4)
      - 老周叔 (远亲, 5 hangouts, ratings 2-3)
      - 阿强 (老同学, 4 hangouts of complaints, ratings 2-4)
    - SEED_VERSION bumped to 2; old seed data is wiped and replaced on first load

### 🚧 In Progress
- Mobile / WeChat in-app browser testing of the live deploy

### ⏳ Pending
- (deferred) Mini Program path: WeChat DevTools test with real appid, get WeChat account app ID

## Completed: 2026-04-29 — User Auth + Persistent Data Storage

### What Was Done
- **Worker.js env fixes**: Fixed `env` references at module level and in functions that weren't receiving `env` as a parameter (getGoogleAuthUrl, getGitHubAuthUrl, getAppleAuthUrl, exchangeGoogleCode, exchangeGitHubCode, exchangeAppleCode). Now all env-dependent functions properly accept `env` as a parameter.
- **Cloudflare D1 schema**: Already set up in `schema.sql` with tables for users, friends, hangouts, hangout_friends, auth_tokens
- **wrangler.toml**: Already configured with D1 binding, KV namespace, and environment variables for OAuth secrets
- **Backend Worker**: Full API implementation with:
  - OAuth flows for Google, GitHub, Apple Sign In
  - Magic link email authentication
  - JWT session management
  - RESTful CRUD for friends and hangouts
  - Data migration endpoint for localStorage → D1
- **Frontend auth components**:
  - `useAuth.js` composable: session management, OAuth callbacks, data migration
  - `useFriends.js`: cloud sync mode when logged in, API calls for CRUD
  - `api.js`: auth-aware API client with cookie/token handling
  - `Login.vue`: 4 login methods (Google, GitHub, Apple, email magic link)
  - `App.vue`: user avatar display, login button, logout functionality
- **Build verified**: `npm run build` succeeds with no errors

### Next Steps
- Configure OAuth credentials in Cloudflare dashboard:
  1. Create Google OAuth2 app, set secrets via `wrangler secret put GOOGLE_CLIENT_ID/SECRET`
  2. Create GitHub OAuth app, set secrets via `wrangler secret put GITHUB_CLIENT_ID/SECRET`
  3. Configure Apple Sign In in Apple Developer console, set secrets
  4. Set `wrangler secret put JWT_SECRET` (generate with: `openssl rand -base64 32`)
  5. Set `wrangler secret put APP_BASE_URL=https://who-to-play-with.ljding94.workers.dev`
- Create D1 database: `wrangler d1 create who-to-play-with-db`
- Run migrations: `wrangler d1 execute who-to-play-with-db --file=./schema.sql --remote`
- Deploy worker: `wrangler deploy`
- Test full auth flow end-to-end

## Deployment

**Chosen route: A — H5 hosted publicly, shared via WeChat link / QR**

- Live URL: https://who-to-play-with.ljding94.workers.dev/
- Host: Cloudflare Pages (deployed via `ljding94` Cloudflare account; repo owned by `znding04`)
- Build: `npm run build` → `dist/` (auto-deploys on push to `main`)
- Distribution: paste link into WeChat chat, or generate a QR code

The `wechat/` Mini Program wrapper directory is **not used** for Route A. It is preserved for the deferred Mini Program path (Route B), which would require Tencent review, a 小程序 account, and a cross-compile (uni-app / Taro) or rewrite.

## Architecture
src/pages/        → Vue page components
src/composables/  → Shared logic (useSeedData, useFriends, useScoring)
src/components/   → ScatterPlot, InsightsPanel
dist/             → Production build output (deployed to Cloudflare)
wechat/           → (Unused for Route A) Mini Program wrapper, kept for future Route B
wechat/h5/        → (Unused for Route A) WebView asset target for Mini Program

## Scoring Model
- Quantity (raw): log(1 + Σ duration_mult) × 25 × (0.3 + 0.7 × exp(-days_since_last/60))
  - Duration multipliers: 30min 0.5, 1hr 1, 2hr 1.5, halfday 2, fullday 3, trip 4
- Quality (raw): average_rating × 10 (so 10/10 → 100, 1/10 → 10)
  - Type weight is intentionally NOT applied here. It conflates "investment" with "how it felt" — a 8/10 online call is still an 8/10 experience.
- View mode (`useViewMode`):
  - **标准化** (default): both scores z-score normalized so population mean lands at (50, 50)
  - **绝对值**: raw scores clipped to [0, 100]
- Gap = quality − quantity (computed from whichever mode is active)
  - Within ±gapThreshold (user-tunable, default 12) → 平衡
  - > +threshold → 很值得 (great experience relative to time invested)
  - < −threshold → 不平衡 (lots of time, mediocre experience)

## Recommendation Logic
1. Negative gap + active in last 30 days → "reconnect meaningfully or pull back"
2. Positive gap but no contact in 14+ days → "these hangouts always feel great but you haven't seen them"
3. Lowest quantity overall → "check in, might be drifting"
