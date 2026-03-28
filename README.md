# 🐾 Pawzzle - Dog Photo Puzzle Game

Pawzzle is a fun, lightweight weekend hobby project created to turn your favorite dog photos into an engaging "swap-tile" puzzle game! 

## Why was this created?
Because who doesn't love looking at cute dogs while giving their brain a tiny workout? I built Pawzzle purely because I wanted to create a fun, personalized game to showcase and play with my own dog pictures. What started as a lightweight weekend project quickly escalated into a deeply optimized, competitive daily challenge game!

## Features & Architecture

Pawzzle started as a simple React experiment but quickly evolved into a robust, edge-optimized application. 

### Core Mechanics
- **Swap-Tile Mechanics:** A mathematically guaranteed solvable puzzle every time, utilizing inversion counting logic.
- **Dynamic Difficulty:** Play on a 3x3 (Easy), 4x4 (Medium), or 5x5 (Hard) grid.
- **Admin Dashboard:** Secure, JWT-protected `/admin` middleware route with bulk drag-and-drop uploads. High-res iPhone photos are compressed client-side before uploading to save bandwidth.

### Scale & State Management (v2 Updates)
- **Global Leaderboards:** Powered by Upstash Redis `ZSET`s. Scores are computed using a fast composite formula (`time + (moves / 1000)`) to deduplicate logic and return O(log(N)) ranked leaderboards instantly.
- **Image Tagging & Categories:** Bulk-uploader tags images using Redis `SET`s alongside Cloudflare R2 object storage. The Next.js API uses native `pipeline` and `srandmember` to achieve **O(1)** random image retrieval for any given category, avoiding costly bucket-scanning operations.
- **Daily Canine Challenge:** A deterministic daily puzzle mode. It generates a daily math seed `sin(seed) * 10000` mapped to the calendar date. This guarantees that everyone playing on the same day globally receives the exact same puzzle image and initial shuffled permutation.
- **Progressive Web App (PWA) & Offline Mode:** Built as a fully installable Web App. A custom configured Workbox Service Worker aggressively intercepts and caches `*.r2.cloudflarestorage.com` requests via a `StaleWhileRevalidate` strategy. Once a puzzle is loaded, it can be replayed completely offline!

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Frontend**: React 19, TailwindCSS, Framer Motion
- **Storage**: Cloudflare R2 (S3-compatible object storage)
- **Database**: Upstash Redis (Vercel KV) for instantaneous Sets and Sorted Sets querying
- **Authentication**: `jose` (JWT Session Management)
- **PWA**: `@ducanh2912/next-pwa` with custom Workbox caching logic

If you enjoy the game or the code, consider [sponsoring me on GitHub](https://github.com/sponsors/arnayshukla)! ❤️
