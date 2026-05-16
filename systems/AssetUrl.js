/**
 * Абсолютный URL к файлу из папки `assets/` рядом с корнем игры.
 * Нужен для Capacitor и для `www/`, чтобы пути не зависели только от адреса index.html.
 */
export function resolveGameAssetUrl(relativePath) {
  if (typeof relativePath !== "string") return relativePath;
  const t = relativePath.trim();
  if (!t) return relativePath;
  if (/^https?:\/\//i.test(t) || t.startsWith("data:") || t.startsWith("blob:")) return t;
  try {
    return new URL(`../${t}`, import.meta.url).href;
  } catch {
    return relativePath;
  }
}
