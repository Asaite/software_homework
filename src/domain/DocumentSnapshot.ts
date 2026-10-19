import type { Shape } from "./Shape.js";

/** Owns an isolated graph; callers can only obtain new copies of it. */
export class DocumentSnapshot {
  readonly #width: number;
  readonly #height: number;
  readonly #roots: readonly Shape[];

  constructor(width: number, height: number, roots: readonly Shape[]) {
    this.#width = width;
    this.#height = height;
    this.#roots = roots.map(shape => shape.clone());
  }

  get width(): number { return this.#width; }
  get height(): number { return this.#height; }

  copyRoots(): readonly Shape[] {
    return Object.freeze(this.#roots.map(shape => shape.clone()));
  }
}
