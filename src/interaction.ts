import panzoom, { type PanzoomInstance } from "panzoom";

import { MAP_HEIGHT, MAP_WIDTH } from "./assetsConfig";
import { type Point } from "./engine";

const DRAG_THRESHOLD = 8;

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
    boundsPadding: 0.12,
    maxZoom: 4.8,
    minZoom: 0.14,
    smoothScroll: false,
    zoomDoubleClickSpeed: 1,
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

  // Fallback for environments that don't support Pointer Events (old iOS Safari).
  let touchFallbackAdded = false;
  const handleTouchEnd = (event: TouchEvent) => {
    if (dragged) {
      dragged = false;
      return;
    }

    const touch = event.changedTouches && event.changedTouches[0];

    if (!touch) return;

    const fakeEvent = {
      clientX: touch.clientX,
      clientY: touch.clientY,
    } as unknown as PointerEvent;
    onMapClick(normalizeClickPosition(fakeEvent, canvas));
  };

  if (typeof PointerEvent === "undefined") {
    canvas.addEventListener("touchend", handleTouchEnd, { passive: true });
    touchFallbackAdded = true;
  }

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
      if (touchFallbackAdded) {
        canvas.removeEventListener("touchend", handleTouchEnd as EventListener);
      }
      instance.dispose();
      stage.classList.remove("is-dragging");
      stage.style.transform = "";
    },
  };
}
