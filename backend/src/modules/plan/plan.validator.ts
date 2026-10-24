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

  // Rule 5: Deduplicate while preserving order of first appearance
  const uniqueTestIds: string[] = [];
  const seen = new Set<string>();

  for (const rawId of rawTestIds) {
    if (typeof rawId === 'string' && rawId.trim().length > 0) {
      if (!seen.has(rawId)) {
        seen.add(rawId);
        uniqueTestIds.push(rawId);
      }
    }
  }

  if (uniqueTestIds.length === 0) {
    throw new EmptySelectionError();
  }

  // Rule 4: Verify all tests exist and are active (status: true)
  const invalidTestIds: string[] = [];
  for (const testId of uniqueTestIds) {
    const test = catalogRepo.findTestById(testId);
    if (!test || test.status === false) {
      invalidTestIds.push(testId);
    }
  }

  if (invalidTestIds.length > 0) {
    throw new InvalidTestsError(invalidTestIds);
  }

  // Rule 4: Tests with price: null can only be obtained through an active package
  const packageCoverableTests = new Set<string>();
  for (const pkg of catalogRepo.getUsablePackages()) {
    for (const testId of pkg.testIds) {
      packageCoverableTests.add(testId);
    }
  }

  const unobtainableTestIds: string[] = [];
  for (const testId of uniqueTestIds) {
    const test = catalogRepo.findTestById(testId);
    if (test && test.price === null && !packageCoverableTests.has(testId)) {
      unobtainableTestIds.push(testId);
    }
  }

  if (unobtainableTestIds.length > 0) {
    throw new NotAvailableError(unobtainableTestIds);
  }

  return uniqueTestIds;
}
