/**
 * Ориентация экрана в APK: плагин @capacitor/screen-orientation (после npm i и cap sync).
 * В браузере — пробуем Screen Orientation API (часто срабатывает только в полноэкранном режиме).
 */

function nativePlugin() {
  return typeof window !== "undefined" ? window.Capacitor?.Plugins?.ScreenOrientation : undefined;
}

function webTryLock(orientation) {
  if (typeof screen === "undefined" || typeof screen.orientation?.lock !== "function") {
    return Promise.resolve();
  }
  return screen.orientation.lock(orientation).catch(() => undefined);
}

/**
 * @param {"portrait" | "landscape"} mode
 * @returns {Promise<void>}
 */
export function setScreenOrientation(mode) {
  const plugin = nativePlugin();
  if (plugin?.lock) {
    const o = mode === "portrait" ? "portrait" : "landscape";
    return plugin.lock({ orientation: o }).catch(() => webTryLock(o));
  }
  return webTryLock(mode === "portrait" ? "portrait" : "landscape");
}

export function setOrientationPortrait() {
  return setScreenOrientation("portrait");
}

export function setOrientationLandscape() {
  return setScreenOrientation("landscape");
}
