const rules = new Intl.PluralRules("en");

export function plural(count: number, one: string, other: string): string {
  const word = rules.select(count) === "one" ? one : other;
  return `${count.toLocaleString("en")} ${word}`;
}
