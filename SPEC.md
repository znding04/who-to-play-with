# 找谁玩 (Who To Play With) — WeChat Mini App Spec

## Overview
A social relationship tracker (找谁玩) that helps you maintain and strengthen your friendships. Log hangouts with friends, quantitatively score your relationships, and get data-driven recommendations on who you should reach out to next. Never let a good friendship fade from neglect.

## Tech Stack
- **Framework**: Vue 3 (Composition API) + Vite
- **Styling**: Tailwind CSS 3
- **Routing**: Vue Router 4 (hash mode for mini-app compatibility)
- **Storage**: LocalStorage via a reactive composable
- **Language**: JavaScript (no TypeScript for simplicity)
- **Compatibility**: Works in modern browsers + WeChat webview

## Core Concept

Every friendship has a **Relationship Score** that decays over time if you don't hang out. The app tracks your interactions, calculates scores, and tells you which friends need attention — so you can be intentional about the people who matter to you.

## Data Model

### Friend
```json
{
  "id": "uuid-string",
  "name": "Alice",
  "avatar": "emoji-or-initials",
  "tags": ["college", "climbing"],
  "addedAt": 1745000000000
}
```

### Hangout (Interaction Log)
```json
{
  "id": "uuid-string",
  "friendIds": ["friend-uuid-1", "friend-uuid-2"],
  "type": "meal" | "activity" | "call" | "trip" | "hangout" | "online" | "other",
  "quality": 1-5,
  "note": "Optional description",
  "date": "2026-04-25",
  "createdAt": 1745000000000
}
```

### Interaction Types
| Type      | Icon | Label (EN)     | Label (ZH) | Base Score Weight |
|-----------|------|----------------|-------------|-------------------|
| meal      | 🍜   | Meal           | 吃饭        | 1.0               |
| activity  | 🏃   | Activity       | 活动        | 1.2               |
| call      | 📞   | Call / Video   | 通话        | 0.6               |
| trip      | ✈️   | Trip           | 旅行        | 2.0               |
| hangout   | 🎉   | Hangout        | 聚会        | 1.0               |
| online    | 💬   | Online Chat    | 线上聊天     | 0.3               |
| other     | 📦   | Other          | 其他        | 0.5               |

### Quality Rating
| Stars | Meaning               |
|-------|-----------------------|
| 1     | Awkward / forced      |
| 2     | Fine, nothing special |
| 3     | Good time             |
| 4     | Great connection      |
| 5     | Unforgettable         |

## Relationship Score Algorithm

Each friend has a computed **Relationship Score (RS)** from 0–100.

```
RS = min(100, sum of weighted interaction scores)

For each hangout with this friend:
  interaction_score = base_weight × quality × recency_multiplier

Recency multiplier (exponential decay):
  recency = e^(-days_since_hangout / 60)
```

- Recent, high-quality, in-person interactions score highest
- Score decays naturally over ~2 months without contact
- Trips and activities weigh more than calls and chats
- Group hangouts count for all friends present

### Score Tiers
| Range   | Tier         | Label (ZH) | Color   |
|---------|-------------|-------------|---------|
| 80–100  | Close       | 亲密        | #10B981 |
| 50–79   | Good        | 不错        | #3B82F6 |
| 20–49   | Fading      | 疏远中      | #F59E0B |
| 0–19    | Neglected   | 该联系了    | #EF4444 |

## Pages / Views

### 1. Home (Dashboard) — `/`
- **Recommendation card**: "You should hang out with..." — shows the friend with the highest priority (low score + long time since last seen + historically high quality)
- Quick stats: total friends, hangouts this month, average score
- **Recent hangouts** (last 5)
- Floating "+" button to log a new hangout

### 2. Friends List — `/friends`
- List of all friends sorted by relationship score (descending)
- Each card shows: avatar/emoji, name, tags, score bar, last hangout date, days since last seen
- Color-coded score indicator (green/blue/yellow/red)
- Tap to view friend detail
- "Add Friend" button

### 3. Friend Detail — `/friends/:id`
- Friend name, avatar, tags
- Current relationship score (large, color-coded)
- Score trend (simple sparkline: last 4 weeks)
- Hangout history with this friend (chronological)
- Quick "Log Hangout" button pre-filled with this friend

### 4. Log Hangout — `/log`
- Friend selector (multi-select for group hangouts)
- Interaction type selector (grid of icons)
- Quality rating (1–5 stars)
- Date picker (defaults to today)
- Optional note
- Save → redirects to home with updated recommendation

### 5. Stats / Insights — `/stats`
- Month selector
- Distribution: how many friends in each score tier (bar chart, CSS-only)
- Hangout frequency: total hangouts per week/month
- Top friends by score
- Most neglected friends (sorted by days since last hangout)
- Social diversity: breakdown by interaction type

## Navigation
- Bottom tab bar with 4 tabs: Home, Friends, Log (+), Stats
- Floating "+" button on Home for quick log

## Storage
- Key: `hangout_friends` — JSON array of Friend objects
- Key: `hangout_logs` — JSON array of Hangout objects
- Composable: `useFriends()` — reactive friend list + CRUD
- Composable: `useHangouts()` — reactive hangout list + CRUD
- Composable: `useRelationshipScore(friendId)` — computed score for a friend
- Composable: `useRecommendation()` — who to hang out with next

## Recommendation Algorithm

Priority score for "who to hang out with next":

```
priority = (100 - relationship_score) × time_factor × affinity_bonus

time_factor = log2(days_since_last_hangout + 1)
affinity_bonus = average_quality_with_this_friend / 3
```

- Friends you haven't seen in a while AND historically enjoy hanging out with get the highest priority
- Friends with consistently low quality scores get deprioritized (the app won't nag you to see people you don't enjoy)

## UI Design Principles
- Mobile-first: max-width 480px centered
- Clean white background, subtle shadows
- Score-tier color coding throughout (green/blue/yellow/red)
- Rounded cards, 16px padding
- Chinese labels with English subtitles
- Safe-area padding for notch devices
- Warm, friendly aesthetic — this is about people, not spreadsheets

## Mini-App Compatibility Notes
- Hash-based routing (`createWebHashHistory`)
- No external font loading (use system fonts)
- No `window.open` or external links
- LocalStorage is available in WeChat webview
- Viewport meta tag for proper scaling
