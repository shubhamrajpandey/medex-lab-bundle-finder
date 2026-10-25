export interface LabTest {
  id: string;
  code: string;
  name: string;
  price: number | null;
  status: boolean;
}

export interface PlanItem {
  type: 'package' | 'test';
  id: string;
  name: string;
  price: number;
  covers: string[];
}

export interface PlanResponseDto {
  items: PlanItem[];
  total: number;
  extraTests: string[];
  individualTotal: number | null;
  savings: number | null;
}

export type PlanErrorCode =
  | 'EMPTY_SELECTION'
  | 'INVALID_TESTS'
  | 'NOT_AVAILABLE'
  | 'NOT_FOUND'
  | 'INTERNAL_SERVER_ERROR'
  | 'NETWORK_ERROR';

export interface PlanErrorResponseDto {
  error: PlanErrorCode;
  testIds: string[];
  message?: string;
}
