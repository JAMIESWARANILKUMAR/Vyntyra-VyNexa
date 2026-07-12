import React, { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function GlobalBackButton() {
  const router = useRouter();
  const qc = useQueryClient();
  const pathname = router.state.location.pathname;
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Don't show on the root home page where you can't go back
  if (pathname === "/") {
    return null;
  }

  const isAdminRoute = pathname.startsWith("/_authenticated");

  const handleClick = () => {
    if (isAdminRoute) {
      setOpen(true);
    } else {
      window.location.href = "/";
    }
  };

  const handleConfirm = async () => {
    if (!password) {
      toast.error("Please enter your password to confirm");
      return;
    }
    
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("No active user session found");

      // Verify password by attempting to sign in
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (error) {
        toast.error("Incorrect password");
        setIsLoading(false);
        return;
      }

      // Password is correct, sign out and go home
      await qc.cancelQueries();
      qc.clear();
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        aria-label="Go back to Home"
        className="fixed left-4 bottom-6 z-50 inline-flex items-center justify-center h-12 px-4 py-2 rounded-md bg-primary text-primary-foreground shadow-lg hover:bg-secondary transition-colors"
        style={{ boxShadow: "0 8px 24px rgba(2,6,23,0.2)" }}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Home
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Close Admin Session?</DialogTitle>
            <DialogDescription>
              To go back to the public home page, you must close your admin session for security purposes. Please enter your password to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="password"
              placeholder="Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={isLoading || !password}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm & Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
