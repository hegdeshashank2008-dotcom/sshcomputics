import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, LogOut, ShieldCheck } from "lucide-react";
import logo from "@/assets/shashank-logo.png.asset.json";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/materials", label: "Study Materials" },
  { to: "/quiz", label: "Quiz" },
  { to: "/animations", label: "Animations" },
  { to: "/tracker", label: "Tracker" },
  { to: "/colleges", label: "Colleges" },
  { to: "/stays", label: "Hostel & PG" },
  { to: "/events", label: "Events" },
  { to: "/resources", label: "Resources" },
] as const;


export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user, isAdmin, username } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.assign("/");
  };

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled
          ? "border-b border-border bg-popover/85 py-2 shadow-[0_18px_50px_-30px_oklch(0_0_0/0.9)] backdrop-blur-xl"
          : "border-b border-transparent bg-transparent py-4",
      ].join(" ")}
    >
      <div
        aria-hidden
        className={[
          "nav-floating pointer-events-none absolute inset-0 -z-10 transition-opacity duration-500",
          scrolled ? "opacity-100" : "opacity-60",
        ].join(" ")}
      />
      <nav className="section-shell flex items-center justify-between gap-4">
        <Link to="/" className="flex shrink-0 items-center gap-3">

          <img
            src={logo.url}
            alt="Shashank Computics logo"
            className={[
              "w-auto transition-all duration-500",
              scrolled ? "h-9" : "h-12",
            ].join(" ")}
          />
          <span className="sr-only">Shashank Computics</span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={[
                "nav-link",
                pathname === link.to ? "nav-link-active" : "",
              ].join(" ")}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          {isAdmin && (
            <Link to="/admin">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ShieldCheck className="h-4 w-4" /> Admin
              </Button>
            </Link>
          )}
          {user ? (
            <>
              <span className="max-w-[9rem] truncate text-sm text-muted-foreground">
                {username ?? "Student"}
              </span>
              <Button variant="ghost" size="sm" onClick={signOut} className="gap-1.5">
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm">Login / Register</Button>
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
          className="rounded-full border border-border p-2 text-foreground transition-colors hover:bg-primary/15 lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="section-shell lg:hidden">
          <div className="mt-3 flex flex-col gap-1 rounded-2xl border border-border bg-popover/95 p-3 backdrop-blur-xl">
            {LINKS.map((link) => (
              <Link key={link.to} to={link.to} className="nav-link text-left">
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin" className="nav-link text-left">
                Admin panel
              </Link>
            )}
            {user ? (
              <Button variant="ghost" size="sm" onClick={signOut} className="mt-1 justify-start">
                Sign out
              </Button>
            ) : (
              <Link to="/auth" className="mt-1">
                <Button size="sm" className="w-full">
                  Login / Register
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
