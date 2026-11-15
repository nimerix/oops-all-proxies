import { useEffect, useState } from "react";
import { useLoadingStore } from "../store";
import LoadingOverlay from "./LoadingOverlay";

const SHOW_AFTER_MS = 300;

export function Loader() {
  const loadingTask = useLoadingStore((state) => state.loadingTask);
  const loadingProgress = useLoadingStore((state) => state.loadingProgress);
  const cancelLabel = useLoadingStore((state) => state.cancelLabel);
  const canCancel = useLoadingStore((state) => !!state.cancelAction);
  const requestCancel = useLoadingStore((state) => state.requestCancel);
  const active = loadingTask !== null;
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setVisible(true), SHOW_AFTER_MS);
    return () => {
      clearTimeout(timer);
      setVisible(false);
    };
  }, [active]);

  if (loadingTask === null || !visible) {
    return null;
  }

  return (
    <LoadingOverlay
      task={loadingTask}
      progress={loadingProgress}
      cancelLabel={cancelLabel}
      onCancel={canCancel ? requestCancel : null}
    />
  );
}
