import type { LabPackage, LabTest, RawCatalogData, SanitizedCatalog } from './catalog.types';

/**
 * Pure function that cleans and sanitizes raw catalog data according to business rules:
 * 1. Build an in-memory lookup map of all tests by ID.
 * 2. Selectable tests are those with status: true (Rule 4).
 * 3. Usable packages are those with status: true (Rule 4).
 * 4. Deduplicates repeated testIds within packages (e.g. P06 has T02 twice).
 * 5. Removes nonexistent test IDs within packages (e.g. P12 has T99).
 */
export function sanitizeCatalog(raw: RawCatalogData): SanitizedCatalog {
  const allTests = new Map<string, LabTest>();
  for (const test of raw.tests) {
    allTests.set(test.id, test);
  }

  const selectableTests = raw.tests.filter((test) => test.status === true);

  const usablePackages: LabPackage[] = [];

  for (const pkg of raw.packages) {
    // Rule 4: Only packages with status: true can be used
    if (!pkg.status) {
      continue;
    }

    const seenIds = new Set<string>();
    const cleanedIds: string[] = [];

    for (const testId of pkg.testIds) {
      // Rule 6: Handle catalog mistakes - drop nonexistent IDs (e.g. T99)
      if (!allTests.has(testId)) {
        continue;
      }

      // Rule 6: Deduplicate test IDs inside package
      if (!seenIds.has(testId)) {
        seenIds.add(testId);
        cleanedIds.push(testId);
      }
    }

    usablePackages.push({
      id: pkg.id,
      name: pkg.name,
      price: pkg.price,
      testIds: cleanedIds,
      status: pkg.status,
    });
  }

  return {
    allTests,
    selectableTests,
    usablePackages,
  };
}
