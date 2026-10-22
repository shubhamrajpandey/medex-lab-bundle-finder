import type { Request, Response } from 'express';
import type { CatalogRepository } from './catalog.repository';

export class CatalogController {
  constructor(private readonly catalogRepo: CatalogRepository) {}

  getTests = (_req: Request, res: Response): void => {
    const tests = this.catalogRepo.getSelectableTests();
    res.status(200).json(tests);
  };

  getPackages = (_req: Request, res: Response): void => {
    const packages = this.catalogRepo.getUsablePackages();
    res.status(200).json(packages);
  };
}
