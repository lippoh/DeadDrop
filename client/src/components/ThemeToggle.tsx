"use client";

import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 text-yellow-400 transition-transform hover:rotate-45" />
      ) : (
        <Moon className="h-5 w-5 text-slate-700 transition-transform hover:-rotate-12" />
      )}
    </button>
  );
}