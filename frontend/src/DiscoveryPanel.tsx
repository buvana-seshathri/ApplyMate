import { useState, FormEvent } from "react";
import { JobPosting, ScoredPosting, PrefillJob } from "./types";

const API_BASE = "http://localhost:8000/api";

type Status = "idle" | "loading" | "error" | "done";

export default function DiscoveryPanel({
  onSendToTailoring,
}: {
  onSendToTailoring: (job: PrefillJob) => void;
}) {
  const [boards, setBoards] = useState("stripe, netflix, notion");
  const [keyword, setKeyword] = useState("");
  const [resumeForScoring, setResumeForScoring] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [postings, setPostings] = useState<JobPosting[]>([]);
  const [scored, setScored] = useState<ScoredPosting[] | null>(null);
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
    setScored(null);

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

      if (resumeForScoring.trim() && data.postings.length > 0) {
        const scoreRes = await fetch(`${API_BASE}/matching/score`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postings: data.postings,
            base_resume: resumeForScoring,
            min_score: 0,
          }),
        });
        if (scoreRes.ok) {
          const scoreData = await scoreRes.json();
          setScored(scoreData.scored);
        }
      }

      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  // If scoring ran, show ranked results; otherwise fall back to raw postings.
  const displayItems: { job: JobPosting; score: number | null; rationale: string | null }[] =
    scored
      ? scored.map((s) => ({ job: s.posting, score: s.score, rationale: s.rationale }))
      : postings.map((job) => ({ job, score: null, rationale: null }));

  return (
    <div className="console__body">
      <form className="panel input-panel" onSubmit={handleSearch}>
        <div className="panel__label">discovery parameters</div>

        <div className="field">
          <span className="field__label">
            boards<span className="field__hint">comma-separated company tokens</span>
          </span>
          <input
            value={boards}
            onChange={(e) => setBoards(e.target.value)}
            placeholder="stripe, netflix, notion"
          />
        </div>

        <p className="hint">
          Company tokens as used on their Greenhouse or Lever job board — e.g. the
          "stripe" in boards.greenhouse.io/stripe. Both providers are tried per token.
        </p>

        <div className="field">
          <span className="field__label">
            keyword<span className="field__hint">optional, filters titles</span>
          </span>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="e.g. backend, machine learning"
          />
        </div>

        <div className="field">
          <span className="field__label">
            resume<span className="field__hint">
              optional — scores &amp; ranks results instantly, no LLM
            </span>
          </span>
          <textarea
            value={resumeForScoring}
            onChange={(e) => setResumeForScoring(e.target.value)}
            placeholder="Paste your resume to rank results by fit"
            rows={5}
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
          {scored && " · ranked by fit"}
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
          {displayItems.map(({ job, score, rationale }) => (
            <div className="job-card" key={`${job.source}-${job.job_id}`}>
              <div className="job-card__top">
                <span className="job-card__source">{job.source}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {score !== null && (
                    <span className={`score-badge ${scoreClass(score)}`}>
                      {score}
                    </span>
                  )}
                  <span className="job-card__company">{job.company}</span>
                </div>
              </div>
              <div className="job-card__title">{job.title}</div>
              {job.location && (
                <div className="job-card__location">{job.location}</div>
              )}
              {rationale && <div className="job-card__rationale">{rationale}</div>}
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

function scoreClass(score: number): string {
  if (score >= 60) return "score-badge--high";
  if (score >= 30) return "score-badge--mid";
  return "score-badge--low";
}
