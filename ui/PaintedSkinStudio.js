/** Экран «Мастер скина»: несколько слотов, покупка мест за голду, сохранение за коины. */

import { MAX_PAINT_SLOTS } from "../systems/StorageSystem.js";

export const SAVE_PAINT_COINS_COST = 80;

export const PALETTE_COLORS = [
  "#212121",
  "#d32f2f",
  "#ff7043",
  "#ffd54f",
  "#66bb6a",
  "#1976d2",
  "#7e57c2",
  "#ffffff",
];

export const STUDIO_LAYOUT = {
  sphere: { cx: 600, cy: 332, rd: 162 },
  backButton: { x: 20, y: 18, w: 120, h: 48 },
  slotPrevButton: { x: 380, y: 148, w: 56, h: 44 },
  slotNextButton: { x: 764, y: 148, w: 56, h: 44 },
  /** Слева от круга (сфера ~x 438–762), чтобы не перекрывать рисунок. */
  buyExtraSlotButton: { x: 16, y: 228, w: 288, h: 56 },
  clearButton: { x: 340, y: 546, w: 150, h: 44 },
  saveButton: { x: 510, y: 546, w: 280, h: 44 },
  eraseButton: { x: 810, y: 546, w: 120, h: 44 },
  paletteY: 488,
  /** @type {number} На нативном мобильном клиенте выставляется >1 (см. main.js). */
  paletteSwatchScale: 1,
};

export function buildPaletteHitRegions() {
  const { paletteY, paletteSwatchScale = 1 } = STUDIO_LAYOUT;
  const w = 44 * paletteSwatchScale;
  const gap = 12 * paletteSwatchScale;
  const n = PALETTE_COLORS.length;
  const totalW = n * w + (n - 1) * gap;
  const paletteStartX = 600 - totalW / 2;
  return PALETTE_COLORS.map((color, i) => ({
    color,
    rect: { x: paletteStartX + i * (w + gap), y: paletteY, w, h: w },
  }));
}

export function screenToTexture(px, py, texSize, layout = STUDIO_LAYOUT) {
  const { cx, cy, rd } = layout.sphere;
  const span = rd * 2;
  const u = (px - (cx - rd)) / span;
  const v = (py - (cy - rd)) / span;
  if (u < 0 || u > 1 || v < 0 || v > 1) return null;
  return {
    tx: u * texSize,
    ty: v * texSize,
  };
}

/**
 * @param {object} ctx
 * @param {number} slotIndex
 * @param {number} slotTotal
 * @param {boolean} canBuyMore
 * @param {number} extraSlotGoldPrice
 */
export function interpretStudioHit(px, py, slotIndex, slotTotal, canBuyMore) {
  const L = STUDIO_LAYOUT;
  if (inside(px, py, L.backButton)) return { action: "BACK" };

  if (inside(px, py, L.slotPrevButton) && slotTotal > 0) return { action: "SLOT_PREV" };
  if (inside(px, py, L.slotNextButton) && slotTotal > 0) return { action: "SLOT_NEXT" };
  if (canBuyMore && inside(px, py, L.buyExtraSlotButton)) return { action: "BUY_SLOT" };

  const pal = paletteHit(px, py);
  if (pal) return { action: "COLOR", color: pal.color };
  if (inside(px, py, L.clearButton)) return { action: "CLEAR" };
  if (inside(px, py, L.saveButton)) return { action: "SAVE" };
  if (inside(px, py, L.eraseButton)) return { action: "ERASER_TOGGLE" };

  const ddx = px - L.sphere.cx;
  const ddy = py - L.sphere.cy;
  if (ddx * ddx + ddy * ddy <= L.sphere.rd * L.sphere.rd && slotIndex >= 0 && slotIndex < slotTotal) {
    return { action: "PAINT_SURFACE" };
  }

  return null;
}

function inside(px, py, rect) {
  return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}

export function paletteHit(px, py) {
  for (const p of buildPaletteHitRegions()) {
    if (inside(px, py, p.rect)) return { color: p.color };
  }
  return null;
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} opts
 */
