import type { PlanItem } from '../plan.types';

export interface CandidatePlan {
  items: PlanItem[];
  total: number;
  extraTests: string[];
}

/**
 * Compares two candidate plans according to MedEx Rule 3 tie-breaking hierarchy:
 * 1. Cheapest total price wins.
 * 2. If equal, prefer the one with fewer items.
 * 3. If equal, prefer the one with fewer extra tests.
 * 4. If equal, compare the plans' item IDs sorted alphabetically and take the one that comes first.
 *
 * @returns Negative if `a` is preferred over `b`, positive if `b` is preferred over `a`, 0 if identical.
 */
export function comparePlans(a: CandidatePlan, b: CandidatePlan): number {
  // 1. Lowest total price
  if (a.total !== b.total) {
    return a.total - b.total;
  }

  // 2. Fewer items
  if (a.items.length !== b.items.length) {
    return a.items.length - b.items.length;
  }

  // 3. Fewer extra tests
  if (a.extraTests.length !== b.extraTests.length) {
    return a.extraTests.length - b.extraTests.length;
  }

  // 4. Compare item IDs sorted alphabetically
  const aItemIds = a.items.map((i) => i.id).sort();
  const bItemIds = b.items.map((i) => i.id).sort();

  const minLen = Math.min(aItemIds.length, bItemIds.length);
  for (let i = 0; i < minLen; i++) {
    const idA = aItemIds[i]!;
    const idB = bItemIds[i]!;
    const cmp = idA.localeCompare(idB);
    if (cmp !== 0) {
      return cmp;
    }
  }

  return aItemIds.length - bItemIds.length;
}
