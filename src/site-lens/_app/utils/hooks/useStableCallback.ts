import {useCallback, useRef} from 'react';

// Identity-stable callback wrapper: the returned function keeps a constant
// reference across renders but always invokes the latest closure.
export function useStableCallback<T extends (...args: any[]) => any>(callback: T): T {
  const ref = useRef(callback);
  ref.current = callback;
  return useCallback((...args: any[]) => ref.current(...args), []) as T;
}
