import type { NextFunction, Request, Response } from 'express';
import type { PlanService } from './plan.service';

export class PlanController {
  constructor(private readonly planService: PlanService) {}

  calculatePlan = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const plan = this.planService.generatePlan(req.body);
      res.status(200).json(plan);
    } catch (error) {
      next(error);
    }
  };
}
