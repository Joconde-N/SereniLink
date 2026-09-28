import React, { createContext, useContext, useEffect, useLayoutEffect, useState } from "react";
import { applyTheme, isTheme, readTheme } from "../utils/theme";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readTheme);

  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const syncTheme = (event) => {
      if (event.key === "theme" && isTheme(event.newValue) && event.storageArea === window.localStorage) {
        setThemeState(event.newValue);
      }
    };
    window.addEventListener("storage", syncTheme);
    return () => window.removeEventListener("storage", syncTheme);
  }, []);

  const setTheme = (next) => {
    if (isTheme(next)) setThemeState(next);
  };

  const toggle = () => setThemeState((t) => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
