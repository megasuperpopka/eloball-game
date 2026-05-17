export const FIELD = {
  x: 0,
  y: 0,
  width: 1200,
  height: 700,
  lineWidth: 4,
  centerCircleRadius: 86,
  penaltyBoxWidth: 180,
  penaltyBoxHeight: 320,
  goalBoxWidth: 70,
  goalBoxHeight: 170,
};

const GOAL_HEIGHT = 260;

export const GOALS = {
  left: {
    x: FIELD.x,
    y: FIELD.y + FIELD.height / 2 - GOAL_HEIGHT / 2,
    width: 18,
    height: GOAL_HEIGHT,
  },
  right: {
    x: FIELD.x + FIELD.width - 18,
    y: FIELD.y + FIELD.height / 2 - GOAL_HEIGHT / 2,
    width: 18,
    height: GOAL_HEIGHT,
  },
};

/** Для {@link ../systems/Physics.js} `checkGoal` и устаревшего `Match.js`: границы ворот по Y и линии поля по X. */
export const FIELD_CONFIG = {
  width: FIELD.width,
  height: FIELD.height,
  goalTop: GOALS.left.y,
  goalBottom: GOALS.left.y + GOALS.left.height,
  left: FIELD.x,
  right: FIELD.x + FIELD.width,
};

export function drawField(ctx) {
  const cx = FIELD.x + FIELD.width / 2;
  const cy = FIELD.y + FIELD.height / 2;

  // Основной градиент травы
  const grassGradient = ctx.createLinearGradient(FIELD.x, FIELD.y, FIELD.x, FIELD.y + FIELD.height);
  grassGradient.addColorStop(0, "#2ea24f");
  grassGradient.addColorStop(1, "#238344");
  ctx.fillStyle = grassGradient;
  ctx.fillRect(FIELD.x, FIELD.y, FIELD.width, FIELD.height);

  // Полосы газона
  const stripeWidth = FIELD.width / 12;
  for (let i = 0; i < 12; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
    ctx.fillRect(FIELD.x + i * stripeWidth, FIELD.y, stripeWidth, FIELD.height);
  }

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = FIELD.lineWidth;

  // Внешняя рамка поля
  ctx.strokeRect(FIELD.x + 2, FIELD.y + 2, FIELD.width - 4, FIELD.height - 4);

  // Центральная линия
  ctx.beginPath();
  ctx.moveTo(cx, FIELD.y);
  ctx.lineTo(cx, FIELD.y + FIELD.height);
  ctx.stroke();

  // Центральный круг + точка
  ctx.beginPath();
  ctx.arc(cx, cy, FIELD.centerCircleRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  drawBoxes(ctx);
  drawGoals(ctx);
}

function drawBoxes(ctx) {
  const cy = FIELD.y + FIELD.height / 2;

  // Штрафные
  ctx.strokeRect(
    FIELD.x,
    cy - FIELD.penaltyBoxHeight / 2,
    FIELD.penaltyBoxWidth,
    FIELD.penaltyBoxHeight
  );
  ctx.strokeRect(
    FIELD.x + FIELD.width - FIELD.penaltyBoxWidth,
    cy - FIELD.penaltyBoxHeight / 2,
    FIELD.penaltyBoxWidth,
    FIELD.penaltyBoxHeight
  );

  // Вратарские
  ctx.strokeRect(FIELD.x, cy - FIELD.goalBoxHeight / 2, FIELD.goalBoxWidth, FIELD.goalBoxHeight);
  ctx.strokeRect(
    FIELD.x + FIELD.width - FIELD.goalBoxWidth,
    cy - FIELD.goalBoxHeight / 2,
    FIELD.goalBoxWidth,
    FIELD.goalBoxHeight
  );

  // Точки пенальти
  ctx.beginPath();
  ctx.arc(FIELD.x + 120, cy, 4, 0, Math.PI * 2);
  ctx.arc(FIELD.x + FIELD.width - 120, cy, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
}

function drawGoals(ctx) {
  const netColor = "rgba(255,255,255,0.2)";

  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(GOALS.left.x, GOALS.left.y, GOALS.left.width, GOALS.left.height);
  ctx.fillRect(GOALS.right.x, GOALS.right.y, GOALS.right.width, GOALS.right.height);

  ctx.strokeStyle = netColor;
  ctx.lineWidth = 1;

  drawNet(ctx, GOALS.left.x, GOALS.left.y, GOALS.left.width, GOALS.left.height);
  drawNet(ctx, GOALS.right.x, GOALS.right.y, GOALS.right.width, GOALS.right.height);
}

function drawNet(ctx, x, y, width, height) {
  const step = 9;

  for (let xi = x; xi <= x + width; xi += step) {
    ctx.beginPath();
    ctx.moveTo(xi, y);
    ctx.lineTo(xi, y + height);
    ctx.stroke();
  }

  for (let yi = y; yi <= y + height; yi += step) {
    ctx.beginPath();
    ctx.moveTo(x, yi);
    ctx.lineTo(x + width, yi);
    ctx.stroke();
  }
}
