import { useState, useEffect } from "react";
import { User } from "lucide-react";
import { resolveGooglePhotosUrl } from "@/lib/google-photos";

interface SmartAvatarProps {
  src?: string | null;
  alt?: string;
  className?: string;
  fallbackInitials?: string;
}

export function SmartAvatar({ src, alt = "Avatar", className = "h-10 w-10 rounded-full", fallbackInitials }: SmartAvatarProps) {
  const [imgUrl, setImgUrl] = useState<string | null>(src || null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setHasError(false);

    if (!src) {
      setImgUrl(null);
      return;
    }

    // If it's a Google Photos URL, attempt resolution
    if (src.includes("photos.google.com") || src.includes("photos.app.goo.gl")) {
      resolveGooglePhotosUrl(src).then((resolved) => {
        if (isMounted) {
          setImgUrl(resolved || src);
        }
      }).catch(() => {
        if (isMounted) {
          setImgUrl(src);
        }
      });
    } else {
      setImgUrl(src);
    }

    return () => {
      isMounted = false;
    };
  }, [src]);

  if (!imgUrl || hasError) {
    return (
      <div className={`bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 text-slate-300 font-bold uppercase flex items-center justify-center overflow-hidden shrink-0 ${className}`}>
        {fallbackInitials ? (
          <span className="text-xs tracking-wider">{fallbackInitials.slice(0, 2)}</span>
        ) : (
          <User className="h-1/2 w-1/2 text-slate-400" />
        )}
      </div>
    );
  }

  return (
    <img
      src={imgUrl}
      alt={alt}
      onError={() => setHasError(true)}
      className={`object-cover border border-slate-700/60 shadow-sm overflow-hidden shrink-0 ${className}`}
    />
  );
}
