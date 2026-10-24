import type { LabPackage, LabTest } from '../../catalog/catalog.types';
import type { PlanItem, PlanResponseDto } from '../plan.types';
import { NotAvailableError } from '../plan.errors';
import { comparePlans, type CandidatePlan } from './plan-comparator';

/**
 * Pure function that solves the optimal bundle plan:
 * 1. Finds the combination of packages and individual tests covering all requested tests with minimum total cost.
 * 2. Breaks ties using MedEx Rule 3 (fewer items, fewer extra tests, alphabetical item IDs).
 * 3. Populates covers in user selection order.
 * 4. Sorts items and extraTests by ID.
 * 5. Computes individualTotal and savings (or null if any requested test cannot be bought standalone).
 */
export function solveCheapestPlan(
  requestedIds: string[],
  allTests: Map<string, LabTest>,
  usablePackages: LabPackage[],
): PlanResponseDto {
  const requestedSet = new Set(requestedIds);

  // Calculate individualTotal (sum of standalone prices)
  // Rule 4: If any requested test has price: null, it cannot be bought alone -> null
  let individualTotal: number | null = 0;
  for (const id of requestedIds) {
    const test = allTests.get(id);
    if (!test || test.price === null) {
      individualTotal = null;
      break;
    }
    individualTotal += test.price;
  }

  // Only consider active packages that cover at least one requested test
  // Packages with 0 requested tests would only add cost and extra tests
  const relevantPackages = usablePackages.filter((pkg) =>
    pkg.testIds.some((testId) => requestedSet.has(testId)),
  );

  let bestPlan: CandidatePlan | null = null;

  // Branch and bound search over relevant package subsets
  function search(index: number, chosenPackages: LabPackage[], currentPackageCost: number): void {
    // Prune branch if package cost alone already exceeds best found total price
    if (bestPlan !== null && currentPackageCost > bestPlan.total) {
      return;
    }

    if (index === relevantPackages.length) {
      // Collect all tests covered by chosen packages
      const packageCoveredSet = new Set<string>();
      const extraTestSet = new Set<string>();

      for (const pkg of chosenPackages) {
        for (const testId of pkg.testIds) {
          packageCoveredSet.add(testId);
          if (!requestedSet.has(testId)) {
            extraTestSet.add(testId);
          }
        }
      }

      // Determine uncovered requested tests that must be purchased individually
      const uncoveredIds = requestedIds.filter((id) => !packageCoveredSet.has(id));

      let standaloneCost = 0;
      const standaloneItems: PlanItem[] = [];

      for (const uncId of uncoveredIds) {
        const test = allTests.get(uncId);
        // Rule 4: A test with price: null can only be obtained through a package
        if (!test || test.price === null) {
          // This package combination cannot cover this unpriced test
          return;
        }
        standaloneCost += test.price;
        standaloneItems.push({
          type: 'test',
          id: test.id,
          name: test.name,
          price: test.price,
          covers: [test.id],
        });
      }

      const totalCost = currentPackageCost + standaloneCost;

      // Build package items with covers in user selection order
      const packageItems: PlanItem[] = chosenPackages.map((pkg) => {
        const covers = requestedIds.filter((reqId) => pkg.testIds.includes(reqId));
        return {
          type: 'package',
          id: pkg.id,
          name: pkg.name,
          price: pkg.price,
          covers,
        };
      });

      // Combine items and sort alphabetically by id
      const allItems = [...packageItems, ...standaloneItems].sort((a, b) =>
        a.id.localeCompare(b.id),
      );

      // Extra tests sorted alphabetically by id
      const sortedExtraTests = Array.from(extraTestSet).sort((a, b) => a.localeCompare(b));

      const candidate: CandidatePlan = {
        items: allItems,
        total: totalCost,
        extraTests: sortedExtraTests,
      };

      if (bestPlan === null || comparePlans(candidate, bestPlan) < 0) {
        bestPlan = candidate;
      }

      return;
    }

    const currentPkg = relevantPackages[index]!;

    // Branch 1: Include current package
    chosenPackages.push(currentPkg);
    search(index + 1, chosenPackages, currentPackageCost + currentPkg.price);
    chosenPackages.pop();

    // Branch 2: Exclude current package
    search(index + 1, chosenPackages, currentPackageCost);
  }

  // Execute optimization search
  search(0, [], 0);

  if (bestPlan === null) {
    throw new NotAvailableError(requestedIds);
  }

  const resolvedPlan = bestPlan as CandidatePlan;
  const savings = individualTotal !== null ? individualTotal - resolvedPlan.total : null;

  return {
    items: resolvedPlan.items,
    total: resolvedPlan.total,
    extraTests: resolvedPlan.extraTests,
    individualTotal,
    savings,
  };
}
