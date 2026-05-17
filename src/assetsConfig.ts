export const MAP_WIDTH = 2400;
export const MAP_HEIGHT = 2400;
export const SPRITE_WIDTH = 120;
export const SPRITE_HEIGHT = 150;
export const DISTRACTOR_COUNT = 350;

export const PAPER_DOLL_LAYERS = ['bodies', 'heads', 'hairs', 'faceAccessories', 'headwear'] as const;
export type PaperDollLayer = typeof PAPER_DOLL_LAYERS[number];

export interface AssetManifest {
  background: string;
  target: string;
  bodies: string[];
  heads: string[];
  hairs: string[];
  faceAccessories: string[];
  headwear: string[];
}

export const ASSET_MANIFEST: AssetManifest = {
  // Use Vite's BASE URL so paths work when deployed under a subpath
  // (e.g. GitHub Pages). import.meta.env.BASE_URL is injected by Vite.
  background: `${import.meta.env.BASE_URL}assets/background_square.svg`,
  target: `${import.meta.env.BASE_URL}assets/viovvy_classic.svg`,
  bodies: [
    `${import.meta.env.BASE_URL}assets/body_blue_overall.svg`,
    `${import.meta.env.BASE_URL}assets/body_green_hoodie.svg`,
    `${import.meta.env.BASE_URL}assets/body_orange_cardigan.svg`,
    `${import.meta.env.BASE_URL}assets/body_cream_jacket.svg`,
  ],
  heads: [
    `${import.meta.env.BASE_URL}assets/head_fair.svg`,
    `${import.meta.env.BASE_URL}assets/head_olive.svg`,
    `${import.meta.env.BASE_URL}assets/head_deep.svg`,
  ],
  hairs: [
    `${import.meta.env.BASE_URL}assets/hair_black_wave.svg`,
    `${import.meta.env.BASE_URL}assets/hair_brown_curl.svg`,
    `${import.meta.env.BASE_URL}assets/hair_blonde_bob.svg`,
    `${import.meta.env.BASE_URL}assets/hair_silver_buzz.svg`,
  ],
  faceAccessories: [
    `${import.meta.env.BASE_URL}assets/none.svg`,
    `${import.meta.env.BASE_URL}assets/accessory_round_glasses.svg`,
    `${import.meta.env.BASE_URL}assets/accessory_beard.svg`,
  ],
  headwear: [
    `${import.meta.env.BASE_URL}assets/none.svg`,
    `${import.meta.env.BASE_URL}assets/headwear_red_beanie.svg`,
    `${import.meta.env.BASE_URL}assets/headwear_teal_cap.svg`,
  ],
};
