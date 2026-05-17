import { FIELD, GOALS } from "./Field.js";
import { getBallDrawScale } from "../core/MobileLayout.js";

export class Ball {
  constructor() {
    this.radius = 22.5;
    this.x = FIELD.x + FIELD.width / 2;
    this.y = FIELD.y + FIELD.height / 2;
    this.vx = 280;
    this.vy = 170;
    this.frictionPerFrame = 0.985;
    this.rotation = 0;
  }

  update(deltaTime) {
    if (!Number.isFinite(deltaTime) || deltaTime <= 0) return;

    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.applyWallBounce();

    const speed = Math.hypot(this.vx, this.vy);
    this.rotation += (speed * deltaTime) / this.radius;

    const frameFactor = deltaTime * 60;
    const friction = Math.pow(this.frictionPerFrame, frameFactor);
    this.vx *= friction;
    this.vy *= friction;

    if (Math.abs(this.vx) < 0.5) this.vx = 0;
    if (Math.abs(this.vy) < 0.5) this.vy = 0;
  }

  draw(ctx) {
    const x = this.x;
    const y = this.y;
    const r = this.radius * getBallDrawScale();

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.translate(x, y);
    ctx.rotate(this.rotation);

    drawPentagon(ctx, 0, 0, r * 0.34, "#111111");
    for (let i = 0; i < 5; i += 1) {
      const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const px = Math.cos(angle) * r * 0.63;
      const py = Math.sin(angle) * r * 0.63;
      drawPentagon(ctx, px, py, r * 0.2, "#111111");
    }
    ctx.restore();

    const glare = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.05, x, y, r);
    glare.addColorStop(0, "rgba(255,255,255,0.75)");
    glare.addColorStop(0.5, "rgba(255,255,255,0.12)");
    glare.addColorStop(1, "rgba(0,0,0,0.1)");

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = glare;
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(17,24,39,0.8)";
    ctx.stroke();
  }

  applyWallBounce() {
    const minX = FIELD.x + this.radius;
    const maxX = FIELD.x + FIELD.width - this.radius;
    const minY = FIELD.y + this.radius;
    const maxY = FIELD.y + FIELD.height - this.radius;
    const goalTop = GOALS.left.y;
    const goalBottom = GOALS.left.y + GOALS.left.height;
    const inGoalWindow = this.y - this.radius >= goalTop && this.y + this.radius <= goalBottom;

    const restitution = 1.32;
    const minBounce = 300;

    if (!inGoalWindow) {
      if (this.x < minX) {
        this.x = minX + 0.25;
        this.vx = Math.max(minBounce, Math.abs(this.vx) * restitution);
      } else if (this.x > maxX) {
        this.x = maxX - 0.25;
        this.vx = -Math.max(minBounce, Math.abs(this.vx) * restitution);
      }
    }

    if (this.y < minY) {
      this.y = minY + 0.25;
      this.vy = Math.max(minBounce, Math.abs(this.vy) * restitution);
    } else if (this.y > maxY) {
      this.y = maxY - 0.25;
      this.vy = -Math.max(minBounce, Math.abs(this.vy) * restitution);
    }

    if (this.x <= minX + 1 || this.x >= maxX - 1) {
      if (Math.abs(this.vy) < minBounce * 0.55) {
        this.vy = (this.vy >= 0 ? 1 : -1) * minBounce * 0.55;
      }
    }
    if (this.y <= minY + 1 || this.y >= maxY - 1) {
      if (Math.abs(this.vx) < minBounce * 0.55) {
        this.vx = (this.vx >= 0 ? 1 : -1) * minBounce * 0.55;
      }
    }
  }
}

