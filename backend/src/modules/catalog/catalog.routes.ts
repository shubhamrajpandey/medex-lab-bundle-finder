import { Router } from 'express';
import type { CatalogController } from './catalog.controller';

export function createCatalogRouter(controller: CatalogController): Router {
  const router = Router();

  router.get('/tests', controller.getTests);
  router.get('/packages', controller.getPackages);

  return router;
}
