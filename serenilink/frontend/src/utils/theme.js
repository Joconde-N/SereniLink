export const isTheme = (value) => value === "light" || value === "dark";

export function readTheme() {
  try {
    const saved = localStorage.getItem("theme");
    return isTheme(saved) ? saved : "dark";
  } catch {
    return "dark";
  }
}

export function applyTheme(theme) {
  if (!isTheme(theme)) return;
  document.body.classList.remove("dark", "light");
  document.body.classList.add(theme);
  document.documentElement.style.colorScheme = theme;
  try {
    localStorage.setItem("theme", theme);
  } catch {
    // Keep switching available even when browser storage is blocked.
  }
}
