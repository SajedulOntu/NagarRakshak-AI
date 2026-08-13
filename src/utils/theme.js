const THEME_STORAGE_KEY = "dhakaiPakhiTheme";

export const THEMES = {
  DARK: "dark",
  LIGHT: "light",
  SYSTEM: "system",
};

function getSystemTheme() {
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return THEMES.DARK;
  }

  return THEMES.LIGHT;
}

export function getSavedTheme() {
  if (typeof window === "undefined") {
    return THEMES.LIGHT;
  }

  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

  if (
    savedTheme === THEMES.DARK ||
    savedTheme === THEMES.LIGHT ||
    savedTheme === THEMES.SYSTEM
  ) {
    return savedTheme;
  }

  // Default theme = colorful light mode
  return THEMES.LIGHT;
}

export function getResolvedTheme(theme) {
  return theme === THEMES.SYSTEM
    ? getSystemTheme()
    : theme;
}

export function applyTheme(theme) {
  if (typeof document === "undefined") {
    return;
  }

  const resolvedTheme = getResolvedTheme(theme);

  document.documentElement.classList.remove(
    THEMES.DARK,
    THEMES.LIGHT
  );

  document.documentElement.classList.add(resolvedTheme);

  document.documentElement.dataset.theme = theme;
}

export function saveTheme(theme) {
  if (
    theme !== THEMES.DARK &&
    theme !== THEMES.LIGHT &&
    theme !== THEMES.SYSTEM
  ) {
    throw new Error("Invalid application theme.");
  }

  localStorage.setItem(THEME_STORAGE_KEY, theme);

  applyTheme(theme);

  window.dispatchEvent(
    new CustomEvent("dhakai-pakhi-theme-change", {
      detail: {
        theme,
        resolvedTheme: getResolvedTheme(theme),
      },
    })
  );

  return theme;
}

export function initializeTheme() {
  const theme = getSavedTheme();

  applyTheme(theme);

  return theme;
}

export function toggleTheme() {
  const currentTheme = getResolvedTheme(getSavedTheme());

  const nextTheme =
    currentTheme === THEMES.DARK
      ? THEMES.LIGHT
      : THEMES.DARK;

  return saveTheme(nextTheme);
}