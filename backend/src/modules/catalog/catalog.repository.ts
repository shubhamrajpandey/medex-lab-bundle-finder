import type { LabPackage, LabTest, SanitizedCatalog } from './catalog.types';

export interface CatalogRepository {
  getSelectableTests(): LabTest[];
  getUsablePackages(): LabPackage[];
  getAllTests(): Map<string, LabTest>;
  findTestById(id: string): LabTest | undefined;
  findPackageById(id: string): LabPackage | undefined;
}

export class InMemoryCatalogRepository implements CatalogRepository {
  private readonly catalog: SanitizedCatalog;
  private readonly packageMap: Map<string, LabPackage>;

  constructor(catalog: SanitizedCatalog) {
    this.catalog = catalog;
    this.packageMap = new Map(catalog.usablePackages.map((pkg) => [pkg.id, pkg]));
  }

  getSelectableTests(): LabTest[] {
    return this.catalog.selectableTests;
  }

  getUsablePackages(): LabPackage[] {
    return this.catalog.usablePackages;
  }

  getAllTests(): Map<string, LabTest> {
    return this.catalog.allTests;
  }

  findTestById(id: string): LabTest | undefined {
    return this.catalog.allTests.get(id);
  }

  findPackageById(id: string): LabPackage | undefined {
    return this.packageMap.get(id);
  }
}
