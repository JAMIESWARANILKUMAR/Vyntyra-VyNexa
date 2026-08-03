import React from "react";
import ReactMarkdown from "react-markdown";

interface RichContentRendererProps {
  content: string;
  className?: string;
}

// Helper to extract YouTube Video ID
function getYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

// Helper to extract Vimeo ID
function getVimeoId(url: string): string | null {
  const regExp = /(?:vimeo\.com\/|^)(\d+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

// Check if URL is direct video file
function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|ogg|mov|m4v)($|\?)/i.test(url);
}

export function RichContentRenderer({ content, className = "" }: RichContentRendererProps) {
  if (!content) return null;

  return (
    <div className={`prose prose-slate max-w-none dark:prose-invert text-slate-700 dark:text-slate-200 leading-relaxed ${className}`}>
      <ReactMarkdown
        components={{
          img({ src, alt }) {
            if (!src) return null;

            // If image alt or URL indicates video, render video player
            const ytId = getYouTubeId(src);
            if (ytId) {
              return (
                <div className="relative aspect-video w-full rounded-xl overflow-hidden shadow-md my-4 border border-slate-200 dark:border-slate-800">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${ytId}`}
                    title={alt || "YouTube Video"}
                    className="absolute inset-0 w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              );
            }

            const vimeoId = getVimeoId(src);
            if (vimeoId) {
              return (
                <div className="relative aspect-video w-full rounded-xl overflow-hidden shadow-md my-4 border border-slate-200 dark:border-slate-800">
                  <iframe
                    src={`https://player.vimeo.com/video/${vimeoId}`}
                    title={alt || "Vimeo Video"}
                    className="absolute inset-0 w-full h-full border-0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              );
            }

            if (isDirectVideo(src)) {
              return (
                <video
                  src={src}
                  controls
                  className="w-full rounded-xl my-4 shadow-md border border-slate-200 dark:border-slate-800 max-h-[500px]"
                >
                  Your browser does not support the video tag.
                </video>
              );
            }

            return (
              <img
                src={src}
                alt={alt || "Content Image"}
                className="rounded-xl max-h-[480px] w-full object-cover my-4 shadow-sm border border-slate-200 dark:border-slate-800 transition-all hover:shadow-md"
                loading="lazy"
              />
            );
          },
          a({ href, children }) {
            if (!href) return <span>{children}</span>;

            // Check if link is a YouTube video link
            const ytId = getYouTubeId(href);
            if (ytId) {
              return (
                <div className="my-4">
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-800">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${ytId}`}
                      title="YouTube Video"
                      className="absolute inset-0 w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-secondary hover:underline inline-block mt-1"
                  >
                    Open video on YouTube ↗
                  </a>
                </div>
              );
            }

            const vimeoId = getVimeoId(href);
            if (vimeoId) {
              return (
                <div className="my-4">
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-800">
                    <iframe
                      src={`https://player.vimeo.com/video/${vimeoId}`}
                      title="Vimeo Video"
                      className="absolute inset-0 w-full h-full border-0"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              );
            }

            if (isDirectVideo(href)) {
              return (
                <div className="my-4">
                  <video
                    src={href}
                    controls
                    className="w-full rounded-xl shadow-md border border-slate-200 dark:border-slate-800 max-h-[500px]"
                  />
                </div>
              );
            }

            return (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="text-secondary font-medium underline underline-offset-4 hover:text-primary transition-colors"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
