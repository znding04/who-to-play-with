# 找谁玩 (Who To Play With)

A social relationship tracker (找谁玩) that helps you be intentional about friendships. Built as a WeChat Mini App compatible web app.

## What It Does

- **Track friends** and tag them by context (college, work, climbing buddies, etc.)
- **Log hangouts** — meals, trips, calls, activities — with quality ratings
- **Relationship scores** that decay over time without contact, so you can see which friendships need attention
- **Smart recommendations** on who to hang out with next, based on recency, score, and historical quality

## Tech Stack

- Vue 3 (Composition API) + Vite
- Tailwind CSS 3
- Vue Router 4 (hash mode)
- LocalStorage for persistence
- No backend required — runs entirely in the browser

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser (or load via WeChat webview).

## Project Structure

```
src/
  views/          # Page components (Home, Friends, Log, Stats)
  composables/    # useFriends(), useHangouts(), useRelationshipScore()
  components/     # Shared UI components
  router/         # Vue Router config
  App.vue         # Root layout + bottom nav
  main.js         # Entry point
```

## How Scoring Works

Each friend gets a **Relationship Score (0–100)** based on your logged interactions. Scores decay exponentially over ~60 days without contact. High-quality, in-person interactions (trips, activities) weigh more than quick chats. The app recommends who to see next by combining low scores with high historical affinity — it nudges you toward friends you actually enjoy spending time with.

See [SPEC.md](./SPEC.md) for the full scoring algorithm and app specification.
