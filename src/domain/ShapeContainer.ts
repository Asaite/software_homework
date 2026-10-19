import type { Shape } from "./Shape.js";
import { TreeAccess } from "./internal/TreeAccess.js";

export interface ShapeContainer {
  readonly containerId: string | null;
  readonly parent: ShapeContainer | null;
  readonly children: readonly Shape[];
  [TreeAccess.insertChild](shape: Shape, index: number): void;
  [TreeAccess.removeChild](shape: Shape): void;
}
