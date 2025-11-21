import { motion } from "framer-motion";
import { Settings, User, Bell, Heart, Shield, LogOut } from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";

export default function Profile() {
  const menuItems = [
    { icon: User, label: "Account Details" },
    { icon: Bell, label: "Notifications" },
    { icon: Heart, label: "Wellbeing Settings" },
    { icon: Shield, label: "Privacy & Data" },
    { icon: Settings, label: "Preferences" },
  ];

  return (
    <MobileLayout>
      <div className="p-6 min-h-full pb-24">
        {/* Profile Header */}
        <div className="flex flex-col items-center mb-12 pt-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-24 h-24 rounded-full bg-gradient-to-br from-dream-rose to-dream-lavender p-1 shadow-xl shadow-dream-rose/20 mb-4"
          >
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
               <span className="text-3xl font-display text-muted-foreground/50">JD</span>
            </div>
          </motion.div>
          
          <motion.h1 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-display font-semibold text-foreground mb-1"
          >
            Jane Doe
          </motion.h1>
          <motion.p 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-muted-foreground"
          >
            Member since 2024
          </motion.p>
        </div>

        {/* Stats Row */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center gap-8 mb-12"
        >
          <div className="text-center">
            <p className="text-2xl font-display font-bold text-foreground">42</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Entries</p>
          </div>
          <div className="w-px bg-border/50" />
          <div className="text-center">
            <p className="text-2xl font-display font-bold text-foreground">12</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Streak</p>
          </div>
          <div className="w-px bg-border/50" />
          <div className="text-center">
            <p className="text-2xl font-display font-bold text-foreground">8</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Insights</p>
          </div>
        </motion.div>

        {/* Menu Items */}
        <div className="space-y-3">
          {menuItems.map((item, i) => (
            <motion.button
              key={item.label}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 + (i * 0.1) }}
              className="w-full p-4 rounded-2xl bg-white/40 border border-white/40 shadow-sm flex items-center justify-between group hover:bg-white/60 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-full bg-secondary/30 text-muted-foreground group-hover:text-primary transition-colors">
                  <item.icon size={18} />
                </div>
                <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                  {item.label}
                </span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-primary/50 transition-colors" />
            </motion.button>
          ))}

          <motion.button
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 1.0 }}
            className="w-full p-4 mt-8 rounded-2xl flex items-center justify-center gap-2 text-destructive/70 hover:text-destructive hover:bg-destructive/5 transition-all"
          >
            <LogOut size={16} />
            <span className="text-sm font-medium">Sign Out</span>
          </motion.button>
        </div>
      </div>
    </MobileLayout>
  );
}
