const STORAGE_KEY = "fischers_mobile_mode";

/** Device-wide preference — on-screen mobile controls. */
export function isMobileModeEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setMobileModeEnabled(on: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
}
