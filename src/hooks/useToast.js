// src/hooks/useToast.js
import { useState, useCallback } from "react";

/**
 * useToast — manages toast notification state.
 *
 * Usage:
 *   const { toast, showToast, clearToast } = useToast();
 *   showToast("Admin saved ✅", "#16a34a");
 */
export function useToast() {
  const [toast, setToast] = useState(null); // { msg, color }

  const showToast = useCallback((msg, color = "#16a34a") => {
    setToast({ msg, color });
  }, []);

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  return { toast, showToast, clearToast };
}
