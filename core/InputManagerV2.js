export class InputManagerV2 {
  constructor(canvas) {
    this.canvas = canvas;
    this.pointerPosition = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      isActive: false,
    };
    // Тип последнего использованного ввода: "mouse" или "touch".
    // Нужен матчу, чтобы по-разному вести себя на ПК и телефоне.
    this.inputType = "mouse";

    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);

    // Слушаем мышь только на canvas: нет скачков, когда курсор вне игрового поля.
    this.canvas.addEventListener("mousemove", this.handleMouseMove);
    this.canvas.addEventListener("mouseleave", this.handleMouseLeave);
    this.canvas.addEventListener("touchstart", this.handleTouchStart, { passive: false });
    this.canvas.addEventListener("touchmove", this.handleTouchMove, { passive: false });
    this.canvas.addEventListener("touchend", this.handleTouchEnd);
    this.canvas.addEventListener("touchcancel", this.handleTouchEnd);
  }

  getPointerPosition() {
    return { ...this.pointerPosition };
  }

  handleMouseMove(event) {
    const normalized = this.normalizeClientPosition(event.clientX, event.clientY);
    this.pointerPosition = { x: normalized.x, y: normalized.y, isActive: true };
    this.inputType = "mouse";
  }

  handleMouseLeave() {
    this.pointerPosition.isActive = false;
  }

  handleTouchStart(event) {
    if (event.touches.length === 0) return;
    event.preventDefault();
    const touch = event.touches[0];
    const normalized = this.normalizeClientPosition(touch.clientX, touch.clientY);
    this.pointerPosition = { x: normalized.x, y: normalized.y, isActive: true };
    this.inputType = "touch";
  }

  handleTouchMove(event) {
    if (event.touches.length === 0) return;
    event.preventDefault();
    const touch = event.touches[0];
    const normalized = this.normalizeClientPosition(touch.clientX, touch.clientY);
    this.pointerPosition = { x: normalized.x, y: normalized.y, isActive: true };
    this.inputType = "touch";
  }

  handleTouchEnd() {
    this.pointerPosition.isActive = false;
  }

  normalizeClientPosition(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const normalizedX = ((clientX - rect.left) / rect.width) * this.canvas.width;
    const normalizedY = ((clientY - rect.top) / rect.height) * this.canvas.height;

    return {
      x: Math.max(0, Math.min(this.canvas.width, normalizedX)),
      y: Math.max(0, Math.min(this.canvas.height, normalizedY)),
    };
  }
}
