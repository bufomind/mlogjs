import { camelToDashCase } from "../utils";
import { MacroFunction } from ".";
import { IScope } from "../types";
import {
  IObjectValueData,
  LiteralValue,
  ObjectValue,
  StoreValue,
} from "../values";
import { CompilerError } from "../CompilerError";
import { ValueOwner } from "../values/ValueOwner";
import { Building, Unit } from "./Entities";

interface NamespaceMacroOptions {
  changeCasing?: boolean;
}
export class NamespaceMacro extends ObjectValue {
  changeCasing: boolean;
  constructor(
    scope: IScope,
    { changeCasing = false }: NamespaceMacroOptions = {}
  ) {
    super(scope, {
      $get: new MacroFunction(scope, prop => {
        if (!(prop instanceof LiteralValue) || typeof prop.data !== "string")
          throw new CompilerError(
            "Cannot use dynamic properties on object macros"
          );
        const symbolName = this.changeCasing
          ? camelToDashCase(prop.data)
          : prop.data;

        const owner = new ValueOwner({
          scope,
          value: new StoreValue(scope),
          name: `@${symbolName}`,
        });
        return [owner.value, []];
      }),
    });
    this.changeCasing = changeCasing;
  }
}

export class VarsNamespace extends NamespaceMacro {
  constructor(scope: IScope) {
    super(scope);
    Object.assign<IObjectValueData, IObjectValueData>(this.data, {
      unit: new ValueOwner({
        scope,
        name: "@unit",
        value: new Unit(scope),
      }).value,
      this: new ValueOwner({
        scope,
        name: "@this",
        value: new Building(scope),
      }).value,
    });
  }
}

export class UCommandsNamespace extends NamespaceMacro {
  constructor(scope: IScope) {
    super(scope);
    this.data.$get = new MacroFunction(scope, prop => {
      if (!(prop instanceof LiteralValue) || typeof prop.data !== "string")
        throw new CompilerError(
          "Cannot use dynamic properties on object macros"
        );
      const symbolName = prop.data[0].toUpperCase() + prop.data.slice(1);
      const owner = new ValueOwner({
        scope,
        name: `@command${symbolName}`,
        value: new StoreValue(scope),
      });
      return [owner.value, []];
    });
  }
}
