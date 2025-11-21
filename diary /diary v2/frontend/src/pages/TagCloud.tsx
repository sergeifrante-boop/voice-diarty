import { motion } from "framer-motion";
import { useLocation } from "wouter";
import MobileLayout from "@/components/layout/MobileLayout";
import { BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { config } from "../config";

type TagCloudItem = {
  tag: string;
  weight: number;
};

export default function TagCloud() {
  const [, setLocation] = useLocation();

  // Fetch tag cloud data
  const { data: tags, isLoading } = useQuery<TagCloudItem[]>({
    queryKey: [config.apiBaseUrl, `/tags-cloud`],
  });

  const handleTagClick = () => {
    // TODO: Navigate to filtered entries by tag when implemented
    setLocation("/calendar");
  };

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-full">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </MobileLayout>
    );
  }

  // Generate positions for tags (simplified layout)
  const positionedTags = tags?.map((tag, i) => {
    const angle = (i / (tags.length || 1)) * 2 * Math.PI;
    const radius = 30 + (tag.weight * 10);
    return {
      ...tag,
      x: 50 + radius * Math.cos(angle),
      y: 50 + radius * Math.sin(angle),
      scale: 0.8 + (tag.weight / 10),
      opacity: 0.6 + (tag.weight / 20),
    };
  }) || [];

  return (
    <MobileLayout>
      <div className="flex-1 w-full relative overflow-hidden bg-white min-h-[80vh]">
        
        {/* Subtle background gradient */}
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
          {positionedTags.length > 0 ? (
            positionedTags.map((tag, i) => (
              <motion.div
                key={tag.tag}
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
                  opacity: tag.opacity 
                }}
                whileHover={{ scale: 1.1, zIndex: 50 }}
                whileTap={{ scale: 0.95 }}
                transition={{
                  y: { duration: 8 + i, repeat: Infinity, ease: "easeInOut" },
                  x: { duration: 10 + i, repeat: Infinity, ease: "easeInOut" },
                  opacity: { duration: 1, delay: i * 0.1 },
                  scale: { duration: 0.2 }
                }}
              >
                <span 
                  className="font-display font-medium tracking-tight transition-colors duration-300 hover:text-primary"
                  style={{ 
                    fontSize: `${tag.scale}rem`,
                    color: `rgba(71, 85, 105, ${tag.opacity})`
                  }}
                >
                  {tag.tag}
                </span>
              </motion.div>
            ))
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No tags yet</p>
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}

