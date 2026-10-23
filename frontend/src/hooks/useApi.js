"use client";

import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "@/services/api";

/**
 * Run an API call when the page opens and track loading / error state.
 *   const { data, loading, error, reload } = useApi(() => getProducts());
 * Pass a function that returns a Promise. Call reload() to try again.
 */
export default function useApi(request) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    request()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // `request` is intentionally left out: callers pass a new arrow function on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  return { data, loading, error, reload };
}