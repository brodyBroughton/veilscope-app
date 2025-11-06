"use client";
import { useEffect, useState } from "react";
type Theme = "system" | "light" | "dark";
const THEME_KEY = "vs-theme";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("system");
  useEffect(() => {
    const saved = (localStorage.getItem(THEME_KEY) as Theme) || "system";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme || "system");
  }, [theme]);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if ((localStorage.getItem(THEME_KEY) as Theme) === "system") {
        document.documentElement.setAttribute("data-theme", "system");
      }
    };
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, []);

  const set = (t: Theme) => { localStorage.setItem(THEME_KEY, t); setTheme(t); };
  return { theme, setTheme: set };
}
