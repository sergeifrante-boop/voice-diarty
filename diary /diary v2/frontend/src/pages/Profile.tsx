import MobileLayout from "@/components/layout/MobileLayout";
import { User, LogOut } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { Button } from "@/components/ui/button";

export default function Profile() {
  const { logout } = useAuth();

  return (
    <MobileLayout>
      <div className="flex flex-col items-center justify-center min-h-full p-6">
        <div className="w-24 h-24 rounded-full bg-secondary/50 flex items-center justify-center mb-6">
          <User size={48} className="text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-display font-semibold mb-2">Profile</h1>
        <p className="text-muted-foreground text-center mb-8">
          Profile settings coming soon
        </p>
        <Button
          onClick={logout}
          variant="outline"
          className="flex items-center gap-2"
        >
          <LogOut size={18} />
          Sign Out
        </Button>
      </div>
    </MobileLayout>
  );
}

