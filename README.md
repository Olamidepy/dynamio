# Dynamio (3D Arcade Chain Reaction)

<div align="center">

![Dynamio Banner](/public/DynamioArtboard%201%20copy.png)

**A Next-Gen 3D Zuma-Style Chain Reaction Arcade Game Powered by WebGL and the Nimiq Ecosystem.**

[![React](https://img.shields.io/badge/React-18.3.1-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r170-black?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38bdf8?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6.0.1-646cff?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Nimiq](https://img.shields.io/badge/Nimiq-Mini_App-e5a910?style=for-the-badge&logo=bitcoin&logoColor=black)](https://nimiq.com/)

[Play Demo](http://localhost:3000) • [Arcade Campaign](#arcade-campaign-stages) • [Architecture](#architecture--technical-design) • [Controls](#controls--shortcuts)

</div>

---

## Table of Contents
- [Overview](#overview)
- [Core Gameplay Mechanics](#core-gameplay-mechanics)
- [Key Features](#key-features)
- [Arcade Campaign Stages](#arcade-campaign-stages)
- [Architecture & Technical Design](#architecture--technical-design)
- [Design System & UI Conventions](#design-system--ui-conventions)
- [Nimiq Blockchain Integration](#nimiq-blockchain-integration)
- [Project Directory Structure](#project-directory-structure)
- [Getting Started](#getting-started)
- [Controls & Shortcuts](#controls--shortcuts)
- [License](#license)

---

## Overview

**Dynamio** is a high-performance 3D chain reaction arcade game engineered for modern web browsers and the Nimiq Mini App ecosystem. Inspired by classic sphere-matching arcades such as *Zuma* and *Luxor*, Dynamio brings the formula into real-time 3D diorama environments with dynamic perspective cameras, spline trajectory physics, reverse magnetic snap-back cascades, and non-custodial cryptographic micro-rewards in **NIM**.

Players control a 360-degree central shooter station, launching vibrant energy spheres to match three or more contiguous colors before the ever-advancing chain breaches the golden core vortex.

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
   - The queue advances progressively towards the vortex station at the center of the arena.

2. **Aim & Launch**:
   - The central cannon rotates dynamically to track player pointer / touch positions in 3D world space.
   - High-velocity projectile physics calculate precise spherical raycasts against queued balls.

3. **Match 3+ Color Clears**:
   - Direct hits insert the fired ball into the train at the collision index.
   - Contiguous sequences of 3 or more matching colors trigger energy explosions, earning score points and combo multipliers.

4. **Reverse Magnetic Snap-Back (Gaps Cascade)**:
   - When a match is cleared, a gap opens in the chain.
   - Rather than rolling forward, the separated front train segments roll **backward** along the track to meet the rear segment.
   - If the newly connected ends match in color, they trigger an automatic magnetic combo cascade!

5. **Core Vortex Defense**:
   - If the leading sphere breaches the threshold of the central golden vortex, the vortex collapses and triggers a game over.
   - Eliminating all spheres in the active level queue awards victory, star rankings, and NIM cryptocurrency rewards.

---

## Key Features

- **Real-Time 3D Diorama Engine**: Built directly on Three.js (r170) with customized PBR materials, dynamic point lights, high-performance spline interpolation, and an adaptive camera viewport.
- **Continuous Translational Level Previews**: A 1:1 square diorama carousel featuring real-time moving 2D canvas simulations of all 7 campaign stages in continuous translational motion loop.
- **Dynamic Lock Progression**: Visual progression engine tracking player progress. Uncompleted stages show frosted glass locks while completed stages display high scores, star achievements, and direct play options.
- **Deterministic Daily Challenge**: Generates a unique daily trial seeded from the current UTC date string (`YYYY-MM-DD`), allowing worldwide players to compete on identical daily layouts.
- **Non-Custodial Nimiq Wallet**: Built-in wallet integration with address generator, balance tracker, and cryptographic mock transaction signing for arcade rewards.
- **Strict `#020202` & shadcn/ui Design**: Engineered to match official shadcn/ui component standards, deep `#020202` black background, and unified `#FFCA1A` golden yellow accents.
- **Ultra-Fast Performance**: Zero external heavy game engines; runs at a locked 60 FPS on desktop and mobile devices with minimal battery footprint.

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

## Architecture & Technical Design

```
src/
├── game/                      # Core Game Logic & 3D Simulation
│   ├── GameEngine.ts          # Orchestrates subsystems, tick loop, HUD callbacks
│   ├── GameState.ts           # State machine (TITLE, LOADING, READY, PLAYING, PAUSED, etc.)
│   ├── types.ts               # Core domain types (LevelConfig, BallColor, GameTelemetry)
│   ├── data/
│   │   └── levels.ts          # Spline coordinates and parameters for Stages 1-7 + Daily
│   ├── entities/
│   │   ├── Ball.ts            # Mesh representation, color assignment, collision radius
│   │   ├── BallQueue.ts       # Physical queue of balls rolling along spline distances
│   │   └── Shooter.ts         # Central cannon, aim vectors, projectile firing
│   ├── path/
│   │   └── SplinePath.ts      # Catmull-Rom curve sampling, arc-length lookup & binary search
│   ├── rendering/
│   │   ├── CameraManager.ts   # Perspective camera positioning & viewport framing
│   │   └── SceneManager.ts    # Three.js scene, transparent background, lighting rigs
│   └── systems/
│       ├── AudioEngine.ts     # Synthesized Web Audio API sound effects (match, combo, shoot)
│       ├── CollisionSystem.ts # Spherical raycast & projectile insertion math
│       ├── ParticleSystem.ts  # Particle emitters for ball explosions and combo sparks
│       └── ScoreSystem.ts     # Score multiplier, combo tracking, NIM reward tallying
├── components/                # React UI Layer (shadcn/ui convention)
│   ├── HUD/                   # In-game HUD, combo indicator, countdown timer
│   ├── Menus/                 # MainMenu, LoadingScreen, PauseModal, LevelSelectModal
│   ├── Sections/              # LevelPreviewSection, HowToPlaySection
│   ├── Wallet/                # Nimiq non-custodial wallet modal
│   └── ui/                    # Primitive shadcn components (Button, Card, Badge, Dialog)
└── lib/
    ├── nimiq/                 # NimiqWalletService (reactive account listener & state)
    └── persistence/           # StorageService (Local persistence for progress & scores)
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

## Nimiq Blockchain Integration

Dynamio integrates non-custodial Nimiq wallet mechanics:

1. **Reactive Wallet State**: Subscribes to account updates via `NimiqWalletService`.
2. **Arcade NIM Rewards**: Successful level completions reward micro-transactions in NIM directly deposited into the player's balance.
3. **Daily Cryptographic Trials**: Daily challenges deterministically derive seed hashes from `Date.now()`, creating a synchronized daily board for global players.

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
# Start Vite development server
npm run dev
```

Open your browser and navigate to `http://localhost:3000`.

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

Developed for the **Nimiq Ecosystem**. Built with React, TypeScript, and Three.js.
