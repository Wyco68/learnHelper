"use client";

import SunIcon from "../icons/SunIcon";
import MoonIcon from "../icons/MoonIcon";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-7 w-7 items-center justify-center rounded text-gray-500 hover:bg-black/5 dark:text-gray-400 dark:hover:bg-white/10"
    >
      {theme === "dark" ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
    </button>
  );
}
