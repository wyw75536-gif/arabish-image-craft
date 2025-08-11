import { useCallback, useEffect, useState } from "react";

export type ImageHistoryItem = {
  id: string;
  url: string;
  promptAr: string;
  promptEn?: string;
  style?: string;
  createdAt: number;
};

const LS_KEY = "aic_images_v1";
const MAX_ITEMS = 100;

function loadFromStorage(): ImageHistoryItem[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ImageHistoryItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x) => x && typeof x.id === "string" && typeof x.url === "string")
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch {
    return [];
  }
}

function saveToStorage(items: ImageHistoryItem[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {}
}

export function useImageHistory() {
  const [items, setItems] = useState<ImageHistoryItem[]>([]);

  useEffect(() => {
    setItems(loadFromStorage());
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_KEY) {
        setItems(loadFromStorage());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const add = useCallback((item: ImageHistoryItem) => {
    setItems((prev) => {
      const existing = prev.find((x) => x.id === item.id);
      const next = existing
        ? prev.map((x) => (x.id === item.id ? { ...x, ...item } : x))
        : [item, ...prev];
      saveToStorage(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((x) => x.id !== id);
      saveToStorage(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setItems(() => {
      saveToStorage([]);
      return [];
    });
  }, []);

  return { items, add, remove, clear } as const;
}
