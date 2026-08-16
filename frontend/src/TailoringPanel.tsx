import { useState, FormEvent, useEffect } from "react";
import { TailorResult, PrefillJob } from "./types";

const API_BASE = "http://localhost:8000/api";

type Status = "idle" | "loading" | "error" | "done";

export default function TailoringPanel({ prefill }: { prefill: PrefillJob | null }) {
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [baseResume, setBaseResume] = useState("");
  const [notes, setNotes] = useState("");

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TailorResult | null>(null);
  const [activeTab, setActiveTab] = useState<"resume" | "cover">("resume");

  useEffect(() => {
    if (prefill) {
      setJobTitle(prefill.jobTitle);
      setCompany(prefill.company);
      setJobDescription(prefill.jobDescription);
    }
  }, [prefill]);

  const canSubmit =
    jobTitle.trim() && company.trim() && jobDescription.trim() && baseResume.trim();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit || status === "loading") return;

    setStatus("loading");
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${API_BASE}/tailoring/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_title: jobTitle,
          company,
          job_description: jobDescription,
          base_resume: baseResume,
          notes: notes.trim() || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Request failed (${res.status})`);
      }

      const data: TailorResult = await res.json();
      setResult(data);
      setActiveTab("resume");
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  return (
    <div className="console__body">
      <form className="panel input-panel" onSubmit={handleSubmit}>
        <div className="panel__label">input parameters</div>

        {prefill && (
          <p className="hint hint--accent">
            Prefilled from discovery — paste the full job description below for best
            results.
          </p>
        )}

        <div className="field-row">
          <Field label="job_title" required>
            <input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Senior software engineer"
            />
          </Field>
          <Field label="company" required>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Corp"
            />
          </Field>
        </div>

        <Field label="job_description" required>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job posting here"
            rows={8}
          />
        </Field>

        <Field label="base_resume" required>
          <textarea
            value={baseResume}
            onChange={(e) => setBaseResume(e.target.value)}
            placeholder="Paste your base resume as plain text"
            rows={10}
          />
        </Field>

        <Field label="notes" hint="optional">
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. emphasize backend work"
          />
        </Field>

        <button type="submit" disabled={!canSubmit || status === "loading"}>
          {status === "loading" ? "Running tailoring pass…" : "Run tailoring"}
        </button>

        {status === "loading" && (
          <p className="hint">
            Local models can take a few minutes per request — this is normal.
          </p>
        )}
        {status === "error" && <p className="error-text">{error}</p>}
      </form>

      <div className="panel output-panel">
        <div className="panel__label">readout</div>

        {!result && status !== "loading" && (
          <div className="empty-state">
            <p>No output yet.</p>
            <p className="hint">Fill in the form and run a tailoring pass.</p>
          </div>
        )}

        {status === "loading" && (
          <div className="empty-state">
            <p className="hint">Waiting on the local model…</p>
          </div>
        )}

        {result && (
          <>
            <ScoreGauge score={result.match_score} />

            <div className="rationale">
              <div className="field__label">match_rationale</div>
              <p>{result.match_rationale}</p>
            </div>

            {result.flagged_gaps.length > 0 && (
              <div className="gaps">
                <div className="field__label">flagged_gaps</div>
                <ul>
                  {result.flagged_gaps.map((gap, i) => (
                    <li key={i}>{gap}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="tabs">
              <button
                type="button"
                className={activeTab === "resume" ? "tab tab--active" : "tab"}
                onClick={() => setActiveTab("resume")}
              >
                tailored_resume
              </button>
              <button
                type="button"
                className={activeTab === "cover" ? "tab tab--active" : "tab"}
                onClick={() => setActiveTab("cover")}
              >
                cover_letter
              </button>
            </div>

            <pre className="output-text">
              {activeTab === "resume" ? result.tailored_resume : result.cover_letter}
            </pre>
          </>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span className="field__label">
        {label}
        {required && <span className="required">*</span>}
        {hint && <span className="field__hint">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function ScoreGauge({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div className="gauge">
      <div className="gauge__track">
        <div className="gauge__fill" style={{ width: `${clamped}%` }} />
        {[0, 25, 50, 75, 100].map((tick) => (
          <div key={tick} className="gauge__tick" style={{ left: `${tick}%` }} />
        ))}
      </div>
      <div className="gauge__readout">
        <span className="gauge__value">{clamped}</span>
        <span className="gauge__unit">/ 100 match_score</span>
      </div>
    </div>
  );
}
