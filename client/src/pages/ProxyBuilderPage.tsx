import { AddCardsDialog } from "../components/deck/AddCardsDialog";
import { DeckPanel } from "../components/deck/DeckPanel";
import { DropTargets } from "../components/deck/DropTargets";
import { PageView } from "../components/PageView";
import { ExportDialog } from "../components/print/ExportDialog";
import { PrintSetupPanel } from "../components/print/PrintSetupPanel";
import { RegionNav, SidePanelSwitch } from "../components/shell/RegionNav";
import { TopBar } from "../components/shell/TopBar";
import { useUiStore } from "../store";
export default function ProxyBuilderPage() {
  const region = useUiStore((s) => s.region);
  const sidePanel = useUiStore((s) => s.sidePanel);
  return (
    <div className="app-shell" data-region={region} data-side-panel={sidePanel}>
      <TopBar />
      <main className="workspace">
        <SidePanelSwitch />
        <DeckPanel />
        <PageView />
        <PrintSetupPanel />
      </main>
      <RegionNav />
      <ExportDialog />
      <AddCardsDialog />
      <DropTargets />
    </div>
  );
}
