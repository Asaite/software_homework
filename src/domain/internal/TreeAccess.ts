/** Only domain objects may use these capabilities to change tree links. */
export class TreeAccess {
  static readonly setParent = Symbol("setParent");
  static readonly insertChild = Symbol("insertChild");
  static readonly removeChild = Symbol("removeChild");
}
