import { Link } from "wouter";
import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft } from "lucide-react";

export default function NotesSplitView() {
  // TODO: Implement split view when needed
  // This is a placeholder that redirects to list view
  return (
    <MobileLayout>
      <div className="p-6">
        <Link href="/notes-list">
          <a className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors text-sm font-medium mb-4">
            <ArrowLeft size={18} />
            <span>Back to List View</span>
          </a>
        </Link>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Split view coming soon</p>
        </div>
      </div>
    </MobileLayout>
  );
}

