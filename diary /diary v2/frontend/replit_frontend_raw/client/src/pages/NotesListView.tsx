import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, Search, Grid, Calendar, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import MobileLayout from "@/components/layout/MobileLayout";

// Mock data for entries
const mockEntries = [
  {
    id: "today-1",
    section: "Today",
    time: "14:41",
    title: "Afternoon thoughts",
    preview: "Feeling a bit overwhelmed but hopeful...",
    content: "I've been thinking a lot about the project deadline."
  },
  {
    id: "today-2",
    section: "Today",
    time: "09:15",
    title: "Morning quiet",
    preview: "Just woke up, the house is silent.",
    content: "The house is so quiet this morning."
  },
  {
    id: "prev-7-1",
    section: "Previous 7 Days",
    time: "Yesterday",
    title: "A long walk",
    preview: "Walked for hours today, cleared my head.",
    content: "I walked all the way to the park and back."
  },
  {
    id: "prev-7-2",
    section: "Previous 7 Days",
    time: "Tuesday",
    title: "Coffee break",
    preview: "Met with Sarah, good conversation.",
    content: "Met Sarah for coffee."
  },
  {
    id: "prev-30-1",
    section: "Previous 30 Days",
    time: "Oct 24",
    title: "Spring rain",
    preview: "It hasn't stopped raining all day.",
    content: "The rain has been relentless."
  },
  {
    id: "prev-30-2",
    section: "Previous 30 Days",
    time: "Oct 12",
    title: "New book",
    preview: "Started reading 'The Creative Act'.",
    content: "Rick Rubin has some interesting ideas."
  },
  {
    id: "sep-1",
    section: "September",
    time: "Sep 28",
    title: "End of summer",
    preview: "The leaves are starting to turn.",
    content: "It's beautiful outside."
  }
];

// Group entries by their section property
const groupedEntries = mockEntries.reduce((acc, entry) => {
  if (!acc[entry.section]) {
    acc[entry.section] = [];
  }
  acc[entry.section].push(entry);
  return acc;
}, {} as Record<string, typeof mockEntries>);

// Order of sections
const sectionOrder = ["Today", "Previous 7 Days", "Previous 30 Days", "September"];

export default function NotesListView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInsight, setSelectedInsight] = useState<"weekly" | "monthly" | "yearly" | null>(null);

  return (
    <MobileLayout>
      <div className="min-h-full w-full bg-background flex flex-col pb-24">
        
        {/* Header Area */}
        <div className="px-5 pt-6 pb-2 sticky top-0 z-30 bg-background/95 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <Link href="/calendar">
              <a className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors text-sm font-medium">
                <ArrowLeft size={18} />
                <span>Back</span>
              </a>
            </Link>
            <h1 className="text-lg font-semibold text-foreground">Notes</h1>
            <div className="w-[50px] flex justify-end">
               {/* Placeholder for right action if needed */}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Search size={16} />
            </div>
            <input 
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-secondary/50 text-foreground placeholder:text-muted-foreground rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Insight Controls */}
          <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
            {(["weekly", "monthly", "yearly"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedInsight(selectedInsight === type ? null : type)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 border shrink-0",
                  selectedInsight === type 
                    ? "bg-foreground text-background border-foreground shadow-sm" 
                    : "bg-transparent text-muted-foreground border-border hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Insight Panel Content */}
        <AnimatePresence>
          {selectedInsight && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: "auto", opacity: 1, marginBottom: 16 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              className="px-5 overflow-hidden"
            >
              <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-5 border border-primary/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Calendar size={40} />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-1">
                  {selectedInsight} Insight
                </h4>
                <p className="text-sm text-foreground/80 font-medium leading-relaxed">
                  {selectedInsight === "weekly" && "You've focused heavily on clarity this week. Keep finding those quiet moments."}
                  {selectedInsight === "monthly" && "This month has been about grounding. Your most used word was 'calm'."}
                  {selectedInsight === "yearly" && "A year of significant inner growth. You are learning to trust yourself."}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notes List */}
        <div className="px-4 space-y-6">
          {sectionOrder.map((section) => {
            const entries = groupedEntries[section];
            if (!entries || entries.length === 0) return null;

            return (
              <div key={section}>
                <h3 className="text-lg font-bold text-foreground px-1 mb-2">
                  {section}
                </h3>
                <div className="space-y-3">
                  {entries.map((entry) => (
                    <Link key={entry.id} href={`/entry/${entry.id.split('-')[1] || 1}`}>
                      <motion.div
                        whileTap={{ scale: 0.98 }}
                        className="bg-secondary/30 backdrop-blur-sm rounded-2xl p-4 border border-white/5 shadow-sm hover:bg-secondary/40 transition-colors cursor-pointer mb-3"
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="text-base font-bold text-foreground mb-1 truncate pr-4">
                            {entry.title}
                          </h4>
                          {/* Optional Chevron for explicit navigation cue */}
                          {/* <ChevronRight size={16} className="text-muted-foreground/50 mt-1" /> */}
                        </div>
                        <div className="flex items-baseline gap-2 text-sm text-muted-foreground">
                          <span className="font-medium text-foreground/70 shrink-0">{entry.time}</span>
                          <span className="truncate opacity-70">{entry.preview}</span>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MobileLayout>
  );
}
