import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, Calendar, Grid, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data for entries
const mockEntries = [
  {
    id: "today-1",
    group: "Today",
    time: "14:41",
    title: "Afternoon thoughts",
    preview: "Feeling a bit overwhelmed but hopeful...",
    content: "I've been thinking a lot about the project deadline. It feels heavy, but taking a moment to breathe helps. The sun is shining outside, and I want to remember that this feeling is temporary. I need to focus on one small step at a time."
  },
  {
    id: "today-2",
    group: "Today",
    time: "09:15",
    title: "Morning quiet",
    preview: "Just woke up, the house is silent.",
    content: "The house is so quiet this morning. It's my favorite time of day. I made coffee and just sat by the window for twenty minutes without looking at my phone. I want to do this more often."
  },
  {
    id: "sep-1",
    group: "September 2025",
    time: "20:30",
    title: "A long walk",
    preview: "Walked for hours today, cleared my head.",
    content: "I walked all the way to the park and back. My legs are tired but my mind feels clearer than it has in weeks. Nature has a way of putting things into perspective. The trees don't rush, yet everything gets done."
  },
  {
    id: "sep-2",
    group: "September 2025",
    time: "11:00",
    title: "Coffee break",
    preview: "Met with Sarah, good conversation.",
    content: "Met Sarah for coffee. We talked about our plans for the future. It's scary to think about change, but also exciting. She suggested I try journaling more, which is funny because here I am."
  },
  {
    id: "apr-1",
    group: "April 2025",
    time: "16:20",
    title: "Spring rain",
    preview: "It hasn't stopped raining all day.",
    content: "The rain has been relentless. It matches my mood a bit. I feel stuck inside, both literally and metaphorically. Maybe I need to embrace the coziness of it instead of fighting it."
  }
];

// Group entries by their group property
const groupedEntries = mockEntries.reduce((acc, entry) => {
  if (!acc[entry.group]) {
    acc[entry.group] = [];
  }
  acc[entry.group].push(entry);
  return acc;
}, {} as Record<string, typeof mockEntries>);

export default function NotesSplitView() {
  const [selectedEntryId, setSelectedEntryId] = useState<string>(mockEntries[0].id);
  const [selectedInsight, setSelectedInsight] = useState<"weekly" | "monthly" | "yearly" | null>(null);

  const selectedEntry = mockEntries.find(e => e.id === selectedEntryId);

  return (
    <div className="h-screen w-full bg-background flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Sidebar Toggle / Header */}
      <div className="md:hidden h-16 border-b border-border/40 flex items-center px-4 justify-between bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <Link href="/">
           <a className="text-muted-foreground hover:text-foreground transition-colors">
             <ArrowLeft size={20} />
           </a>
        </Link>
        <span className="font-display font-medium">Journal Notes</span>
        <div className="w-5" /> {/* Spacer */}
      </div>

      {/* Left Sidebar - Entry List */}
      <div className="w-full md:w-[30%] lg:w-[25%] h-full border-r border-border/40 bg-background/50 backdrop-blur-xl flex flex-col relative z-10">
        {/* Desktop Header */}
        <div className="hidden md:flex h-16 items-center justify-between px-6 border-b border-border/20">
           <Link href="/">
             <a className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm font-medium">
               <ArrowLeft size={16} /> Back
             </a>
           </Link>
           <div className="flex gap-2">
             <button className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground transition-colors">
               <Grid size={16} />
             </button>
           </div>
        </div>

        {/* Entry List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-6">
          {Object.entries(groupedEntries).map(([group, entries]) => (
            <div key={group}>
              <h3 className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider px-3 mb-2 sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10">
                {group}
              </h3>
              <div className="space-y-1">
                {entries.map(entry => (
                  <motion.button
                    key={entry.id}
                    onClick={() => setSelectedEntryId(entry.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl transition-all duration-300 group",
                      selectedEntryId === entry.id 
                        ? "bg-primary/10 shadow-sm ring-1 ring-primary/20" 
                        : "hover:bg-white/5"
                    )}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex justify-between items-baseline mb-1">
                      <span className={cn(
                        "font-display font-semibold text-sm truncate pr-2",
                         selectedEntryId === entry.id ? "text-foreground" : "text-foreground/80"
                      )}>
                        {entry.title}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                        {entry.time}
                      </span>
                    </div>
                    <p className={cn(
                      "text-xs truncate line-clamp-1",
                      selectedEntryId === entry.id ? "text-foreground/70" : "text-muted-foreground/60"
                    )}>
                      {entry.preview}
                    </p>
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Pane - Reading Area */}
      <div className="flex-1 h-full bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden flex flex-col">
        
        {/* Floating Particles Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-primary/5 blur-3xl"
              style={{
                width: Math.random() * 300 + 100,
                height: Math.random() * 300 + 100,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                x: [0, 30, -30, 0],
                y: [0, -30, 30, 0],
              }}
              transition={{
                duration: 20 + Math.random() * 10,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        {/* Top Toolbar / Insight Controls */}
        <div className="h-16 px-8 flex items-center justify-center md:justify-end gap-3 border-b border-border/20 relative z-20 bg-background/30 backdrop-blur-sm">
          {(["weekly", "monthly", "yearly"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedInsight(selectedInsight === type ? null : type)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 border",
                selectedInsight === type 
                  ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
                  : "bg-transparent text-muted-foreground border-transparent hover:bg-primary/5 hover:text-foreground hover:border-primary/10"
              )}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)} Insight
            </button>
          ))}
        </div>

        {/* Insight Panel (Conditional) */}
        <AnimatePresence>
          {selectedInsight && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-primary/5 border-b border-border/20 overflow-hidden relative z-10"
            >
              <div className="p-6 text-center max-w-2xl mx-auto">
                <h4 className="text-sm font-semibold uppercase tracking-widest text-primary mb-2">
                  {selectedInsight} Insight
                </h4>
                <p className="text-foreground/80 font-display text-lg italic leading-relaxed">
                  {selectedInsight === "weekly" && "You've focused heavily on clarity this week. Keep finding those quiet moments."}
                  {selectedInsight === "monthly" && "This month has been about grounding. Your most used word was 'calm'."}
                  {selectedInsight === "yearly" && "A year of significant inner growth. You are learning to trust yourself."}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Reading Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-16 relative z-10">
          {selectedEntry ? (
            <motion.div
              key={selectedEntry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="max-w-3xl mx-auto bg-card/40 backdrop-blur-md rounded-2xl p-8 md:p-12 shadow-sm border border-white/5"
            >
              <div className="text-center mb-8">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest block mb-2">
                  {selectedEntry.group}
                </span>
                <span className="text-sm text-muted-foreground font-mono">
                  at {selectedEntry.time}
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-8 leading-tight text-center">
                {selectedEntry.title}
              </h1>

              <div className="prose prose-lg prose-stone dark:prose-invert max-w-none">
                <p className="font-body text-foreground/90 leading-loose indent-8 text-xl">
                  {selectedEntry.content}
                </p>
              </div>

              <div className="mt-12 pt-8 border-t border-border/20 flex justify-center">
                 <span className="w-1.5 h-1.5 rounded-full bg-primary/40 mx-1" />
                 <span className="w-1.5 h-1.5 rounded-full bg-primary/40 mx-1" />
                 <span className="w-1.5 h-1.5 rounded-full bg-primary/40 mx-1" />
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Select an entry to read
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
