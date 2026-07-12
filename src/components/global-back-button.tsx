import React from "react";
import { useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export default function GlobalBackButton() {
  const router = useRouter();

  // Don't show on the root home page where you can't go back
  if (router.state.location.pathname === "/") {
    return null;
  }

  return (
    <button
      onClick={() => window.location.href = "/"}
      aria-label="Go back to Home"
      className="fixed left-4 bottom-6 z-50 inline-flex items-center justify-center h-12 px-4 py-2 rounded-md bg-primary text-primary-foreground shadow-lg hover:bg-secondary transition-colors"
      style={{ boxShadow: "0 8px 24px rgba(2,6,23,0.2)" }}
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      Back to Home
    </button>
  );
}
