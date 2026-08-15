import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export function LoginNotice({ what = "these features" }: { what?: string }) {
  const { user, loading } = useAuth();
  if (loading || user) return null;
  return (
    <div className="glass-card mt-6 flex flex-col gap-3 border-primary/40 p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Lock className="h-4 w-4 shrink-0 text-primary" />
        You need to log in to access {what}. Browsing is open to everyone, but saving, uploading and
        generating require an account.
      </p>
      <Link to="/auth">
        <Button size="sm">Log in / Register</Button>
      </Link>
    </div>
  );
}
