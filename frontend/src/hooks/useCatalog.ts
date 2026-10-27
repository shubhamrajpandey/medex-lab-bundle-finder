import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LabTest } from '../types/plan';
import { ApiError, fetchTests } from '../services/api';

export interface UseCatalogResult {
  tests: LabTest[];
  testMap: Map<string, LabTest>;
  testNameMap: Map<string, string>;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to load and manage the lab tests catalog.
 * Fetches tests once on mount and provides fast lookup maps.
 */
export function useCatalog(): UseCatalogResult {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    try {
      const data = await fetchTests(signal);
      setTests(data);
      setError(null);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      if (err instanceof ApiError) {
        setError(err.friendlyMessage);
      } else {
        setError('Failed to load lab tests. Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    fetchTests(controller.signal)
      .then((data) => {
        setTests(data);
        setError(null);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        if (err instanceof ApiError) {
          setError(err.friendlyMessage);
        } else {
          setError('Failed to load lab tests. Please check your connection and try again.');
        }
        setIsLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, []);

  const testMap = useMemo(() => {
    const map = new Map<string, LabTest>();
    for (const test of tests) {
      map.set(test.id, test);
    }
    return map;
  }, [tests]);

  const testNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const test of tests) {
      map.set(test.id, test.name);
    }
    return map;
  }, [tests]);

  const refetch = useCallback(async () => {
    await loadData();
  }, [loadData]);

  return {
    tests,
    testMap,
    testNameMap,
    isLoading,
    error,
    refetch,
  };
}
