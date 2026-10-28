import { describe, it, expect } from 'vitest';
import { sanitizeCatalog } from './catalog.sanitizer';
import type { RawCatalogData } from './catalog.types';

describe('catalog.sanitizer', () => {
  const mockRawData: RawCatalogData = {
    tests: [
      { id: 'T01', code: 'CBC', name: 'Complete Blood Count', price: 250, status: true },
      { id: 'T02', code: 'FBS', name: 'Fasting Blood Sugar', price: 120, status: true },
      { id: 'T15', code: 'HIV', name: 'HIV 1 & 2', price: null, status: true },
      { id: 'T19', code: 'ALLERGY', name: 'Allergy Panel', price: 3500, status: false },
    ],
    packages: [
      {
        id: 'P01',
        name: 'Basic',
        price: 300,
        testIds: ['T01', 'T02'],
        status: true,
      },
      {
        id: 'P02',
        name: 'Messy Package',
        price: 500,
        testIds: ['T01', 'T02', 'T01', 'T99'], // duplicate T01 and nonexistent T99
        status: true,
      },
      {
        id: 'P03',
        name: 'Inactive Package',
        price: 400,
        testIds: ['T01'],
        status: false,
      },
    ],
  };

  it('filters out inactive tests from selectableTests while keeping them in allTests lookup', () => {
    const sanitized = sanitizeCatalog(mockRawData);

    expect(sanitized.selectableTests.map((t) => t.id)).toEqual(['T01', 'T02', 'T15']);
    expect(sanitized.allTests.has('T19')).toBe(true);
    expect(sanitized.allTests.get('T19')?.status).toBe(false);
  });

  it('filters out inactive packages', () => {
    const sanitized = sanitizeCatalog(mockRawData);
    const packageIds = sanitized.usablePackages.map((p) => p.id);

    expect(packageIds).toContain('P01');
    expect(packageIds).toContain('P02');
    expect(packageIds).not.toContain('P03');
  });

  it('deduplicates testIds and strips nonexistent test IDs from packages', () => {
    const sanitized = sanitizeCatalog(mockRawData);
    const p02 = sanitized.usablePackages.find((p) => p.id === 'P02');

    expect(p02).toBeDefined();
    expect(p02?.testIds).toEqual(['T01', 'T02']);
  });

  it('records warnings for inactive tests, inactive packages, duplicate test IDs, and unknown test IDs', () => {
    const sanitized = sanitizeCatalog(mockRawData);

    expect(sanitized.warnings).toHaveLength(4);
    expect(sanitized.warnings.some((w) => w.includes('T19'))).toBe(true);
    expect(sanitized.warnings.some((w) => w.includes('P03'))).toBe(true);
    expect(sanitized.warnings.some((w) => w.includes('duplicate test T01'))).toBe(true);
    expect(sanitized.warnings.some((w) => w.includes('unknown test T99'))).toBe(true);
  });
});
