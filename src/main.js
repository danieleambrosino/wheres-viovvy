import './style.css';
import {
  ASSET_MANIFEST,
  DISTRACTOR_COUNT,
  MAP_HEIGHT,
  MAP_WIDTH,
} from './assetsConfig.js';
import { generateScene } from './engine.js';
import { createInteraction } from './interaction.js';

const app = document.querySelector('#app');

app.innerHTML = `
  <div class="shell">
    <aside class="panel">
      <div class="panel-copy">
        <p class="eyebrow">Clone procedurale</p>
        <h1>Where's Viovvy?</h1>
        <p class="lead">
          Una scena da ${MAP_WIDTH}x${MAP_HEIGHT} pixel viene composta a runtime con un
          motore paper doll e fusa in un solo canvas statico.
        </p>
      </div>

      <div class="status-card">
        <span id="status-badge" class="status-badge" data-state="loading">Generazione scena</span>
        <p id="status-message" class="message">
          Caricamento asset e composizione della mappa off-screen.
        </p>
      </div>

      <div class="controls">
        <button id="regenerate-button" class="primary-button" type="button">
          Rigenera la scena
        </button>
      </div>

      <div class="legend">
        <div class="target-card">
          <span class="legend-label">Bersaglio</span>
          <img id="target-preview" alt="Anteprima del bersaglio Viovvy" />
        </div>

        <div class="legend-content">
          <div class="stat-row">
            <div class="stat">
              <span>Canvas logico</span>
              <strong>${MAP_WIDTH}x${MAP_HEIGHT}</strong>
            </div>
            <div class="stat">
              <span>Distrattori</span>
              <strong>${DISTRACTOR_COUNT}</strong>
            </div>
          </div>

          <ul class="instructions">
            <li>Trascina la mappa per il pan.</li>
            <li>Usa rotella o pinch per fare zoom.</li>
            <li>Clicca quando pensi di aver trovato Viovvy nella scena logica.</li>
          </ul>
        </div>
      </div>
    </aside>

    <section class="board">
      <div class="board-header">
        <div>
          <p class="eyebrow">Viewport</p>
          <h2 class="board-title">Canvas statico, navigazione GPU-driven</h2>
          <p class="board-copy">
            Pan e zoom agiscono via trasformazioni CSS sul contenitore del canvas,
            senza redraw continuo della folla.
          </p>
        </div>
        <div class="board-chip">panzoom</div>
      </div>

      <div id="viewport" class="viewport" aria-label="Mappa giocabile di Where's Viovvy?">
        <div id="scene-stage" class="scene-stage"></div>
        <div class="viewport-banner" aria-live="polite">
          <strong>Viovvy localizzato</strong>
          <span>Rigenera la scena per una nuova composizione procedurale.</span>
        </div>
      </div>
    </section>
  </div>
`;

const refs = {
  regenerateButton: document.querySelector('#regenerate-button'),
  sceneStage: document.querySelector('#scene-stage'),
  statusBadge: document.querySelector('#status-badge'),
  statusMessage: document.querySelector('#status-message'),
  targetPreview: document.querySelector('#target-preview'),
  viewport: document.querySelector('#viewport'),
};

const STATE = Object.freeze({
  loading: 'loading',
  playing: 'playing',
  victory: 'victory',
  error: 'error',
});

const LABELS = Object.freeze({
  [STATE.loading]: 'Generazione scena',
  [STATE.playing]: 'Partita in corso',
  [STATE.victory]: 'Bersaglio trovato',
  [STATE.error]: 'Errore',
});

let currentState = STATE.loading;
let currentTargetBounds = null;
let currentMarker = null;
let currentInteraction = null;
let isGenerating = false;

refs.targetPreview.src = ASSET_MANIFEST.target;

function setState(state, message) {
  currentState = state;
  refs.statusBadge.dataset.state = state;
  refs.statusBadge.textContent = LABELS[state];
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
  const marker = document.createElement('div');
  marker.className = 'target-marker';
  marker.hidden = true;
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
    setState(
      STATE.victory,
      'Coordinate corrette: Viovvy era dentro il bounding box tracciato sul canvas.'
    );
    return;
  }

  refs.statusMessage.textContent = 'Quello non era Viovvy. Continua a cercare nella folla.';
}

async function startRound() {
  if (isGenerating) {
    return;
  }

  isGenerating = true;
  refs.regenerateButton.disabled = true;
  clearScene();
  setState(STATE.loading, 'Assemblaggio dello sfondo, del bersaglio e dei distrattori.');

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

    setState(
      STATE.playing,
      'La scena e pronta. Pan e zoom sono attivi: clicca appena pensi di averlo individuato.'
    );
  } catch (error) {
    console.error(error);
    setState(
      STATE.error,
      'Generazione fallita. Verifica il manifest degli asset o la leggibilita dei file in public/assets.'
    );
  } finally {
    refs.regenerateButton.disabled = false;
    isGenerating = false;
  }
}

refs.regenerateButton.addEventListener('click', () => {
  startRound();
});

startRound();
