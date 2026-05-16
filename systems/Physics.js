/**
 * Physics.js — физика для альтернативного потока (game/Match.js): удар по мячу и гол.
 * Основная игра (MatchCore) использует CollisionCore.resolveCollision напрямую.
 */

export { resolveCollision } from "./CollisionCore.js";

/**
 * Столкновение кругов: игрок/бот толкают мяч по нормали.
 * @param {{ x: number; y: number; radius: number; vx: number; vy: number }} a — толкающий
 * @param {{ x: number; y: number; radius: number; vx: number; vy: number }} b — мяч
 * @returns {boolean} был ли передан импульс
 */
export function resolveCircleCollision(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distSq = dx * dx + dy * dy;
  const minDist = a.radius + b.radius;
  const minDistSq = minDist * minDist;

  if (distSq >= minDistSq || distSq < 0.001 * 0.001) return false;

  const dist = Math.sqrt(distSq);

  const nx = dx / dist;
  const ny = dy / dist;

  const overlap = minDist - dist;
  b.x += nx * overlap;
  b.y += ny * overlap;

  const aVelN = a.vx * nx + a.vy * ny;
  const bVelN = b.vx * nx + b.vy * ny;
  const closing = aVelN - bVelN;
  const impulse = Math.max(0, closing) + Math.min(40, overlap * 5 + 0.25);

  b.vx += impulse * nx;
  b.vy += impulse * ny;
  return true;
}

/**
 * Мяч пересёк линию ворот по X в вертикальной зоне ворот.
 *
 * @param {{ x: number; y: number; radius: number }} ball
 * @param {{ left: number; right: number; goalTop: number; goalBottom: number }} fieldConfig — например FIELD_CONFIG из Field.js
 * @returns {"left" | "right" | null}
 */
export function checkGoal(ball, fieldConfig) {
  const { left, right, goalTop, goalBottom } = fieldConfig;
  const r = ball.radius;

  const inGoalZone = ball.y >= goalTop && ball.y <= goalBottom;
  if (!inGoalZone) return null;

  if (ball.x + r < left) return "left";
  if (ball.x - r > right) return "right";

  return null;
}
