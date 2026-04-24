import { useCallback, useState } from "react";

export function useLoadingState(initialLoading = true) {
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);

  const withLoading = useCallback(async (fn: () => Promise<void>) => {
    setLoading(true);
    setError(null);
    try {
      await fn();
    } catch (e: any) {
      setError(e?.message ?? "Щось пішло не так");
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, setLoading, withLoading };
}
