import { useEffect, useState } from "react";
import { FileImage, Upload } from "lucide-react";
import {
  IMAGE_TYPE,
  importMpcFile,
  MPC_FILE,
  uploadImages,
} from "@/helpers/addCards";
import { useLoadingStore } from "@/store";
import { notify } from "@/store/notifications";

const hasFiles = (e: DragEvent) =>
  !!e.dataTransfer && [...e.dataTransfer.types].includes("Files");
const blocked = () =>
  !!document.querySelector("dialog[open]") ||
  !!useLoadingStore.getState().loadingTask;

function addDropped(files: File[], hasBakedBleed: boolean) {
  if (files.length === 1 && MPC_FILE.test(files[0].name))
    return void importMpcFile(files[0]);
  if (files.length && files.every((file) => IMAGE_TYPE.test(file.type)))
    return void uploadImages(files, hasBakedBleed);
  notify(
    "Drop PNG, JPEG, WebP, GIF or AVIF images, or an MPCFill XML file.",
    "error"
  );
}

export function DropTargets() {
  const [shown, setShown] = useState(false);
  const [over, setOver] = useState<string | null>(null);
  useEffect(() => {
    let depth = 0;
    const hide = () => {
      depth = 0;
      setShown(false);
      setOver(null);
    };
    const onEnter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth++;
      setShown(!blocked());
    };
    const onOver = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      // Without this the browser opens the dropped file in place of the app.
      e.preventDefault();
      const target = (e.target as Element | null)?.closest?.("[data-drop]");
      const allowed = !!target && !blocked();
      e.dataTransfer!.dropEffect = allowed ? "copy" : "none";
      setOver(allowed ? (target as HTMLElement).dataset.drop! : null);
    };
    const onLeave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (!depth) hide();
    };
    const onDrop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      hide();
      const target = (e.target as Element | null)?.closest?.<HTMLElement>(
        "[data-drop]"
      );
      if (!target || blocked()) return;
      addDropped(
        [...(e.dataTransfer?.files ?? [])],
        target.dataset.drop === "bleed"
      );
    };
    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragover", onOver);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("drop", onDrop);
    window.addEventListener("dragend", hide);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("drop", onDrop);
      window.removeEventListener("dragend", hide);
    };
  }, []);
  return (
    <div className="drop-targets" hidden={!shown} aria-hidden="true">
      <div
        className="drop-target"
        data-drop="trimmed"
        data-over={over === "trimmed" || undefined}
      >
        <FileImage size={32} aria-hidden="true" />
        <p>Card images, trimmed to the card edge</p>
      </div>
      <div
        className="drop-target"
        data-drop="bleed"
        data-over={over === "bleed" || undefined}
      >
        <Upload size={32} aria-hidden="true" />
        <p>Images with 3 mm bleed (MPC)</p>
      </div>
    </div>
  );
}
