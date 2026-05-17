import { isNativeMobileApp } from "../core/MobileLayout.js";

/** Запас «касания» (пиксели): на телефоне круг рисуется крупнее, чем хитбокс. */
function getTouchSlop() {
  return isNativeMobileApp() ? 20 : 12;
}

function segmentHitsCircle(x1, y1, x2, y2, cx, cy, radius) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-6) {
    return Math.hypot(x1 - cx, y1 - cy) <= radius;
  }
  let t = ((cx - x1) * dx + (cy - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const px = x1 + t * dx;
  const py = y1 + t * dy;
  return Math.hypot(px - cx, py - cy) <= radius;
}

/**
 * Столкновение игрок/бот с мячом: достаточно коснуться, не нужно проходить сквозь мяч.
 * @param {{ x: number; y: number; radius: number; vx?: number; vy?: number; prevX?: number; prevY?: number }} a
 * @param {{ x: number; y: number; radius: number; vx: number; vy: number }} b — мяч
 */
export function resolveCollision(a, b) {
  const touchSlop = getTouchSlop();
  const minDistance = a.radius + b.radius;
  const hitRadius = minDistance + touchSlop;

  let dx = b.x - a.x;
  let dy = b.y - a.y;
  let distance = Math.hypot(dx, dy);

  let overlap = minDistance - distance;

  if (distance >= hitRadius) {
    const px = a.prevX;
    const py = a.prevY;
    if (!Number.isFinite(px) || !Number.isFinite(py)) return false;
    if (!segmentHitsCircle(px, py, a.x, a.y, b.x, b.y, hitRadius)) return false;
    overlap = Math.max(overlap, 4);
    dx = b.x - a.x;
    dy = b.y - a.y;
    distance = Math.hypot(dx, dy) || 0.0001;
  }

  const nx = distance > 0.0001 ? dx / distance : 1;
  const ny = distance > 0.0001 ? dy / distance : 0;

  if (overlap > 0) {
    b.x += nx * overlap;
    b.y += ny * overlap;
  } else if (distance > minDistance) {
    const nudge = distance - minDistance + 1.5;
    b.x += nx * nudge;
    b.y += ny * nudge;
    overlap = 1.5;
  }

  const avx = Number.isFinite(a.vx) ? a.vx : 0;
  const avy = Number.isFinite(a.vy) ? a.vy : 0;
  const bvx = Number.isFinite(b.vx) ? b.vx : 0;
  const bvy = Number.isFinite(b.vy) ? b.vy : 0;

  const closingSpeed = (avx - bvx) * nx + (avy - bvy) * ny;
  const playerSpeed = Math.hypot(avx, avy);
  const impulseFromSpeed = Math.max(0, closingSpeed) * 0.42 + playerSpeed * 0.12;
  const impulseFromOverlap = Math.min(52, Math.max(overlap, 1) * 10);
  let impulse = Math.min(240, impulseFromSpeed + impulseFromOverlap);

  const minImpulse = distance > minDistance ? 22 : 30;
  if (impulse < minImpulse) impulse = minImpulse;

  b.vx += nx * impulse;
  b.vy += ny * impulse;

  const maxBallSpeed = 920;
  const ballSpeed = Math.hypot(b.vx, b.vy);
  if (ballSpeed > maxBallSpeed) {
    const scale = maxBallSpeed / ballSpeed;
    b.vx *= scale;
    b.vy *= scale;
  }
  return true;
}
