// Applies a forced Light/Dark theme before first paint (spec 001 research R2).
// Reads the same key as src/storage/preferences.ts; any failure falls back to System.
try {
  const raw = localStorage.getItem('zmk-customizer:preferences') ?? '';
  const match = /"theme":"(light|dark)"/u.exec(raw);
  if (match) {
    document.documentElement.dataset.theme = match[1];
  }
} catch {
  // Storage blocked: keep the System theme.
}
