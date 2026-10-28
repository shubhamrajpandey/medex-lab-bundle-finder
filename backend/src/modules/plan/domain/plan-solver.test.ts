import { describe, it, expect } from 'vitest';
import { solveCheapestPlan } from './plan-solver';
import { comparePlans, type CandidatePlan } from './plan-comparator';
import type { LabPackage, LabTest } from '../../catalog/catalog.types';

describe('plan-comparator (Rule 3 Tie-Breaking Hierarchy)', () => {
  it('prefers the plan with lower total price', () => {
    const planA: CandidatePlan = { total: 1000, items: [], extraTests: [] };
    const planB: CandidatePlan = { total: 1200, items: [], extraTests: [] };

    expect(comparePlans(planA, planB)).toBeLessThan(0);
    expect(comparePlans(planB, planA)).toBeGreaterThan(0);
  });

  it('prefers the plan with fewer items when prices are identical', () => {
    const planA: CandidatePlan = {
      total: 1000,
      items: [{ type: 'package', id: 'P01', name: 'Pkg', price: 1000, covers: ['T01', 'T02'] }],
      extraTests: [],
    };
    const planB: CandidatePlan = {
      total: 1000,
      items: [
        { type: 'test', id: 'T01', name: 'Test 1', price: 500, covers: ['T01'] },
        { type: 'test', id: 'T02', name: 'Test 2', price: 500, covers: ['T02'] },
      ],
      extraTests: [],
    };

    expect(comparePlans(planA, planB)).toBeLessThan(0);
  });

  it('prefers the plan with fewer extra tests when prices and item counts are identical', () => {
    const planA: CandidatePlan = {
      total: 1000,
      items: [{ type: 'package', id: 'P01', name: 'Pkg 1', price: 1000, covers: ['T01'] }],
      extraTests: ['T02'], // 1 extra test
    };
    const planB: CandidatePlan = {
      total: 1000,
      items: [{ type: 'package', id: 'P02', name: 'Pkg 2', price: 1000, covers: ['T01'] }],
      extraTests: ['T02', 'T03'], // 2 extra tests
    };

    expect(comparePlans(planA, planB)).toBeLessThan(0);
  });

  it('prefers alphabetical order of sorted item IDs when prices, item counts, and extra tests are identical', () => {
    const planA: CandidatePlan = {
      total: 1000,
      items: [{ type: 'package', id: 'P01', name: 'Pkg 1', price: 1000, covers: ['T01'] }],
      extraTests: [],
    };
    const planB: CandidatePlan = {
      total: 1000,
      items: [{ type: 'package', id: 'P02', name: 'Pkg 2', price: 1000, covers: ['T01'] }],
      extraTests: [],
    };

    // P01 comes before P02
    expect(comparePlans(planA, planB)).toBeLessThan(0);
  });
});

