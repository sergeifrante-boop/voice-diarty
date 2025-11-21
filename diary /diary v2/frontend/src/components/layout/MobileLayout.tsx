import { Link, useLocation } from "wouter";
import { Home, Calendar, Hash, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileLayoutProps {
  children: React.ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Journal" },
    { path: "/calendar", icon: Calendar, label: "History" },
    { path: "/tags", icon: Hash, label: "Themes" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="min-h-screen w-full max-w-md mx-auto bg-background/50 relative overflow-hidden shadow-2xl shadow-black/5 flex flex-col">
      {/* Main Content Area - Added flex flex-col to ensure children fill height */}
      <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden scrollbar-hide relative z-10">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="h-20 pb-4 glass-panel border-t border-white/20 flex items-center justify-around px-6 relative z-20 shrink-0">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <div className="flex flex-col items-center gap-1 p-2 transition-all duration-500 relative group cursor-pointer w-16">
                <div
                  className={cn(
                    "p-2 rounded-full transition-all duration-500",
                    isActive
                      ? "bg-foreground/5 text-foreground translate-y-0"
                      : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground/70 translate-y-1"
                  )}
                >
                  <item.icon 
                    size={24} 
                    strokeWidth={isActive ? 2 : 1.5}
                    className="transition-all duration-500"
                  />
                </div>
                <span 
                  className={cn(
                    "text-[10px] font-medium transition-all duration-500 absolute -bottom-2 text-center w-full",
                    isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
                  )}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
