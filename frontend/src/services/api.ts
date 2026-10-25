import type { LabTest, PlanErrorCode, PlanErrorResponseDto, PlanResponseDto } from '../types/plan';
import { translateErrorMessage } from './error-translator';

export class ApiError extends Error {
  public readonly code: PlanErrorCode;
  public readonly testIds: string[];
  public readonly friendlyMessage: string;

  constructor(
    code: PlanErrorCode,
    testIds: string[] = [],
    testNameMap?: Map<string, string>,
  ) {
    const friendly = translateErrorMessage(code, testIds, testNameMap);
    super(friendly);
    this.name = 'ApiError';
    this.code = code;
    this.testIds = testIds;
    this.friendlyMessage = friendly;
  }
}

/**
 * Fetches all active, selectable tests from the backend.
 */
export async function fetchTests(signal?: AbortSignal): Promise<LabTest[]> {
  try {
    const res = await fetch('/api/tests', { signal });

    if (!res.ok) {
      throw new ApiError('INTERNAL_SERVER_ERROR');
    }

    return (await res.json()) as LabTest[];
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err; // Allow caller to ignore deliberate cancellations
    }
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError('NETWORK_ERROR');
  }
}

/**
 * Calculates the optimal bundle plan for a given array of test IDs.
 * Supports AbortSignal for seamless race-condition cancellation.
 */
export async function calculatePlan(
  testIds: string[],
  signal?: AbortSignal,
  testNameMap?: Map<string, string>,
): Promise<PlanResponseDto> {
  try {
    const res = await fetch('/api/plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ testIds }),
      signal,
    });

    if (!res.ok) {
      let errorPayload: PlanErrorResponseDto | null = null;
      try {
        errorPayload = (await res.json()) as PlanErrorResponseDto;
      } catch {
        // Response was not JSON
      }

      const code: PlanErrorCode = errorPayload?.error || 'INTERNAL_SERVER_ERROR';
      const invalidIds: string[] = errorPayload?.testIds || [];
      throw new ApiError(code, invalidIds, testNameMap);
    }

    return (await res.json()) as PlanResponseDto;
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err; // Standard abort, do not translate
    }
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError('NETWORK_ERROR');
  }
}
