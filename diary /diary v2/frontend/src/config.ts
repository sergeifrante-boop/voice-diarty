/**
 * API configuration for the frontend.
 * 
 * In development, the backend runs on http://localhost:8000
 * The API routes don't have an /api prefix - they're directly under the root:
 * - /auth/* (authentication)
 * - /entries/* (journal entries)
 * - /insights/* (AI insights)
 * - /tags-cloud (tag cloud)
 * - /healthz (health check)
 * 
 * Set VITE_API_BASE_URL in .env to override the default.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const config = {
  apiBaseUrl: API_BASE_URL,
} as const;

