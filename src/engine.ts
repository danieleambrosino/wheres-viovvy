import {
  ASSET_MANIFEST,
  DISTRACTOR_COUNT,
  MAP_HEIGHT,
  MAP_WIDTH,
  PAPER_DOLL_LAYERS,
  SPRITE_HEIGHT,
  SPRITE_WIDTH,
  type PaperDollLayer,
} from './assetsConfig';

interface Bounds { x: number; y: number; width: number; height: number };

interface LoadedAssets {
  background: HTMLImageElement;
  target: HTMLImageElement;
  paperDoll: Record<PaperDollLayer, HTMLImageElement[]>;
}

interface Distractor {
  bounds: Bounds;
  parts: Record<PaperDollLayer, HTMLImageElement>;
}

export type HitRegion = { type: 'distractor' | 'target'; bounds: Bounds };

let loadedAssetsPromise: Promise<LoadedAssets> | undefined;
const MAX_DISTRACTOR_PLACEMENT_ATTEMPTS = 60;
const MAX_DISTRACTOR_GENERATION_ROLLS = DISTRACTOR_COUNT * 3;

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Impossibile caricare l'asset ${source}.`));
    image.src = source;
  });
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(items: T[]): T {
  return items[randomInt(0, items.length - 1)];
}

function createCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = MAP_WIDTH;
  canvas.height = MAP_HEIGHT;
  return canvas;
}

function createBounds(x: number, y: number): Bounds {
  return { x, y, width: SPRITE_WIDTH, height: SPRITE_HEIGHT };
}

function randomBounds(): Bounds {
  return createBounds(randomInt(0, MAP_WIDTH - SPRITE_WIDTH), randomInt(0, MAP_HEIGHT - SPRITE_HEIGHT));
}

function intersectionArea(a: Bounds, b: Bounds): number {
  const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return width * height;
}

function createTargetHotspot(bounds: Bounds): Bounds {
  return {
    x: bounds.x + 24,
    y: bounds.y + 16,
    width: 72,
    height: 66,
  };
}

function isDistractorPlacementValid(bounds: Bounds, targetBounds: Bounds, targetHotspot: Bounds): boolean {
  const overlapWithTarget = intersectionArea(bounds, targetBounds);
  const overlapRatio = overlapWithTarget / (targetBounds.width * targetBounds.height);
  return overlapRatio < 0.38 && intersectionArea(bounds, targetHotspot) === 0;
}

function createDistractor(assets: LoadedAssets, targetBounds: Bounds): Distractor | null {
  const targetHotspot = createTargetHotspot(targetBounds);
  for (let attempts = 0; attempts < MAX_DISTRACTOR_PLACEMENT_ATTEMPTS; attempts += 1) {
    const bounds = randomBounds();

    if (isDistractorPlacementValid(bounds, targetBounds, targetHotspot)) {
      return {
        bounds,
        parts: Object.fromEntries(
          PAPER_DOLL_LAYERS.map((layer) => [layer, randomChoice(assets.paperDoll[layer])])
        ) as Record<PaperDollLayer, HTMLImageElement>,
      };
    }
  }

  return null;
}

function drawPaperDoll(context: CanvasRenderingContext2D, distractor: Distractor) {
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

function createHitRegion(type: HitRegion['type'], bounds: Bounds): HitRegion {
  return {
    type,
    bounds: { ...bounds },
  };
}

function drawDistractors(context: CanvasRenderingContext2D, distractors: Distractor[], hitRegions: HitRegion[]) {
  distractors.forEach((distractor) => {
    drawPaperDoll(context, distractor);
    hitRegions.push(createHitRegion('distractor', distractor.bounds));
  });
}

function createDistractors(assets: LoadedAssets, targetBounds: Bounds): Distractor[] {
  const distractors: Distractor[] = [];

  for (let roll = 0; roll < MAX_DISTRACTOR_GENERATION_ROLLS; roll += 1) {
    const distractor = createDistractor(assets, targetBounds);

    if (distractor) {
      distractors.push(distractor);
    }

    if (distractors.length === DISTRACTOR_COUNT) {
      break;
    }
  }

  return distractors;
}

async function loadAssets(): Promise<LoadedAssets> {
  if (!loadedAssetsPromise) {
    const assetEntries: Array<[string, string]> = [
      ['background', ASSET_MANIFEST.background],
      ['target', ASSET_MANIFEST.target],
      ...PAPER_DOLL_LAYERS.flatMap((layer) =>
        ASSET_MANIFEST[layer].map((source, index) => [`${layer}:${index}`, source])
      ),
    ];

    loadedAssetsPromise = Promise.all(
      assetEntries.map(([key, source]) => loadImage(source).then((image) => [key, image] as const))
    ).then((entries) => {
      const loadedMap = new Map(entries as Array<[string, HTMLImageElement]>);

      return {
        background: loadedMap.get('background')!,
        target: loadedMap.get('target')!,
        paperDoll: Object.fromEntries(
          PAPER_DOLL_LAYERS.map((layer) => [
            layer,
            ASSET_MANIFEST[layer].map((_, index) => loadedMap.get(`${layer}:${index}`)!),
          ])
        ) as Record<PaperDollLayer, HTMLImageElement[]>,
      } as LoadedAssets;
    });
  }

  return loadedAssetsPromise;
}

export async function generateScene(): Promise<{ canvas: HTMLCanvasElement; hitRegions: HitRegion[] }> {
  const assets = await loadAssets();
  const canvas = createCanvas();
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Impossibile ottenere il contesto 2D del canvas.');
  }

  context.imageSmoothingEnabled = true;
  context.drawImage(assets.background, 0, 0, MAP_WIDTH, MAP_HEIGHT);

  const targetBounds = randomBounds();
  const distractors = createDistractors(assets, targetBounds).sort(
    (left, right) => left.bounds.y - right.bounds.y
  );
  const splitIndex = Math.floor(distractors.length / 2);
  const backgroundDistractors = distractors.slice(0, splitIndex);
  const foregroundDistractors = distractors.slice(splitIndex);
  const hitRegions: HitRegion[] = [];

  drawDistractors(context, backgroundDistractors, hitRegions);

  context.drawImage(
    assets.target,
    targetBounds.x,
    targetBounds.y,
    targetBounds.width,
    targetBounds.height
  );
  hitRegions.push(createHitRegion('target', targetBounds));

  drawDistractors(context, foregroundDistractors, hitRegions);

  return { canvas, hitRegions };
}
