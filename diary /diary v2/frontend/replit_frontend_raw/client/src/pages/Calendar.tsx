import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Layout, List } from "lucide-react";
import { Link } from "wouter";
import MobileLayout from "@/components/layout/MobileLayout";
import { cn } from "@/lib/utils";

type ReflectionType = "Weekly" | "Monthly" | "Yearly" | null;

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState<number>(20);
  const [activeReflection, setActiveReflection] = useState<ReflectionType>(null);
  
  // Mock calendar data
  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const entries = [
    { day: 5, mood: "neutral" },
    { day: 8, mood: "good" },
    { day: 12, mood: "bad" },
    { day: 15, mood: "good" },
    { day: 20, mood: "neutral" },
    { day: 22, mood: "good" },
  ];

  const todaysEntries = [
    { id: 1, time: "09:30", title: "Morning Anxiety", tags: ["Work", "Anxiety"] },
    { id: 2, time: "21:45", title: "Evening Calm", tags: ["Gratitude", "Sleep"] },
  ];

  const hasEntry = (day: number) => entries.find(e => e.day === day);

  const renderReflectionOverlay = () => {
    if (!activeReflection) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm p-6 flex flex-col justify-center items-center text-center"
      >
        <button 
          onClick={() => setActiveReflection(null)}
          className="absolute top-6 right-6 p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={24} />
        </button>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-4">
            {activeReflection} Reflection
          </h2>
          <p className="text-2xl font-display font-medium text-foreground leading-relaxed max-w-xs mx-auto">
            "You've been seeking stillness lately. This {activeReflection.toLowerCase()}, focus on the moments between the noise."
          </p>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <MobileLayout>
      <div className="p-6 min-h-full relative">
        <header className="flex items-center justify-between mb-6 pt-4">
          <h1 className="text-2xl font-display font-semibold">November 2025</h1>
          <div className="flex gap-2">
            {/* Notes List View Toggle Button */}
            <Link href="/notes-list">
              <a className="p-2 hover:bg-black/5 rounded-full transition-colors text-muted-foreground hover:text-primary" title="Switch to List View">
                <List size={20} />
              </a>
            </Link>
            {/* Notes Split View Toggle Button */}
            <Link href="/notes-split">
              <a className="p-2 hover:bg-black/5 rounded-full transition-colors text-muted-foreground hover:text-primary" title="Switch to Notes View">
                <Layout size={20} />
              </a>
            </Link>
            <div className="w-px h-6 bg-border/50 my-auto mx-1" />
            <button className="p-2 hover:bg-black/5 rounded-full transition-colors">
              <ChevronLeft size={20} className="text-muted-foreground" />
            </button>
            <button className="p-2 hover:bg-black/5 rounded-full transition-colors">
              <ChevronRight size={20} className="text-muted-foreground" />
            </button>
          </div>
        </header>

        {/* Reflection Options */}
        <div className="flex justify-center gap-8 mb-8 px-2">
          {(["Weekly", "Monthly", "Yearly"] as const).map((type, i) => (
            <motion.button
              key={type}
              onClick={() => setActiveReflection(type)}
              className={cn(
                "text-xs font-body tracking-wide transition-all duration-500 ease-out select-none",
                "text-foreground",
                activeReflection === type ? "opacity-80 font-medium" : "opacity-30 hover:opacity-60"
              )}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 0.3, y: 0 }}
              whileHover={{ y: -2 }}
              transition={{ delay: i * 0.1, duration: 0.8 }}
              style={{
                transform: `translateY(${i % 2 === 0 ? '0px' : '4px'})` // Slight vertical misalignment
              }}
            >
              {type} Reflection
            </motion.button>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="mb-10">
          <div className="grid grid-cols-7 mb-4">
            {weekDays.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-2">
            {/* Empty days for offset */}
            <div className="col-span-5" /> 
            
            {days.map((day) => {
              const entry = hasEntry(day);
              const isSelected = selectedDate === day;
              
              return (
                <div key={day} className="flex items-center justify-center aspect-square relative">
                  <button
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm transition-all duration-300 relative z-10",
                      isSelected 
                        ? "bg-foreground text-background shadow-lg scale-105" 
                        : "text-foreground hover:bg-black/5",
                      !isSelected && entry && "font-semibold"
                    )}
                  >
                    {day}
                  </button>
                  
                  {/* Indicator Dot for Entry */}
                  {entry && !isSelected && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute bottom-1 w-1 h-1 rounded-full bg-primary/60"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Entries */}
        <motion.div
          key={selectedDate}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Entries for Nov {selectedDate}
          </h2>

          <div className="space-y-4">
            {selectedDate === 20 ? (
              todaysEntries.map((entry, i) => (
                <Link href={`/entry/${entry.id}`} key={entry.id}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="group relative pl-6 border-l border-border hover:border-primary/30 transition-colors py-1 cursor-pointer mb-4"
                  >
                    <div className="absolute left-[-2.5px] top-3 w-[5px] h-[5px] rounded-full bg-border group-hover:bg-primary transition-colors" />
                    
                    <div className="flex items-baseline gap-3 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">{entry.time}</span>
                      <h3 className="text-lg font-medium text-foreground">{entry.title}</h3>
                    </div>
                    
                    <div className="flex gap-2">
                      {entry.tags.map(tag => (
                        <span key={tag} className="text-xs text-muted-foreground bg-secondary/30 px-2 py-0.5 rounded-md">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                </Link>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground italic">
                No entries for this day.
              </div>
            )}
          </div>
        </motion.div>
        
        <AnimatePresence>
          {renderReflectionOverlay()}
        </AnimatePresence>
      </div>
    </MobileLayout>
  );
}
