import type { RuleNode } from "publicodes";
import RawPublicodes from "publicodes";

export type RuleName = string;
export type ParsedRules = Record<RuleName, RuleNode<RuleName>>;
export type RawRules = RawPublicodes<RuleName>;

export function getRawNodes(parsedRules: ParsedRules): RawRules {
  return Object.fromEntries(
    Object.values(parsedRules).reduce((acc: any, rule) => {
      const { nom, ...rawNode } = rule.rawNode;
      acc.push([nom, rawNode]);
      return acc;
    }, [])
  ) as RawRules;
}

function consumeMsg(_: string): void {}

export const disabledLogger = {
  log: consumeMsg,
  warn: consumeMsg,
  error: consumeMsg,
};
