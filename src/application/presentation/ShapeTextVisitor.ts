import type { Circle } from "../../domain/Circle.js";
import type { Ellipse } from "../../domain/Ellipse.js";
import type { Group } from "../../domain/Group.js";
import type { Line } from "../../domain/Line.js";
import type { Rect } from "../../domain/Rect.js";
import type { Shape } from "../../domain/Shape.js";
import type { ShapeVisitor } from "../../domain/ShapeVisitor.js";
import type { Text } from "../../domain/Text.js";

export class ShapeTextVisitor implements ShapeVisitor<string> {
  visitRect(shape: Rect): string {
    return this.withStyles(shape, `rect#${shape.id}  x=${shape.x} y=${shape.y} w=${shape.width} h=${shape.height}`);
  }
  visitCircle(shape: Circle): string {
    return this.withStyles(shape, `circle#${shape.id}  cx=${shape.cx} cy=${shape.cy} r=${shape.r}`);
  }
  visitEllipse(shape: Ellipse): string {
    return this.withStyles(shape, `ellipse#${shape.id}  cx=${shape.cx} cy=${shape.cy} rx=${shape.rx} ry=${shape.ry}`);
  }
  visitLine(shape: Line): string {
    return this.withStyles(shape, `line#${shape.id}  (${shape.x1},${shape.y1}) -> (${shape.x2},${shape.y2})`);
  }
  visitText(shape: Text): string {
    return this.withStyles(shape, `text#${shape.id}  (${shape.x},${shape.y}) ${JSON.stringify(shape.content)}`);
  }
  visitGroup(shape: Group): string { return this.withStyles(shape, `g#${shape.id}`); }

  private withStyles(shape: Shape, summary: string): string {
    const styles = Object.entries(shape.styles).map(([name, value]) => `${name}=${value}`).join(" ");
    return styles === "" ? summary : `${summary} ${styles}`;
  }
}
