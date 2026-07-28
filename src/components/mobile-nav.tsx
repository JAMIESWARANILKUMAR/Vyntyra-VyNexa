import { ChevronLeft, ChevronRight, Home, Menu } from "lucide-react";
import { Link, useRouter } from "@tanstack/react-router";

export function MobileNav() {
  const router = useRouter();

  return (
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-[300px]">
      <div className="flex items-center justify-between px-3 py-2.5 bg-[#0a1128]/85 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-full">
        <button 
          onClick={() => router.history.back()} 
          className="relative group p-2 text-primary-foreground/60 hover:text-white transition-all active:scale-90 rounded-full"
          aria-label="Go back"
        >
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-full transition-colors duration-300" />
          <ChevronLeft className="h-5 w-5 relative z-10" />
        </button>
        
        <Link 
          to="/" 
          className="relative group p-3 bg-gradient-to-br from-gold/80 to-gold/40 text-[#0a1128] hover:text-black shadow-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all active:scale-95 rounded-full -translate-y-2 border border-gold/50"
          aria-label="Home"
        >
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/20 rounded-full transition-colors duration-300" />
          <Home className="h-5 w-5 relative z-10" />
        </Link>
        
        <button 
          onClick={() => router.history.forward()} 
          className="relative group p-2 text-primary-foreground/60 hover:text-white transition-all active:scale-90 rounded-full"
          aria-label="Go forward"
        >
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-full transition-colors duration-300" />
          <ChevronRight className="h-5 w-5 relative z-10" />
        </button>
      </div>
    </div>
  );
}
