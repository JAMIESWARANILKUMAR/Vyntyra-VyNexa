import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { auth } from "@/integrations/firebase/client";
import { onAuthStateChanged, User } from "firebase/auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const user = await new Promise<User | null>((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            resolve(user);
        });
    });
    
    if (!user) throw redirect({ to: "/auth" });
    return { user };
  },
  component: () => <Outlet />,
});
