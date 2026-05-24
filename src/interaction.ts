import panzoom, { type PanzoomInstance } from "panzoom";

import { MAP_HEIGHT, MAP_WIDTH } from "./assetsConfig";
import { type Point } from "./engine";

const DRAG_THRESHOLD = 8;
const PANZOOM_BOUNDS_PADDING = 0.12;
const PANZOOM_MAX_ZOOM = 4.8;
const PANZOOM_MIN_ZOOM = 0.14;
const PANZOOM_ZOOM_DOUBLE_CLICK_SPEED = 1;

export function createInteraction({
  viewport,
  stage,
  canvas,
  onMapClick,
}: {
  viewport: HTMLElement;
  stage: HTMLElement;
  canvas: HTMLCanvasElement;
  onMapClick: (point: Point) => void;
}) {
  const instance = panzoom(stage, {
    bounds: true,
    boundsPadding: PANZOOM_BOUNDS_PADDING,
    maxZoom: PANZOOM_MAX_ZOOM,
    minZoom: PANZOOM_MIN_ZOOM,
    smoothScroll: false,
    zoomDoubleClickSpeed: PANZOOM_ZOOM_DOUBLE_CLICK_SPEED,
  });

  let pointerOrigin: Point | null = null;
  let dragged = false;

  const handlePointerDown = (event: PointerEvent) => {
    pointerOrigin = { x: event.clientX, y: event.clientY };
    dragged = false;
    stage.classList.add("is-dragging");
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (!pointerOrigin) {
      return;
    }

    const deltaX = event.clientX - pointerOrigin.x;
    const deltaY = event.clientY - pointerOrigin.y;

    if (Math.hypot(deltaX, deltaY) > DRAG_THRESHOLD) {
      dragged = true;
    }
  };

  const handlePointerEnd = () => {
    pointerOrigin = null;
    stage.classList.remove("is-dragging");
  };

  const handleCanvasPointerUp = (event: PointerEvent) => {
    if (dragged) {
      dragged = false;
      return;
    }

    onMapClick(normalizeClickPosition(event, canvas));
  };

  viewport.addEventListener("pointerdown", handlePointerDown, {
    passive: true,
  });
  viewport.addEventListener("pointermove", handlePointerMove, {
    passive: true,
  });
  window.addEventListener("pointerup", handlePointerEnd, { passive: true });
  window.addEventListener("pointercancel", handlePointerEnd, { passive: true });
  canvas.addEventListener("pointerup", handleCanvasPointerUp, {
    passive: true,
  });

  const resizeObserver = new ResizeObserver(() => {
    fitStageToViewport(stage, viewport, instance);
  });

  resizeObserver.observe(viewport);
  requestAnimationFrame(() => {
    fitStageToViewport(stage, viewport, instance);
  });

  return {
    destroy() {
      resizeObserver.disconnect();
      viewport.removeEventListener("pointerdown", handlePointerDown);
      viewport.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerEnd);
      window.removeEventListener("pointercancel", handlePointerEnd);
      canvas.removeEventListener("pointerup", handleCanvasPointerUp);
      instance.dispose();
      stage.classList.remove("is-dragging");
      stage.style.transform = "";
    },
  };
}

function fitStageToViewport(
  stage: HTMLElement,
  viewport: HTMLElement,
  instance: PanzoomInstance,
) {
  const { width, height } = viewport.getBoundingClientRect();

  if (!width || !height) {
    return;
  }

  const scale = Math.min(width / MAP_WIDTH, height / MAP_HEIGHT);
  const offsetX = (width - MAP_WIDTH * scale) / 2;
  const offsetY = (height - MAP_HEIGHT * scale) / 2;

  instance.zoomAbs(0, 0, scale);
  instance.moveTo(offsetX, offsetY);
  stage.style.transformOrigin = "0 0";
}

function normalizeClickPosition(
  event: PointerEvent | MouseEvent,
  canvas: HTMLCanvasElement,
) {
  const rect = canvas.getBoundingClientRect();

  return {
    x: (event.clientX - rect.left) * (MAP_WIDTH / rect.width),
    y: (event.clientY - rect.top) * (MAP_HEIGHT / rect.height),
  };
}
