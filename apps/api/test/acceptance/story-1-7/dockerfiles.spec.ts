/**
 * ATDD Tests - Story 1.7: CI/CD Pipeline - Dockerfiles & GCP Cloud Run Configs
 * Test IDs: 1.7-CFG-008 through 1.7-CFG-014
 * Priority: P1 (Critical — Build reliability)
 * Status: 🔴 RED (failing before implementation)
 *
 * These tests validate that Dockerfiles and GCP Cloud Run config files
 * exist and follow the correct multi-stage build pattern.
 *
 * AC#4: deploy-api.yml builds Docker image and deploys to Cloud Run
 * AC#5: deploy-ai-worker.yml builds Docker image and deploys to Cloud Run
 * AC#6: Cloud Run service configs use GCP Secret Manager
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// __dirname = apps/api/test/acceptance/story-1-7/
// Monorepo root = up 5 levels
const MONOREPO_ROOT = join(__dirname, '../../../../..');
const API_DIR = join(MONOREPO_ROOT, 'apps/api');
const AI_WORKER_DIR = join(MONOREPO_ROOT, 'apps/ai-worker');
const GCP_INFRA_DIR = join(MONOREPO_ROOT, 'infra/gcp');

describe('Story 1.7: Dockerfiles & GCP Cloud Run Configs @P1 @Config', () => {
  // =========================================================================
  // 1.7-CFG-008: Dockerfile existence
  // =========================================================================
  describe('1.7-CFG-008: Dockerfile Files Existence', () => {
    it('should have Dockerfile in apps/api/', () => {
      // RED: Dockerfile does not exist yet
      const filePath = join(API_DIR, 'Dockerfile');
      expect(existsSync(filePath)).toBe(true);
    });

    it('should have .dockerignore in apps/api/', () => {
      // RED: .dockerignore does not exist yet
      const filePath = join(API_DIR, '.dockerignore');
      expect(existsSync(filePath)).toBe(true);
    });

    it('should have Dockerfile in apps/ai-worker/', () => {
      // RED: Dockerfile does not exist yet
      const filePath = join(AI_WORKER_DIR, 'Dockerfile');
      expect(existsSync(filePath)).toBe(true);
    });

    it('should have .dockerignore in apps/ai-worker/', () => {
      // RED: .dockerignore does not exist yet
      const filePath = join(AI_WORKER_DIR, '.dockerignore');
      expect(existsSync(filePath)).toBe(true);
    });
  });

  // =========================================================================
  // 1.7-CFG-009: apps/api/Dockerfile — multi-stage build pattern
  // =========================================================================
  describe('1.7-CFG-009: apps/api/Dockerfile Multi-stage Build', () => {
    let content: string;

    beforeEach(() => {
      const filePath = join(API_DIR, 'Dockerfile');
      // RED: will throw because Dockerfile doesn't exist
      content = readFileSync(filePath, 'utf-8');
    });

    it('should use node:20-alpine base image', () => {
      // RED: Dockerfile does not exist yet
      // Matches: 'node:20-alpine' or 'node:20-alpine3.x'
      expect(content).toMatch(/FROM\s+node:20-alpine/);
    });

    it('should use multi-stage build with builder stage', () => {
      // RED: Dockerfile does not exist yet
      // Multi-stage: prevents dev dependencies from entering production image
      expect(content).toMatch(/AS\s+builder/i);
    });

    it('should use multi-stage build with production stage', () => {
      // RED: Dockerfile does not exist yet
      expect(content).toMatch(/AS\s+production/i);
    });

    it('should expose port 3000', () => {
      // RED: Dockerfile does not exist yet
      expect(content).toMatch(/EXPOSE\s+3000/);
    });

    it('should start with node (not ts-node or nest start)', () => {
      // RED: Dockerfile does not exist yet
      // Production should run compiled JS, not TypeScript
      expect(content).toMatch(/CMD\s+\["node"/);
      expect(content).not.toMatch(/ts-node/);
      expect(content).not.toMatch(/nest start/);
    });

    it('should use pnpm (corepack enable) in build stage', () => {
      // RED: Dockerfile does not exist yet
      // Project uses pnpm exclusively (anti-pattern: using npm in CI)
      expect(content).toMatch(/corepack\s+enable\s+pnpm|pnpm/);
    });

    it('should install only production dependencies in final stage', () => {
      // RED: Dockerfile does not exist yet
      // Production stage must NOT include devDependencies
      // Accepts: --prod flag or NODE_ENV=production
      const hasProdInstall =
        content.includes('--prod') ||
        content.includes('--production') ||
        content.includes('NODE_ENV=production');
      expect(hasProdInstall).toBe(true);
    });

    it('should NOT include node_modules from host in COPY instructions', () => {
      // RED: Dockerfile does not exist yet
      // This is validated via .dockerignore, but Dockerfile should not COPY node_modules
      expect(content).not.toMatch(/COPY\s+node_modules/);
    });
  });

  // =========================================================================
  // 1.7-CFG-010: apps/api/.dockerignore — security & build efficiency
  // =========================================================================
  describe('1.7-CFG-010: apps/api/.dockerignore Security & Efficiency', () => {
    let content: string;

    beforeEach(() => {
      const filePath = join(API_DIR, '.dockerignore');
      // RED: will throw because .dockerignore doesn't exist
      content = readFileSync(filePath, 'utf-8');
    });

    it('should exclude node_modules from Docker context', () => {
      // RED: .dockerignore does not exist yet
      expect(content).toMatch(/node_modules/);
    });

    it('should exclude .env files from Docker context', () => {
      // RED: .dockerignore does not exist yet
      // Critical: prevents secrets from leaking into Docker image
      expect(content).toMatch(/\.env/);
    });

    it('should exclude test files from Docker context', () => {
      // RED: .dockerignore does not exist yet
      // Test files increase image size unnecessarily
      const hasTestExclusion =
        content.includes('test/') ||
        content.includes('*.spec.ts') ||
        content.includes('*.test.ts');
      expect(hasTestExclusion).toBe(true);
    });
  });

  // =========================================================================
  // 1.7-CFG-011: apps/ai-worker/Dockerfile — multi-stage build pattern
  // =========================================================================
  describe('1.7-CFG-011: apps/ai-worker/Dockerfile Multi-stage Build', () => {
    let content: string;

    beforeEach(() => {
      const filePath = join(AI_WORKER_DIR, 'Dockerfile');
      // RED: will throw because Dockerfile doesn't exist
      content = readFileSync(filePath, 'utf-8');
    });

    it('should use node:20-alpine base image', () => {
      // RED: Dockerfile does not exist yet
      expect(content).toMatch(/FROM\s+node:20-alpine/);
    });

    it('should use multi-stage build (builder + production)', () => {
      // RED: Dockerfile does not exist yet
      expect(content).toMatch(/AS\s+builder/i);
      expect(content).toMatch(/AS\s+production/i);
    });

    it('should expose port 3001', () => {
      // RED: Dockerfile does not exist yet
      // AI Worker runs on port 3001 (separate from API on 3000)
      expect(content).toMatch(/EXPOSE\s+3001/);
    });

    it('should start with node (not ts-node)', () => {
      // RED: Dockerfile does not exist yet
      expect(content).toMatch(/CMD\s+\["node"/);
      expect(content).not.toMatch(/ts-node/);
    });
  });

  // =========================================================================
  // 1.7-CFG-012: GCP Cloud Run config files — AC#6
  // =========================================================================
  describe('1.7-CFG-012: GCP Cloud Run Config Files (AC#6)', () => {
    it('should have cloud-run-api.yaml in infra/gcp/', () => {
      // RED: infra/gcp/ only has .gitkeep, no configs yet
      const filePath = join(GCP_INFRA_DIR, 'cloud-run-api.yaml');
      expect(existsSync(filePath)).toBe(true);
    });

    it('should have cloud-run-ai-worker.yaml in infra/gcp/', () => {
      // RED: infra/gcp/ only has .gitkeep
      const filePath = join(GCP_INFRA_DIR, 'cloud-run-ai-worker.yaml');
      expect(existsSync(filePath)).toBe(true);
    });

    it('should have secrets.yaml template in infra/gcp/', () => {
      // RED: infra/gcp/ only has .gitkeep
      const filePath = join(GCP_INFRA_DIR, 'secrets.yaml');
      expect(existsSync(filePath)).toBe(true);
    });
  });

  // =========================================================================
  // 1.7-CFG-013: cloud-run-api.yaml content — AC#4 + AC#6
  // =========================================================================
  describe('1.7-CFG-013: cloud-run-api.yaml Content Validation', () => {
    let content: string;

    beforeEach(() => {
      const filePath = join(GCP_INFRA_DIR, 'cloud-run-api.yaml');
      // RED: will throw because file doesn't exist
      content = readFileSync(filePath, 'utf-8');
    });

    it('should reference asia-southeast1 region', () => {
      // RED: cloud-run-api.yaml does not exist yet
      expect(content).toMatch(/asia-southeast1/);
    });

    it('should configure minScale 1 for API (always-warm)', () => {
      // RED: cloud-run-api.yaml does not exist yet
      // API must be always-warm (min 1) per architecture spec
      expect(content).toMatch(/minScale[:\s]+1\b|min-instances[:\s]+1\b/);
    });

    it('should configure maxScale 10 for API', () => {
      // RED: cloud-run-api.yaml does not exist yet
      expect(content).toMatch(/maxScale[:\s]+10\b|max-instances[:\s]+10\b/);
    });

    it('should reference secrets via secretKeyRef or Secret Manager (not plain env values)', () => {
      // RED: cloud-run-api.yaml does not exist yet
      // AC#6: production secrets via GCP Secret Manager
      const hasSecretRef =
        content.includes('secretKeyRef') ||
        content.includes('secret:') ||
        content.includes('valueFrom') ||
        content.includes('secretmanager');
      expect(hasSecretRef).toBe(true);
    });

    it('should NOT contain literal DATABASE_URL value (must use secret ref)', () => {
      // RED: cloud-run-api.yaml does not exist yet
      // Secrets must be referenced, not hardcoded
      expect(content).not.toMatch(/DATABASE_URL\s*:\s*postgresql:\/\//);
    });
  });

  // =========================================================================
  // 1.7-CFG-014: cloud-run-ai-worker.yaml content — AC#5 + AC#6
  // =========================================================================
  describe('1.7-CFG-014: cloud-run-ai-worker.yaml Content Validation', () => {
    let content: string;

    beforeEach(() => {
      const filePath = join(GCP_INFRA_DIR, 'cloud-run-ai-worker.yaml');
      // RED: will throw because file doesn't exist
      content = readFileSync(filePath, 'utf-8');
    });

    it('should configure minScale 0 for AI Worker (scale-to-zero)', () => {
      // RED: cloud-run-ai-worker.yaml does not exist yet
      // AI Worker can scale to zero (no always-warm requirement)
      expect(content).toMatch(/minScale[:\s]+0\b|min-instances[:\s]+0\b/);
    });

    it('should configure maxScale 20 for AI Worker', () => {
      // RED: cloud-run-ai-worker.yaml does not exist yet
      expect(content).toMatch(/maxScale[:\s]+20\b|max-instances[:\s]+20\b/);
    });

    it('should configure containerConcurrency 10', () => {
      // RED: cloud-run-ai-worker.yaml does not exist yet
      // AI Worker has lower concurrency due to CPU-intensive AI tasks
      expect(content).toMatch(
        /containerConcurrency[:\s]+10\b|concurrency[:\s]+10\b/,
      );
    });
  });
});
