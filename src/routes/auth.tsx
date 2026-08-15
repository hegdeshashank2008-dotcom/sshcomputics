import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usernameToEmail } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Student Login & Registration | Shashank Computics" },
      {
        name: "description",
        content:
          "Sign in to Shashank Computics with your username, password and captcha to access study materials, the study tracker and saved quiz attempts.",
      },
      { property: "og:title", content: "Login | Shashank Computics" },
      {
        property: "og:description",
        content: "Secure student and admin login for the Shashank Computics learning platform.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const newCaptcha = () => {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  return { a, b, answer: a + b };
};

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [captcha, setCaptcha] = useState(newCaptcha);
  const [captchaInput, setCaptchaInput] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(captchaInput) !== captcha.answer) {
      toast.error("Captcha answer is incorrect.");
      setCaptcha(newCaptcha());
      setCaptchaInput("");
      return;
    }
    setBusy(true);
    const email = usernameToEmail(username);
    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { username: username.trim(), full_name: fullName, class_level: classLevel },
          },
        });
        if (error) throw error;
        toast.success("Account created — welcome to Shashank Computics!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in.");
      }
      navigate({ to: "/tracker" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
      setCaptcha(newCaptcha());
      setCaptchaInput("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="section-shell flex justify-center pt-28 pb-24">
      <div className="glass-card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold">
          {mode === "login" ? "Sign in" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Students and admins use the same login. Admins land on the upload panel automatically.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="text-muted-foreground">Username</span>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="mt-1"
            />
          </label>

          {mode === "register" && (
            <>
              <label className="block text-sm">
                <span className="text-muted-foreground">Full name</span>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1" />
              </label>
              <label className="block text-sm">
                <span className="text-muted-foreground">Class / course</span>
                <Input
                  value={classLevel}
                  onChange={(e) => setClassLevel(e.target.value)}
                  placeholder="e.g. Class 10 or B.Tech CSE"
                  className="mt-1"
                />
              </label>
            </>
          )}

          <label className="block text-sm">
            <span className="text-muted-foreground">Password</span>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="mt-1"
            />
          </label>

          <label className="block text-sm">
            <span className="text-muted-foreground">
              Captcha — what is {captcha.a} + {captcha.b}?
            </span>
            <Input
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value)}
              required
              inputMode="numeric"
              className="mt-1"
            />
          </label>

          <Button type="submit" className="w-full gap-2" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "login" ? "Sign in" : "Register"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="mt-5 text-sm text-primary hover:underline"
        >
          {mode === "login" ? "New here? Create an account" : "Already registered? Sign in"}
        </button>

        <p className="mt-6 flex items-center gap-2 rounded-xl border border-border bg-surface p-3 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
          Admin uploads are restricted to the Shashank Computics admin account.
        </p>
      </div>
    </div>
  );
}
