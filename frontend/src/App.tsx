import { useState } from "react";
import DiscoveryPanel from "./DiscoveryPanel";
import TailoringPanel from "./TailoringPanel";
import TrackingPanel from "./TrackingPanel";
import { PrefillJob } from "./types";

type View = "discovery" | "tailoring" | "tracking";

const ENDPOINT_LABEL: Record<View, string> = {
  discovery: "endpoint: /api/discovery/search + /api/matching/score",
  tailoring: "endpoint: /api/tailoring/generate",
  tracking: "endpoint: /api/applications",
};

export default function App() {
  const [view, setView] = useState<View>("discovery");
  const [prefill, setPrefill] = useState<PrefillJob | null>(null);

  function handleSendToTailoring(job: PrefillJob) {
    setPrefill(job);
    setView("tailoring");
  }

  return (
    <div className="console">
      <header className="console__header">
        <div>
          <div className="eyebrow">ApplyMate · local model</div>
          <h1>Application console</h1>
        </div>
        <div className="header-meta">
          <span className="dot" />
          {ENDPOINT_LABEL[view]}
        </div>
      </header>

      <nav className="nav-tabs">
        <button
          type="button"
          className={view === "discovery" ? "nav-tab nav-tab--active" : "nav-tab"}
          onClick={() => setView("discovery")}
        >
          <span className="nav-tab__index">01</span> discovery
        </button>
        <button
          type="button"
          className={view === "tailoring" ? "nav-tab nav-tab--active" : "nav-tab"}
          onClick={() => setView("tailoring")}
        >
          <span className="nav-tab__index">02</span> tailoring
        </button>
        <button
          type="button"
          className={view === "tracking" ? "nav-tab nav-tab--active" : "nav-tab"}
          onClick={() => setView("tracking")}
        >
          <span className="nav-tab__index">03</span> tracking
        </button>
      </nav>

      {view === "discovery" && (
        <DiscoveryPanel onSendToTailoring={handleSendToTailoring} />
      )}
      {view === "tailoring" && <TailoringPanel prefill={prefill} />}
      {view === "tracking" && <TrackingPanel />}
    </div>
  );
}
