import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import MobileLayout from "@/components/layout/MobileLayout";
import { cn } from "@/lib/utils";
import { config } from "../config";
import { getAuthHeaders, removeToken } from "../lib/auth";
import type { TranscribeResponse, ErrorResponse } from "../types/api";

const REQUEST_TIMEOUT_MS = 60000; // 60 seconds

export default function Home() {
  const [status, setStatus] = useState<"idle" | "recording" | "processing">("idle");
  const [, setLocation] = useLocation();
  const [recordingTime, setRecordingTime] = useState(0);
  
  // Voice recording refs (from VoiceRecordTest.tsx)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === "recording") {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [status]);

  // Voice recording logic (integrated from VoiceRecordTest.tsx)
  const startRecording = async () => {
    try {
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
        await processRecording(blob);
      };

      recorder.start();
      setStatus("recording");
    } catch (error) {
      console.error("Microphone access denied or unavailable", error);
      alert("Unable to access microphone. Please check your browser permissions.");
      setStatus("idle");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setStatus("processing");
  };

  const processRecording = async (blob: Blob) => {
    try {
      // Step 1: Transcribe audio
      const formData = new FormData();
      formData.append("file", new File([blob], "recording.webm", { type: blob.type || "audio/webm" }));

      // Health check first
      try {
        const healthCheck = await fetch(`${config.apiBaseUrl}/healthz`, { method: "GET" });
        if (!healthCheck.ok) {
          throw new Error(`Backend health check failed: ${healthCheck.status}`);
        }
      } catch (healthError) {
        const healthMessage = healthError instanceof Error ? healthError.message : "Unknown error";
        throw new Error(`Failed to connect to server. Make sure backend is running on ${config.apiBaseUrl}. Error: ${healthMessage}`);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        // Call /transcribe endpoint
        // Note: /transcribe doesn't require auth, but we include token if available
        const authHeaders = getAuthHeaders();
        // For FormData, we need to let browser set Content-Type with boundary
        // So we only include Authorization header
        const headers: HeadersInit = {};
        if (authHeaders["Authorization"]) {
          headers["Authorization"] = authHeaders["Authorization"];
        }
        
        const transcribeResponse = await fetch(`${config.apiBaseUrl}/transcribe`, {
          method: "POST",
          headers, // ✅ Include Authorization header if token exists
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!transcribeResponse.ok) {
          let errorMessage: string;
          const contentType = transcribeResponse.headers.get("content-type");
          if (contentType?.includes("application/json")) {
            try {
              const errorData = (await transcribeResponse.json()) as ErrorResponse;
              errorMessage = errorData.detail || `HTTP ${transcribeResponse.status}`;
            } catch {
              errorMessage = `HTTP ${transcribeResponse.status}: ${transcribeResponse.statusText}`;
            }
          } else {
            errorMessage = await transcribeResponse.text();
          }
          throw new Error(`Transcription failed ${transcribeResponse.status}: ${errorMessage}`);
        }

        let transcribeData: TranscribeResponse;
        try {
          const contentType = transcribeResponse.headers.get("content-type");
          if (!contentType?.includes("application/json")) {
            throw new Error("Response is not JSON");
          }
          transcribeData = (await transcribeResponse.json()) as TranscribeResponse;
        } catch (parseError) {
          console.error("Failed to parse JSON response:", parseError);
          throw new Error("Server returned invalid response. Please try again.");
        }

        const transcript = transcribeData.text || transcribeData.transcript;
        if (!transcript || !transcript.trim()) {
          throw new Error("Transcription produced empty result");
        }

        // Step 2: Create entry with transcript
        const entryResponse = await fetch(`${config.apiBaseUrl}/entries`, {
          method: "POST",
          headers: getAuthHeaders(), // ✅ Include Authorization header with token
          body: JSON.stringify({ transcript }),
        });

        if (!entryResponse.ok) {
          // Handle 401 Unauthorized - token expired or invalid
          if (entryResponse.status === 401) {
            // Remove invalid token and redirect to login
            removeToken();
            setLocation("/login");
            throw new Error("Your session has expired. Please log in again.");
          }
          
          let errorMessage: string;
          const contentType = entryResponse.headers.get("content-type");
          if (contentType?.includes("application/json")) {
            try {
              const errorData = (await entryResponse.json()) as ErrorResponse;
              errorMessage = errorData.detail || `HTTP ${entryResponse.status}`;
            } catch {
              errorMessage = `HTTP ${entryResponse.status}: ${entryResponse.statusText}`;
            }
          } else {
            errorMessage = await entryResponse.text();
          }
          throw new Error(`Failed to create entry ${entryResponse.status}: ${errorMessage}`);
        }

        const entryData = await entryResponse.json();
        console.log("Entry created:", entryData);

        // Step 3: Navigate to entry detail
        setLocation(`/entry/${entryData.id}`);

      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          throw new Error(`Request timed out (${REQUEST_TIMEOUT_MS / 1000} seconds)`);
        }
        if (fetchError instanceof TypeError && fetchError.message.includes("fetch")) {
          throw new Error(`Failed to connect to server ${config.apiBaseUrl}. Check that backend is running.`);
        }
        throw fetchError;
      }
    } catch (error) {
      console.error("Failed to process recording", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      alert(`Error: ${errorMessage}`);
      setStatus("idle");
    }
  };

  const handlePress = async () => {
    if (status === "idle") {
      await startRecording();
    } else if (status === "recording") {
      stopRecording();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <MobileLayout>
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div 
            animate={{ 
              x: [0, 20, -20, 0],
              y: [0, -30, 20, 0],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] bg-dream-rose/30 blur-[80px] rounded-full mix-blend-multiply"
          />
          <motion.div 
             animate={{ 
              x: [0, -30, 20, 0],
              y: [0, 40, -20, 0],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-[10%] right-[-10%] w-[60%] h-[50%] bg-dream-lavender/30 blur-[80px] rounded-full mix-blend-multiply"
          />
        </div>

        {/* Central Orb Button Container - Perfectly Centered */}
        <div className="flex-1 flex items-center justify-center w-full relative z-20">
          <div className="relative flex items-center justify-center">
            {/* Ripples */}
            {status === "recording" && (
              <>
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ width: "100%", height: "100%", opacity: 0.5 }}
                    animate={{ 
                      width: ["100%", "250%"], 
                      height: ["100%", "250%"],
                      opacity: [0.4, 0] 
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      delay: i * 0.6,
                      ease: "easeOut" 
                    }}
                    className="absolute rounded-full border border-primary/20 bg-primary/5 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  />
                ))}
              </>
            )}

            {/* Main Button */}
            <motion.button
              onClick={handlePress}
              disabled={status === "processing"}
              animate={
                status === "idle" 
                  ? { scale: [1, 1.05, 1] }
                  : status === "recording"
                  ? { scale: [1, 1.1, 1] }
                  : { scale: 0.9 }
              }
              transition={
                status === "idle"
                  ? { duration: 4, repeat: Infinity, ease: "easeInOut" }
                  : status === "recording"
                  ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 0.5 }
              }
              className={cn(
                "w-48 h-48 rounded-full relative flex items-center justify-center transition-all duration-700 outline-none",
                "bg-gradient-to-br from-white to-fog-rose",
                "shadow-[0_20px_50px_rgba(0,0,0,0.1),0_10px_20px_rgba(0,0,0,0.05),inset_0_-5px_10px_rgba(0,0,0,0.05)]",
                "border border-white/50",
                status === "recording" && "shadow-[0_0_60px_rgba(255,200,200,0.4)] from-white to-dream-rose",
                status === "processing" && "opacity-80"
              )}
            >
              <div className="absolute inset-2 rounded-full bg-gradient-to-tl from-white/90 to-transparent opacity-50 pointer-events-none" />
              
              {/* Inner Wave/Visual */}
              <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center opacity-20">
                {status === "recording" ? (
                  <div className="flex items-center gap-1 h-12">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ height: ["20%", "100%", "20%"] }}
                        transition={{ 
                          duration: 0.8, 
                          repeat: Infinity, 
                          delay: i * 0.1,
                          ease: "easeInOut" 
                        }}
                        className="w-1.5 bg-foreground rounded-full"
                      />
                    ))}
                  </div>
                ) : status === "processing" ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 rounded-full border-2 border-foreground/20 border-t-foreground/50"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-transparent via-primary/10 to-transparent blur-xl" />
                )}
              </div>
            </motion.button>
          </div>
        </div>

        {/* Bottom Processing Text & Timer */}
        <AnimatePresence>
          {status === "recording" && (
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0 }}
               className="absolute bottom-12 text-center w-full left-0"
             >
               <p className="font-mono text-sm text-muted-foreground/60">
                 {formatTime(recordingTime)}
               </p>
             </motion.div>
          )}
          {status === "processing" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-12 text-center w-full left-0"
            >
              <p className="text-sm text-muted-foreground">Turning your words into a page...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MobileLayout>
  );
}

