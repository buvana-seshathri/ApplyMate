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

export interface PrefillJob {
  jobTitle: string;
  company: string;
  jobDescription: string;
}
