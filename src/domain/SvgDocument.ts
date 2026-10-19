import { DocumentSnapshot } from "./DocumentSnapshot.js";
import { DomainError } from "./DomainError.js";
import { Group } from "./Group.js";
import type { Shape } from "./Shape.js";
import type { ShapeContainer } from "./ShapeContainer.js";
import { NumberValidator } from "./internal/NumberValidator.js";
import { TreeAccess } from "./internal/TreeAccess.js";

export class SvgDocument implements ShapeContainer {
  #width: number;
  #height: number;
  #roots: Shape[] = [];
  #index = new Map<string, Shape>();

  constructor(width = 800, height = 600) {
    this.#width = NumberValidator.positive(width, "canvas width");
    this.#height = NumberValidator.positive(height, "canvas height");
  }

  get width(): number { return this.#width; }
  get height(): number { return this.#height; }
  get children(): readonly Shape[] { return Object.freeze([...this.#roots]); }
  get containerId(): null { return null; }
  get parent(): null { return null; }
  get size(): number { return this.#index.size; }

  has(id: string): boolean { return this.#index.has(id); }

  find(id: string): Shape {
    const shape = this.#index.get(id);
    if (!shape) throw new DomainError(`no such shape: ${id}`);
    return shape;
  }

  requireContainer(id: string): Group {
    const shape = this.#index.get(id);
    if (!shape) throw new DomainError(`no such container: ${id}`);
    return shape.asContainer();
  }

  resize(width: number, height: number): void {
    const nextWidth = NumberValidator.positive(width, "canvas width");
    const nextHeight = NumberValidator.positive(height, "canvas height");
    this.#width = nextWidth;
    this.#height = nextHeight;
  }

  insert(shape: Shape, containerId?: string, index?: number): void {
    const parent = containerId === undefined ? this : this.requireContainer(containerId);
    if (shape.parent !== null) throw new DomainError(`shape is already attached: ${shape.id}`);
    const incoming = new Set<string>();
    for (const node of shape.walk()) {
      if (incoming.has(node.id) || this.has(node.id)) {
        throw new DomainError(`id already exists: ${node.id}`);
      }
      incoming.add(node.id);
    }
    const position = index ?? parent.children.length;
    this.attach(shape, parent, position);
    for (const node of shape.walk()) this.#index.set(node.id, node);
  }

  delete(id: string): void {
    const shape = this.find(id);
    this.detach(shape);
    for (const node of shape.walk()) this.#index.delete(node.id);
  }

  move(id: string, dx: number, dy: number): void { this.find(id).move(dx, dy); }
  scale(id: string, factor: number): void { this.find(id).scale(factor); }
  setAttribute(id: string, name: string, value: string): void {
    this.find(id).setAttribute(name, value);
  }

  group(newId: string, ids: readonly string[]): Group {
    if (this.has(newId)) throw new DomainError(`id already exists: ${newId}`);
    const group = new Group(newId);
    if (ids.length < 2) throw new DomainError("group requires at least two shapes");
    const selected = ids.map(id => this.find(id));
    const selectedIds = new Set(ids);
    if (selectedIds.size !== ids.length) throw new DomainError("duplicate shape in group command");

    for (const shape of selected) {
      for (let parent = shape.parent; parent !== null; parent = parent.parent) {
        if (parent.containerId !== null && selectedIds.has(parent.containerId)) {
          throw new DomainError(`cannot group a container into its own descendant: ${parent.containerId}`);
        }
      }
    }

    // Use document order rather than argument order, including across parents.
    const ordered = [...this.walk()].filter(shape => selectedIds.has(shape.id));
    const parent = this.commonParent(selected);
    const branches = ordered.map(shape => {
      let branch = shape;
      while (branch.parent !== parent) {
        const ancestorId = branch.parent?.containerId;
        if (ancestorId === null || ancestorId === undefined) throw new DomainError("invalid parent chain");
        branch = this.find(ancestorId);
      }
      return branch;
    });
    const position = Math.min(...branches.map(branch => parent.children.indexOf(branch)));

    for (const shape of ordered) this.detach(shape);
    this.attach(group, parent, position);
    this.#index.set(group.id, group);
    for (const shape of ordered) this.attach(shape, group, group.children.length);
    return group;
  }

  ungroup(id: string): void {
    const group = this.find(id).asContainer();
    const parent = group.parent;
    if (parent === this) throw new DomainError(`cannot ungroup top-level container: ${id}`);
    if (parent === null) throw new DomainError(`no such shape: ${id}`);
    const position = parent.children.indexOf(group);
    const children = group.children;
    this.detach(group);
    this.#index.delete(group.id);
    for (const [offset, child] of children.entries()) {
      this.detach(child);
      this.attach(child, parent, position + offset);
    }
  }

  addTo(containerId: string, id: string): void {
    const target = this.requireContainer(containerId);
    const shape = this.find(id);
    for (let ancestor: ShapeContainer | null = target; ancestor !== null; ancestor = ancestor.parent) {
      if (ancestor.containerId === shape.id) {
        throw new DomainError(`cannot move a container into its own descendant: ${shape.id}`);
      }
    }
    this.detach(shape);
    this.attach(shape, target, target.children.length);
  }

  bringToFront(id: string): void {
    const shape = this.find(id);
    const parent = this.parentOf(shape);
    this.detach(shape);
    this.attach(shape, parent, parent.children.length);
  }

  sendToBack(id: string): void {
    const shape = this.find(id);
    const parent = this.parentOf(shape);
    this.detach(shape);
    this.attach(shape, parent, 0);
  }

  *walk(): IterableIterator<Shape> {
    for (const root of this.#roots) yield* root.walk();
  }

  createSnapshot(): DocumentSnapshot {
    return new DocumentSnapshot(this.width, this.height, this.#roots);
  }

  clone(): SvgDocument { return SvgDocument.fromSnapshot(this.createSnapshot()); }

  static fromSnapshot(snapshot: DocumentSnapshot): SvgDocument {
    const document = new SvgDocument(snapshot.width, snapshot.height);
    for (const root of snapshot.copyRoots()) document.insert(root);
    document.assertInvariants();
    return document;
  }

  restore(snapshot: DocumentSnapshot): void {
    // Construct and validate the complete replacement before changing live state.
    const replacement = SvgDocument.fromSnapshot(snapshot);
    for (const root of this.#roots) root[TreeAccess.setParent](null);
    for (const root of replacement.#roots) root[TreeAccess.setParent](this);
    this.#width = replacement.#width;
    this.#height = replacement.#height;
    this.#roots = replacement.#roots;
    this.#index = replacement.#index;
  }

  assertInvariants(): void {
    const seen = new Set<Shape>();
    const ids = new Set<string>();
    const pending = this.#roots.map(shape => ({ shape, parent: this as ShapeContainer }));
    while (pending.length > 0) {
      const entry = pending.pop();
      if (!entry) break;
      const { shape, parent } = entry;
      if (seen.has(shape)) throw new DomainError("cycle or shared node in document");
      if (ids.has(shape.id)) throw new DomainError(`id already exists: ${shape.id}`);
      if (shape.parent !== parent) throw new DomainError(`invalid parent: ${shape.id}`);
      if (this.#index.get(shape.id) !== shape) throw new DomainError(`invalid id index: ${shape.id}`);
      seen.add(shape);
      ids.add(shape.id);
      for (const child of shape.children) pending.push({ shape: child, parent: shape.asContainer() });
    }
    if (ids.size !== this.#index.size) throw new DomainError("id index contains detached nodes");
  }

  [TreeAccess.insertChild](shape: Shape, index: number): void {
    if (!Number.isInteger(index) || index < 0 || index > this.#roots.length) {
      throw new DomainError("invalid child position");
    }
    this.#roots.splice(index, 0, shape);
  }

  [TreeAccess.removeChild](shape: Shape): void {
    const index = this.#roots.indexOf(shape);
    if (index < 0) throw new DomainError(`no such child: ${shape.id}`);
    this.#roots.splice(index, 1);
  }

  private parentOf(shape: Shape): ShapeContainer {
    if (shape.parent === null) throw new DomainError(`no such shape: ${shape.id}`);
    return shape.parent;
  }

  private attach(shape: Shape, parent: ShapeContainer, index: number): void {
    parent[TreeAccess.insertChild](shape, index);
    shape[TreeAccess.setParent](parent);
  }

  private detach(shape: Shape): void {
    this.parentOf(shape)[TreeAccess.removeChild](shape);
    shape[TreeAccess.setParent](null);
  }

  private commonParent(shapes: readonly Shape[]): ShapeContainer {
    const paths = shapes.map(shape => {
      const path: ShapeContainer[] = [];
      for (let parent = shape.parent; parent !== null; parent = parent.parent) path.unshift(parent);
      return path;
    });
    let common: ShapeContainer = this;
    const firstPath = paths[0] ?? [];
    for (const [index, parent] of firstPath.entries()) {
      if (!paths.every(path => path[index] === parent)) break;
      common = parent;
    }
    return common;
  }
}
