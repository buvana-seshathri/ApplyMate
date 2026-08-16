import { useState, FormEvent } from "react";
import { JobPosting, PrefillJob } from "./types";

const API_BASE = "http://localhost:8000/api";

type Status = "idle" | "loading" | "error" | "done";

export default function DiscoveryPanel({
  onSendToTailoring,
}: {
  onSendToTailoring: (job: PrefillJob) => void;
}) {
  const [boards, setBoards] = useState("stripe, netflix, notion");
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [postings, setPostings] = useState<JobPosting[]>([]);
  const [failedBoards, setFailedBoards] = useState<string[]>([]);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    const boardList = boards
      .split(",")
      .map((b) => b.trim())
      .filter(Boolean);
    if (boardList.length === 0 || status === "loading") return;

    setStatus("loading");
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/discovery/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boards: boardList, keyword: keyword.trim() || null }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Request failed (${res.status})`);
      }

      const data = await res.json();
      setPostings(data.postings);
      setFailedBoards(data.boards_failed);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  return (
    <div className="console__body">
      <form className="panel input-panel" onSubmit={handleSearch}>
        <div className="panel__label">discovery parameters</div>

        <div className="field">
          <span className="field__label">
            boards<span className="field__hint">companies</span>
          </span>
          <input
            value={boards}
            onChange={(e) => setBoards(e.target.value)}
            placeholder="stripe, netflix, notion"
          />
        </div>

        <div className="field">
          <span className="field__label">
            keyword<span className="field__hint">job title</span>
          </span>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="e.g. backend, machine learning"
          />
        </div>

        <button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Searching boards…" : "Search boards"}
        </button>

        {status === "error" && <p className="error-text">{error}</p>}
        {failedBoards.length > 0 && (
          <p className="hint">
            No postings found for: {failedBoards.join(", ")} — check the token or try
            the other provider.
          </p>
        )}
      </form>

      <div className="panel output-panel">
        <div className="panel__label">
          postings {postings.length > 0 && `· ${postings.length} found`}
        </div>

        {postings.length === 0 && status !== "loading" && (
          <div className="empty-state">
            <p>No results yet.</p>
            <p className="hint">Enter company board tokens and search.</p>
          </div>
        )}

        {status === "loading" && (
          <div className="empty-state">
            <p className="hint">Querying job boards…</p>
          </div>
        )}

        <div className="job-list">
          {postings.map((job) => (
            <div className="job-card" key={`${job.source}-${job.job_id}`}>
              <div className="job-card__top">
                <span className="job-card__source">{job.source}</span>
                <span className="job-card__company">{job.company}</span>
              </div>
              <div className="job-card__title">{job.title}</div>
              {job.location && (
                <div className="job-card__location">{job.location}</div>
              )}
              <div className="job-card__actions">
                <a
                  className="job-card__link"
                  href={job.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  view posting ↗
                </a>
                <button
                  type="button"
                  className="job-card__tailor"
                  onClick={() =>
                    onSendToTailoring({
                      jobTitle: job.title,
                      company: job.company,
                      jobDescription: `${job.title} at ${job.company}. Full posting: ${job.url}\n\n(Paste the full job description here for best tailoring results.)`,
                    })
                  }
                >
                  send to tailoring →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
