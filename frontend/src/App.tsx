import { useState } from "react";
import DiscoveryPanel from "./DiscoveryPanel";
import TailoringPanel from "./TailoringPanel";
import { PrefillJob } from "./types";

type View = "discovery" | "tailoring";

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
          {view === "discovery"
            ? "endpoint: /api/discovery/search + /api/matching/score"
            : "endpoint: /api/tailoring/generate"}
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
      </nav>

      {view === "discovery" ? (
        <DiscoveryPanel onSendToTailoring={handleSendToTailoring} />
      ) : (
        <TailoringPanel prefill={prefill} />
      )}
    </div>
  );
}
