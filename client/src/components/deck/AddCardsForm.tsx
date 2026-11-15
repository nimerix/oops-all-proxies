import { useState, type ChangeEvent } from "react";
import { FileImage, ListPlus, Upload } from "lucide-react";
import { LANGUAGE_OPTIONS } from "@/constants";
import {
  importDecklist,
  importMpcFile,
  uploadImages,
} from "@/helpers/addCards";
import { useCardsStore, useLoadingStore } from "@/store";

const takeFiles = (event: ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(event.target.files ?? []);
  event.target.value = "";
  return files;
};

export function AddCardsForm({ onAdded }: { onAdded?: () => void }) {
  const [deckText, setDeckText] = useState("");
  const language = useCardsStore((s) => s.globalLanguage);
  const setLanguage = useCardsStore((s) => s.setGlobalLanguage);
  const loading = useLoadingStore((s) => !!s.loadingTask);
  const done = (added: boolean) => {
    if (added) onAdded?.();
  };

  return (
    <div className="add-cards">
      <form
        className="add-cards-list"
        onSubmit={async (e) => {
          e.preventDefault();
          const added = await importDecklist(deckText, language);
          if (added) setDeckText("");
          done(added);
        }}
      >
        <div className="field">
          <label htmlFor="decklist">Decklist</label>
          <textarea
            id="decklist"
            rows={8}
            placeholder={
              "1 Sol Ring\n2 Counterspell\n1 Lightning Bolt (m11) 146"
            }
            value={deckText}
            onChange={(e) => setDeckText(e.target.value)}
            aria-describedby="deck-hint"
            spellCheck={false}
          />
          <p id="deck-hint" className="hint">
            One card per line. Add a quantity, set or collector number if you
            like.
          </p>
        </div>
        <div className="field">
          <label htmlFor="language">Card language</label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {LANGUAGE_OPTIONS.map((o) => (
              <option key={o.code} value={o.code}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <button
          className="primary-button"
          disabled={!deckText.trim() || loading}
        >
          <ListPlus size={18} aria-hidden="true" /> Add to deck
        </button>
      </form>
      <section className="own-images" aria-labelledby="own-images-heading">
        <h3 id="own-images-heading">Your own images</h3>
        <label className="upload-option">
          <FileImage size={20} aria-hidden="true" />
          <span>
            <strong>Card images</strong>
            <small>Trimmed to the card edge, no bleed</small>
          </span>
          <input
            aria-label="Upload card images"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
            multiple
            disabled={loading}
            onChange={async (e) =>
              done(await uploadImages(takeFiles(e), false))
            }
          />
        </label>
        <label className="upload-option">
          <Upload size={20} aria-hidden="true" />
          <span>
            <strong>MPC images</strong>
            <small>Artwork with 3 mm bleed</small>
          </span>
          <input
            aria-label="Upload MPC images"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            disabled={loading}
            onChange={async (e) => done(await uploadImages(takeFiles(e), true))}
          />
        </label>
        <div className="field">
          <label htmlFor="mpc-xml">MPCFill XML or text</label>
          <input
            id="mpc-xml"
            type="file"
            accept=".xml,.txt,.csv,.log"
            disabled={loading}
            onChange={async (e) => {
              const [file] = takeFiles(e);
              if (file) done(await importMpcFile(file));
            }}
          />
        </div>
      </section>
    </div>
  );
}
