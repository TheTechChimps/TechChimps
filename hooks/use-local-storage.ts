"use client";

import { useEffect, useRef, useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const initialRef = useRef(initialValue);
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const stored = window.localStorage.getItem(key);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as T;
          const merged =
            parsed &&
            initialRef.current &&
            typeof parsed === "object" &&
            typeof initialRef.current === "object" &&
            !Array.isArray(parsed)
              ? ({ ...initialRef.current, ...parsed } as T)
              : parsed;
          setValue(merged);
        } catch {
          setValue(initialRef.current);
        }
      }
      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(id);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [hydrated, key, value]);

  return [value, setValue] as const;
}
