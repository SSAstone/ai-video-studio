# AI Video Studio – AI-Powered Video Editor SaaS

A browser-based AI Video Editor SaaS inspired by CapCut, combining traditional multi-track timeline video editing with AI-driven smart automation, developed local-first with a modular monolith architecture.

![AI Video Studio](https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80)

---

## 1. Architecture Overview

AI Video Studio is built as a **Modular Monolith** organized in a pnpm workspace and orchestrated with Turborepo:

```
ai-video-studio/
├── apps/
│   ├── web/               # Next.js 15 (App Router), React 19, Tailwind CSS, Zustand, Socket.IO Client
│   ├── api/               # NestJS Modular Monolith API, Drizzle ORM, PostgreSQL, BullMQ, Redis, WebSockets
│   ├── render-worker/     # Standalone BullMQ Worker generating MP4 renders via FFmpeg & Remotion
│   └── media-worker/      # Standalone Worker for FFprobe metadata extraction & thumbnail generation
├── packages/
│   ├── shared-types/      # Common DTOs, Enums, Socket events, and StorageProvider interface
│   ├── video-schema/      # Strict Zod schemas for Timeline, Track, Clip, Transforms, and AI Edit Plans
│   ├── timeline-engine/   # Command pattern timeline reducer with full Undo/Redo history manager
│   ├── typescript-config/ # Base and framework tsconfigs
│   └── eslint-config/     # Monorepo linting configurations
├── docker-compose.yml     # Local PostgreSQL 16 & Redis 7 services
├── .env.example           # Fully configurable local development environment variables
└── storage/               # Local filesystem storage provider (uploads, thumbnails, renders, temp)
```

---

## 2. Key Features

### 🎬 Professional Dark-Themed Video Editor
- **Top Toolbar**: Project title, undo/redo counters and buttons, live save status indicators (`Saved`, `Saving`, `Unsaved`, `Error`), zoom slider, resolution & fps tags, and one-click MP4 export.
- **Left Sidebar**:
  - **Media**: Drag-and-drop file uploader (MP4, MOV, WEBM, JPG, PNG, MP3, WAV, AAC), search, filtering, and instant insertion to playhead.
  - **Text**: Heading, Punchy Hook ("STOP SCROLLING 🚨"), Neon Glow, Lower Third, and Closed Caption presets.
  - **Audio**: Sound effects, background music tracks, and ambient soundscapes.
  - **Transitions**: Crossfade, Fade to black, Wipe left/right, Zoom in, Dissolve.
  - **Effects**: Real-time visual CSS and FFmpeg filters (Brightness, High Contrast, Saturation, Sepia, Blur, Grayscale).
  - **AI Tools**: Natural language editing assistant with one-click quick action chips.
- **Center Canvas Preview**: Responsive 16:9, 9:16, 1:1 viewport, frame-synchronized playback loop, play/pause (Spacebar), timecode display (`HH:MM:SS:FF`), and fullscreen mode.
- **Right Inspector Panel**: Real-time property inspector for selected clips (X/Y position, Scale 10%–300%, Rotation -180°–+180°, Opacity 0%–100%, Volume 0%–200%, Speed 0.25x–4.0x, Text content, Font size, Color, Alignment).
- **Bottom Multi-Track Timeline**:
  - Multiple video, audio, and text tracks.
  - Frame-accurate ruler with tick marks and timecode.
  - Draggable red playhead scrubber with live time scrubbing.
  - Drag-to-reposition clip blocks.
  - Left and right trim handles on clips (frame-quantized in-point and out-point adjustments).
  - Track header toggles: Mute, Lock, Hide/Show, Add track.

### 🧠 Deterministic AI Editing System
1. Accepts natural language prompts (e.g. *"Add title 'Summer Vacation' at the beginning"*, *"Remove silent sections"*, *"Auto-generate subtitles"*, *"Speed up clips by 1.5x"*).
2. Generates a structured **AI Edit Plan** containing strictly validated `TimelineCommand` objects.
3. Validates the plan with **Zod** (`AiEditPlanSchema`).
4. Presents a visual diff and summary to the user.
5. User reviews and clicks **Approve & Apply** (or Reject).
6. Applies changes sequentially through the command engine with full **Undo / Redo** support.
7. **Security Guarantee**: AI is strictly prevented from executing arbitrary shell or raw FFmpeg commands.

