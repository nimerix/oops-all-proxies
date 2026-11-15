import { LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import { useUiStore } from "@/store";
import type { Region, SidePanel } from "@/store/ui";

const regions: { id: Region; label: string; icon: typeof List }[] = [
  { id: "deck", label: "Deck", icon: List },
  { id: "sheets", label: "Sheets", icon: LayoutGrid },
  { id: "print", label: "Print setup", icon: SlidersHorizontal },
];
const sidePanels: { id: SidePanel; label: string }[] = [
  { id: "deck", label: "Deck" },
  { id: "print", label: "Print setup" },
];

// The phone region and the tablet side panel follow each other, so resizing
// across the 760 px breakpoint keeps the panel the user was looking at.
function show(region: Region) {
  const ui = useUiStore.getState();
  ui.setRegion(region);
  if (region !== "sheets") ui.setSidePanel(region);
}

export function SidePanelSwitch() {
  const sidePanel = useUiStore((s) => s.sidePanel);
  return (
    <div className="segmented side-switch" role="group" aria-label="Side panel">
      {sidePanels.map(({ id, label }) => (
        <button
          key={id}
          aria-pressed={sidePanel === id}
          onClick={() => show(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function RegionNav() {
  const region = useUiStore((s) => s.region);
  return (
    <nav className="region-nav" aria-label="Workspace regions">
      {regions.map(({ id, label, icon: Icon }) => (
        <button key={id} aria-pressed={region === id} onClick={() => show(id)}>
          <Icon size={20} aria-hidden="true" />
          {label}
        </button>
      ))}
    </nav>
  );
}
