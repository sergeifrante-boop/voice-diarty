import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, Search, Calendar, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import MobileLayout from "@/components/layout/MobileLayout";
import { useQuery } from "@tanstack/react-query";
import { config } from "../config";
import type { EntryListResponse } from "../types/api";
import { format, isToday, isYesterday, isThisWeek, isThisMonth, parseISO } from "date-fns";

export default function NotesListView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInsight, setSelectedInsight] = useState<"week" | "month" | "year" | null>(null);

  // Fetch entries
  const { data: entriesData, isLoading } = useQuery<EntryListResponse>({
    queryKey: [config.apiBaseUrl, `/entries`, { limit: 50 }],
  });

  // Fetch period insight when selected
  const { data: periodInsight } = useQuery({
    queryKey: [config.apiBaseUrl, `/insights/period`, { timeframe: selectedInsight }],
    enabled: !!selectedInsight,
  });

  // Group entries by time period
  const groupedEntries = entriesData?.entries.reduce((acc, entry) => {
    const date = parseISO(entry.created_at);
    let section: string;
    
    if (isToday(date)) {
      section = "Today";
    } else if (isYesterday(date)) {
      section = "Yesterday";
    } else if (isThisWeek(date)) {
      section = "This Week";
    } else if (isThisMonth(date)) {
      section = "This Month";
    } else {
      section = format(date, "MMMM yyyy");
    }
    
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(entry);
    return acc;
  }, {} as Record<string, typeof entriesData.entries>) || {};

  const sectionOrder = Object.keys(groupedEntries).sort((a, b) => {
    const order = ["Today", "Yesterday", "This Week", "This Month"];
    const aIdx = order.indexOf(a);
    const bIdx = order.indexOf(b);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return b.localeCompare(a); // Reverse chronological for months
  });

  const filteredEntries = searchQuery
    ? Object.values(groupedEntries).flat().filter((entry) =>
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.transcript_preview.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-full">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </MobileLayout>
    );
  }

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
            <div className="w-[50px] flex justify-end" />
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
            {(["week", "month", "year"] as const).map((type) => (
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
          {selectedInsight && periodInsight && (
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
                  {periodInsight.summary || `Your ${selectedInsight} insight will appear here.`}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notes List */}
        <div className="px-4 space-y-6">
          {filteredEntries ? (
            filteredEntries.length > 0 ? (
              filteredEntries.map((entry) => (
                <Link key={entry.id} href={`/entry/${entry.id}`}>
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    className="bg-secondary/30 backdrop-blur-sm rounded-2xl p-4 border border-white/5 shadow-sm hover:bg-secondary/40 transition-colors cursor-pointer mb-3"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="text-base font-bold text-foreground mb-1 truncate pr-4">
                        {entry.title}
                      </h4>
                    </div>
                    <div className="flex items-baseline gap-2 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground/70 shrink-0">
                        {format(parseISO(entry.created_at), "MMM d, h:mm a")}
                      </span>
                      <span className="truncate opacity-70">{entry.transcript_preview}</span>
                    </div>
                  </motion.div>
                </Link>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">No entries found</div>
            )
          ) : (
            sectionOrder.map((section) => {
              const entries = groupedEntries[section];
              if (!entries || entries.length === 0) return null;

              return (
                <div key={section}>
                  <h3 className="text-lg font-bold text-foreground px-1 mb-2">
                    {section}
                  </h3>
                  <div className="space-y-3">
                    {entries.map((entry) => (
                      <Link key={entry.id} href={`/entry/${entry.id}`}>
                        <motion.div
                          whileTap={{ scale: 0.98 }}
                          className="bg-secondary/30 backdrop-blur-sm rounded-2xl p-4 border border-white/5 shadow-sm hover:bg-secondary/40 transition-colors cursor-pointer mb-3"
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="text-base font-bold text-foreground mb-1 truncate pr-4">
                              {entry.title}
                            </h4>
                          </div>
                          <div className="flex items-baseline gap-2 text-sm text-muted-foreground">
                            <span className="font-medium text-foreground/70 shrink-0">
                              {format(parseISO(entry.created_at), "h:mm a")}
                            </span>
                            <span className="truncate opacity-70">{entry.transcript_preview}</span>
                          </div>
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </MobileLayout>
  );
}

