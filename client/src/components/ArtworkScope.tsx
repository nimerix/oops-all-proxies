import { useId } from "react";
import { plural } from "../helpers/plural";
import type { DialogScope, ScopeOption } from "../hooks/useArtworkScope";
import type { CardOption } from "../types/Card";

function label(option: ScopeOption, name: string) {
  if (option.scope === "row") return `The ${option.count} copies in this row`;
  if (option.scope === "name")
    return `All ${option.count} cards named ${name}, across printings`;
  if (option.scope === "deck")
    return `The deck's default back, used by ${plural(option.count, "card", "cards")}`;
  return "This copy";
}

export function ScopeFieldset({
  card,
  options,
  scope,
  replaces,
  onChange,
}: {
  card: CardOption;
  options: ScopeOption[];
  scope: DialogScope;
  replaces: string;
  onChange: (scope: DialogScope) => void;
}) {
  const name = useId();
  return (
    <>
      {options.length > 1 && (
        <fieldset className="scope-options">
          <legend>Change</legend>
          {options.map((option) => (
            <label key={option.scope} className="check-field">
              <input
                type="radio"
                name={name}
                value={option.scope}
                checked={scope === option.scope}
                onChange={() => onChange(option.scope)}
              />
              {label(option, card.name)}
            </label>
          ))}
        </fieldset>
      )}
      <div aria-live="polite">
        {replaces && <p className="scope-note">{replaces}</p>}
      </div>
    </>
  );
}
