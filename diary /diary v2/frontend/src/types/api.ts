/** TypeScript types for API responses */

export interface TranscribeResponse {
  text: string;
  transcript: string; // Alias for text
  language: string;
}

export interface EntryCreateRequest {
  transcript: string;
}

export interface EntrySummary {
  id: string;
  title: string;
  mood_label: string;
  tags: string[];
  created_at: string;
  transcript_preview: string;
}

export interface EntryDetail {
  id: string;
  title: string;
  mood_label: string;
  tags: string[];
  created_at: string;
  transcript: string;
  insights: string[];
}

export interface EntryListResponse {
  entries: EntrySummary[];
  total: number;
}

export interface HealthCheckResponse {
  status: string;
}

export interface ErrorResponse {
  detail: string;
}

