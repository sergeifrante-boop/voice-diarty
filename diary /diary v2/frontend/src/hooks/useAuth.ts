import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { getToken, setToken, removeToken } from "../lib/auth";
import { config } from "../config";
import type { ErrorResponse } from "../types/api";

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getToken());
  const [, setLocation] = useLocation();

  useEffect(() => {
    setIsAuthenticated(!!getToken());
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      // First check if backend is reachable
      try {
        const healthCheck = await fetch(`${config.apiBaseUrl}/healthz`, { method: "GET" });
        if (!healthCheck.ok) {
          throw new Error(`Backend health check failed: ${healthCheck.status}`);
        }
      } catch (healthError) {
        const healthMessage = healthError instanceof Error ? healthError.message : "Unknown error";
        throw new Error(`Cannot connect to server at ${config.apiBaseUrl}. Make sure the backend is running. Error: ${healthMessage}`);
      }

      const response = await fetch(`${config.apiBaseUrl}/auth/login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      }).catch((fetchError) => {
        // Catch network errors (CORS, connection refused, etc.)
        console.error("Fetch error:", fetchError);
        if (fetchError instanceof TypeError) {
          throw new Error(`Cannot connect to ${config.apiBaseUrl}. Make sure the backend is running on port 8000 and CORS is configured.`);
        }
        throw fetchError;
      });

      if (!response.ok) {
        let errorMessage: string;
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          try {
            const errorData = (await response.json()) as ErrorResponse;
            errorMessage = errorData.detail || `HTTP ${response.status}`;
          } catch {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }
        } else {
          errorMessage = await response.text();
        }
        throw new Error(errorMessage);
      }

      const data = (await response.json()) as TokenResponse;
      setToken(data.access_token);
      setIsAuthenticated(true);
    } catch (error) {
      removeToken();
      setIsAuthenticated(false);
      // Improve error message for network errors
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(`Cannot connect to server at ${config.apiBaseUrl}. Make sure the backend is running on port 8000.`);
      }
      throw error;
    }
  };

  const register = async (email: string, password: string): Promise<void> => {
    try {
      // First check if backend is reachable
      try {
        const healthCheck = await fetch(`${config.apiBaseUrl}/healthz`, { method: "GET" });
        if (!healthCheck.ok) {
          throw new Error(`Backend health check failed: ${healthCheck.status}`);
        }
      } catch (healthError) {
        const healthMessage = healthError instanceof Error ? healthError.message : "Unknown error";
        throw new Error(`Cannot connect to server at ${config.apiBaseUrl}. Make sure the backend is running. Error: ${healthMessage}`);
      }

      const response = await fetch(`${config.apiBaseUrl}/auth/register`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      }).catch((fetchError) => {
        // Catch network errors (CORS, connection refused, etc.)
        console.error("Fetch error:", fetchError);
        if (fetchError instanceof TypeError) {
          throw new Error(`Cannot connect to ${config.apiBaseUrl}. Make sure the backend is running on port 8000 and CORS is configured.`);
        }
        throw fetchError;
      });

      if (!response.ok) {
        let errorMessage: string;
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          try {
            const errorData = (await response.json()) as ErrorResponse;
            errorMessage = errorData.detail || `HTTP ${response.status}`;
          } catch {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }
        } else {
          errorMessage = await response.text();
        }
        throw new Error(errorMessage);
      }

      // After registration, automatically log in
      await login(email, password);
    } catch (error) {
      removeToken();
      setIsAuthenticated(false);
      // Improve error message for network errors
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(`Cannot connect to server at ${config.apiBaseUrl}. Make sure the backend is running on port 8000.`);
      }
      // Re-throw with better context
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Registration failed: ${String(error)}`);
    }
  };

  const logout = () => {
    removeToken();
    setIsAuthenticated(false);
    setLocation("/");
  };

  return {
    isAuthenticated,
    login,
    register,
    logout,
  };
}

