import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { config } from "../config"; // ✅ Use our config as single source of truth
import { getAuthHeaders, removeToken } from "./auth"; // ✅ Include auth token in requests

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/**
 * API request helper that uses config.apiBaseUrl
 * ✅ All API calls go through config.apiBaseUrl (no hardcoded URLs)
 */
export async function apiRequest(
  method: string,
  endpoint: string, // Endpoint path like "/entries" or "/entries/123"
  data?: unknown | undefined,
): Promise<Response> {
  const url = `${config.apiBaseUrl}${endpoint}`; // ✅ Prepend base URL
  const headers = getAuthHeaders(); // ✅ Include Authorization header with token
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // Handle 401 Unauthorized - remove token and redirect
  if (res.status === 401) {
    removeToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

/**
 * React Query function factory that uses config.apiBaseUrl
 * ✅ All query keys are relative paths, base URL is prepended here
 * 
 * Query key format: [config.apiBaseUrl, "/endpoint", { queryParams }]
 * Example: [config.apiBaseUrl, "/entries", { limit: 50 }]
 */
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // queryKey format: [baseUrl, endpoint, ...params]
    // Example: [config.apiBaseUrl, "/entries", { limit: 50 }]
    if (queryKey.length < 2) {
      throw new Error("Invalid query key format. Expected [baseUrl, endpoint, ...params]");
    }
    
    const baseUrl = queryKey[0] as string;
    const endpoint = queryKey[1] as string;
    const params = queryKey.slice(2);
    
    // Build URL with query params if needed
    let url = `${baseUrl}${endpoint}`;
    if (params.length > 0 && typeof params[0] === "object" && params[0] !== null) {
      const queryParams = new URLSearchParams();
      Object.entries(params[0] as Record<string, unknown>).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          queryParams.append(k, String(v));
        }
      });
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
    }

    const headers = getAuthHeaders(); // ✅ Include Authorization header with token
    const res = await fetch(url, {
      headers,
      credentials: "include",
    });

    if (res.status === 401) {
      // Remove invalid/expired token
      removeToken();
      
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      
      // For "throw" behavior, redirect to login
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

