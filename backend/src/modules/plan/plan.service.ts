import type { CatalogRepository } from '../catalog/catalog.repository';
import type { PlanResponseDto } from './plan.types';
import { validatePlanRequest } from './plan.validator';
import { solveCheapestPlan } from './domain/plan-solver';

export class PlanService {
  constructor(private readonly catalogRepo: CatalogRepository) {}

  /**
   * Generates the optimal bundle plan for a customer request:
   * 1. Validates payload, deduplicates selections, checks status and availability.
   * 2. Executes pure solver with tie-breaking rules.
   */
  generatePlan(body: unknown): PlanResponseDto {
    const validatedTestIds = validatePlanRequest(body, this.catalogRepo);
    const allTests = this.catalogRepo.getAllTests();
    const usablePackages = this.catalogRepo.getUsablePackages();

    return solveCheapestPlan(validatedTestIds, allTests, usablePackages);
  }
}
