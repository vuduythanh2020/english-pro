/**
 * ATDD Tests - Story 1.7: CI/CD Pipeline - GitHub Actions Workflows
 * Test IDs: 1.7-CFG-001 through 1.7-CFG-020
 * Priority: P1 (Critical — CI reliability)
 * Status: 🟢 GREEN (implementation complete)
 *
 * These tests validate that GitHub Actions CI/CD workflow files exist
 * and contain the correct configuration according to Story 1.7 AC#1-5.
 *
 * AC#1: ci-mobile.yml runs melos analyze + melos test on apps/mobile/** changes
 * AC#2: ci-api.yml runs pnpm lint + pnpm test + e2e tests on apps/api/** changes
 * AC#3: ci-ai-worker.yml runs pnpm lint + pnpm test on apps/ai-worker/** changes
 * AC#4: deploy-api.yml deploys to Cloud Run (min 1, max 10, concurrency 80)
 * AC#5: deploy-ai-worker.yml deploys to Cloud Run (min 0, max 20, concurrency 10)
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// __dirname = apps/api/test/acceptance/story-1-7/
// Monorepo root = up 5 levels
const MONOREPO_ROOT = join(__dirname, '../../../../..');
const WORKFLOWS_DIR = join(MONOREPO_ROOT, '.github/workflows');

describe('Story 1.7: GitHub Actions CI/CD Workflows @P1 @Config', () => {
  // =========================================================================
  // 1.7-CFG-001 to 1.7-CFG-005: Workflow files existence
  // =========================================================================
  describe('1.7-CFG-001: CI/CD Workflow Files Existence', () => {
    it('should have ci-mobile.yml in .github/workflows/', () => {
      const filePath = join(WORKFLOWS_DIR, 'ci-mobile.yml');
      expect(existsSync(filePath)).toBe(true);
    });

    it('should have ci-api.yml in .github/workflows/', () => {
      const filePath = join(WORKFLOWS_DIR, 'ci-api.yml');
      expect(existsSync(filePath)).toBe(true);
    });

    it('should have ci-ai-worker.yml in .github/workflows/', () => {
      const filePath = join(WORKFLOWS_DIR, 'ci-ai-worker.yml');
      expect(existsSync(filePath)).toBe(true);
    });

    it('should have deploy-api.yml in .github/workflows/', () => {
      const filePath = join(WORKFLOWS_DIR, 'deploy-api.yml');
      expect(existsSync(filePath)).toBe(true);
    });

    it('should have deploy-ai-worker.yml in .github/workflows/', () => {
      const filePath = join(WORKFLOWS_DIR, 'deploy-ai-worker.yml');
      expect(existsSync(filePath)).toBe(true);
    });
  });

  // =========================================================================
  // 1.7-CFG-002: ci-mobile.yml — AC#1
  // =========================================================================
  describe('1.7-CFG-002: ci-mobile.yml Content Validation (AC#1)', () => {
    let content: string;

    beforeEach(() => {
      const filePath = join(WORKFLOWS_DIR, 'ci-mobile.yml');
      content = readFileSync(filePath, 'utf-8');
    });

    it('should trigger on push when apps/mobile/** changes', () => {
      expect(content).toMatch(/paths:/);
      expect(content).toMatch(/apps\/mobile\/\*\*/);
    });

    it('should run melos analyze step', () => {
      // Accepts: 'melos analyze' or 'melos run analyze'
      expect(content).toMatch(/melos\s+(run\s+)?analyze/);
    });

    it('should run melos test step', () => {
      // Accepts: 'melos test' or 'melos run test'
      expect(content).toMatch(/melos\s+(run\s+)?test/);
    });

    it('should use ubuntu-latest runner', () => {
      expect(content).toMatch(/ubuntu-latest/);
    });
  });

  // =========================================================================
  // 1.7-CFG-003: ci-api.yml — AC#2
  // =========================================================================
  describe('1.7-CFG-003: ci-api.yml Content Validation (AC#2)', () => {
    let content: string;

    beforeEach(() => {
      const filePath = join(WORKFLOWS_DIR, 'ci-api.yml');
      content = readFileSync(filePath, 'utf-8');
    });

    it('should trigger on push/PR when apps/api/** changes', () => {
      expect(content).toMatch(/paths:/);
      expect(content).toMatch(/apps\/api\/\*\*/);
    });

    it('should trigger on push/PR when packages/shared-types/** changes', () => {
      expect(content).toMatch(/packages\/shared-types\/\*\*/);
    });

    it('should use Node.js 20', () => {
      expect(content).toMatch(/node-version.*20|20.*node-version/);
    });

    it('should use pnpm (not npm or yarn)', () => {
      expect(content).toMatch(/pnpm/);
      expect(content).not.toMatch(/\bnpm\s+(install|ci)\b/);
    });

    it('should run pnpm lint step for english-pro-api', () => {
      expect(content).toMatch(/pnpm.*lint|lint.*english-pro-api/);
    });

    it('should run pnpm test step for english-pro-api', () => {
      expect(content).toMatch(/pnpm.*test/);
    });

    it('should use --frozen-lockfile for reproducible installs', () => {
      expect(content).toMatch(/frozen-lockfile/);
    });
  });

  // =========================================================================
  // 1.7-CFG-004: ci-ai-worker.yml — AC#3
  // =========================================================================
  describe('1.7-CFG-004: ci-ai-worker.yml Content Validation (AC#3)', () => {
    let content: string;

    beforeEach(() => {
      const filePath = join(WORKFLOWS_DIR, 'ci-ai-worker.yml');
      content = readFileSync(filePath, 'utf-8');
    });

    it('should trigger on push/PR when apps/ai-worker/** changes', () => {
      expect(content).toMatch(/apps\/ai-worker\/\*\*/);
    });

    it('should run pnpm lint step for english-pro-ai-worker', () => {
      expect(content).toMatch(/pnpm.*lint/);
    });

    it('should run pnpm test step for english-pro-ai-worker', () => {
      expect(content).toMatch(/pnpm.*test/);
    });
  });

  // =========================================================================
  // 1.7-CFG-005: deploy-api.yml — AC#4
  // =========================================================================
  describe('1.7-CFG-005: deploy-api.yml Content Validation (AC#4)', () => {
    let content: string;

    beforeEach(() => {
      const filePath = join(WORKFLOWS_DIR, 'deploy-api.yml');
      content = readFileSync(filePath, 'utf-8');
    });

    it('should trigger only on push to main branch', () => {
      expect(content).toMatch(/branches:\s*\[?main\]?/);
      // Should NOT trigger on pull_request
      expect(content).not.toMatch(/pull_request:/);
    });

    it('should use Google Cloud auth action', () => {
      // Accepts either Workload Identity Federation or service account key approach
      expect(content).toMatch(
        /google-github-actions\/auth|google-github-actions\/setup-gcloud/,
      );
    });

    it('should use GCP_PROJECT_ID secret (not hardcoded)', () => {
      // Hardcoding project ID is an anti-pattern (AC#6 compliance)
      expect(content).toMatch(/secrets\.GCP_PROJECT_ID/);
    });

    it('should set Cloud Run min-instances to 1', () => {
      // AC#4: min 1, max 10 instances, 80 concurrency
      expect(content).toMatch(/min-instances[=:\s]+1\b/);
    });

    it('should set Cloud Run max-instances to 10', () => {
      expect(content).toMatch(/max-instances[=:\s]+10\b/);
    });

    it('should set Cloud Run concurrency to 80', () => {
      expect(content).toMatch(/concurrency[=:\s]+80\b/);
    });

    it('should deploy to asia-southeast1 region', () => {
      // ADR-005: region = asia-southeast1
      expect(content).toMatch(/asia-southeast1/);
    });

    it('should use git SHA for Docker image tag', () => {
      expect(content).toMatch(/github\.sha/);
    });
  });

  // =========================================================================
  // 1.7-CFG-006: deploy-ai-worker.yml — AC#5
  // =========================================================================
  describe('1.7-CFG-006: deploy-ai-worker.yml Content Validation (AC#5)', () => {
    let content: string;

    beforeEach(() => {
      const filePath = join(WORKFLOWS_DIR, 'deploy-ai-worker.yml');
      content = readFileSync(filePath, 'utf-8');
    });

    it('should set Cloud Run min-instances to 0 (scale-to-zero)', () => {
      // AC#5: min 0, max 20, concurrency 10
      expect(content).toMatch(/min-instances[=:\s]+0\b/);
    });

    it('should set Cloud Run max-instances to 20', () => {
      expect(content).toMatch(/max-instances[=:\s]+20\b/);
    });

    it('should set Cloud Run concurrency to 10', () => {
      // AI Worker handles heavy AI tasks → low concurrency per instance
      expect(content).toMatch(/concurrency[=:\s]+10\b/);
    });

    it('should deploy to asia-southeast1 region', () => {
      expect(content).toMatch(/asia-southeast1/);
    });

    it('should use git SHA for Docker image tag', () => {
      expect(content).toMatch(/github\.sha/);
    });
  });

  // =========================================================================
  // 1.7-CFG-007: GCP Secret Manager compliance — AC#6
  // =========================================================================
  describe('1.7-CFG-007: GCP Secret Manager References (AC#6)', () => {
    it('deploy-api.yml should reference secrets via Secret Manager (not hardcoded env vars)', () => {
      // AC#6: Cloud Run service configs use GCP Secret Manager for production secrets
      const filePath = join(WORKFLOWS_DIR, 'deploy-api.yml');
      const content = readFileSync(filePath, 'utf-8');

      // Should reference GCP secrets, not hardcode DATABASE_URL etc.
      // Accepts: secrets field, --set-secrets flag, or update-secrets
      const hasSecretReference =
        content.includes('secrets') ||
        content.includes('set-secrets') ||
        content.includes('update-secrets') ||
        content.includes('secretmanager') ||
        content.includes('WIF_PROVIDER') ||
        content.includes('WIF_SERVICE_ACCOUNT');
      expect(hasSecretReference).toBe(true);
    });

    it('deploy-api.yml should NOT contain hardcoded DATABASE_URL', () => {
      // Critical: secrets must NOT be in workflow files
      const filePath = join(WORKFLOWS_DIR, 'deploy-api.yml');
      const content = readFileSync(filePath, 'utf-8');

      // Must not contain literal DB credentials
      expect(content).not.toMatch(/postgresql:\/\/[^$]/);
      expect(content).not.toMatch(/DATABASE_URL\s*=\s*["'][^$]/);
    });
  });
});
