import { ChevronLeft, ChevronRight, Home } from "lucide-react";
import { Link, useRouter } from "@tanstack/react-router";

export function MobileNav() {
  const router = useRouter();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-background/80 backdrop-blur-xl border-t border-border z-50 flex items-center justify-around px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
      <button 
        onClick={() => router.history.back()} 
        className="p-3 text-muted-foreground hover:text-primary transition-colors active:scale-95"
        aria-label="Go back"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      
      <Link 
        to="/" 
        className="p-3 text-muted-foreground hover:text-primary transition-colors active:scale-95"
        aria-label="Home"
      >
        <Home className="h-5 w-5" />
      </Link>
      
      <button 
        onClick={() => router.history.forward()} 
        className="p-3 text-muted-foreground hover:text-primary transition-colors active:scale-95"
        aria-label="Go forward"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </div>
  );
}
