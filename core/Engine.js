export class Engine {
  constructor() {
    this.isRunning = false;
    this.lastTimeMs = 0;
    this.maxDeltaTime = 0.05; // Защита от слишком больших скачков dt
    this.updateFn = () => {};
    this.renderFn = () => {};
    this.frameId = null;
    this.loop = this.loop.bind(this);
  }

  setUpdateFn(fn) {
    this.updateFn = typeof fn === "function" ? fn : () => {};
  }

  setRenderFn(fn) {
    this.renderFn = typeof fn === "function" ? fn : () => {};
  }

  start() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.lastTimeMs = performance.now();
    this.frameId = requestAnimationFrame(this.loop);
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  loop(nowMs) {
    if (!this.isRunning) {
      return;
    }

    const rawDeltaTime = (nowMs - this.lastTimeMs) / 1000;
    const deltaTime = Math.min(rawDeltaTime, this.maxDeltaTime);
    this.lastTimeMs = nowMs;

    this.updateFn(deltaTime);
    this.renderFn();

    this.frameId = requestAnimationFrame(this.loop);
  }
}
