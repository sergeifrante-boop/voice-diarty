import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Share, MoreHorizontal, Sparkles } from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function EntryDetail() {
  const [showInsight, setShowInsight] = useState(false);
  const [buttonPressed, setButtonPressed] = useState(false);

  const handleInsightClick = () => {
    setButtonPressed(true);
    setTimeout(() => {
      setButtonPressed(false);
      setShowInsight(true);
    }, 200);
  };

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
          <Link href="/">
            <a className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={20} />
            </a>
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
          November 20, 2025
        </motion.p>

        {/* Title */}
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-display font-semibold text-foreground mb-6 leading-tight"
        >
          A Quiet Morning Reflection
        </motion.h1>

        {/* Journal Content */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="prose prose-stone max-w-none mb-8"
        >
          <p className="text-lg leading-loose text-foreground/90 font-body indent-8">
            I woke up feeling a heavy weight in my chest today. It's that same anxiety about the project deadline next week. I keep thinking I'm not doing enough, even though I've been working late every night.
          </p>
          <p className="text-lg leading-loose text-foreground/90 font-body">
            But then I took a walk outside. The air was cold, and for a moment, just looking at the trees, I felt small in a good way. <span className="bg-dream-rose/30 px-1 rounded">I realized that my worth isn't tied to this one deliverable.</span> I need to be kinder to myself. It's okay to rest. It's okay to just be.
          </p>
        </motion.div>

        {/* Insight Button & Result */}
        <div className="mb-12 flex flex-col items-start gap-6">
          <motion.button
            onClick={handleInsightClick}
            animate={buttonPressed ? { scale: 0.95 } : { scale: 1 }}
            className={cn(
              "flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors px-0 py-2 outline-none",
              showInsight && "opacity-50"
            )}
          >
            <Sparkles size={14} />
            Get an insight
          </motion.button>

          <AnimatePresence>
            {showInsight && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 0.7, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="text-lg font-serif italic text-foreground/80 leading-relaxed pl-4 border-l-2 border-primary/10"
              >
                Soft insight: Try to breathe slower today.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </MobileLayout>
  );
}
