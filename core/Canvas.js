export function createCanvas(container, width = 1200, height = 700) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.style.display = "block";
  canvas.style.backgroundColor = "#101b36";
  // На телефоне без этого браузер часто перехватывает касания (скролл/зум) вместо игры.
  canvas.style.touchAction = "none";

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Не удалось получить 2D контекст canvas.");
  }

  container.innerHTML = "";
  container.appendChild(canvas);

  function resize() {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const viewportAspect = viewportWidth / viewportHeight;
    const canvasAspect = width / height;

    let renderWidth = viewportWidth;
    let renderHeight = viewportHeight;

    if (viewportAspect > canvasAspect) {
      renderWidth = viewportHeight * canvasAspect;
    } else {
      renderHeight = viewportWidth / canvasAspect;
    }

    canvas.style.width = `${renderWidth}px`;
    canvas.style.height = `${renderHeight}px`;
    canvas.style.marginLeft = "";
    canvas.style.marginTop = "";
  }

  function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  window.addEventListener("resize", resize);
  resize();

  return { canvas, ctx, clear, resize };
}
