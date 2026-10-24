import type { PlanErrorCode } from '../../common/errors/error-codes';

export interface PlanRequestDto {
  testIds: string[];
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

export interface PlanErrorResponseDto {
  error: PlanErrorCode;
  testIds: string[];
}
