import { useState } from "react";

export function ProfileAvatar({ url, name }: { url?: string | null; name?: string }) {
  const [error, setError] = useState(false);

  if (url && !error) {
    return (
      <img 
        src={url} 
        alt={name || "User"} 
        onError={() => setError(true)}
        className="w-14 h-14 rounded-full border-[3px] border-white/20 object-cover shadow-lg shrink-0"
      />
    );
  }
  
  // Fancy placeholder that works on both dark and light backgrounds
  const initial = (name || "U").charAt(0).toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full border-2 border-white/50 bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shrink-0">
      <span className="text-lg font-bold text-white drop-shadow-sm">{initial}</span>
    </div>
  );
}
