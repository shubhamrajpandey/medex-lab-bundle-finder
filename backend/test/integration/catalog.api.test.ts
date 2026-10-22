import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from '../../src/app';
import { loadRawCatalogFile } from '../../src/modules/catalog/catalog.loader';
import { sanitizeCatalog } from '../../src/modules/catalog/catalog.sanitizer';
import { InMemoryCatalogRepository } from '../../src/modules/catalog/catalog.repository';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Integration: Catalog API endpoints', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const catalogPath = path.resolve(__dirname, '../../data/lab-catalog.json');
    const raw = loadRawCatalogFile(catalogPath);
    const sanitized = sanitizeCatalog(raw);
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

  it('GET /api/tests returns 200 with only active selectable tests', async () => {
    const res = await fetch(`${baseUrl}/api/tests`);
    expect(res.status).toBe(200);

    const data = (await res.json()) as Array<{ id: string; status: boolean }>;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data.every((t) => t.status === true)).toBe(true);
    expect(data.some((t) => t.id === 'T19')).toBe(false); // Inactive test
  });

  it('GET /api/packages returns 200 with sanitized usable packages', async () => {
    const res = await fetch(`${baseUrl}/api/packages`);
    expect(res.status).toBe(200);

    const data = (await res.json()) as Array<{ id: string; status: boolean; testIds: string[] }>;
    expect(Array.isArray(data)).toBe(true);
    expect(data.every((p) => p.status === true)).toBe(true);
    expect(data.some((p) => p.id === 'P10')).toBe(false); // Inactive package

    const p06 = data.find((p) => p.id === 'P06');
    expect(p06).toBeDefined();
    // Verify deduplication
    expect(new Set(p06!.testIds).size).toBe(p06!.testIds.length);

    const p12 = data.find((p) => p.id === 'P12');
    expect(p12).toBeDefined();
    expect(p12!.testIds).not.toContain('T99'); // Nonexistent test removed
  });

  it('GET /api/nonexistent returns 404 with standard error JSON', async () => {
    const res = await fetch(`${baseUrl}/api/nonexistent`);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('NOT_FOUND');
  });
});
