import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CloudflareSecurityCheckpoint } from "@/components/cloudflare-security-checkpoint";

export const Route = createFileRoute("/security-check")({
  component: SecurityCheckRoute,
});

function SecurityCheckRoute() {
  const navigate = useNavigate();

  return (
    <CloudflareSecurityCheckpoint 
      onVerified={() => {
        navigate({ to: "/" });
      }}
    />
  );
}
