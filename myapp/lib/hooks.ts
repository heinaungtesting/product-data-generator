import { useState, useEffect, useRef, DependencyList } from 'react';

/**
 * Custom hook for live querying Dexie database
 * Replaces dexie-react-hooks for better compatibility with React 19
 */
export function useLiveQuery<T>(
  querier: () => T | Promise<T>,
  deps: DependencyList = []
): T | undefined {
  const [result, setResult] = useState<T | undefined>(undefined);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    const updateResult = async () => {
      try {
        const value = await querier();
        if (!cancelled && mountedRef.current) {
          setResult(value);
        }
      } catch (error) {
        console.error('Error in useLiveQuery:', error);
        if (!cancelled && mountedRef.current) {
          setResult(undefined);
        }
      }
    };

    // Initial query
    updateResult();

    // Set up polling for changes (every 500ms)
    // This is a simple implementation. For production, you might want
    // to use Dexie's observable capabilities or a more sophisticated approach
    const intervalId = setInterval(updateResult, 500);

    return () => {
      cancelled = true;
      mountedRef.current = false;
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return result;
}
