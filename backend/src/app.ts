import express, { type Express } from 'express';
import cors from 'cors';
import type { CatalogRepository } from './modules/catalog/catalog.repository';
import { CatalogController } from './modules/catalog/catalog.controller';
import { createCatalogRouter } from './modules/catalog/catalog.routes';
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

  // Fallback 404 & centralized error handler
  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);

  return app;
}
