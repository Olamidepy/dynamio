# Dynamio (3D Arcade Chain Reaction)

<div align="center">

![Dynamio Banner](/public/DynamioArtboard%201%20copy.png)

**A Next-Gen 3D Zuma-Style Chain Reaction Arcade Game Powered by WebGL and the Nimiq 2.0 Albatross Ecosystem.**

[![React](https://img.shields.io/badge/React-18.3.1-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r170-black?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38bdf8?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6.0.1-646cff?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Nimiq 2.0 Albatross](https://img.shields.io/badge/Nimiq_2.0-Albatross_Mainnet-e5a910?style=for-the-badge&logo=bitcoin&logoColor=black)](https://nimiq.com/)
[![Nimiq Pay](https://img.shields.io/badge/Nimiq_Pay-Native_In--App-260146?style=for-the-badge)](https://nimiq.com/)

[Play Demo](http://localhost:3000) • [Arcade Campaign](#arcade-campaign-stages) • [Nimiq 2.0 Integration](#nimiq-20-albatross--blockchain-architecture) • [Leaderboard](#live-zero-dummy-global-leaderboard) • [Architecture](#architecture--technical-design) • [Controls](#controls--shortcuts)

</div>

---

## Table of Contents
- [Overview](#overview)
- [Core Gameplay Mechanics](#core-gameplay-mechanics)
- [Key Features](#key-features)
- [Arcade Campaign Stages](#arcade-campaign-stages)
- [Nimiq 2.0 Albatross & Blockchain Architecture](#nimiq-20-albatross--blockchain-architecture)
  - [Mainnet Treasury & Automated Payout Pipeline](#mainnet-treasury--automated-payout-pipeline)
  - [Native Nimiq Pay In-App Bridge & Nimiq Hub Connect](#native-nimiq-pay-in-app-bridge--nimiq-hub-connect)
  - [Authentic Profiles & Nimiq Identicons](#authentic-profiles--nimiq-identicons)
- [Live Zero-Dummy Global Leaderboard](#live-zero-dummy-global-leaderboard)
- [Serverless API & Treasury Endpoints](#serverless-api--treasury-endpoints)
- [Architecture & Technical Design](#architecture--technical-design)
  - [Project Directory Structure](#project-directory-structure)
  - [Spline Trajectory & Arc-Length Parameterization](#spline-trajectory--arc-length-parameterization)
  - [Single Persistent Canvas Architecture](#single-persistent-canvas-architecture)
- [Design System & UI Conventions](#design-system--ui-conventions)
- [Getting Started](#getting-started)
- [Controls & Shortcuts](#controls--shortcuts)
- [License](#license)

---

## Overview

**Dynamio** is a high-performance 3D chain reaction arcade game engineered for modern web browsers, the Nimiq Mini App ecosystem, and the Nimiq Pay mobile wallet. Inspired by classic sphere-matching arcades such as *Zuma* and *Luxor*, Dynamio elevates the formula into real-time 3D diorama environments with dynamic perspective cameras, spline trajectory physics, reverse magnetic snap-back cascades, and authentic on-chain cryptocurrency payouts in **NIM** on the **Nimiq 2.0 Albatross Mainnet**.

Players control a 360-degree central shooter station, launching vibrant energy spheres to match three or more contiguous colors before the advancing chain reaches the golden core vortex. Complete levels to earn real NIM micro-rewards disbursed directly from the game's automated on-chain treasury.

---

## Core Gameplay Mechanics

```
       [ Central Cannon ]
               │
          Aim & Launch
               │
               ▼
  ──●─●─●─[ Match 3+ ]─●─●───► [ Golden Vortex ]
               │
        Group Explodes
               │
        Gap Created
               │
   ◄── Reverse Attraction ── (Front segment rolls backward to meet rear)
               │
      Cascading Chain Reaction!
```

1. **Continuous Spline Trajectory**:
   - Energy spheres roll along smooth 3D Catmull-Rom spline curves.
   - The queue advances progressively towards the central vortex.

2. **Aim & Launch**:
   - The central cannon rotates dynamically to track player pointer and touch positions in 3D world space.
   - High-velocity projectile physics calculate precise spherical raycasts against queued balls.

3. **Match 3+ Color Clears**:
   - Direct hits insert the fired ball into the train at the collision index.
   - Contiguous sequences of 3 or more matching colors trigger energy explosions, earning score points and combo multipliers.

4. **Reverse Magnetic Snap-Back (Gap Cascades)**:
   - When a match is cleared, a gap opens in the chain.
   - Rather than rolling forward, separated front train segments roll **backward** along the track to meet the rear segment.
   - If the newly connected ends match in color, they trigger an automatic magnetic combo cascade.

5. **Core Vortex Defense & Rewards**:
   - If the leading sphere breaches the threshold of the central golden vortex, the vortex collapses, ending the run.
   - Eliminating all spheres in the active level queue awards victory, star rankings, and automated on-chain NIM cryptocurrency rewards.

---

## Key Features

- **Real-Time 3D Diorama Engine**: Built directly on Three.js (r170) with customized PBR materials, dynamic point lights, high-performance spline interpolation, and an adaptive camera viewport.
- **Nimiq 2.0 Albatross Mainnet Rewards**: Instant solo payouts executed directly on the live Nimiq 2.0 Proof-of-Stake Mainnet (`networkId: 24`). Payouts are verifiable on the public block explorer.
- **Dual-Mode Nimiq Connection (Nimiq Pay & Hub)**:
  - **Native In-App Mini App**: Automatic zero-click bridge detection via `@nimiq/mini-app-sdk` when opened inside the Nimiq Pay mobile wallet (`window.nimiq`), allowing seamless transactions and account queries without redirects.
  - **Web Hub Connect**: Official Nimiq Hub (`@nimiq/hub-api`) integration for secure non-custodial browser logins and checkout.
  - **Nimiq Pay Deep Links**: Native `nimiq:` protocol deep link and QR code generation for one-tap mobile checkout.
- **Authentic Nimiq Profiles & Identicons**: Automatic derivation of official 3-word animal monikers and SVG Identicons via `@nimiq/identicons` alongside real-time on-chain balance fetching.
- **Live Zero-Dummy Global Leaderboard**: Completely purged of simulated bots and mock users. Displays only real connected devices and verified players with their authentic Nimiq address, moniker, combo, score, and accuracy.
- **Continuous Translational Level Previews**: A 1:1 square diorama carousel featuring real-time moving 2D canvas simulations of all 7 campaign stages in a continuous translational motion loop.
- **Dynamic Lock Progression**: Visual progression engine tracking player progress. Uncompleted stages show frosted glass locks, while completed stages display high scores, star achievements, and direct play options.
- **Deterministic Daily Challenge**: Generates a unique daily trial seeded from the current UTC date string (`YYYY-MM-DD`), allowing worldwide players to compete on identical daily track layouts.
- **Direct Arena Treasury Routing**: Arena and high-stakes challenge entry payments route directly to the dedicated game treasury address (`NQ81 BDH4 RKPV XMG3 T082 J84R QRPT VJEJ FUET`).
- **Strict `#020202` & shadcn/ui Design**: Engineered to match official shadcn/ui component standards with a deep `#020202` background and unified `#FFCA1A` golden accents.
- **Locked 60 FPS Performance**: Zero bloated game engine overhead; runs smoothly on desktop and mobile devices with minimal battery drain.

---

## Arcade Campaign Stages

Dynamio features 7 progressive handcrafted 3D tracks:

| Stage | Name | Difficulty | Balls | Speed | Colors | Target Score | Reward |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **1** | **Neon Gateway** | `EASY` | 28 | 2.2 | 3 (Ruby, Sapphire, Amber) | 2,500 pts | `+0.5 NIM` |
| **2** | **Amber Spiral** | `EASY` | 36 | 2.6 | 4 (+Emerald) | 4,000 pts | `+1.0 NIM` |
| **3** | **Cobalt S-Bend** | `MEDIUM` | 42 | 3.0 | 4 | 6,000 pts | `+1.5 NIM` |
| **4** | **Prism Switchback** | `MEDIUM` | 48 | 3.4 | 5 (+Amethyst) | 8,500 pts | `+2.0 NIM` |
| **5** | **Quantum Vortex** | `HARD` | 55 | 3.7 | 5 | 11,000 pts | `+3.0 NIM` |
| **6** | **Solar Flare** | `HARD` | 62 | 4.1 | 5 | 14,000 pts | `+4.0 NIM` |
| **7** | **Dynamio Core** | `EXPERT` | 70 | 4.5 | 5 | 18,000 pts | `+5.0 NIM` |

---

## Nimiq 2.0 Albatross & Blockchain Architecture

Dynamio is built specifically to showcase the speed and micro-transaction capabilities of **Nimiq 2.0 (Albatross PoS)**.

### Mainnet Treasury & Automated Payout Pipeline

```
  [ Level Completed ]
          │
          ▼
  [ POST /api/claim-reward ] ──► Fetch Live Block Height (rpc.nimiqwatch.com)
          │
          ▼
  [ Build Basic Tx ] ──────────► Network ID: 24 (MainAlbatross) | Fee: 0 NIM
          │
          ▼
  [ Sign with Treasury Key ] ──► Dedicated KeyPair for NQ81 BDH4 RKPV XMG3 T082 J84R QRPT VJEJ FUET
          │
          ▼
  [ RPC Broadcast ] ───────────► JSON-RPC `sendRawTransaction` to Nimiq 2.0 Validators
          │
          ▼
  [ Return Tx Hash ] ──────────► Live verification link on https://nimiq.watch/#<hash>
```

- **Treasury Address**: `NQ81 BDH4 RKPV XMG3 T082 J84R QRPT VJEJ FUET`
- **Network ID**: `24` (`MainAlbatross` for Mainnet 2.0, fallback `5` for `TestAlbatross`)
- **Block Height Sync**: Dynamically queries `getBlockNumber` from live Albatross RPC nodes to set accurate transaction `validityStartHeight`.
- **Zero-Fee Transactions**: Leverages native Nimiq 2.0 zero-fee basic transactions for instant sub-second micro-payouts.

### Native Nimiq Pay In-App Bridge & Nimiq Hub Connect

Dynamio implements a flexible dual-mode connection system with zero mock or simulated wallets:

1. **Nimiq Pay In-App (Mobile Mini App)**:
   - When opened inside the **Nimiq Pay** wallet app or an in-app WebView, the app automatically detects the native provider via `@nimiq/mini-app-sdk` and `window.nimiq`.
   - Players are immediately connected with zero login clicks.
   - Payments and balance checks run directly inside the app without external browser redirects.
2. **Nimiq Hub (Desktop & Browser)**:
   - Web browser players connect securely through the official `@nimiq/hub-api`.
   - No private keys are ever handled by the game client.
3. **Nimiq Pay Deep Links**:
   - For desktop players wanting to pay via mobile, Dynamio generates native `nimiq:` protocol URIs paired with dynamic QR codes for instant scanning in Nimiq Pay.

### Authentic Profiles & Nimiq Identicons

- **3-Word Monikers**: Automatically maps any Nimiq address into its canonical human-readable 3-word name (e.g., `"Golden Swift Falcon"`).
- **SVG Identicons**: Rendered in real-time using `@nimiq/identicons` for pixel-perfect visual identity across HUDs, wallet modals, and leaderboard ranks.
- **On-Chain Balance Sync**: Queries `https://api.nimiq.watch/account/<address>` to display verified on-chain balances.

---

## Live Zero-Dummy Global Leaderboard

Dynamio enforces a strict **Zero Dummy Data Policy**:

- **Real Devices Only**: The leaderboard displays exclusively genuine scores submitted by connected devices and real Nimiq accounts.
- **Dual Leaderboard Divisions**:
  - **Campaign Mode**: Ranks players across standard campaign stage completions.
  - **Daily Challenge**: Synchronized UTC daily trials with identical tracks for fair competitive scoring.
- **Comprehensive Telemetry**: Tracks Player Moniker, Address, Total Score, Highest Combo (`highestCombo`), Accuracy percentage, Run Duration (`durationMs`), and NIM earned.
- **Zero Bots**: If no runs have been recorded, clean empty states prompt players to claim the #1 spot.

---

## Serverless API & Treasury Endpoints

Dynamio includes production-ready serverless API handlers (compatible with Vercel and local Vite dev proxy):

| Endpoint | Method | Description |
|:---|:---:|:---|
| `/api/claim-reward` | `POST` | Builds, signs, and broadcasts an on-chain Nimiq 2.0 payout from the game treasury to the player's wallet. |
| `/api/leaderboard` | `GET` | Fetches authentic live leaderboard records (supports `?type=daily` or `?type=campaign`). |
| `/api/leaderboard` | `POST` | Submits verified game run telemetry with anti-tamper validations. |
| `/api/treasury` | `GET` | Queries live balance and status for the game treasury (`NQ81 BDH4...`). |

---

## Architecture & Technical Design

### Project Directory Structure

```
Dynamio/
├── api/                               # Serverless API Handlers (Vercel & Vite Dev Middleware)
│   ├── claim-reward.ts                # On-chain Nimiq 2.0 Albatross payout engine
│   ├── leaderboard.ts                 # Live zero-dummy leaderboard storage & retrieval
│   └── treasury.ts                    # Treasury balance & network telemetry
├── public/                            # Static assets, branding, and sound effects
├── src/
│   ├── components/                    # React UI Layer (shadcn/ui convention)
│   │   ├── HUD/                       # In-game HUD, combo streak counter, audio controls
│   │   ├── Leaderboard/               # LeaderboardModal with live tabs & authentic Identicons
│   │   ├── Menus/                     # MainMenu, LevelSelect, LevelCompleteModal, ChallengeModal
│   │   ├── Sections/                  # LevelPreviewSection, HowToPlaySection
│   │   ├── Wallet/                    # NimiqWalletModal (Nimiq Pay & Hub connect, QR codes)
│   │   └── ui/                        # Reusable shadcn primitives (Button, Card, Badge, Dialog)
│   ├── game/                          # Core 3D Game Engine & Simulation
│   │   ├── GameEngine.ts              # Orchestrates game loop, tick updates, HUD callbacks
│   │   ├── GameState.ts               # State machine (TITLE, READY, PLAYING, PAUSED, etc.)
│   │   ├── types.ts                   # Domain types (LevelConfig, BallColor, GameTelemetry)
│   │   ├── data/                      # levels.ts (Spline coordinates for Stages 1-7 + Daily)
│   │   ├── entities/                  # Ball.ts, BallQueue.ts, Shooter.ts
│   │   ├── path/                      # SplinePath.ts (Catmull-Rom arc-length sampling)
│   │   ├── rendering/                 # CameraManager.ts, SceneManager.ts
│   │   └── systems/                   # CollisionSystem, AudioEngine, ParticleSystem, ScoreSystem
│   └── lib/
│       ├── nimiq/                     # Nimiq Blockchain Services
│       │   ├── LeaderboardService.ts  # Client service for live leaderboard sync
│       │   ├── NimiqProfileService.ts # Moniker generation & Identicon SVG renderer
│       │   └── NimiqWalletService.ts  # Dual-mode Nimiq Pay SDK & Hub Api orchestrator
│       └── persistence/               # Local storage persistence for level unlocks & records
├── index.html                         # Entry HTML with meta tags & mobile viewport config
├── vite.config.ts                     # Vite build setup with embedded local dev API server
└── package.json                       # Dependencies & scripts
```

### Spline Trajectory & Arc-Length Parameterization
Tracks are defined as discrete 3D waypoints interpolated via `THREE.CatmullRomCurve3`. To maintain uniform ball speed regardless of curve curvature, the engine samples 400 equidistant points and uses a binary search table to translate travel distance into exact 3D Cartesian coordinates `(x, y, z)` and tangent vectors.

### Single Persistent Canvas Architecture
The WebGL canvas is mounted once in `App.tsx` and never unmounted across screen transitions. When switching between menus and active gameplay, the engine transitions render modes without destroying shaders, buffers, or GPU context.

---

## Design System & UI Conventions

Dynamio is designed under strict adherence to modern design standards:

- **Deep Black Background**: Pure `#020202` (`hsl(0, 0%, 0.78%)`) background with dark border tokens (`hsl(0, 0%, 14.9%)`).
- **Brand Accent Line**: Straight thin yellow rectangle accents (`bg-[#FFCA1A] h-1 rounded-full`) situated beneath all major headers.
- **Unified Golden Icons**: All application icons use `#FFCA1A` golden yellow coloring; flash/sparkle symbols are completely avoided.
- **shadcn/ui Alignment**: Card, Dialog, Badge, and Button layouts conform to standard shadcn/ui component patterns.

---

## Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **pnpm** / **yarn**

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/dynamio.git

# Navigate to the workspace
cd dynamio

# Install dependencies
npm install
```

### Running Locally

```bash
# Start Vite development server (includes embedded live API endpoints)
npm run dev
```

Open your browser and navigate to `http://localhost:3000`.

### Environment Configuration (Optional)

You can customize the Nimiq network and treasury key via environment variables:

```env
# Optional: Set to 'test' for Nimiq 2.0 Testnet (default is Mainnet Albatross, networkId: 24)
NIMIQ_NETWORK=main

# Optional: Override treasury private key (hex)
NIMIQ_TREASURY_KEY=your_private_key_hex_here
```

### Building for Production

```bash
# Typecheck and compile production bundle
npm run build

# Preview production build locally
npm run preview
```

### Running Unit Tests

```bash
# Run Vitest test suites
npm run test
```

---

## Controls & Shortcuts

| Action | Desktop Mouse / Keyboard | Mobile / Touch Device |
|:---|:---|:---|
| **Aim Cannon** | Move mouse cursor across arena | Drag finger across screen |
| **Launch Sphere** | Left-Click mouse | Tap screen or release drag |
| **Swap Next Sphere** | `Spacebar` or Right-Click | Tap cannon sphere preview |
| **Pause Game** | `Escape` or Pause button | Tap Pause icon in HUD |
| **Toggle Fullscreen** | Fullscreen HUD button | Fullscreen HUD button |

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

Developed for the **Nimiq Ecosystem**. Built with React, TypeScript, Three.js, and the Nimiq 2.0 Albatross blockchain.
