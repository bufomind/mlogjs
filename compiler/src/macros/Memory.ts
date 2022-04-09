import { operators } from "../operators";
import { InstructionBase } from "../instructions";
import { IScope, IValue } from "../types";
import { BaseValue, LiteralValue, ObjectValue, StoreValue } from "../values";
import { MacroFunction } from "./Function";
import { CompilerError } from "../CompilerError";
import { deepEval } from "../utils";

class MemoryEntry extends ObjectValue {
  private _store: StoreValue | null = null;

  constructor(scope: IScope, mem: MemoryMacro, prop: IValue) {
    super(scope, {
      $eval: new MacroFunction(scope, () => {
        if (this._store) return [this._store, []];
        this.ensureOwned();
        const temp = this.store;
        return [temp, [new InstructionBase("read", temp, mem.cell, prop)]];
      }),
      "$=": new MacroFunction(scope, value => {
        const [data, dataInst] = deepEval(scope, value);
        return [
          data,
          [...dataInst, new InstructionBase("write", data, mem.cell, prop)],
        ];
      }),
    });
  }

  private get store() {
    if (!this._store) {
      this._store = new StoreValue(this.scope);
      this.owner?.own(this._store);
    }
    return this._store;
  }
}

for (const operator of operators) {
  if (operator === "=") continue;
  MemoryEntry.prototype[operator] = function (
    this: MemoryEntry,
    ...args: unknown[]
  ) {
    // eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-unsafe-return
    return (BaseValue.prototype[operator] as Function).apply(this, args);
  };
}

class MemoryMacro extends ObjectValue {
  name: string;
  toString() {
    return this.name;
  }
  constructor(scope: IScope, public cell: ObjectValue, size: LiteralValue) {
    super(scope, {
      $get: new MacroFunction(scope, (prop: IValue) => {
        if (prop instanceof LiteralValue && typeof prop.data !== "number")
          throw new CompilerError(
            `Invalid memory object property: "${prop.data}"`
          );
        const obj = new MemoryEntry(scope, this, prop);
        return [obj, []];
      }),
      length: size,
      size,
    });

    this.name = cell.toString();
  }
}

export class MemoryBuilder extends ObjectValue {
  constructor(scope: IScope) {
    super(scope, {
      $call: new MacroFunction(
        scope,
        (cell: IValue, size: IValue = new LiteralValue(scope, 64)) => {
          if (!(cell instanceof ObjectValue))
            throw new CompilerError("Memory cell must be a building object.");

          if (!(size instanceof LiteralValue && typeof size.data === "number"))
            throw new CompilerError(
              "The memory size must be a number literal."
            );

          return [new MemoryMacro(scope, cell, size), []];
        }
      ),
    });
  }
}
