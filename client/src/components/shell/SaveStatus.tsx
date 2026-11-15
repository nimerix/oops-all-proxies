import { useStorageStatus } from "@/helpers/IndexedDBStorage";

export function SaveStatus() {
  const pendingSave = useStorageStatus((s) => s.pending > 0);
  const saveError = useStorageStatus((s) => s.error);
  const savingDisabled = useStorageStatus((s) => s.savingDisabled);
  return (
    <p
      className={saveError ? "save-status save-error" : "save-status"}
      aria-live="polite"
    >
      {savingDisabled
        ? "Temporary workspace · saving disabled"
        : saveError
          ? "Changes not saved"
          : pendingSave
            ? "Saving workspace…"
            : "Saved in this browser"}
    </p>
  );
}