describe('plan-solver (Optimization Algorithm)', () => {
  const testsMap = new Map<string, LabTest>([
    ['T01', { id: 'T01', code: 'CBC', name: 'Complete Blood Count', price: 250, status: true }],
    ['T02', { id: 'T02', code: 'FBS', name: 'Fasting Blood Sugar', price: 120, status: true }],
    ['T03', { id: 'T03', code: 'HBA1C', name: 'HbA1c', price: 450, status: true }],
    ['T04', { id: 'T04', code: 'LIPID', name: 'Lipid Profile', price: 600, status: true }],
    ['T05', { id: 'T05', code: 'LFT', name: 'Liver Function Test', price: 700, status: true }],
    ['T06', { id: 'T06', code: 'KFT', name: 'Kidney Function Test', price: 650, status: true }],
    ['T07', { id: 'T07', code: 'TSH', name: 'Thyroid Stimulating Hormone', price: 400, status: true }],
    ['T14', { id: 'T14', code: 'HBSAG', name: 'Hepatitis B', price: 500, status: true }],
    ['T15', { id: 'T15', code: 'HIV', name: 'HIV 1 & 2', price: null, status: true }],
  ]);

  const packages: LabPackage[] = [
    { id: 'P01', name: 'Diabetes Basic', price: 500, testIds: ['T02', 'T03'], status: true },
    { id: 'P02', name: 'Diabetes Plus', price: 1500, testIds: ['T02', 'T03', 'T04', 'T06'], status: true },
    { id: 'P08', name: 'Sexual Health Screen', price: 900, testIds: ['T14', 'T15'], status: true },
  ];

  it('solves pure package recommendation with correct savings (Example 1)', () => {
    const plan = solveCheapestPlan(['T02', 'T03', 'T04', 'T06'], testsMap, packages);

    expect(plan.total).toBe(1500);
    expect(plan.individualTotal).toBe(1820);
    expect(plan.savings).toBe(320);
    expect(plan.extraTests).toEqual([]);
    expect(plan.items).toHaveLength(1);
    expect(plan.items[0]).toEqual({
      type: 'package',
      id: 'P02',
      name: 'Diabetes Plus',
      price: 1500,
      covers: ['T02', 'T03', 'T04', 'T06'],
    });
  });

  it('solves combination of package and standalone tests (Example 2)', () => {
    const plan = solveCheapestPlan(
      ['T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07'],
      testsMap,
      packages,
    );

    expect(plan.total).toBe(2850);
    expect(plan.individualTotal).toBe(3170);
    expect(plan.savings).toBe(320);
    expect(plan.extraTests).toEqual([]);
    expect(plan.items.map((i) => i.id)).toEqual(['P02', 'T01', 'T05', 'T07']);
  });

  it('handles tests with price: null and extra bonus tests (Example 3)', () => {
    const plan = solveCheapestPlan(['T15'], testsMap, packages);

    expect(plan.total).toBe(900);
    expect(plan.individualTotal).toBeNull();
    expect(plan.savings).toBeNull();
    expect(plan.extraTests).toEqual(['T14']);
    expect(plan.items).toEqual([
      {
        type: 'package',
        id: 'P08',
        name: 'Sexual Health Screen',
        price: 900,
        covers: ['T15'],
      },
    ]);
  });

  it('chooses standalone tests when buying individually is cheaper than any package', () => {
    // Only requesting T02 (120 THB). Package P01 costs 500 THB. Standalone is cheaper!
    const plan = solveCheapestPlan(['T02'], testsMap, packages);

    expect(plan.total).toBe(120);
    expect(plan.individualTotal).toBe(120);
    expect(plan.savings).toBe(0);
    expect(plan.items).toEqual([
      {
        type: 'test',
        id: 'T02',
        name: 'Fasting Blood Sugar',
        price: 120,
        covers: ['T02'],
      },
    ]);
  });

  it('assigns each selected test to exactly one item when packages overlap (no duplicate covers)', () => {
    // Overlapping packages: P01 covers T01, T02; P02 covers T02, T03
    const mockPackages: LabPackage[] = [
      { id: 'P01', name: 'Bundle A', price: 100, testIds: ['T01', 'T02'], status: true },
      { id: 'P02', name: 'Bundle B', price: 100, testIds: ['T02', 'T03'], status: true },
    ];
    const selection = ['T02', 'T03', 'T01'];
    const plan = solveCheapestPlan(selection, testsMap, mockPackages);

    expect(plan.items).toHaveLength(2);
    expect(plan.items.map((i) => i.id)).toEqual(['P01', 'P02']);

    // P01 has smaller ID than P02, so P01 gets T02 and T01; P02 gets only T03
    const p01Item = plan.items.find((i) => i.id === 'P01')!;
    const p02Item = plan.items.find((i) => i.id === 'P02')!;

    expect(p01Item.covers).toEqual(['T02', 'T01']);
    expect(p02Item.covers).toEqual(['T03']);

    // Assert the covers arrays contain no duplicates and their union equals the selection
    const allCovers = plan.items.flatMap((i) => i.covers);
    expect(new Set(allCovers).size).toBe(allCovers.length);
    expect(new Set(allCovers)).toEqual(new Set(selection));
  });

  it('runs within performance budget (< 10ms)', () => {
    const start = performance.now();
    for (let i = 0; i < 20; i++) {
      solveCheapestPlan(['T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07'], testsMap, packages);
    }
    const elapsed = performance.now() - start;
    expect(elapsed / 20).toBeLessThan(10); // Well under 300ms SLA
  });
});
