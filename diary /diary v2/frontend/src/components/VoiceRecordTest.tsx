import { useEffect, useRef, useState } from "react";
import { config } from "../config";
import type { TranscribeResponse, ErrorResponse } from "../types/api";

const API_URL = config.apiBaseUrl;
const REQUEST_TIMEOUT_MS = 60000; // 60 seconds

const buttonBaseStyle: React.CSSProperties = {
  width: 160,
  height: 160,
  borderRadius: "80px",
  color: "white",
  border: "none",
  fontSize: "20px",
  fontWeight: 600,
  cursor: "pointer",
  transition: "background-color 0.2s ease",
};

const VoiceRecordTest = () => {
  const [recording, setRecording] = useState(false);
  const [responseText, setResponseText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioURLRef = useRef<string | null>(null);

  // Cleanup effect for object URLs
  useEffect(() => {
    return () => {
      if (audioURLRef.current) {
        URL.revokeObjectURL(audioURLRef.current);
        audioURLRef.current = null;
      }
    };
  }, []);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;

    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = async () => {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      await sendToBackend(blob);
    };

    recorder.start();
    setRecording(true);
    setResponseText(null);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const handleClick = async () => {
    if (recording) {
      stopRecording();
    } else {
      try {
        await startRecording();
      } catch (error) {
        console.error("Microphone access denied or unavailable", error);
        alert("Unable to access microphone. Please check your browser permissions.");
      }
    }
  };

  const sendToBackend = async (blob: Blob) => {
    setLoading(true);
    try {
      const formData = new FormData();
      // Use the original blob type (webm from MediaRecorder)
      // Backend will convert to optimal format for Whisper
      formData.append("file", new File([blob], "recording.webm", { type: blob.type || "audio/webm" }));

      // Use the new high-quality transcribe endpoint
      const url = `${API_URL}/transcribe`;
      console.log("Sending audio to backend for high-quality transcription...", { size: blob.size, type: blob.type, url });

      // First, check if backend is reachable
      try {
        const healthCheck = await fetch(`${API_URL}/healthz`, { method: "GET" });
        if (!healthCheck.ok) {
          throw new Error(`Backend health check failed: ${healthCheck.status} ${healthCheck.statusText}`);
        }
      } catch (healthError) {
        const healthMessage = healthError instanceof Error ? healthError.message : "Unknown error";
        throw new Error(`Не удалось подключиться к серверу. Убедитесь, что backend запущен на ${API_URL}. Ошибка: ${healthMessage}`);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(url, {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        console.log("Response status:", response.status, response.statusText);

        if (!response.ok) {
          // Try to parse error as JSON, fallback to text
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
          console.error("Error response:", errorMessage);
          throw new Error(`Запрос завершился с ошибкой ${response.status}: ${errorMessage}`);
        }

        // Parse JSON response with error handling
        let data: TranscribeResponse;
        try {
          const contentType = response.headers.get("content-type");
          if (!contentType?.includes("application/json")) {
            throw new Error("Response is not JSON");
          }
          data = (await response.json()) as TranscribeResponse;
        } catch (parseError) {
          console.error("Failed to parse JSON response:", parseError);
          throw new Error("Сервер вернул некорректный ответ. Попробуйте еще раз.");
        }

        console.log("Received transcription data:", data);
        
        // Display transcript with metadata
        let displayText = data.text || data.transcript || "No transcript returned.";
        
        // Add language metadata if available
        if (data.language && data.language !== "auto") {
          displayText += `\n\n[Язык: ${data.language}]`;
        }
        
        setResponseText(displayText);
        
        // Store transcript for potential saving
        // TODO: Add a "Save to Library" button that calls POST /entries with this transcript
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          throw new Error(`Запрос превысил время ожидания (${REQUEST_TIMEOUT_MS / 1000} секунд)`);
        }
        if (fetchError instanceof TypeError && fetchError.message.includes("fetch")) {
          throw new Error(`Не удалось подключиться к серверу ${API_URL}. Проверьте, что backend запущен и доступен.`);
        }
        throw fetchError;
      }
    } catch (error) {
      console.error("Failed to send audio", error);
      const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
      setResponseText(`Ошибка: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
        padding: "2rem 1rem",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <button
          onClick={handleClick}
          style={{
            ...buttonBaseStyle,
            backgroundColor: recording ? "#cc0000" : "#ff4d4d",
          }}
        >
          {recording ? "Stop" : "Record"}
        </button>
        {loading && (
          <p style={{ marginTop: "1rem", color: "#555" }}>Обрабатываем запись...</p>
        )}
      </div>

      {responseText && (
        <div
          style={{
            background: "#f4f4f4",
            borderRadius: "12px",
            padding: "1rem 1.25rem",
            maxWidth: "420px",
            width: "90%",
            color: "#333",
            lineHeight: 1.5,
          }}
        >
          {responseText}
        </div>
      )}
    </div>
  );
};

export default VoiceRecordTest;

