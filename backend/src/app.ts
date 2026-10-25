import express, { type Express } from 'express';
import cors from 'cors';
import type { CatalogRepository } from './modules/catalog/catalog.repository';
import { CatalogController } from './modules/catalog/catalog.controller';
import { createCatalogRouter } from './modules/catalog/catalog.routes';
import { PlanService } from './modules/plan/plan.service';
import { PlanController } from './modules/plan/plan.controller';
import { createPlanRouter } from './modules/plan/plan.routes';
import { errorHandlerMiddleware } from './common/middleware/error-handler.middleware';
import { notFoundMiddleware } from './common/middleware/not-found.middleware';

export interface AppDependencies {
  catalogRepo: CatalogRepository;
}

export function createApp(deps: AppDependencies): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });


  // Mount catalog module
  const catalogController = new CatalogController(deps.catalogRepo);
  const catalogRouter = createCatalogRouter(catalogController);
  app.use('/api', catalogRouter);

  // Mount plan module
  const planService = new PlanService(deps.catalogRepo);
  const planController = new PlanController(planService);
  const planRouter = createPlanRouter(planController);
  app.use('/api', planRouter);

  // Fallback 404 & centralized error handler
  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);

  return app;
}
