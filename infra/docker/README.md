# Local Development Infrastructure

Hướng dẫn setup môi trường phát triển local cho English Pro.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) >= 24.0
- [Docker Compose](https://docs.docker.com/compose/install/) >= 2.20 (bundled với Docker Desktop)
- [Node.js](https://nodejs.org/) >= 20.x
- [pnpm](https://pnpm.io/) >= 9.x
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`npm install -g supabase` hoặc dùng `npx supabase`)

## Architecture

Story này sử dụng **hybrid approach**:
- **Supabase CLI** quản lý PostgreSQL, GoTrue Auth, PostgREST, Studio, Kong, và các services Supabase khác
- **Docker Compose** chỉ quản lý **Redis** (và các non-Supabase services trong tương lai)

Lý do: Supabase CLI tự động quản lý ~15 containers, đảm bảo tương thích version, và tránh phải tự config JWT secrets, Kong routes, GoTrue config.

## Quick Start

```bash
# 1. Từ thư mục english-pro/
cd english-pro

# 2. Khởi động tất cả infrastructure services
pnpm dev:infra

# Hoặc khởi động riêng từng phần:
pnpm docker:up        # Chỉ Redis
pnpm supabase:start   # Chỉ Supabase (PostgreSQL, Auth, Studio, ...)
```

## Services & Ports

| Service | Port | URL | Quản lý bởi |
|---------|------|-----|-------------|
| Supabase API (Kong) | 54321 | http://localhost:54321 | Supabase CLI |
| PostgreSQL | 54322 | `postgresql://postgres:postgres@localhost:54322/postgres` | Supabase CLI |
| Supabase Studio | 54323 | http://localhost:54323 | Supabase CLI |
| Redis | 6379 | `redis://localhost:6379` | Docker Compose |
| NestJS API | 3000 | http://localhost:3000 | Native (pnpm) |
| AI Worker | 3001 | — | Native (pnpm) |

## Available Commands

| Command | Mô tả |
|---------|-------|
| `pnpm dev:infra` | Khởi động tất cả (Redis + Supabase) |
| `pnpm dev:infra:stop` | Dừng tất cả |
| `pnpm docker:up` | Khởi động Redis container |
| `pnpm docker:down` | Dừng Redis container |
| `pnpm docker:logs` | Xem logs Redis |
| `pnpm docker:reset` | Reset Redis (xóa data + restart) |
| `pnpm supabase:start` | Khởi động Supabase services |
| `pnpm supabase:stop` | Dừng Supabase services |
| `pnpm supabase:status` | Kiểm tra trạng thái Supabase |

## Environment Setup

### 1. Docker Compose (.env)

```bash
# Copy .env.example cho Docker Compose
cp infra/docker/.env.example infra/docker/.env
```

### 2. NestJS API (.env)

```bash
# Copy .env.example cho API
cp apps/api/.env.example apps/api/.env
```

### 3. AI Worker (.env)

```bash
# Copy .env.example cho AI Worker
cp apps/ai-worker/.env.example apps/ai-worker/.env
```

## Verification

Sau khi khởi động services, kiểm tra:

```bash
# 1. Kiểm tra Redis
docker compose -f infra/docker/docker-compose.dev.yml exec redis redis-cli ping
# Expected: PONG

# 2. Kiểm tra Supabase
pnpm supabase:status
# Shows all Supabase service statuses and URLs

# 3. Kiểm tra PostgreSQL
docker exec -it supabase_db_english-pro pg_isready -U postgres
# Expected: accepting connections

# 4. Truy cập Supabase Studio
# Mở browser: http://localhost:54323
```

## Troubleshooting

### Port conflicts

Nếu port đã được sử dụng:

```bash
# Kiểm tra process đang dùng port
lsof -i :6379    # Redis
lsof -i :54321   # Supabase API
lsof -i :54322   # PostgreSQL
lsof -i :54323   # Supabase Studio

# Kill process nếu cần
kill -9 <PID>
```

### Redis không start được

```bash
# Kiểm tra logs
pnpm docker:logs

# Reset hoàn toàn (xóa data)
pnpm docker:reset
```

### Supabase không start được

```bash
# Kiểm tra trạng thái
pnpm supabase:status

# Restart
pnpm supabase:stop
pnpm supabase:start

# Nếu vẫn lỗi, reset hoàn toàn
npx supabase stop --no-backup
npx supabase start
```

### Docker Compose down không sạch

```bash
# Force remove containers và volumes
docker compose -f infra/docker/docker-compose.dev.yml down -v --remove-orphans
```

### NestJS không kết nối được database

1. Đảm bảo Supabase đang chạy: `pnpm supabase:status`
2. Kiểm tra `DATABASE_URL` trong `apps/api/.env` match port 54322
3. Kiểm tra `REDIS_URL` trong `apps/api/.env` match port 6379

## Data Persistence

- **PostgreSQL data**: Managed by Supabase CLI, persists giữa `supabase stop` / `supabase start`
- **Redis data**: Persist qua Docker volume `redis_data`. Mất khi chạy `pnpm docker:reset` hoặc `docker compose down -v`
- **Clean slate**: `pnpm docker:reset && npx supabase stop --no-backup && npx supabase start`
