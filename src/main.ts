import "./style.css";
import { ASSET_MANIFEST, MAP_WIDTH } from "./assetsConfig";
import {
  type Bounds,
  generateScene,
  type HitRegion,
  type Point,
} from "./engine";
import { createInteraction } from "./interaction";

const FEEDBACK_DISPLAY_DURATION = 1400;
const FEEDBACK_LABEL_BOTTOM_THRESHOLD = 68;
const FEEDBACK_LABEL_RIGHT_MARGIN = 200;
const HIT_FEEDBACK_LABELS = {
  success: "Hai trovato Viovvy!",
  error: "Non è lei",
} as const;

function getElement<T extends Element = HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Elemento DOM non trovato: ${selector}`);
  }

  return element;
}

const refs = {
  regenerateButton: getElement<HTMLButtonElement>("#regenerate-button"),
  sceneStage: getElement<HTMLElement>("#scene-stage"),
  statusBadge: getElement<HTMLElement>("#status-badge"),
  statusMessage: getElement<HTMLElement>("#status-message"),
  hitFeedbackTemplate: getElement<HTMLTemplateElement>(
    "#hit-feedback-template",
  ),
  targetPreview: getElement<HTMLImageElement>("#target-preview"),
  viewport: getElement<HTMLElement>("#viewport"),
};

const STATE = {
  loading: "loading",
  playing: "playing",
  victory: "victory",
  error: "error",
} as const;
type State = typeof STATE[keyof typeof STATE];

const STATUS_CONTENT: Record<State, { badge: string; message: string }> = {
  [STATE.loading]: {
    badge: "Sto preparando la scena",
    message: "Creo una nuova folla da esplorare.",
  },
  [STATE.playing]: {
    badge: "In cerca",
    message: "Trascina, fai zoom e tocca quando pensi di aver trovato Viovvy.",
  },
  [STATE.victory]: {
    badge: "Hai trovato Viovvy!",
    message: "Sì, è proprio lei!",
  },
  [STATE.error]: {
    badge: "Errore di caricamento",
    message: "Non riesco a caricare la scena. Prova di nuovo.",
  },
};

let currentState: State = STATE.loading;
let currentHitRegions: HitRegion[] = [];
let activeFeedback: HTMLElement | null = null;
let currentInteraction: { destroy(): void } | null = null;
let isGenerating = false;
let feedbackCleanupTimer = 0;

refs.targetPreview.src = ASSET_MANIFEST.target;
refs.targetPreview.decoding = "async";

function setState(state: State, message = STATUS_CONTENT[state].message) {
  currentState = state;
  refs.statusBadge.dataset.state = state;
  refs.statusBadge.textContent = STATUS_CONTENT[state].badge;
  refs.statusMessage.textContent = message;
}

function isPointInsideBounds(
  point: Point,
  bounds: Bounds,
) {
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}

function clearFeedback() {
  if (feedbackCleanupTimer) {
    clearTimeout(feedbackCleanupTimer);
    feedbackCleanupTimer = 0;
  }

  if (activeFeedback) {
    activeFeedback.remove();
    activeFeedback = null;
  }
}

function clearScene() {
  if (currentInteraction) {
    currentInteraction.destroy();
    currentInteraction = null;
  }

  clearFeedback();
  refs.sceneStage.replaceChildren();
  refs.viewport.classList.remove("is-victory");
  currentHitRegions = [];
}

function shouldPlaceLabelBelow(bounds: Bounds) {
  return bounds.y < FEEDBACK_LABEL_BOTTOM_THRESHOLD;
}

function shouldAlignLabelToEnd(bounds: Bounds) {
  return bounds.x + bounds.width > MAP_WIDTH - FEEDBACK_LABEL_RIGHT_MARGIN;
}

function createHitFeedback(region: HitRegion, variant: "success" | "error") {
  const feedback = refs.hitFeedbackTemplate.content.firstElementChild!
    .cloneNode(true) as HTMLElement;
  const labelElement = feedback.querySelector(
    ".hit-feedback__label",
  ) as HTMLElement;
  const { bounds } = region;

  feedback.hidden = false;
  feedback.dataset.variant = variant;
  feedback.style.left = `${bounds.x}px`;
  feedback.style.top = `${bounds.y}px`;
  feedback.style.width = `${bounds.width}px`;
  feedback.style.height = `${bounds.height}px`;
  labelElement.textContent = HIT_FEEDBACK_LABELS[variant] ?? "";

  if (shouldPlaceLabelBelow(bounds)) {
    feedback.classList.add("hit-feedback--below");
  }

  if (shouldAlignLabelToEnd(bounds)) {
    feedback.classList.add("hit-feedback--align-end");
  }

  return feedback;
}

function showHitFeedback(
  region: HitRegion,
  variant: "success" | "error",
  { persist = false } = {},
) {
  clearFeedback();

  const feedback = createHitFeedback(region, variant);
  refs.sceneStage.append(feedback);
  activeFeedback = feedback;

  if (!persist) {
    feedbackCleanupTimer = window.setTimeout(() => {
      if (activeFeedback === feedback) {
        feedback.remove();
        activeFeedback = null;
      }
    }, FEEDBACK_DISPLAY_DURATION);
  }
}

function findTopmostHitRegion(point: Point) {
  for (let index = currentHitRegions.length - 1; index >= 0; index -= 1) {
    const region = currentHitRegions[index];

    if (isPointInsideBounds(point, region.bounds)) {
      return region;
    }
  }

  return null;
}

function handleMapClick(point: Point) {
  if (currentState !== STATE.playing) {
    return;
  }

  const hitRegion = findTopmostHitRegion(point);

  if (!hitRegion) {
    clearFeedback();
    setState(
      STATE.playing,
      "Tocca un personaggio della folla per fare un tentativo.",
    );
    return;
  }

  if (hitRegion.type === "target") {
    showHitFeedback(hitRegion, "success", { persist: true });
    refs.viewport.classList.add("is-victory");
    setState(
      STATE.victory,
      "Sì, è proprio lei! Se vuoi, genera una nuova scena.",
    );
    return;
  }

  showHitFeedback(hitRegion, "error");
  setState(STATE.playing, "Questa non è Viovvy. Continua a cercarla.");
}

async function startRound(): Promise<void> {
  if (isGenerating) {
    return;
  }

  isGenerating = true;
  refs.regenerateButton.disabled = true;
  clearScene();
  setState(STATE.loading, "Sto preparando una nuova folla.");

  try {
    const { canvas, hitRegions } = await generateScene();

    canvas.className = "scene-canvas";
    currentHitRegions = hitRegions;
    refs.sceneStage.append(canvas);

    currentInteraction = createInteraction({
      viewport: refs.viewport,
      stage: refs.sceneStage,
      canvas,
      onMapClick: handleMapClick,
    });

    setState(STATE.playing);
  } catch (error) {
    console.error(error);
    setState(STATE.error, "Non riesco a caricare la scena. Prova di nuovo.");
  } finally {
    refs.regenerateButton.disabled = false;
    isGenerating = false;
  }
}

refs.regenerateButton.addEventListener("click", () => void startRound());

startRound();
