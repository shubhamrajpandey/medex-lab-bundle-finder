import type { CatalogRepository } from '../catalog/catalog.repository';
import { EmptySelectionError, InvalidTestsError, NotAvailableError } from './plan.errors';

/**
 * Validates a plan calculation request according to business rules:
 * 1. Checks that testIds is a non-empty array (throws EMPTY_SELECTION, 400).
 * 2. De-duplicates repeated selections while preserving selection order (Rule 5).
 * 3. Checks that every selected test exists and has status: true (Rule 4, throws INVALID_TESTS, 400).
 * 4. Checks that tests with price: null are present in at least one usable package (Rule 4, throws NOT_AVAILABLE, 422).
 *
 * @returns Deduplicated array of valid, obtainable test IDs in selection order.
 */
export function validatePlanRequest(body: unknown, catalogRepo: CatalogRepository): string[] {
  if (
    !body ||
    typeof body !== 'object' ||
    !('testIds' in body) ||
    !Array.isArray((body as { testIds: unknown }).testIds)
  ) {
    throw new EmptySelectionError();
  }

  const rawTestIds = (body as { testIds: unknown[] }).testIds;
  if (rawTestIds.length === 0) {
    throw new EmptySelectionError();
  }

  // Deduplicate entries while preserving selection order
  const uniqueItems: { raw: unknown; str: string }[] = [];
  const seen = new Set<string>();

  for (const rawId of rawTestIds) {
    const str = String(rawId);
    if (!seen.has(str)) {
      seen.add(str);
      uniqueItems.push({ raw: rawId, str });
    }
  }

  // If only empty/whitespace strings were provided, treat as EMPTY_SELECTION
  const nonBlankItems = uniqueItems.filter(
    (item) => typeof item.raw !== 'string' || item.raw.trim().length > 0,
  );
  if (nonBlankItems.length === 0) {
    throw new EmptySelectionError();
  }

  // Rule 4: Verify all tests exist, are strings, and are active (status: true)
  const invalidTestIds: string[] = [];
  for (const item of nonBlankItems) {
    if (typeof item.raw !== 'string') {
      invalidTestIds.push(item.str);
      continue;
    }
    const test = catalogRepo.findTestById(item.str);
    if (!test || test.status === false) {
      invalidTestIds.push(item.str);
    }
  }

  if (invalidTestIds.length > 0) {
    throw new InvalidTestsError(invalidTestIds);
  }

  const validTestIds = nonBlankItems.map((item) => item.str);

  // Rule 4: Tests with price: null can only be obtained through an active package
  const packageCoverableTests = new Set<string>();
  for (const pkg of catalogRepo.getUsablePackages()) {
    for (const testId of pkg.testIds) {
      packageCoverableTests.add(testId);
    }
  }

  const unobtainableTestIds: string[] = [];
  for (const testId of validTestIds) {
    const test = catalogRepo.findTestById(testId);
    if (test && test.price === null && !packageCoverableTests.has(testId)) {
      unobtainableTestIds.push(testId);
    }
  }

  if (unobtainableTestIds.length > 0) {
    throw new NotAvailableError(unobtainableTestIds);
  }

  return validTestIds;
}
