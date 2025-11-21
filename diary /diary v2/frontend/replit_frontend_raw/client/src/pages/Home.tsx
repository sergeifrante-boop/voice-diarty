import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import MobileLayout from "@/components/layout/MobileLayout";
import { cn } from "@/lib/utils";

export default function Home() {
  const [status, setStatus] = useState<"idle" | "recording" | "processing">("idle");
  const [, setLocation] = useLocation();
  const [recordingTime, setRecordingTime] = useState(0);

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

  const handlePress = () => {
    if (status === "idle") {
      setStatus("recording");
    } else if (status === "recording") {
      setStatus("processing");
      // Simulate processing time then navigate
      setTimeout(() => {
        setLocation("/entry/1"); // Navigate to a mock entry
      }, 3000);
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
                // Enhanced shadows for visibility
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

        {/* Bottom Processing Text & Timer - Positioned relative to bottom of screen */}
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
