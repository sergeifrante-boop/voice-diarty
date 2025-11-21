import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Layout, List } from "lucide-react";
import { Link } from "wouter";
import MobileLayout from "@/components/layout/MobileLayout";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { config } from "../config";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, parseISO } from "date-fns";

type CalendarDay = {
  date: string;
  entries: Array<{
    id: string;
    title: string;
    time: string;
    tags: string[];
  }>;
};

type ReflectionType = "week" | "month" | "year" | null;

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [activeReflection, setActiveReflection] = useState<ReflectionType>(null);
  
  const monthStr = format(currentMonth, "yyyy-MM");
  
  // Fetch calendar data
  const { data: calendarData, isLoading } = useQuery<CalendarDay[]>({
    queryKey: [config.apiBaseUrl, `/entries/calendar`, { month: monthStr }],
  });

  // Fetch period insight when reflection is selected
  const { data: periodInsight } = useQuery({
    queryKey: [config.apiBaseUrl, `/insights/period`, { timeframe: activeReflection }],
    enabled: !!activeReflection,
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfWeek = getDay(monthStart); // 0 = Sunday

  // Create calendar grid with empty cells for days before month start
  const calendarDays = [
    ...Array(firstDayOfWeek).fill(null),
    ...daysInMonth.map((day) => day.getDate()),
  ];

  const hasEntry = (day: number) => {
    if (!calendarData) return false;
    const dayStr = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day), "yyyy-MM-dd");
    return calendarData.some((item) => item.date.startsWith(dayStr));
  };

  const getDayEntries = (day: number) => {
    if (!calendarData) return [];
    const dayStr = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day), "yyyy-MM-dd");
    const dayData = calendarData.find((item) => item.date.startsWith(dayStr));
    return dayData?.entries || [];
  };

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
          ×
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
            {periodInsight?.summary || `Your ${activeReflection} reflection will appear here.`}
          </p>
        </motion.div>
      </motion.div>
    );
  };

  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <MobileLayout>
      <div className="p-6 min-h-full relative">
        <header className="flex items-center justify-between mb-6 pt-4">
          <h1 className="text-2xl font-display font-semibold">{format(currentMonth, "MMMM yyyy")}</h1>
          <div className="flex gap-2">
            <Link href="/notes-list">
              <a className="p-2 hover:bg-black/5 rounded-full transition-colors text-muted-foreground hover:text-primary" title="Switch to List View">
                <List size={20} />
              </a>
            </Link>
            <Link href="/notes-split">
              <a className="p-2 hover:bg-black/5 rounded-full transition-colors text-muted-foreground hover:text-primary" title="Switch to Notes View">
                <Layout size={20} />
              </a>
            </Link>
            <div className="w-px h-6 bg-border/50 my-auto mx-1" />
            <button 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-2 hover:bg-black/5 rounded-full transition-colors"
            >
              <ChevronLeft size={20} className="text-muted-foreground" />
            </button>
            <button 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-2 hover:bg-black/5 rounded-full transition-colors"
            >
              <ChevronRight size={20} className="text-muted-foreground" />
            </button>
          </div>
        </header>

        {/* Reflection Options */}
        <div className="flex justify-center gap-8 mb-8 px-2">
          {(["week", "month", "year"] as const).map((type, i) => (
            <motion.button
              key={type}
              onClick={() => setActiveReflection(activeReflection === type ? null : type)}
              className={cn(
                "text-xs font-body tracking-wide transition-all duration-500 ease-out select-none",
                "text-foreground",
                activeReflection === type ? "opacity-80 font-medium" : "opacity-30 hover:opacity-60"
              )}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 0.3, y: 0 }}
              whileHover={{ y: -2 }}
              transition={{ delay: i * 0.1, duration: 0.8 }}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)} Reflection
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
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} />;
              }
              
              const entry = hasEntry(day);
              const isSelected = selectedDate === day;
              const dayDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
              const isTodayDate = isToday(dayDate);
              
              return (
                <div key={day} className="flex items-center justify-center aspect-square relative">
                  <button
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm transition-all duration-300 relative z-10",
                      isSelected 
                        ? "bg-foreground text-background shadow-lg scale-105" 
                        : "text-foreground hover:bg-black/5",
                      !isSelected && entry && "font-semibold",
                      isTodayDate && !isSelected && "ring-2 ring-primary/30"
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
        {selectedDate && (
          <motion.div
            key={selectedDate}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
              Entries for {format(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), selectedDate), "MMM d")}
            </h2>

            <div className="space-y-4">
              {getDayEntries(selectedDate).length > 0 ? (
                getDayEntries(selectedDate).map((entry, i) => (
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
                      
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex gap-2">
                          {entry.tags.map(tag => (
                            <span key={tag} className="text-xs text-muted-foreground bg-secondary/30 px-2 py-0.5 rounded-md">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
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
        )}
        
        <AnimatePresence>
          {renderReflectionOverlay()}
        </AnimatePresence>
      </div>
    </MobileLayout>
  );
}

