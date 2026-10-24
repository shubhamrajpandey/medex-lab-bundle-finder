import { describe, it, expect } from 'vitest';
import { validatePlanRequest } from './plan.validator';
import { EmptySelectionError, InvalidTestsError, NotAvailableError } from './plan.errors';
import { InMemoryCatalogRepository } from '../catalog/catalog.repository';
import type { SanitizedCatalog } from '../catalog/catalog.types';

describe('plan.validator', () => {
  const mockCatalog: SanitizedCatalog = {
    allTests: new Map([
      ['T01', { id: 'T01', code: 'CBC', name: 'Complete Blood Count', price: 250, status: true }],
      ['T02', { id: 'T02', code: 'FBS', name: 'Fasting Blood Sugar', price: 120, status: true }],
      ['T03', { id: 'T03', code: 'HBA1C', name: 'HbA1c', price: 450, status: true }],
      ['T15', { id: 'T15', code: 'HIV', name: 'HIV Screening', price: null, status: true }], // available via P08
      ['T16_ORPHAN', { id: 'T16_ORPHAN', code: 'ORPHAN', name: 'Orphan Null Price', price: null, status: true }], // price null, not in package
      ['T19', { id: 'T19', code: 'ALLERGY', name: 'Allergy Panel', price: 3500, status: false }], // inactive
    ]),
    selectableTests: [
      { id: 'T01', code: 'CBC', name: 'Complete Blood Count', price: 250, status: true },
      { id: 'T02', code: 'FBS', name: 'Fasting Blood Sugar', price: 120, status: true },
      { id: 'T03', code: 'HBA1C', name: 'HbA1c', price: 450, status: true },
      { id: 'T15', code: 'HIV', name: 'HIV Screening', price: null, status: true },
      { id: 'T16_ORPHAN', code: 'ORPHAN', name: 'Orphan Null Price', price: null, status: true },
    ],
    usablePackages: [
      { id: 'P01', name: 'Diabetes Basic', price: 500, testIds: ['T02', 'T03'], status: true },
      { id: 'P08', name: 'Sexual Health', price: 900, testIds: ['T15'], status: true },
    ],
  };

  const repo = new InMemoryCatalogRepository(mockCatalog);

  it('throws EmptySelectionError when body is empty or testIds is missing', () => {
    expect(() => validatePlanRequest(null, repo)).toThrow(EmptySelectionError);
    expect(() => validatePlanRequest({}, repo)).toThrow(EmptySelectionError);
    expect(() => validatePlanRequest({ testIds: [] }, repo)).toThrow(EmptySelectionError);
    expect(() => validatePlanRequest({ testIds: ['   '] }, repo)).toThrow(EmptySelectionError);

    try {
      validatePlanRequest({ testIds: [] }, repo);
    } catch (err) {
      expect(err).toBeInstanceOf(EmptySelectionError);
      const appErr = err as EmptySelectionError;
      expect(appErr.statusCode).toBe(400);
      expect(appErr.code).toBe('EMPTY_SELECTION');
      expect(appErr.testIds).toEqual([]);
    }
  });

  it('deduplicates selections while preserving selection order (Rule 5)', () => {
    const result = validatePlanRequest({ testIds: ['T02', 'T01', 'T02', 'T03', 'T01'] }, repo);
    expect(result).toEqual(['T02', 'T01', 'T03']);
  });

  it('throws InvalidTestsError when a selected test does not exist or is inactive (Rule 4)', () => {
    // T99 does not exist, T19 is inactive
    expect(() => validatePlanRequest({ testIds: ['T01', 'T99', 'T19'] }, repo)).toThrow(
      InvalidTestsError,
    );

    try {
      validatePlanRequest({ testIds: ['T01', 'T99', 'T19'] }, repo);
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidTestsError);
      const appErr = err as InvalidTestsError;
      expect(appErr.statusCode).toBe(400);
      expect(appErr.code).toBe('INVALID_TESTS');
      expect(appErr.testIds).toEqual(['T99', 'T19']);
    }
  });

  it('throws NotAvailableError when a test has price: null and is not in any usable package', () => {
    expect(() => validatePlanRequest({ testIds: ['T01', 'T16_ORPHAN'] }, repo)).toThrow(
      NotAvailableError,
    );

    try {
      validatePlanRequest({ testIds: ['T01', 'T16_ORPHAN'] }, repo);
    } catch (err) {
      expect(err).toBeInstanceOf(NotAvailableError);
      const appErr = err as NotAvailableError;
      expect(appErr.statusCode).toBe(422);
      expect(appErr.code).toBe('NOT_AVAILABLE');
      expect(appErr.testIds).toEqual(['T16_ORPHAN']);
    }
  });

  it('allows a test with price: null if it is part of a usable package', () => {
    // T15 has price: null, but is included in active package P08
    const result = validatePlanRequest({ testIds: ['T15'] }, repo);
    expect(result).toEqual(['T15']);
  });
});
