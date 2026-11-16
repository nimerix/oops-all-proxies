import { useSettingsStore } from "@/store";
import { blobToDataUrl } from "@/helpers/imageUtils";
import { errorMessage, notify } from "@/store/notifications";
import { defaultCardbackPreviewUrl } from "@/constants";
import { SCHEMES } from "@/schemes";
export function CardbackSettings() {
  const s = useSettingsStore();
  return (
    <>
      <div className="field">
        <label htmlFor="custom-back">Custom cardback</label>
        <input
          id="custom-back"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            try {
              if (
                !/^image\/(png|jpeg|webp)$/.test(file.type) ||
                file.size > 30 * 1024 * 1024
              )
                throw new Error(
                  "Choose a PNG, JPEG or WebP image up to 30 MB."
                );
              s.setCustomCardbackUrl(await blobToDataUrl(file));
              notify("Custom cardback saved.", "success");
            } catch (error) {
              notify(errorMessage(error), "error");
            }
          }}
        />
        <p className="hint">
          Replaces the default back on cards without an assigned back face.
        </p>
      </div>
      {s.customCardbackUrl ? (
        <>
          <img
            className="cardback-preview"
            src={s.customCardbackUrl}
            alt="Your custom cardback"
            loading="lazy"
            decoding="async"
          />
          <label className="check-field">
            <input
              type="checkbox"
              checked={s.customCardbackHasBleed}
              onChange={(e) => s.setCustomCardbackHasBleed(e.target.checked)}
            />{" "}
            Image includes 3 mm MPC bleed
          </label>
          <button
            className="text-button danger"
            onClick={() => {
              s.setCustomCardbackUrl(null);
              s.setCustomCardbackHasBleed(false);
            }}
          >
            Remove custom cardback
          </button>
        </>
      ) : (
        <fieldset>
          <legend>Default card back</legend>
          <div className="swatch-picker">
            {SCHEMES.map(({ id, label }) => (
              <label key={id} className="swatch-option">
                <input
                  type="radio"
                  name="cardback-design"
                  value={id}
                  checked={s.cardbackDesign === id}
                  onChange={() => s.setCardbackDesign(id)}
                />
                <img
                  className="cardback-swatch"
                  src={defaultCardbackPreviewUrl(id)}
                  alt=""
                  width="50"
                  height="70"
                  loading="lazy"
                  decoding="async"
                />
                <span className="swatch-name">{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <label className="check-field">
        <input
          type="checkbox"
          checked={s.disableBackPageGuides}
          onChange={(e) => s.setDisableBackPageGuides(e.target.checked)}
        />{" "}
        Hide cutting guides on backs
      </label>
    </>
  );
}
