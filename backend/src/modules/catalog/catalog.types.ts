export interface LabTest {
  id: string;
  code: string;
  name: string;
  price: number | null;
  status: boolean;
}

export interface LabPackage {
  id: string;
  name: string;
  price: number;
  testIds: string[];
  status: boolean;
}

export interface RawCatalogData {
  _readme?: string;
  tests: LabTest[];
  packages: LabPackage[];
  examples?: Array<{
    request: { testIds: string[] };
    expected: unknown;
  }>;
}

export interface SanitizedCatalog {
  allTests: Map<string, LabTest>;
  selectableTests: LabTest[]; // status: true
  usablePackages: LabPackage[]; // status: true, cleaned testIds
}
