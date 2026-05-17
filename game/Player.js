import { FIELD } from "./Field.js";
import { getPlayerDrawScale } from "../core/MobileLayout.js";

export class Player {
  constructor(options = {}) {
    const {
      x = FIELD.x + FIELD.width * 0.25,
      y = FIELD.y + FIELD.height * 0.5,
      color = "#ffffff",
    } = options;

    this.radius = 33;
    this.maxSpeed = 500;
    this.x = x;
    this.y = y;
    this.color = color;
    this.secondaryColor = null;
    this.skinType = "color";
    /** @type {HTMLImageElement | null} */
    this.skinImage = null;
    this.vx = 0;
    this.vy = 0;
    this.prevX = x;
    this.prevY = y;
  }

  update(target, deltaTime) {
    if (!target || !target.isActive || !Number.isFinite(deltaTime) || deltaTime <= 0) {
      this.vx = 0;
      this.vy = 0;
      return;
    }

    this.prevX = this.x;
    this.prevY = this.y;

    this.x = target.x;
    this.y = target.y;

    this.x = Math.max(FIELD.x + this.radius, Math.min(FIELD.x + FIELD.width - this.radius, this.x));
    this.y = Math.max(FIELD.y + this.radius, Math.min(FIELD.y + FIELD.height - this.radius, this.y));

    const rawVx = (this.x - this.prevX) / deltaTime;
    const rawVy = (this.y - this.prevY) / deltaTime;
    const rawSpeed = Math.hypot(rawVx, rawVy);
    const maxPhysicsSpeed = 900;

    if (rawSpeed > maxPhysicsSpeed && rawSpeed > 0) {
      const scale = maxPhysicsSpeed / rawSpeed;
      this.vx = rawVx * scale;
      this.vy = rawVy * scale;
    } else {
      this.vx = rawVx;
      this.vy = rawVy;
    }
  }

  moveTowards(targetX, targetY, deltaTime, maxSpeed) {
    if (!Number.isFinite(targetX) || !Number.isFinite(targetY) || !Number.isFinite(deltaTime) || deltaTime <= 0) {
      this.vx = 0;
      this.vy = 0;
      return;
    }

    this.prevX = this.x;
    this.prevY = this.y;
    const speed = Number.isFinite(maxSpeed) ? maxSpeed : this.maxSpeed;

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.hypot(dx, dy);
    const maxStep = speed * deltaTime;

    if (distance > 0.001) {
      const step = Math.min(distance, maxStep);
      this.x += (dx / distance) * step;
      this.y += (dy / distance) * step;
    }

    this.x = Math.max(FIELD.x + this.radius, Math.min(FIELD.x + FIELD.width - this.radius, this.x));
    this.y = Math.max(FIELD.y + this.radius, Math.min(FIELD.y + FIELD.height - this.radius, this.y));

    this.vx = (this.x - this.prevX) / deltaTime;
    this.vy = (this.y - this.prevY) / deltaTime;
  }

  draw(ctx) {
    const rVis = this.radius * getPlayerDrawScale();

    if (this.skinType === "image" && this.skinImage) {
      const img = this.skinImage;
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, rVis, 0, Math.PI * 2);
      ctx.clip();
      if (img.complete && img.naturalWidth > 0) {
        const scale = Math.max((2 * rVis) / img.width, (2 * rVis) / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, this.x - w / 2, this.y - h / 2, w, h);
      } else {
        ctx.fillStyle = this.color || "#cfd8dc";
        ctx.fillRect(this.x - rVis, this.y - rVis, rVis * 2, rVis * 2);
      }
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(this.x, this.y, rVis, 0, Math.PI * 2);

      if (this.skinType === "dual" && this.secondaryColor) {
        const grad = ctx.createLinearGradient(this.x - rVis, this.y - rVis, this.x + rVis, this.y + rVis);
        grad.addColorStop(0, this.color);
        grad.addColorStop(1, this.secondaryColor);
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = this.color;
      }
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(this.x, this.y, rVis, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#1e293b";
    ctx.stroke();
  }
}
