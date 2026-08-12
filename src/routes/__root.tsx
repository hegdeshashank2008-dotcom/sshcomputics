import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Navbar } from "@/components/Navbar";
import { FloatingBackground } from "@/components/FloatingBackground";
import { Toaster } from "@/components/ui/sonner";


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "author", content: "Shashank Computics" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Shashank Computics — Study Materials, Quizzes & Coding for Students" },
      { property: "og:title", content: "Shashank Computics — Study Materials, Quizzes & Coding for Students" },
      { name: "twitter:title", content: "Shashank Computics — Study Materials, Quizzes & Coding for Students" },
      { name: "description", content: "Free study materials for Class 1-12, coding and engineering resources, a study tracker, quiz generator and engineering college placement data. Code. Create. Innovate." },
      { property: "og:description", content: "Free study materials for Class 1-12, coding and engineering resources, a study tracker, quiz generator and engineering college placement data. Code. Create. Innovate." },
      { name: "twitter:description", content: "Free study materials for Class 1-12, coding and engineering resources, a study tracker, quiz generator and engineering college placement data. Code. Create. Innovate." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/62b20d9ec293fd2b9d305b048f444847/id-preview-f948159b--b788a246-cef4-4aec-9175-6307f565201a.lovable.app-1786458295003.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/62b20d9ec293fd2b9d305b048f444847/id-preview-f948159b--b788a246-cef4-4aec-9175-6307f565201a.lovable.app-1786458295003.png" },
      { property: "og:type", content: "website" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <FloatingBackground />
      <Navbar />
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <footer id="connect" className="border-t border-border py-12">
        <div className="section-shell text-center">
          <h2 className="text-2xl font-semibold">
            Connect with <span className="text-gradient">Shashank Computics</span>
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Follow along for new material drops, coding tips and contest alerts.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {[
              { label: "Instagram", href: "https://instagram.com/shashank_computics" },
              { label: "YouTube", href: "https://youtube.com/@shashank_computics" },
              {
                label: "LinkedIn",
                href: "https://www.linkedin.com/in/shashank-hegde-039748400",
              },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-border bg-surface px-5 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                {s.label}
              </a>
            ))}
          </div>
          <p className="mt-8 text-sm text-muted-foreground">
            © {new Date().getFullYear()} Shashank Computics · Code · Create · Innovate
          </p>
        </div>
      </footer>

      <Toaster />
    </QueryClientProvider>
  );
}

