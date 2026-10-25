import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from '../../src/app';
import { loadRawCatalogFile } from '../../src/modules/catalog/catalog.loader';
import { sanitizeCatalog } from '../../src/modules/catalog/catalog.sanitizer';
import { InMemoryCatalogRepository } from '../../src/modules/catalog/catalog.repository';
import type { PlanErrorResponseDto, PlanResponseDto } from '../../src/modules/plan/plan.types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Integration: Plan API Examples & Error Contract (POST /api/plan)', () => {
  let server: Server;
  let baseUrl: string;
  const catalogPath = path.resolve(__dirname, '../../data/lab-catalog.json');
  const rawCatalog = loadRawCatalogFile(catalogPath);

  beforeAll(async () => {
    const sanitized = sanitizeCatalog(rawCatalog);
    const catalogRepo = new InMemoryCatalogRepository(sanitized);
    const app = createApp({ catalogRepo });

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address();
        if (address && typeof address === 'object') {
          baseUrl = `http://localhost:${address.port}`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  describe('Verification of EVERY example in data/lab-catalog.json', () => {
    const examples = rawCatalog.examples ?? [];

    it('verifies catalog contains examples to test', () => {
      expect(examples.length).toBeGreaterThan(0);
    });

    for (let i = 0; i < examples.length; i++) {
      const example = examples[i]!;
      it(`matches expected output for Example ${i + 1} (${example.request.testIds.join(', ')})`, async () => {
        const res = await fetch(`${baseUrl}/api/plan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(example.request),
        });

        expect(res.status).toBe(200);
        const data = (await res.json()) as PlanResponseDto;

        // Exact match comparison against catalog expected response
        expect(data).toEqual(example.expected);
      });
    }
  });

  describe('Error Contracts (400 & 422)', () => {
    it('returns HTTP 400 with EMPTY_SELECTION when testIds is empty or missing', async () => {
      const res = await fetch(`${baseUrl}/api/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testIds: [] }),
      });

      expect(res.status).toBe(400);
      const data = (await res.json()) as PlanErrorResponseDto;
      expect(data.error).toBe('EMPTY_SELECTION');
      expect(data.testIds).toEqual([]);
    });

    it('returns HTTP 400 with INVALID_TESTS listing unknown or inactive tests', async () => {
      // T19 is inactive (status: false), T99 does not exist
      const res = await fetch(`${baseUrl}/api/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testIds: ['T01', 'T19', 'T99'] }),
      });

      expect(res.status).toBe(400);
      const data = (await res.json()) as PlanErrorResponseDto;
      expect(data.error).toBe('INVALID_TESTS');
      expect(data.testIds).toEqual(['T19', 'T99']);
    });
  });

  describe('Performance SLA (< 300 ms)', () => {
    it('responds in under 300 ms for a large selection of tests', async () => {
      const start = performance.now();
      const res = await fetch(`${baseUrl}/api/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testIds: ['T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07', 'T11', 'T12', 'T17'],
        }),
      });
      const durationMs = performance.now() - start;

      expect(res.status).toBe(200);
      expect(durationMs).toBeLessThan(300); // Strict requirement: under 300 ms
    });
  });
});
