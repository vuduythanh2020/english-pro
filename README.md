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
- **Very Good CLI** (`dart pub global activate very_good_cli`)
- **NestJS CLI** (`npm i -g @nestjs/cli`)

### Setup

1. Clone the repository
2. Install Flutter dependencies:
   ```bash
   cd apps/mobile && flutter pub get
   ```
3. Install NestJS dependencies:
   ```bash
   pnpm install
   ```

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
