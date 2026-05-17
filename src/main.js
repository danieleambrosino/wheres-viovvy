import './style.css';
import { ASSET_MANIFEST } from './assetsConfig.js';
import { generateScene } from './engine.js';
import { createInteraction } from './interaction.js';

function getElement(selector) {
  const element = document.querySelector(selector);

  if (!element) {
    throw new Error(`Elemento DOM non trovato: ${selector}`);
  }

  return element;
}

const refs = {
  regenerateButton: getElement('#regenerate-button'),
  sceneStage: getElement('#scene-stage'),
  statusBadge: getElement('#status-badge'),
  statusMessage: getElement('#status-message'),
  targetMarkerTemplate: getElement('#target-marker-template'),
  targetPreview: getElement('#target-preview'),
  viewport: getElement('#viewport'),
};

const STATE = Object.freeze({
  loading: 'loading',
  playing: 'playing',
  victory: 'victory',
  error: 'error',
});

const STATUS_CONTENT = Object.freeze({
  [STATE.loading]: {
    badge: 'Sto preparando la scena',
    message: 'Ancora un attimo e puoi iniziare a cercare.',
  },
  [STATE.playing]: {
    badge: 'Inizia a cercare',
    message: 'Muoviti sulla mappa e clicca appena pensi di aver visto Viovvy.',
  },
  [STATE.victory]: {
    badge: 'Trovato',
    message: 'Giusto. Era proprio Viovvy.',
  },
  [STATE.error]: {
    badge: 'Riprova',
    message: 'Non riesco a caricare la scena. Prova di nuovo.',
  },
});

let currentState = STATE.loading;
let currentTargetBounds = null;
let currentMarker = null;
let currentInteraction = null;
let isGenerating = false;

refs.targetPreview.src = ASSET_MANIFEST.target;
refs.targetPreview.decoding = 'async';

function setState(state, message = STATUS_CONTENT[state].message) {
  currentState = state;
  refs.statusBadge.dataset.state = state;
  refs.statusBadge.textContent = STATUS_CONTENT[state].badge;
  refs.statusMessage.textContent = message;
}

function isPointInsideBounds(point, bounds) {
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}

function clearScene() {
  if (currentInteraction) {
    currentInteraction.destroy();
    currentInteraction = null;
  }

  refs.sceneStage.replaceChildren();
  refs.viewport.classList.remove('is-victory');
  currentMarker = null;
  currentTargetBounds = null;
}

function createTargetMarker(bounds) {
  const marker = refs.targetMarkerTemplate.content.firstElementChild.cloneNode(true);
  marker.style.left = `${bounds.x}px`;
  marker.style.top = `${bounds.y}px`;
  marker.style.width = `${bounds.width}px`;
  marker.style.height = `${bounds.height}px`;
  return marker;
}

function handleMapClick(point) {
  if (currentState !== STATE.playing || !currentTargetBounds) {
    return;
  }

  if (isPointInsideBounds(point, currentTargetBounds)) {
    if (currentMarker) {
      currentMarker.hidden = false;
    }

    refs.viewport.classList.add('is-victory');
    setState(STATE.victory);
    return;
  }

  setState(STATE.playing, 'No, continua a cercare.');
}

async function startRound() {
  if (isGenerating) {
    return;
  }

  isGenerating = true;
  refs.regenerateButton.disabled = true;
  clearScene();
  setState(STATE.loading, 'Sto preparando una nuova folla.');

  try {
    const { canvas, targetBounds } = await generateScene();

    canvas.className = 'scene-canvas';
    currentTargetBounds = targetBounds;
    currentMarker = createTargetMarker(targetBounds);
    refs.sceneStage.append(canvas, currentMarker);

    currentInteraction = createInteraction({
      viewport: refs.viewport,
      stage: refs.sceneStage,
      canvas,
      onMapClick: handleMapClick,
    });

    setState(STATE.playing);
  } catch (error) {
    console.error(error);
    setState(STATE.error);
  } finally {
    refs.regenerateButton.disabled = false;
    isGenerating = false;
  }
}

refs.regenerateButton.addEventListener('click', startRound);

startRound();
