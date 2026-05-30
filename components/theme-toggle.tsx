"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const id = window.setTimeout(() => {
      const stored = window.localStorage.getItem("techchimps-theme");
      const nextTheme = stored === "dark" || stored === "light" ? stored : "dark";
      setTheme(nextTheme);
      document.documentElement.dataset.theme = nextTheme;
    }, 0);

    return () => window.clearTimeout(id);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("techchimps-theme", nextTheme);
  };

  return (
    <button aria-label="Toggle dark mode" className="icon-button" onClick={toggleTheme} type="button">
      {theme === "dark" ? <Sun aria-hidden size={18} /> : <Moon aria-hidden size={18} />}
    </button>
  );
}
