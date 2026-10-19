import { ApplicationError } from "../application/ApplicationError.js";
import { CommandToken } from "./CommandToken.js";

export class CommandTokenizer {
  tokenize(line: string): readonly CommandToken[] {
    if (line.trimStart().startsWith("#")) return Object.freeze([]);
    const tokens: CommandToken[] = [];
    let index = 0;
    while (index < line.length) {
      if (/\s/.test(line[index]!)) { index++; continue; }
      const quoted = line[index] === '"';
      if (quoted) index++;
      let value = "";
      let closed = !quoted;
      while (index < line.length) {
        const character = line[index]!;
        if (quoted) {
          if (character === '"') { index++; closed = true; break; }
          const next = line[index + 1];
          if (character === "\\" && (next === '"' || next === "\\")) {
            value += next;
            index += 2;
            continue;
          }
        } else {
          if (/\s/.test(character)) break;
          if (character === '"') throw new ApplicationError("double quotes must start an argument");
        }
        value += character;
        index++;
      }
      if (!closed) throw new ApplicationError("unterminated double-quoted argument");
      if (quoted && index < line.length && !/\s/.test(line[index]!)) {
        throw new ApplicationError("quoted argument must be followed by whitespace");
      }
      tokens.push(new CommandToken(value, quoted));
    }
    return Object.freeze(tokens);
  }
}