### ⚡ Pure Command-Based Timeline Engine
- Pure, immutable timeline state transitions.
- Concrete command implementations:
  - `AddClipCommand`
  - `RemoveClipCommand`
  - `MoveClipCommand`
  - `TrimClipCommand`
  - `SplitClipCommand`
  - `UpdateClipCommand`
  - `AddTrackCommand`
  - `RemoveTrackCommand`
- `HistoryManager` with configurable depth for undo/redo stacks.
- Precision frame/second quantizers to eliminate floating-point drift.

### 💾 Local-First StorageProvider Abstraction
- Zero cloud account requirements during initial phase.
- `StorageProvider` interface with `LocalStorageProvider` implementation saving to `./storage`:
  - `storage/uploads/`
  - `storage/thumbnails/`
  - `storage/renders/`
  - `storage/temp/`
- Serves static media directly through NestJS `/storage/*` endpoint.
- Ready for zero-friction future cloud migration to Amazon S3, Cloudflare R2, or Google Cloud Storage.

---

## 3. Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) v20+ or v24+
- [pnpm](https://pnpm.io/) v9+ or v10+
- [Docker](https://www.docker.com/) (Optional: for local PostgreSQL & Redis containers)
- [FFmpeg](https://ffmpeg.org/) (Installed locally on system path or custom path via `.env`)

### Step 1: Start Local Database & Redis (Optional Docker Compose)
```bash
docker-compose up -d
```
> Note: If Docker is not running, the application includes automatic in-memory fallbacks so you can test and explore immediately!

### Step 2: Install Monorepo Dependencies
```bash
pnpm install
```

### Step 3: Run Database Migrations & Seed Initial Data
```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```
Default Administrator credentials:
- **Email:** `admin@aivideostudio.local`
- **Password:** `admin123456`

### Step 4: Run the Complete Studio in Development
```bash
pnpm dev
```
- **Web Editor:** [http://localhost:3000](http://localhost:3000)
- **API Server:** [http://localhost:4000/api](http://localhost:4000/api)

Or run individual apps:
```bash
# Start API only
pnpm --filter @ai-video-studio/api dev

# Start Web Editor only
pnpm --filter @ai-video-studio/web dev

# Start Rendering Worker only
pnpm --filter @ai-video-studio/render-worker dev

# Start Media Worker only
pnpm --filter @ai-video-studio/media-worker dev
```

---

## 4. Keyboard Shortcuts Reference

| Shortcut | Action |
| :--- | :--- |
| `Space` | Play / Pause Preview Player |
| `S` | Split Selected Clip at Current Playhead |
| `Backspace` / `Delete` | Delete Selected Clip |
| `Cmd + Z` / `Ctrl + Z` | Undo Last Command |
| `Cmd + Shift + Z` / `Ctrl + Y` | Redo Last Command |
| `Home` | Return Playhead to Beginning (00:00:00:00) |

---

## 5. API Reference Summary

### Authentication (`/api/auth`)
- `POST /auth/register` – Create user, default workspace, and grant 100 free credits
- `POST /auth/login` – Authenticate with email & password, return JWT tokens
- `POST /auth/refresh` – Issue refreshed access token
- `GET /auth/me` – Get authenticated user profile

### Projects (`/api/projects`)
- `GET /projects?workspaceId=...` – List active projects
- `POST /projects` – Create project with aspect ratio preset (16:9, 9:16, 1:1, etc.)
- `GET /projects/:id` – Retrieve project timeline
- `PUT /projects/:id/timeline` – Save timeline and create version snapshot
- `POST /projects/:id/duplicate` – Duplicate project
- `DELETE /projects/:id` – Archive project

### Media (`/api/media`)
- `POST /media/upload?workspaceId=...` – Multipart stream upload (up to 500MB)
- `GET /media?workspaceId=...` – Get workspace media library
- `DELETE /media/:id` – Delete media asset

### AI Assistant (`/api/ai`)
- `POST /ai/projects/:projectId/plan` – Generate validated AI edit plan from prompt
- `POST /ai/projects/:projectId/apply` – Sequentially execute plan commands

### Video Rendering (`/api/render`)
- `POST /render/projects/:projectId` – Queue background render job
- `GET /render/jobs/:jobId` – Get frame progress & output URL
- `POST /render/jobs/:jobId/cancel` – Cancel active job

---

## 6. Running Tests & Typechecks

Run timeline engine unit tests:
```bash
pnpm --filter @ai-video-studio/timeline-engine test
```

Run full monorepo typecheck:
```bash
pnpm typecheck
```

Build all packages and applications:
```bash
pnpm build
```

