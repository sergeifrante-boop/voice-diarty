import { useRef, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

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
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [responseText, setResponseText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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
      const url = URL.createObjectURL(blob);
      setAudioURL(url);
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
      formData.append("audio", new File([blob], "voice.webm", { type: blob.type || "audio/webm" }));

      const url = `${API_URL}/test-voice`;
      console.log("Sending audio to backend...", { size: blob.size, type: blob.type, url });

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
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      try {
        const response = await fetch(url, {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        console.log("Response status:", response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response:", errorText);
          throw new Error(`Запрос завершился с ошибкой ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log("Received data:", data);
        setResponseText(data.text ?? data.transcript ?? "No transcript returned.");
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          throw new Error("Запрос превысил время ожидания (60 секунд)");
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

      {audioURL && (
        <audio
          controls
          src={audioURL}
          style={{ width: "320px", maxWidth: "90%" }}
        />
      )}

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

