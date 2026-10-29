"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "./api";

export function useResource<T>(loader: () => Promise<T>) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ data: T | null; error: string | null; loading: boolean }>({
    data: null,
    error: null,
    loading: true,
  });
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  useEffect(() => {
    let active = true;
    setState({ data: null, error: null, loading: true });
    loader()
      .then((data) => {
        if (active) setState({ data, error: null, loading: false });
      })
      .catch((error) => {
        if (active)
          setState({
            data: null,
            error: error instanceof ApiError ? error.displayMessage : "เชื่อมต่อไม่สำเร็จ กรุณาลองอีกครั้ง",
            loading: false,
          });
      });
    return () => {
      active = false;
    };
  }, [loader, attempt]);
  return { ...state, retry };
}
