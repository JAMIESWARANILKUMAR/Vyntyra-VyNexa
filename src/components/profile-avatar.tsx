import { useState } from "react";
import { User } from "lucide-react";

export function ProfileAvatar({ url, name, className }: { url?: string | null; name?: string; className?: string }) {
  const [error, setError] = useState(false);

  if (url && !error) {
    return (
      <img 
        src={url} 
        alt={name || "User"} 
        onError={() => setError(true)}
        className="w-10 h-10 rounded-full border-2 border-white/50 object-cover shadow-md shrink-0 sm:w-14 sm:h-14 sm:border-[3px] sm:border-white/20 sm:shadow-lg"
      />
    );
  }
  
  // Generic user image placeholder
  return (
    <div className="w-10 h-10 rounded-full border-2 border-white/50 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center shadow-md shrink-0 sm:w-14 sm:h-14 sm:border-[3px] sm:border-white/20 sm:shadow-lg text-slate-500">
      <User className="h-5 w-5 sm:h-7 sm:w-7" />
    </div>
  );
}
