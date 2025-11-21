import { Link } from "wouter";
import MobileLayout from "@/components/layout/MobileLayout";

export default function NotFound() {
  return (
    <MobileLayout>
      <div className="flex flex-col items-center justify-center min-h-full p-6 text-center">
        <h1 className="text-4xl font-display font-semibold mb-4">404</h1>
        <p className="text-muted-foreground mb-8">Page not found</p>
        <Link href="/">
          <a className="text-primary hover:underline">Go home</a>
        </Link>
      </div>
    </MobileLayout>
  );
}