export function drawPaintSkinStudio(ctx, opts) {
  const {
    coins = 0,
    gold = 0,
    slotIndex = 0,
    slotTotal = 5,
    canBuyMoreSlots = true,
    extraSlotGoldPrice = 300,
    brushColor,
    eraserMode,
    message = "",
    painterCanvas,
  } = opts;

  const bg = ctx.createLinearGradient(0, 0, 0, 700);
  bg.addColorStop(0, "#0f1729");
  bg.addColorStop(1, "#152038");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1200, 700);

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 44px Arial";
  ctx.fillText("Мастер скина", 600, 86);

  ctx.font = "600 20px Arial";
  ctx.fillStyle = "#b0bec5";
  ctx.fillText(`Коины: ${coins}   ·   Gold: ${gold}`, 600, 120);

  const L = STUDIO_LAYOUT;

  roundedRectStroke(ctx, L.slotPrevButton, "#37474f", "#eceff1");
  roundedRectStroke(ctx, L.slotNextButton, "#37474f", "#eceff1");
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px Arial";
  ctx.fillText("◀", L.slotPrevButton.x + L.slotPrevButton.w / 2, L.slotPrevButton.y + L.slotPrevButton.h / 2);
  ctx.fillText("▶", L.slotNextButton.x + L.slotNextButton.w / 2, L.slotNextButton.y + L.slotNextButton.h / 2);

  ctx.font = "bold 22px Arial";
  ctx.fillStyle = "#e1f5fe";
  ctx.fillText(`Место ${slotIndex + 1} / ${slotTotal}`, 600, L.slotPrevButton.y + L.slotPrevButton.h / 2);

  ctx.font = "500 17px Arial";
  ctx.fillStyle = "rgba(255,255,255,0.58)";
  ctx.fillText(`${slotTotal} из ${MAX_PAINT_SLOTS} максимум · стартово 5 мест`, 600, 176);

  if (canBuyMoreSlots) {
    roundedRectStroke(ctx, L.buyExtraSlotButton, "#6d4c41", "#ffccbc");
    ctx.font = "bold 15px Arial";
    ctx.fillStyle = "#fff";
    const bx = L.buyExtraSlotButton.x + L.buyExtraSlotButton.w / 2;
    const by = L.buyExtraSlotButton.y + L.buyExtraSlotButton.h / 2;
    ctx.fillText("+1 место за голду", bx, by - 9);
    ctx.font = "bold 14px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fillText(`(${extraSlotGoldPrice} gold)`, bx, by + 11);
  }

  const { cx, cy, rd } = L.sphere;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, rd + 10, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, rd, 0, Math.PI * 2);
  ctx.clip();
  const scale = (rd * 2) / painterCanvas.width;
  ctx.drawImage(painterCanvas, cx - rd, cy - rd, rd * 2, rd * 2);
  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cy, rd, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 2;
  ctx.stroke();

  for (const p of buildPaletteHitRegions()) {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.rect.x, p.rect.y, p.rect.w, p.rect.h);
    ctx.strokeStyle = brushColor === p.color && !eraserMode ? "#69f0ae" : "rgba(255,255,255,0.45)";
    ctx.lineWidth = brushColor === p.color && !eraserMode ? 3 : 1.5;
    ctx.strokeRect(p.rect.x, p.rect.y, p.rect.w, p.rect.h);
  }

  roundedRectStroke(ctx, L.clearButton, "#5d4037", "#ffccbc");
  ctx.fillStyle = "#fff";
  ctx.font = "bold 17px Arial";
  ctx.fillText("Очистить", L.clearButton.x + L.clearButton.w / 2, L.clearButton.y + L.clearButton.h / 2);

  roundedRectStroke(ctx, L.saveButton, "#1565c0", "#bbdefb");
  ctx.fillText(`Сохранить (${SAVE_PAINT_COINS_COST} коин)`, L.saveButton.x + L.saveButton.w / 2, L.saveButton.y + L.saveButton.h / 2);

  const erCol = eraserMode ? "#00e676" : "#455a64";
  roundedRectStroke(ctx, L.eraseButton, erCol, "#eceff1");
  ctx.fillStyle = "#fff";
  ctx.fillText("Ластик", L.eraseButton.x + L.eraseButton.w / 2, L.eraseButton.y + L.eraseButton.h / 2);

  roundedRectStroke(ctx, L.backButton, "#455a64", "#eceff1");
  ctx.fillText("Назад", L.backButton.x + L.backButton.w / 2, L.backButton.y + L.backButton.h / 2);

  if (message) {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(240, 620, 720, 44);
    ctx.fillStyle = "#fff9c4";
    ctx.font = "bold 18px Arial";
    ctx.fillText(message, 600, 642);
  }
}

function roundedRectStroke(ctx, rect, fill, stroke) {
  const r = 10;
  const { x, y, w, h } = rect;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.stroke();
}
