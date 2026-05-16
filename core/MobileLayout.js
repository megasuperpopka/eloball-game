/**
 * Раскладка только для нативного приложения (Capacitor APK / iOS).
 * В обычном браузере на ПК всё остаётся как было.
 */

/** В APK: визуальный размер игрока, бота и мяча (физика не меняется). */
export const NATIVE_MOBILE_WORLD_DRAW_SCALE = 1.5;

/** @deprecated используй NATIVE_MOBILE_WORLD_DRAW_SCALE */
export const NATIVE_MOBILE_PLAYER_DRAW_SCALE = NATIVE_MOBILE_WORLD_DRAW_SCALE;

/** Кнопки и зоны тапа в UI (меню, магазин, мастер скина и т.д.). */
export const NATIVE_MOBILE_UI_BUTTON_SCALE = 1.5;

export function isNativeMobileApp() {
  try {
    return typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.() === true;
  } catch {
    return false;
  }
}

export function getPlayerDrawScale() {
  return isNativeMobileApp() ? NATIVE_MOBILE_WORLD_DRAW_SCALE : 1;
}

export function getBallDrawScale() {
  return isNativeMobileApp() ? NATIVE_MOBILE_WORLD_DRAW_SCALE : 1;
}

export function getUiButtonScale() {
  return isNativeMobileApp() ? NATIVE_MOBILE_UI_BUTTON_SCALE : 1;
}

/**
 * Увеличивает прямоугольник относительно центра (и отрисовка, и hit-test совпадают).
 * @param {{ x: number, y: number, w: number, h: number }} rect
 * @param {number} scale
 */
export function scaleUiRectAroundCenter(rect, scale) {
  if (!rect || scale === 1) return;
  const nw = rect.w * scale;
  const nh = rect.h * scale;
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  rect.x = cx - nw / 2;
  rect.y = cy - nh / 2;
  rect.w = nw;
  rect.h = nh;
}

/** Увеличить кнопку у правого верхнего угла (правый край на месте). */
export function scaleUiRectAnchorTopRight(rect, scale) {
  if (!rect || scale === 1) return;
  const right = rect.x + rect.w;
  const top = rect.y;
  rect.w *= scale;
  rect.h *= scale;
  rect.x = right - rect.w;
  rect.y = top;
}
