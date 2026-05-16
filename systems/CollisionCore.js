export function resolveCollision(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const minDistance = a.radius + b.radius;
  const distance = Math.hypot(dx, dy);

  if (distance >= minDistance) return false;

  const nx = distance > 0.0001 ? dx / distance : 1;
  const ny = distance > 0.0001 ? dy / distance : 0;
  const overlap = minDistance - distance;

  b.x += nx * overlap;
  b.y += ny * overlap;

  const avx = Number.isFinite(a.vx) ? a.vx : 0;
  const avy = Number.isFinite(a.vy) ? a.vy : 0;
  const bvx = Number.isFinite(b.vx) ? b.vx : 0;
  const bvy = Number.isFinite(b.vy) ? b.vy : 0;

  // Скорость сближения вдоль нормали: только она даёт «сильный» удар.
  // Раньше при closingSpeed <= 0 выходили без импульса — мяч можно было «проглотить»,
  // пока не обгонишь его по скорости. Касание = всегда чуть отталкиваем по overlap.
  const closingSpeed = (avx - bvx) * nx + (avy - bvy) * ny;
  const impulseFromSpeed = Math.max(0, closingSpeed) * 0.35;
  const impulseFromOverlap = Math.min(45, overlap * 9);
  let impulse = Math.min(220, impulseFromSpeed + impulseFromOverlap);
  if (impulse < 26 && overlap > 0.4) impulse = 26;

  b.vx += nx * impulse;
  b.vy += ny * impulse;

  // Лимит скорости, чтобы мяч не "пробивал" границы при сильном зажатии у стен.
  const maxBallSpeed = 900;
  const ballSpeed = Math.hypot(b.vx, b.vy);
  if (ballSpeed > maxBallSpeed) {
    const scale = maxBallSpeed / ballSpeed;
    b.vx *= scale;
    b.vy *= scale;
  }
  return true;
}
