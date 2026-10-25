import { Router } from 'express';
import type { PlanController } from './plan.controller';

export function createPlanRouter(controller: PlanController): Router {
  const router = Router();

  router.post('/plan', controller.calculatePlan);

  return router;
}
