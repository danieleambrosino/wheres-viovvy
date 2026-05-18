declare module "panzoom" {
  export interface PanzoomInstance {
    zoomAbs(x: number, y: number, scale: number): void;
    moveTo(x: number, y: number): void;
    dispose(): void;
  }

  export default function panzoom(
    node: HTMLElement,
    options?: any,
  ): PanzoomInstance;
}
