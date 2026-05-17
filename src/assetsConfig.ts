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
  background: '/assets/background_square.svg',
  target: '/assets/viovvy_classic.svg',
  bodies: [
    '/assets/body_blue_overall.svg',
    '/assets/body_green_hoodie.svg',
    '/assets/body_orange_cardigan.svg',
    '/assets/body_cream_jacket.svg',
  ],
  heads: ['/assets/head_fair.svg', '/assets/head_olive.svg', '/assets/head_deep.svg'],
  hairs: [
    '/assets/hair_black_wave.svg',
    '/assets/hair_brown_curl.svg',
    '/assets/hair_blonde_bob.svg',
    '/assets/hair_silver_buzz.svg',
  ],
  faceAccessories: ['/assets/none.svg', '/assets/accessory_round_glasses.svg', '/assets/accessory_beard.svg'],
  headwear: ['/assets/none.svg', '/assets/headwear_red_beanie.svg', '/assets/headwear_teal_cap.svg'],
};
