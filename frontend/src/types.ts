export interface TailorResult {
  tailored_resume: string;
  cover_letter: string;
  match_score: number;
  match_rationale: string;
  flagged_gaps: string[];
}

export interface JobPosting {
  source: string;
  company: string;
  title: string;
  location: string | null;
  url: string;
  posted_at: string | null;
  job_id: string;
}

export interface ScoredPosting {
  posting: JobPosting;
  score: number;
  rationale: string;
  matched_skills: string[];
  missing_skills: string[];
}

export type ApplicationStatus =
  | "draft"
  | "applied"
  | "interviewing"
  | "rejected"
  | "offer";

export interface ApplicationSummary {
  id: number;
  job_title: string;
  company: string;
  job_url: string | null;
  match_score: number;
  status: ApplicationStatus;
  created_at: string;
}

export interface PrefillJob {
  jobTitle: string;
  company: string;
  jobDescription: string;
}
