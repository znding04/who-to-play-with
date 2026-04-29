# 找谁玩 (Who To Hang With)

> 量化管理你的朋友圈

**Live app: https://tohangwith.ljding94.workers.dev/#**

A social relationship tracker (找谁玩) that helps you be intentional about friendships. Built as a WeChat Mini App compatible web app.

## What It Does

- **Track friends** and tag them by context (college, work, climbing buddies, etc.)
- **Log hangouts** — meals, trips, calls, activities — with quality ratings
- **Relationship scores** that decay over time without contact, so you can see which friendships need attention
- **Smart recommendations** on who to hang out with next, based on recency, score, and historical quality
- **Cloud sync** — sign in to access your data from any device

## Tech Stack

- Vue 3 (Composition API) + Vite
- Tailwind CSS 4
- Vue Router 4 (hash mode)
- Cloudflare Workers (backend API)
- Cloudflare D1 (SQLite database)
- Cloudflare KV (JWT secret storage)
- JWT-based session authentication
- LocalStorage for offline/guest mode

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser (or load via WeChat webview).

## Project Structure

```
src/
  pages/           # Page components (Home, Friends, Log, Calendar, Login)
  composables/     # useFriends(), useAuth(), useScoring(), useRelationshipScore()
  components/      # Shared UI components
  utils/           # API client
  router/          # Vue Router config
  App.vue          # Root layout + bottom nav
  main.js          # Entry point
schema.sql         # D1 database schema
wrangler.toml      # Cloudflare Worker configuration
src/worker.js      # Cloudflare Worker (API backend)
```

---

## Cloud Backend Setup

### 1. Install Wrangler

```bash
npm install -g wrangler
```

### 2. Create D1 Database

```bash
wrangler d1 create who-to-hang-with-db
```

This will output a `database_id`. Add it to `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "who-to-hang-with-db"
database_id = "YOUR_ACTUAL_DATABASE_ID"
```

### 3. Run Database Migrations

```bash
wrangler d1 execute who-to-hang-with-db --file=./schema.sql --remote
```

Or for local development:

```bash
wrangler d1 execute who-to-hang-with-db --file=./schema.sql --local
```

### 4. Create KV Namespace for JWT Secrets

```bash
wrangler kv:namespace create "JWT_KV"
```

Add to `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "KV"
id = "YOUR_KV_NAMESPACE_ID"
```

### 5. Set OAuth Secrets

For each OAuth provider, you need to create an application and set the credentials:

**Google OAuth2:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project or select existing
3. APIs & Services → Credentials → Create OAuth Client ID
4. Application type: Web application
5. Authorized redirect URI: `https://tohangwith.ljding94.workers.dev/api/auth/callback/google`
6. Set secrets:
```bash
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
```

**GitHub OAuth2:**
1. Go to GitHub Settings → Developer settings → OAuth Apps → New OAuth App
2. Homepage URL: `https://tohangwith.ljding94.workers.dev`
3. Callback URL: `https://tohangwith.ljding94.workers.dev/api/auth/callback/github`
3. Set secrets:
```bash
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET
```

**Apple Sign In:**
1. Go to [Apple Developer Console](https://developer.apple.com/)
2. Certificates, Identifiers & Profiles → Identifiers → App IDs
3. Enable "Sign in with Apple" for your App ID
4. Create a Services ID and configure the return URL
5. Create a key for Apple Sign In (JSON Web Key)
6. Set secrets:
```bash
wrangler secret put APPLE_CLIENT_ID
wrangler secret put APPLE_TEAM_ID
wrangler secret put APPLE_KEY_ID
wrangler secret put APPLE_PRIVATE_KEY
```

**JWT & App Base:**
```bash
wrangler secret put JWT_SECRET
# Generate with: openssl rand -base64 32
wrangler secret put APP_BASE_URL
# Set to: https://tohangwith.ljding94.workers.dev
```

### 6. Deploy the Worker

```bash
wrangler deploy
```

This deploys to `tohangwith.ljding94.workers.dev`.

---

## API Reference

All endpoints require a valid session cookie (`wtpw_session`) unless marked as public.

### Auth Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/google` | Initiate Google OAuth |
| POST | `/api/auth/github` | Initiate GitHub OAuth |
| POST | `/api/auth/apple` | Initiate Apple Sign In |
| POST | `/api/auth/magic` | Send magic link to email |
| GET | `/api/auth/callback/google` | Google OAuth callback |
| GET | `/api/auth/callback/github` | GitHub OAuth callback |
| GET | `/api/auth/callback/apple` | Apple Sign In callback |
| POST | `/api/auth/callback/magic` | Magic link verification |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout |

### Data Endpoints (require auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/friends` | List all friends |
| POST | `/api/friends` | Create a friend |
| PUT | `/api/friends/:id` | Update a friend |
| DELETE | `/api/friends/:id` | Delete a friend |
| GET | `/api/hangouts` | List all hangouts |
| POST | `/api/hangouts` | Create a hangout |
| PUT | `/api/hangouts/:id` | Update a hangout |
| DELETE | `/api/hangouts/:id` | Delete a hangout |
| POST | `/api/data/migrate` | Migrate localStorage data |

### Response Format

```json
{
  "success": true,
  "friends": [...],
  "user": { "id": "...", "email": "...", "name": "...", "avatarUrl": "..." }
}
```

Error responses:
```json
{
  "error": "Error message",
  "success": false
}
```

---

## Data Model

### Users
| Field | Type | Description |
|-------|------|-------------|
| id | TEXT | UUID primary key |
| email | TEXT | Unique email |
| name | TEXT | Display name |
| avatar_url | TEXT | Profile picture URL |
| auth_provider | TEXT | google/github/apple/magic |
| provider_user_id | TEXT | ID from OAuth provider |
| created_at | INTEGER | Unix timestamp |

### Friends
| Field | Type | Description |
|-------|------|-------------|
| id | TEXT | UUID primary key |
| user_id | TEXT | FK to users |
| name | TEXT | Friend's name |
| tags | TEXT | JSON array of tags |
| phone | TEXT | Phone number |
| birthday | TEXT | Birthday (YYYY-MM-DD) |
| location | TEXT | Location |
| how_we_met | TEXT | How you met |
| important_events | TEXT | JSON array |
| values | TEXT | JSON array |
| created_at | INTEGER | Unix timestamp |
| updated_at | INTEGER | Unix timestamp |

### Hangouts
| Field | Type | Description |
|-------|------|-------------|
| id | TEXT | UUID primary key |
| user_id | TEXT | FK to users |
| type | TEXT | Activity type |
| quality | INTEGER | 1-10 quality rating |
| duration | TEXT | Duration description |
| date | TEXT | Date (YYYY-MM-DD) |
| notes | TEXT | Notes |
| created_at | INTEGER | Unix timestamp |

### Hangout_Friends (junction)
| Field | Type | Description |
|-------|------|-------------|
| hangout_id | TEXT | FK to hangouts |
| friend_id | TEXT | FK to friends |

---

## How Scoring Works

Each friend gets a **Relationship Score (0–100)** based on your logged interactions. Scores decay exponentially over ~60 days without contact. High-quality, in-person interactions (trips, activities) weigh more than quick chats. The app recommends who to see next by combining low scores with high historical affinity — it nudges you toward friends you actually enjoy spending time with.

See [SPEC.md](./SPEC.md) for the full scoring algorithm and app specification.
