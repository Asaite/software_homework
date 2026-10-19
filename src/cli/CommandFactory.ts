import { ApplicationError } from "../application/ApplicationError.js";
import { ShapeFactory } from "../application/ShapeFactory.js";
import type { Command } from "../application/commands/Command.js";
import { CanvasCommand } from "../application/commands/document/CanvasCommand.js";
import { InitCommand } from "../application/commands/document/InitCommand.js";
import { ReadCommand } from "../application/commands/document/ReadCommand.js";
import { SaveCommand } from "../application/commands/document/SaveCommand.js";
import { AddToCommand } from "../application/commands/edit/AddToCommand.js";
import { BackCommand } from "../application/commands/edit/BackCommand.js";
import { CreateCommand } from "../application/commands/edit/CreateCommand.js";
import { DeleteCommand } from "../application/commands/edit/DeleteCommand.js";
import { FrontCommand } from "../application/commands/edit/FrontCommand.js";
import { GroupCommand } from "../application/commands/edit/GroupCommand.js";
import { MoveCommand } from "../application/commands/edit/MoveCommand.js";
import { ScaleCommand } from "../application/commands/edit/ScaleCommand.js";
import { SetCommand } from "../application/commands/edit/SetCommand.js";
import { UngroupCommand } from "../application/commands/edit/UngroupCommand.js";
import { RedoCommand } from "../application/commands/history/RedoCommand.js";
import { UndoCommand } from "../application/commands/history/UndoCommand.js";
import { HelpCommand } from "../application/commands/query/HelpCommand.js";
import { ShowCommand } from "../application/commands/query/ShowCommand.js";
import { TreeCommand } from "../application/commands/query/TreeCommand.js";
import { CommandArguments } from "./CommandArguments.js";
import type { CommandToken } from "./CommandToken.js";

export class CommandFactory {
  readonly #shapes: ShapeFactory;
  readonly #commands: ReadonlyMap<string, (args: CommandArguments) => Command>;

  constructor(shapes = new ShapeFactory()) {
    this.#shapes = shapes;
    // The only command-name dispatch point; the parser itself has no command-specific branches.
    this.#commands = new Map<string, (args: CommandArguments) => Command>([
      ["init", args => {
        args.expect(0, 2, "init [w] [h]");
        return new InitCommand(args.length > 0 ? args.number(0, "width") : 800, args.length > 1 ? args.number(1, "height") : 600);
      }],
      ["read", args => { args.expect(1, 1, "read <file.svg>"); return new ReadCommand(args.value(0)); }],
      ["save", args => { args.expect(0, 1, "save [file.svg]"); return new SaveCommand(args.values[0]); }],
      ["canvas", args => {
        args.expect(0, 2, "canvas [w h]");
        if (args.length === 1) throw new ApplicationError("usage: canvas [w h]");
        return args.length === 0 ? new CanvasCommand() : new CanvasCommand(args.number(0, "width"), args.number(1, "height"));
      }],
      ["create", args => this.createShape(args)],
      ["delete", args => { args.expect(1, 1, "delete <id>"); return new DeleteCommand(args.value(0)); }],
      ["move", args => {
        args.expect(3, 3, "move <id> <dx> <dy>");
        return new MoveCommand(args.value(0), args.number(1, "dx"), args.number(2, "dy"));
      }],
      ["scale", args => { args.expect(2, 2, "scale <id> <factor>"); return new ScaleCommand(args.value(0), args.number(1, "scale factor")); }],
      ["set", args => { args.expect(3, 3, "set <id> <attr> <value>"); return new SetCommand(args.value(0), args.value(1), args.value(2)); }],
      ["group", args => { args.expect(3, Infinity, "group <newGid> <id1> <id2>..."); return new GroupCommand(args.value(0), args.values.slice(1)); }],
      ["ungroup", args => { args.expect(1, 1, "ungroup <gid>"); return new UngroupCommand(args.value(0)); }],
      ["addto", args => { args.expect(2, 2, "addto <gid> <id>"); return new AddToCommand(args.value(0), args.value(1)); }],
      ["front", args => { args.expect(1, 1, "front <id>"); return new FrontCommand(args.value(0)); }],
      ["back", args => { args.expect(1, 1, "back <id>"); return new BackCommand(args.value(0)); }],
      ["tree", args => { args.expect(0, 1, "tree [id]"); return new TreeCommand(args.values[0]); }],
      ["show", args => { args.expect(1, 1, "show <id>"); return new ShowCommand(args.value(0)); }],
      ["help", args => { args.expect(0, 0, "help"); return new HelpCommand(); }],
      ["undo", args => { args.expect(0, 0, "undo"); return new UndoCommand(); }],
      ["redo", args => { args.expect(0, 0, "redo"); return new RedoCommand(); }],
    ]);
  }

  create(tokens: readonly CommandToken[]): Command {
    const name = tokens[0]?.value;
    const construct = name === undefined ? undefined : this.#commands.get(name);
    if (!construct) throw new ApplicationError(`unknown command: ${name ?? ""}`);
    return construct(new CommandArguments(tokens.slice(1)));
  }

  private createShape(args: CommandArguments): Command {
    args.expect(2, Infinity, "create <type> <id> [params...] [in <containerId>]");
    const type = args.value(0);
    const id = args.value(1);
    const definition = this.#shapes.definitionFor(type);
    let values = args.tokens.slice(2);
    let containerId: string | undefined;
    if (values.at(-1)?.value === "in" && !values.at(-1)?.quoted) {
      throw new ApplicationError("missing container id after 'in'");
    }
    const suffix = values.at(-2);
    if (suffix?.value === "in" && !suffix.quoted) {
      containerId = values.at(-1)!.value;
      values = values.slice(0, -2);
    }
    const attributes = definition.attributesFromArguments(values.map(token => token.value), type);
    if (definition.textArgumentIndex >= 0 && !values[definition.textArgumentIndex]?.quoted) {
      throw new ApplicationError('text content must be enclosed in double quotes');
    }
    return new CreateCommand(type, id, attributes, containerId);
  }
}
