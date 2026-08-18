import { useEffect, useState } from "react";
import { ApplicationStatus, ApplicationSummary } from "./types";

const API_BASE = "http://localhost:8000/api";

const STATUS_OPTIONS: ApplicationStatus[] = [
  "draft",
  "applied",
  "interviewing",
  "rejected",
  "offer",
];

export default function TrackingPanel() {
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadApplications() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/applications`);
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      setApplications(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApplications();
  }, []);

  async function handleStatusChange(id: number, newStatus: ApplicationStatus) {
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );
    try {
      await fetch(`${API_BASE}/applications/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      loadApplications();
    }
  }

  async function handleDelete(id: number) {
    setApplications((prev) => prev.filter((a) => a.id !== id));
    try {
      await fetch(`${API_BASE}/applications/${id}`, { method: "DELETE" });
    } catch {
      loadApplications();
    }
  }

  const counts = STATUS_OPTIONS.reduce<Record<string, number>>((acc, s) => {
    acc[s] = applications.filter((a) => a.status === s).length;
    return acc;
  }, {});

  return (
    <div className="tracking-view">
      <div className="stat-row">
        {STATUS_OPTIONS.map((s) => (
          <div className={`stat-card stat-card--${s}`} key={s}>
            <div className="stat-card__count">{counts[s] ?? 0}</div>
            <div className="stat-card__label">{s}</div>
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="panel__label">
          tracked applications {applications.length > 0 && `· ${applications.length}`}
        </div>

        {error && <p className="error-text">{error}</p>}
        {loading && (
          <div className="empty-state">
            <p className="hint">Loading…</p>
          </div>
        )}
        {!loading && applications.length === 0 && (
          <div className="empty-state">
            <p>No applications tracked yet.</p>
            <p className="hint">
              Tailor a resume in the Tailoring tab, then hit "Save as draft" to see it
              here.
            </p>
          </div>
        )}

        <div className="tracking-list">
          {applications.map((appItem) => (
            <div className="tracking-row" key={appItem.id}>
              <div className="tracking-row__main">
                <div className="tracking-row__title">{appItem.job_title}</div>
                <div className="tracking-row__company">{appItem.company}</div>
              </div>
              <span className={`score-badge ${scoreClass(appItem.match_score)}`}>
                {appItem.match_score}
              </span>
              <select
                className="status-select"
                value={appItem.status}
                onChange={(e) =>
                  handleStatusChange(appItem.id, e.target.value as ApplicationStatus)
                }
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="tracking-row__delete"
                onClick={() => handleDelete(appItem.id)}
                aria-label="Remove"
                title="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function scoreClass(score: number): string {
  if (score >= 60) return "score-badge--high";
  if (score >= 30) return "score-badge--mid";
  return "score-badge--low";
}