function drawPentagon(ctx, cx, cy, radius, color) {
  ctx.beginPath();
  for (let i = 0; i < 5; i += 1) {
    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}
/*
import { FIELD } from "./Field.js";

export class Ball {
  constructor() {
    this.radius = 22.5;
    this.x = FIELD.x + FIELD.width / 2;
    this.y = FIELD.y + FIELD.height / 2;
    this.vx = 280;
    this.vy = 170;
    this.frictionPerFrame = 0.985;
    this.rotation = 0;
  }

  update(deltaTime) {
    if (!Number.isFinite(deltaTime) || deltaTime <= 0) {
      return;
    }

    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;

    this.applyWallBounce();

    const speed = Math.hypot(this.vx, this.vy);
    this.rotation += (speed * deltaTime) / this.radius;

    const frameFactor = deltaTime * 60;
    const friction = Math.pow(this.frictionPerFrame, frameFactor);
    this.vx *= friction;
    this.vy *= friction;

    if (Math.abs(this.vx) < 0.5) this.vx = 0;
    if (Math.abs(this.vy) < 0.5) this.vy = 0;
  }

  draw(ctx) {
    const x = this.x;
    const y = this.y;
    const r = this.radius;

    // База мяча + мягкая тень
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.restore();

    // Рисунок мяча вращаем вместе со скоростью
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.translate(x, y);
    ctx.rotate(this.rotation);

    drawPentagon(ctx, 0, 0, r * 0.34, "#111111");
    for (let i = 0; i < 5; i += 1) {
      const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const px = Math.cos(angle) * r * 0.63;
      const py = Math.sin(angle) * r * 0.63;
      drawPentagon(ctx, px, py, r * 0.2, "#111111");
    }
    ctx.restore();

    // Объёмный блик
    const glare = ctx.createRadialGradient(
      x - r * 0.3,
      y - r * 0.35,
      r * 0.05,
      x,
      y,
      r
    );
    glare.addColorStop(0, "rgba(255,255,255,0.75)");
    glare.addColorStop(0.5, "rgba(255,255,255,0.12)");
    glare.addColorStop(1, "rgba(0,0,0,0.1)");

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = glare;
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(17,24,39,0.8)";
    ctx.stroke();
  }

  applyWallBounce() {
    const minX = FIELD.x + this.radius;
    const maxX = FIELD.x + FIELD.width - this.radius;
    const minY = FIELD.y + this.radius;
    const maxY = FIELD.y + FIELD.height - this.radius;

    if (this.x < minX) {
      this.x = minX;
      this.vx = Math.abs(this.vx);
    } else if (this.x > maxX) {
      this.x = maxX;
      this.vx = -Math.abs(this.vx);
    }

    if (this.y < minY) {
      this.y = minY;
      this.vy = Math.abs(this.vy);
    } else if (this.y > maxY) {
      this.y = maxY;
      this.vy = -Math.abs(this.vy);
    }
  }
}

function drawPentagon(ctx, cx, cy, radius, color) {
  ctx.beginPath();
  for (let i = 0; i < 5; i += 1) {
    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}
import { FIELD } from "./Field.js";

export class Ball {
  constructor() {
    this.radius = 22.5;
    this.x = FIELD.x + FIELD.width / 2;
    this.y = FIELD.y + FIELD.height / 2;
    this.vx = 280;
    this.vy = 170;
    this.frictionPerFrame = 0.985;
  }

  update(deltaTime) {
    if (!Number.isFinite(deltaTime) || deltaTime <= 0) {
      return;
    }

    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;

    this.applyWallBounce();

    // Приводим трение "на кадр" к любому FPS через deltaTime.
    const frameFactor = deltaTime * 60;
    const friction = Math.pow(this.frictionPerFrame, frameFactor);
    this.vx *= friction;
    this.vy *= friction;

    if (Math.abs(this.vx) < 0.5) {
      this.vx = 0;
    }
    if (Math.abs(this.vy) < 0.5) {
      this.vy = 0;
    }
  }

  draw(ctx) {
    // Основа мяча
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#f8fafc";
    ctx.fill();

    // Центральная "чёрная панель"
    drawPentagon(ctx, this.x, this.y, this.radius * 0.35, "#111111");

    // Внешние панели (упрощённый футбольный узор)
    for (let i = 0; i < 5; i += 1) {
      const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const px = this.x + Math.cos(angle) * this.radius * 0.62;
      const py = this.y + Math.sin(angle) * this.radius * 0.62;
      drawPentagon(ctx, px, py, this.radius * 0.2, "#111111");
    }

    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#0f172a";
    ctx.stroke();
  }

  applyWallBounce() {
    const minX = FIELD.x + this.radius;
    const maxX = FIELD.x + FIELD.width - this.radius;
    const minY = FIELD.y + this.radius;
    const maxY = FIELD.y + FIELD.height - this.radius;

    if (this.x < minX) {
      this.x = minX;
      this.vx = Math.abs(this.vx);
    } else if (this.x > maxX) {
      this.x = maxX;
      this.vx = -Math.abs(this.vx);
    }

    if (this.y < minY) {
      this.y = minY;
      this.vy = Math.abs(this.vy);
    } else if (this.y > maxY) {
      this.y = maxY;
      this.vy = -Math.abs(this.vy);
    }
  }
}

function drawPentagon(ctx, cx, cy, radius, color) {
  ctx.beginPath();
  for (let i = 0; i < 5; i += 1) {
    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}
*/
