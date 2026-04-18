# English Pro

AI-powered English speaking practice for Vietnamese kids.

## Project Structure

```
english-pro/
├── apps/
│   ├── mobile/          # Flutter App (Very Good CLI)
│   ├── api/             # NestJS API Backend
│   └── ai-worker/       # AI Worker Service (NestJS)
├── packages/
│   └── shared-types/    # Shared TypeScript types
├── infra/               # Infrastructure configs
│   ├── docker/
│   ├── gcp/
│   └── supabase/
├── docs/                # Documentation
└── .github/workflows/   # CI/CD pipelines
```

## Getting Started

### Prerequisites

- **Flutter SDK** (latest stable)
- **Dart SDK** (3.x)
- **Node.js** (20 LTS)
- **pnpm** (latest)
- **Docker** (>= 24.0) + **Docker Compose** (>= 2.20)
- **Supabase CLI** (`npm install -g supabase` hoặc dùng `npx supabase`)
- **Very Good CLI** (`dart pub global activate very_good_cli`)
- **NestJS CLI** (`npm i -g @nestjs/cli`)

### Setup

1. Clone the repository
2. Install NestJS dependencies:
   ```bash
   pnpm install
   ```
3. Install Flutter dependencies:
   ```bash
   cd apps/mobile && flutter pub get
   ```

## Local Development

### Khởi động Infrastructure

```bash
# Khởi động tất cả services (Redis + Supabase)
pnpm dev:infra

# Hoặc khởi động riêng:
pnpm docker:up        # Redis only
pnpm supabase:start   # Supabase (PostgreSQL, Auth, Studio, ...)
```

### Environment Configuration

```bash
# Copy environment files
cp apps/api/.env.example apps/api/.env
cp apps/ai-worker/.env.example apps/ai-worker/.env
cp infra/docker/.env.example infra/docker/.env
```

### Chạy ứng dụng

```bash
# API Backend (terminal 1)
pnpm api:dev

# AI Worker (terminal 2)
pnpm worker:dev

# Flutter App (terminal 3)
cd apps/mobile && flutter run --flavor development --target lib/main_development.dart
```

### Dừng Infrastructure

```bash
pnpm dev:infra:stop
```

### Service Ports

| Service | Port | URL |
|---------|------|-----|
| Supabase API | 54321 | http://localhost:54321 |
| PostgreSQL | 54322 | `postgresql://postgres:postgres@localhost:54322/postgres` |
| Supabase Studio | 54323 | http://localhost:54323 |
| Redis | 6379 | `redis://localhost:6379` |
| NestJS API | 3000 | http://localhost:3000 |

> Chi tiết đầy đủ: [infra/docker/README.md](infra/docker/README.md)

## Monorepo Management

- **Flutter**: Managed via [Melos](https://melos.invertase.dev/)
- **NestJS**: Managed via [pnpm workspaces](https://pnpm.io/workspaces)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile App | Flutter + Bloc |
| API Backend | NestJS + Prisma + Supabase |
| AI Worker | NestJS + BullMQ |
| Shared Types | TypeScript |
| Database | PostgreSQL (Supabase) |
| Cache/Queue | Redis + BullMQ |

## License

Proprietary - All rights reserved.
