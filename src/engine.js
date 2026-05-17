import {
  ASSET_MANIFEST,
  DISTRACTOR_COUNT,
  MAP_HEIGHT,
  MAP_WIDTH,
  PAPER_DOLL_LAYERS,
  SPRITE_HEIGHT,
  SPRITE_WIDTH,
} from './assetsConfig.js';

let loadedAssetsPromise;

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Impossibile caricare l'asset ${source}.`));
    image.src = source;
  });
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(items) {
  return items[randomInt(0, items.length - 1)];
}

function createCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = MAP_WIDTH;
  canvas.height = MAP_HEIGHT;
  return canvas;
}

function createBounds(x, y) {
  return { x, y, width: SPRITE_WIDTH, height: SPRITE_HEIGHT };
}

function randomBounds() {
  return createBounds(
    randomInt(0, MAP_WIDTH - SPRITE_WIDTH),
    randomInt(0, MAP_HEIGHT - SPRITE_HEIGHT)
  );
}

function intersectionArea(a, b) {
  const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return width * height;
}

function createTargetHotspot(bounds) {
  return {
    x: bounds.x + 24,
    y: bounds.y + 16,
    width: 72,
    height: 66,
  };
}

function isDistractorPlacementValid(bounds, targetBounds, targetHotspot) {
  const overlapWithTarget = intersectionArea(bounds, targetBounds);
  const overlapRatio = overlapWithTarget / (targetBounds.width * targetBounds.height);
  return overlapRatio < 0.38 && intersectionArea(bounds, targetHotspot) === 0;
}

function createDistractor(assets, targetBounds) {
  const targetHotspot = createTargetHotspot(targetBounds);
  let bounds = randomBounds();
  let attempts = 0;

  while (attempts < 60 && !isDistractorPlacementValid(bounds, targetBounds, targetHotspot)) {
    bounds = randomBounds();
    attempts += 1;
  }

  return {
    bounds,
    parts: Object.fromEntries(
      PAPER_DOLL_LAYERS.map((layer) => [layer, randomChoice(assets.paperDoll[layer])])
    ),
  };
}

function drawPaperDoll(context, distractor) {
  for (const layer of PAPER_DOLL_LAYERS) {
    context.drawImage(
      distractor.parts[layer],
      distractor.bounds.x,
      distractor.bounds.y,
      distractor.bounds.width,
      distractor.bounds.height
    );
  }
}

async function loadAssets() {
  if (!loadedAssetsPromise) {
    const assetEntries = [
      ['background', ASSET_MANIFEST.background],
      ['target', ASSET_MANIFEST.target],
      ...PAPER_DOLL_LAYERS.flatMap((layer) =>
        ASSET_MANIFEST[layer].map((source, index) => [`${layer}:${index}`, source])
      ),
    ];

    loadedAssetsPromise = Promise.all(
      assetEntries.map(([key, source]) => loadImage(source).then((image) => [key, image]))
    ).then((entries) => {
      const loadedMap = new Map(entries);

      return {
        background: loadedMap.get('background'),
        target: loadedMap.get('target'),
        paperDoll: Object.fromEntries(
          PAPER_DOLL_LAYERS.map((layer) => [
            layer,
            ASSET_MANIFEST[layer].map((_, index) => loadedMap.get(`${layer}:${index}`)),
          ])
        ),
      };
    });
  }

  return loadedAssetsPromise;
}

export async function generateScene() {
  const assets = await loadAssets();
  const canvas = createCanvas();
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Impossibile ottenere il contesto 2D del canvas.');
  }

  context.imageSmoothingEnabled = true;
  context.drawImage(assets.background, 0, 0, MAP_WIDTH, MAP_HEIGHT);

  const targetBounds = randomBounds();
  const distractors = Array.from({ length: DISTRACTOR_COUNT }, () =>
    createDistractor(assets, targetBounds)
  ).sort((left, right) => left.bounds.y - right.bounds.y);
  const splitIndex = Math.floor(distractors.length / 2);

  distractors.slice(0, splitIndex).forEach((distractor) => {
    drawPaperDoll(context, distractor);
  });

  context.drawImage(
    assets.target,
    targetBounds.x,
    targetBounds.y,
    targetBounds.width,
    targetBounds.height
  );

  distractors.slice(splitIndex).forEach((distractor) => {
    drawPaperDoll(context, distractor);
  });

  return { canvas, targetBounds };
}