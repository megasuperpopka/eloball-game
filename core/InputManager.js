export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.pointerPosition = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      isActive: false,
    };

    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);

    window.addEventListener("mousemove", this.handleMouseMove);
    window.addEventListener("mouseleave", this.handleMouseLeave);
    window.addEventListener("touchstart", this.handleTouchStart, { passive: false });
    window.addEventListener("touchmove", this.handleTouchMove, { passive: false });
    window.addEventListener("touchend", this.handleTouchEnd);
    window.addEventListener("touchcancel", this.handleTouchEnd);
  }

  getPointerPosition() {
    return { ...this.pointerPosition };
  }

  destroy() {
    window.removeEventListener("mousemove", this.handleMouseMove);
    window.removeEventListener("mouseleave", this.handleMouseLeave);
    window.removeEventListener("touchstart", this.handleTouchStart);
    window.removeEventListener("touchmove", this.handleTouchMove);
    window.removeEventListener("touchend", this.handleTouchEnd);
    window.removeEventListener("touchcancel", this.handleTouchEnd);
  }

  handleMouseMove(event) {
    const normalized = this.normalizeClientPosition(event.clientX, event.clientY);
    this.pointerPosition = {
      x: normalized.x,
      y: normalized.y,
      isActive: true,
    };
  }

  handleMouseLeave() {
    this.pointerPosition.isActive = false;
  }

  handleTouchStart(event) {
    if (event.touches.length === 0) {
      return;
    }

    event.preventDefault();
    const touch = event.touches[0];
    const normalized = this.normalizeClientPosition(touch.clientX, touch.clientY);
    this.pointerPosition = {
      x: normalized.x,
      y: normalized.y,
      isActive: true,
    };
  }

  handleTouchMove(event) {
    if (event.touches.length === 0) {
      return;
    }

    event.preventDefault();
    const touch = event.touches[0];
    const normalized = this.normalizeClientPosition(touch.clientX, touch.clientY);
    this.pointerPosition = {
      x: normalized.x,
      y: normalized.y,
      isActive: true,
    };
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
