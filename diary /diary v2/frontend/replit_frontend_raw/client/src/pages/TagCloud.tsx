import { motion } from "framer-motion";
import { useLocation } from "wouter";
import MobileLayout from "@/components/layout/MobileLayout";
import { BookOpen } from "lucide-react";

export default function TagCloud() {
  const [, setLocation] = useLocation();

  const tags = [
    { id: 1, text: "my inner voice", x: 15, y: 25, scale: 1.3, opacity: 0.8 },
    { id: 2, text: "to be remembered", x: 50, y: 40, scale: 1.0, opacity: 0.7 },
    { id: 3, text: "thoughts softly rising", x: 20, y: 55, scale: 1.4, opacity: 0.9 },
    { id: 4, text: "a peaceful moment", x: 60, y: 65, scale: 0.9, opacity: 0.6 },
    { id: 5, text: "gentle morning light", x: 10, y: 75, scale: 1.1, opacity: 0.7 },
    { id: 6, text: "a new chapter", x: 70, y: 20, scale: 1.0, opacity: 0.8 },
    { id: 7, text: "stillness", x: 45, y: 15, scale: 0.9, opacity: 0.6 },
    { id: 8, text: "breathing room", x: 25, y: 45, scale: 1.1, opacity: 0.7 },
    { id: 9, text: "letting go", x: 75, y: 80, scale: 1.2, opacity: 0.8 },
  ];

  const handleTagClick = () => {
    // Navigate to the mock entry
    setLocation("/entry/1");
  };

  return (
    <MobileLayout>
      <div className="flex-1 w-full relative overflow-hidden bg-white min-h-[80vh]">
        
        {/* Subtle background gradient - moved behind content */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-stone-50/50 to-stone-100/20 pointer-events-none z-0" />

        {/* Header "Your Library" Pill */}
        <div className="absolute top-8 left-0 w-full flex justify-center z-20">
          <button className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-stone-200 shadow-sm text-stone-500 hover:text-stone-800 transition-colors font-medium text-sm">
            <BookOpen size={16} strokeWidth={2} />
            <span>Your Library</span>
          </button>
        </div>

        {/* Floating Text Cloud */}
        <div className="absolute inset-0 mt-20 z-10">
          {tags.map((tag, i) => (
            <motion.div
              key={tag.id}
              onClick={handleTagClick}
              className="absolute whitespace-nowrap select-none cursor-pointer"
              style={{
                left: `${tag.x}%`,
                top: `${tag.y}%`,
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                y: [0, -15, 0],
                x: [0, 10, 0],
                opacity: 1 
              }}
              whileHover={{ scale: 1.1, zIndex: 50 }}
              whileTap={{ scale: 0.95 }}
              transition={{
                y: { duration: 8 + i, repeat: Infinity, ease: "easeInOut" },
                x: { duration: 10 + i, repeat: Infinity, ease: "easeInOut" },
                opacity: { duration: 1, delay: i * 0.1 },
                scale: { duration: 0.2 } // Fast transition for hover/tap
              }}
            >
              <span 
                className="font-display font-medium tracking-tight transition-colors duration-300 hover:text-primary"
                style={{ 
                  fontSize: `${tag.scale}rem`,
                  color: `rgba(71, 85, 105, ${tag.opacity})` // Slate-600 base
                }}
              >
                {tag.text}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
}
