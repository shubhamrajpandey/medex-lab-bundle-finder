import { useEffect, useRef, useState } from 'react';
import type { PlanResponseDto } from '../types/plan';
import { ApiError, calculatePlan } from '../services/api';

export interface UsePlanCalculatorResult {
  plan: PlanResponseDto | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom hook to calculate the optimal plan dynamically as selected tests change.
 * Implements two-layer race condition protection:
 * 1. AbortController: actively cancels earlier in-flight HTTP requests.
 * 2. Sequential Request ID: guarantees that only the newest request's response
 *    can ever update the state (a slow earlier request can NEVER overwrite a newer one).
 */
export function usePlanCalculator(
  selectedTestIds: string[],
  testNameMap: Map<string, string>,
): UsePlanCalculatorResult {
  const [plan, setPlan] = useState<PlanResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // References to manage cancellation and request ordering
  const requestIdRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear any pending debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Cancel any previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Rule: Empty selection state
    if (selectedTestIds.length === 0) {
      setPlan(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    // Start loading state immediately so UI gives instant feedback
    setIsLoading(true);
    setError(null);

    // Increment request ID to track latest call
    const currentRequestId = ++requestIdRef.current;

    // Create a new AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Debounce by 150ms to batch rapid successive clicks
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const result = await calculatePlan(
          selectedTestIds,
          controller.signal,
          testNameMap,
        );

        // Race condition guard: ignore if a newer request has started
        if (currentRequestId === requestIdRef.current) {
          setPlan(result);
          setError(null);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        // If aborted by a newer request or unmount, ignore silently
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }

        // Race condition guard for error state
        if (currentRequestId === requestIdRef.current) {
          if (err instanceof ApiError) {
            setError(err.friendlyMessage);
          } else {
            setError('Unable to calculate plan. Please try again.');
          }
          setPlan(null);
          setIsLoading(false);
        }
      }
    }, 150);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      controller.abort();
    };
  }, [selectedTestIds, testNameMap]);

  return {
    plan,
    isLoading,
    error,
  };
}
