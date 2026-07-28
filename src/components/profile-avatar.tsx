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
  
  // Fancy placeholder
  const initial = (name || "U").charAt(0).toUpperCase();
  return (
    <div className="w-14 h-14 rounded-full border-[3px] border-white/20 bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center shadow-lg backdrop-blur-md shrink-0">
      <span className="text-xl font-bold text-white shadow-sm drop-shadow-md">{initial}</span>
    </div>
  );
}
