import { Link, useRoute } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Share, MoreHorizontal, Sparkles } from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { config } from "../config";
import type { EntryDetail as EntryDetailType } from "../types/api";
import { format } from "date-fns";

export default function EntryDetail() {
  const [, params] = useRoute<{ id: string }>("/entry/:id");
  const entryId = params?.id;
  const [showInsight, setShowInsight] = useState(false);
  const [buttonPressed, setButtonPressed] = useState(false);

  // Fetch entry data
  const { data: entry, isLoading: entryLoading } = useQuery<EntryDetailType>({
    queryKey: [config.apiBaseUrl, `/entries/${entryId}`],
    enabled: !!entryId,
  });

  // Fetch insight when button is clicked
  const { data: insight, isLoading: insightLoading } = useQuery({
    queryKey: [config.apiBaseUrl, `/insights/entry/${entryId}`],
    enabled: showInsight && !!entryId,
  });

  const handleInsightClick = () => {
    setButtonPressed(true);
    setTimeout(() => {
      setButtonPressed(false);
      setShowInsight(true);
    }, 200);
  };

  if (entryLoading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-full">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </MobileLayout>
    );
  }

  if (!entry) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-full p-6">
          <p className="text-muted-foreground mb-4">Entry not found</p>
          <Link href="/" className="text-primary hover:underline">
            Go home
          </Link>
        </div>
      </MobileLayout>
    );
  }

  const entryDate = entry.created_at ? new Date(entry.created_at) : new Date();
  const formattedDate = format(entryDate, "MMMM d, yyyy");

  return (
    <MobileLayout>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="min-h-full p-6 pb-24"
      >
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex gap-2">
            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              <Share size={18} />
            </button>
            <button className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors">
              <MoreHorizontal size={20} />
            </button>
          </div>
        </div>

        {/* Date */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm font-medium text-muted-foreground mb-3"
        >
          {formattedDate}
        </motion.p>

        {/* Title */}
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-display font-semibold text-foreground mb-6 leading-tight"
        >
          {entry.title}
        </motion.h1>

        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {entry.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs text-muted-foreground bg-secondary/30 px-2 py-1 rounded-md"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Journal Content */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="prose prose-stone max-w-none mb-8"
        >
          <p className="text-lg leading-loose text-foreground/90 font-body whitespace-pre-wrap">
            {entry.transcript}
          </p>
        </motion.div>

        {/* Insight Button & Result */}
        <div className="mb-12 flex flex-col items-start gap-6">
          <motion.button
            onClick={handleInsightClick}
            disabled={showInsight || insightLoading}
            animate={buttonPressed ? { scale: 0.95 } : { scale: 1 }}
            className={cn(
              "flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors px-0 py-2 outline-none",
              (showInsight || insightLoading) && "opacity-50"
            )}
          >
            <Sparkles size={14} />
            {insightLoading ? "Loading insight..." : "Get an insight"}
          </motion.button>

          <AnimatePresence>
            {showInsight && insight && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 0.7, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="text-lg font-serif italic text-foreground/80 leading-relaxed pl-4 border-l-2 border-primary/10"
              >
                {insight.summary || insight.details || "No insight available"}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </MobileLayout>
  );
}

