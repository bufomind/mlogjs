import {
  EMutability,
  IScope,
  IValue,
  TEOutput,
  TValueInstructions,
} from "../types";
import { VoidValue } from "../values";

type TFunction<T extends IValue | null> = (
  scope: IScope,
  out: TEOutput | undefined,
  ...args: IValue[]
) => TValueInstructions<T>;

export class MacroFunction<
  RT extends IValue | null = IValue
> extends VoidValue {
  macro = true;
  mutability = EMutability.constant;
  fn: TFunction<RT>;
  constructor(fn: TFunction<RT>, public paramOuts?: TEOutput[]) {
    super();
    this.fn = fn;
  }
  call(scope: IScope, args: IValue[], out?: TEOutput): TValueInstructions<RT> {
    return this.fn.apply(this, [scope, out, ...args]);
  }
  eval(_scope: IScope): TValueInstructions {
    return [this, []];
  }

  preCall(
    _scope: IScope,
    _out?: TEOutput | undefined
  ): readonly TEOutput[] | undefined {
    return this.paramOuts;
  }

  debugString(): string {
    return "MacroFunction";
  }

  toString(): string {
    return '"[macro MacroFunction]"';
  }
}
