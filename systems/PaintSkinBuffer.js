/** Квадратная текстура для скина: круг с «пустым мячом», рисуем кистью внутри клипа. */
export const PAINT_SKIN_TEXTURE_SIZE = 256;
const R_PAD = 6;

function drawBallBase(ctx, w) {
  const cx = w / 2;
  const cy = w / 2;
  const R = w / 2 - R_PAD;
  ctx.save();
  ctx.clearRect(0, 0, w, w);
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.clip();
  const g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.08, cx, cy, R * 1.05);
  g.addColorStop(0, "#f5f7fa");
  g.addColorStop(0.45, "#dde3ea");
  g.addColorStop(0.85, "#aeb8c4");
  g.addColorStop(1, "#8a939e");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, w);
  ctx.restore();
}

export function createPaintSkinBuffer() {
  const SZ = PAINT_SKIN_TEXTURE_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = SZ;
  canvas.height = SZ;
  /** @type {CanvasRenderingContext2D} */
  const ctx = canvas.getContext("2d");

  function resetTemplate() {
    drawBallBase(ctx, SZ);
  }

  resetTemplate();

  return {
    canvas,
    ctx,
    size: SZ,
    resetTemplate,

    stampLine(fromX, fromY, toX, toY, radius, hexColor, eraser) {
      const cx = SZ / 2;
      const cy = SZ / 2;
      const R = SZ / 2 - R_PAD;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();

      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = radius * 2;
      ctx.strokeStyle = eraser ? "rgba(245,247,250,1)" : hexColor;

      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();
      ctx.restore();
    },

    async loadFromDataUrl(dataUrl) {
      resetTemplate();
      if (!dataUrl || typeof dataUrl !== "string") return;
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          ctx.save();
          const cx = SZ / 2;
          const cy = SZ / 2;
          const R = SZ / 2 - R_PAD;
          ctx.beginPath();
          ctx.arc(cx, cy, R, 0, Math.PI * 2);
          ctx.clip();
          const scale = Math.max((2 * R) / img.width, (2 * R) / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
          ctx.restore();
          resolve();
        };
        img.onerror = () => resolve();
        img.src = dataUrl;
      });
    },

    toDataUrlPng() {
      return canvas.toDataURL("image/png");
    },
  };
}
