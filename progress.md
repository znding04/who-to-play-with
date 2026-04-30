# 找谁玩 — Project Progress

## Last Updated
2026-04-30 (Auth security fixes + cloud sync)

## Current Status

### ✅ Completed
- SPEC.md written and pushed
- README.md written
- GitHub repo created: znding04/who-to-hang-with
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

- **2026-04-29 i18n + PWA + UI Polish:**
  - ✅ Full internationalization (i18n) with English + Chinese support
    - `src/i18n/en.js` + `src/i18n/zh.js` — complete translations
    - `src/composables/useI18n.js` — language composable
    - `src/components/LocaleToggle.vue` — language switcher UI
  - ✅ PWA icons and favicons added:
    - Favicons: 16×16, 32×32, .ico, apple-touch-icon
    - PWA icons: 192×192, 512×512
    - App icon: `public/tohangwith_icon.png`
  - ✅ UI improvements across pages:
    - Home, Friends, FriendDetail, Calendar, LogHangout, Login pages polished
    - ScatterPlot and InsightsPanel component updates
    - Mobile-friendly improvements
  - ✅ Seed data split by locale: `seedFriends.en.js` + `seedFriends.zh.js`
  - ✅ WeChat mini program config updates

### 🚧 In Progress
- Auth deployment — see 2026-04-29 section below

### 🔒 Security Fixes (2026-04-30)
- ✅ JWT expiration now verified in `verifyJwt()` (exp claim checked)
- ✅ OAuth state parameter now signed as JWT to prevent CSRF attacks (10-min expiry)
- ✅ Magic token `user_id` changed from `''` to `NULL` in schema (FK constraint fix)
- ✅ `getJwtSecret()` throws error if not configured in production
- ✅ Fixed malformed error redirect URL (`/${'?error='}${error}` → `/#/login?error=${error}`)
- ✅ Apple Sign In response_mode changed from `form_post` to `query`
- ✅ Removed invalid CORS config (`Access-Control-Allow-Origin: *` + `credentials: true`)
- ✅ wrangler added as dev dependency for deployment

### ⏳ Pending
- (deferred) Mini Program path: WeChat DevTools test with real appid, get WeChat account app ID
- **ScatterPlot category filter** — let the user filter the scatter plot by hangout category (e.g. 🍜 吃饭, ✈️ 旅行, 💬 线上). Recompute each friend's quality/quantity using only hangouts of the selected type, so the user can see "who's good for which activity". UI: chip row above the plot with 全部 + each type. Should also include any custom types from `useCustomTypes`.

## [2026-04-29] — Auth Deployment Progress

### Code Changes Done
- Removed unused KV namespace binding from `wrangler.toml` (worker uses `env.JWT_SECRET` directly)
- Simplified `getJwtSecret()` in worker.js to use `env.JWT_SECRET` without KV fallback
- Frontend build verified: `npm run build` succeeds
- Auth code reviewed: email/password signup+login, OAuth (Google/GitHub/Apple), magic link all implemented
- Auth callback flow verified: worker → `/#/auth-callback?token=...` → Login.vue `onMounted` → `handleAuthCallback`
- **2026-04-30 Security fixes applied** (see above)

### Deployment Steps (requires `wrangler login` or `CLOUDFLARE_API_TOKEN`)

Run these commands in order:

```bash
# 1. Authenticate wrangler (opens browser) OR set API token
npx wrangler login
# OR for CI/non-interactive:
# export CLOUDFLARE_API_TOKEN="your_token_here"

# 2. Create D1 database (if not already created)
npx wrangler d1 create who-to-hang-with-db
# ⚠️ Copy the database_id from output and update wrangler.toml

# 3. Run migrations
npx wrangler d1 execute who-to-hang-with-db --file=./schema.sql --remote

# 4. Set secrets
openssl rand -base64 32 | npx wrangler secret put JWT_SECRET
echo "https://who-to-hang-with.ljding94.workers.dev" | npx wrangler secret put APP_BASE_URL

# 5. Build and deploy
npm run build
npx wrangler deploy
```

### OAuth Setup Required (manual)

**GitHub OAuth** (easiest, do first):
1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. App name: `找谁玩`
4. Homepage URL: `https://who-to-hang-with.ljding94.workers.dev`
5. Authorization callback URL: `https://who-to-hang-with.ljding94.workers.dev/api/auth/callback/github`
6. Copy Client ID and Client Secret, then:
   ```bash
   npx wrangler secret put GITHUB_CLIENT_ID
   npx wrangler secret put GITHUB_CLIENT_SECRET
   ```

**Google OAuth**:
1. Go to https://console.cloud.google.com/ → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Authorized redirect URIs: `https://who-to-hang-with.ljding94.workers.dev/api/auth/callback/google`
4. Copy Client ID and Secret, then:
   ```bash
   npx wrangler secret put GOOGLE_CLIENT_ID
   npx wrangler secret put GOOGLE_CLIENT_SECRET
   ```

**Apple Sign In** (optional, complex — skip for now):
- Requires Apple Developer Program ($99/year), Service ID, and ES256 key

### Status
- ✅ Auth code written and reviewed
- ✅ Frontend build passes
- ✅ wrangler.toml configured with D1 binding (database_id: e717cd17-5944-4ea5-9291-37aa1a2c78f7)
- ✅ Security fixes applied (JWT expiry, OAuth CSRF, magic token FK)
- ⚠️ D1 database needs schema migration (run `wrangler d1 execute` with updated schema.sql)
- ⚠️ Secrets not yet set (JWT_SECRET, APP_BASE_URL, OAuth credentials)
- ⚠️ Worker not yet deployed
- ⚠️ OAuth apps need manual creation in GitHub/Google consoles
- ✅ Email/password auth will work immediately after deploy (no OAuth needed)

## Deployment

**Chosen route: A — H5 hosted publicly, shared via WeChat link / QR**

- Live URL: https://who-to-hang-with.ljding94.workers.dev/
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
