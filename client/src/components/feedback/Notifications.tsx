import { useEffect, useState } from "react";
import { X, AlertCircle, CheckCircle2 } from "lucide-react";
import { useNotifications, type Notice } from "../../store/notifications";

function Notification({ notice: n }: { notice: Notice }) {
  const [paused, setPaused] = useState(false);
  const dismiss = useNotifications((s) => s.dismiss);
  useEffect(() => {
    if (paused || n.kind === "error") return;
    const timer = setTimeout(() => dismiss(n.id), 8000);
    return () => clearTimeout(timer);
  }, [paused, n.id, n.kind, dismiss]);
  return (
    <div
      className={`notice ${n.kind}`}
      role={n.kind === "error" ? "alert" : "status"}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
      }}
    >
      {n.kind === "success" ? (
        <CheckCircle2 size={19} aria-hidden="true" />
      ) : (
        <AlertCircle size={19} aria-hidden="true" />
      )}
      <p>{n.message}</p>
      {n.action && (
        <button
          className="notice-action"
          onClick={() => {
            if (n.action?.run() !== false) dismiss(n.id);
          }}
        >
          {n.action.label}
        </button>
      )}
      <button
        className="notice-dismiss"
        aria-label="Dismiss notification"
        onClick={() => dismiss(n.id)}
      >
        <X size={17} aria-hidden="true" />
      </button>
    </div>
  );
}

export function Notifications() {
  const notices = useNotifications((s) => s.notices);
  return (
    <section className="notifications" aria-label="Notifications">
      {notices.map((n) => (
        <Notification key={n.id} notice={n} />
      ))}
    </section>
  );
}
