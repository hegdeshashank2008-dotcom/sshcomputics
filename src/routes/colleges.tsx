import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Building2, Star, Globe, Pencil, Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { LoginNotice } from "@/components/LoginNotice";

export const Route = createFileRoute("/colleges")({
  head: () => ({
    meta: [
      { title: "Engineering College Placements by State & District | Shashank Computics" },
      {
        name: "description",
        content:
          "Compare engineering colleges by state and district with branch-wise placement percentages, average and highest packages, plus honest student ratings and feedback.",
      },
      { property: "og:title", content: "Engineering College Placement Data | Shashank Computics" },
      {
        property: "og:description",
        content: "Branch-wise placement data and student reviews for engineering colleges across India.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CollegesPage,
});

type Branch = { branch: string; placement_pct?: number | undefined; avg_package?: number | undefined };

type CollegeForm = {
  id?: string;
  name: string;
  state: string;
  district: string;
  college_type: string;
  nirf_rank: string;
  website: string;
  avg_package: string;
  highest_package: string;
  placement_pct: string;
  branches: string;
};

const emptyForm: CollegeForm = {
  name: "",
  state: "",
  district: "",
  college_type: "",
  nirf_rank: "",
  website: "",
  avg_package: "",
  highest_package: "",
  placement_pct: "",
  branches: "",
};

const num = (v: string) => (v.trim() === "" ? null : Number(v));

function parseBranches(text: string): Branch[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [branch, pct, avg] = line.split(",").map((p) => p?.trim() ?? "");
      return {
        branch: branch ?? "",
        placement_pct: pct ? Number(pct) : undefined,
        avg_package: avg ? Number(avg) : undefined,
      };
    })
    .filter((b) => b.branch);
}

function branchesToText(branches: Branch[]) {
  return branches.map((b) => [b.branch, b.placement_pct ?? "", b.avg_package ?? ""].join(", ")).join("\n");
}

function CollegesPage() {
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [form, setForm] = useState<CollegeForm | null>(null);

  const { data: colleges = [], isLoading } = useQuery({
    queryKey: ["colleges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colleges")
        .select("*")
        .order("nirf_rank", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async (f: CollegeForm) => {
      if (!user) throw new Error("Sign in first.");
      if (!f.name.trim() || !f.state.trim() || !f.district.trim())
        throw new Error("Name, state and district are required.");
      const payload = {
        name: f.name.trim(),
        state: f.state.trim(),
        district: f.district.trim(),
        college_type: f.college_type.trim() || null,
        nirf_rank: num(f.nirf_rank),
        website: f.website.trim() || null,
        avg_package: num(f.avg_package),
        highest_package: num(f.highest_package),
        placement_pct: num(f.placement_pct),
        branches: parseBranches(f.branches) as unknown as never,
      };
      if (f.id) {
        const { error } = await supabase.from("colleges").update(payload).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("colleges").insert({
          ...payload,
          approved: isAdmin,
          submitted_by: user.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(isAdmin ? "College saved." : "Submitted for admin approval.");
      setForm(null);
      qc.invalidateQueries({ queryKey: ["colleges"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("colleges").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["colleges"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const states = Array.from(new Set(colleges.map((c) => c.state))).sort();
  const districts = Array.from(
    new Set(colleges.filter((c) => !state || c.state === state).map((c) => c.district)),
  ).sort();

  const filtered = colleges.filter(
    (c) => (!state || c.state === state) && (!district || c.district === district),
  );

  return (
    <div className="section-shell pt-28 pb-24">
      <LoginNotice what="posting college feedback and submissions" />
      <h1 className="text-4xl font-bold md:text-5xl">
        Engineering <span className="text-gradient">Colleges & Placements</span>
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Filter by state and district, then open a college for branch-wise placement data and what
        students actually say about it.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <select
          value={state}
          onChange={(e) => {
            setState(e.target.value);
            setDistrict("");
          }}
          className="rounded-xl border border-border bg-surface px-4 py-2 text-sm text-foreground"
        >
          <option value="">All states</option>
          {states.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          className="rounded-xl border border-border bg-surface px-4 py-2 text-sm text-foreground"
        >
          <option value="">All districts</option>
          {districts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        {user && (
          <Button size="sm" className="gap-1.5" onClick={() => setForm({ ...emptyForm })}>
            <Plus className="h-4 w-4" /> {isAdmin ? "Add college" : "Suggest a college"}
          </Button>
        )}
      </div>

      {form && (
        <section className="glass-card mt-6 grid gap-3 p-6 md:grid-cols-3">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="College name" />
          <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="State" />
          <Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} placeholder="District" />
          <Input value={form.college_type} onChange={(e) => setForm({ ...form, college_type: e.target.value })} placeholder="Type (Government / Private)" />
          <Input value={form.nirf_rank} onChange={(e) => setForm({ ...form, nirf_rank: e.target.value })} placeholder="NIRF rank" />
          <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="Website" />
          <Input value={form.placement_pct} onChange={(e) => setForm({ ...form, placement_pct: e.target.value })} placeholder="Placement %" />
          <Input value={form.avg_package} onChange={(e) => setForm({ ...form, avg_package: e.target.value })} placeholder="Avg package (LPA)" />
          <Input value={form.highest_package} onChange={(e) => setForm({ ...form, highest_package: e.target.value })} placeholder="Highest package (LPA)" />
          <Textarea
            value={form.branches}
            onChange={(e) => setForm({ ...form, branches: e.target.value })}
            placeholder={"Branches, one per line: CSE, 95, 18"}
            rows={4}
            className="md:col-span-3"
          />
          <div className="flex gap-2 md:col-span-3">
            <Button size="sm" onClick={() => save.mutate(form)} disabled={save.isPending}>
              {form.id ? "Update college" : isAdmin ? "Add college" : "Submit for approval"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setForm(null)}>
              Cancel
            </Button>
          </div>
          {!isAdmin && (
            <p className="text-xs text-muted-foreground md:col-span-3">
              Student submissions go live after admin approval.
            </p>
          )}
        </section>
      )}

      {isLoading && <p className="mt-10 text-muted-foreground">Loading colleges…</p>}

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        {filtered.map((c) => {
          const branches = (Array.isArray(c.branches) ? c.branches : []) as unknown as Branch[];
          const isOpen = openId === c.id;
          return (
            <article key={c.id} className="glass-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-flex rounded-lg bg-primary/15 p-2.5 text-primary">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <h2 className="mt-3 text-lg font-semibold">{c.name}</h2>
                  <p className="mt-1 text-xs tracking-wider text-primary uppercase">
                    {c.district}, {c.state} · {c.college_type}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Last updated {new Date(c.updated_at).toLocaleDateString()}
                    {!c.approved && " · pending approval"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {c.nirf_rank && (
                    <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                      NIRF #{c.nirf_rank}
                    </span>
                  )}
                  {isAdmin && (
                    <>
                      <button
                        type="button"
                        aria-label="Edit college"
                        onClick={() =>
                          setForm({
                            id: c.id,
                            name: c.name,
                            state: c.state,
                            district: c.district,
                            college_type: c.college_type ?? "",
                            nirf_rank: c.nirf_rank?.toString() ?? "",
                            website: c.website ?? "",
                            avg_package: c.avg_package?.toString() ?? "",
                            highest_package: c.highest_package?.toString() ?? "",
                            placement_pct: c.placement_pct?.toString() ?? "",
                            branches: branchesToText(branches),
                          })
                        }
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                      </button>
                      <button type="button" aria-label="Delete college" onClick={() => remove.mutate(c.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl border border-border bg-surface p-3">
                  <dt className="text-[0.65rem] tracking-wider text-muted-foreground uppercase">Placed</dt>
                  <dd className="mt-1 font-semibold text-primary">{c.placement_pct ?? "—"}%</dd>
                </div>
                <div className="rounded-xl border border-border bg-surface p-3">
                  <dt className="text-[0.65rem] tracking-wider text-muted-foreground uppercase">Avg LPA</dt>
                  <dd className="mt-1 font-semibold text-primary">{c.avg_package ?? "—"}</dd>
                </div>
                <div className="rounded-xl border border-border bg-surface p-3">
                  <dt className="text-[0.65rem] tracking-wider text-muted-foreground uppercase">High LPA</dt>
                  <dd className="mt-1 font-semibold text-primary">{c.highest_package ?? "—"}</dd>
                </div>
              </dl>

              {branches.length > 0 && (
                <div className="mt-5 overflow-hidden rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-surface text-xs tracking-wider text-muted-foreground uppercase">
                      <tr>
                        <th className="px-3 py-2 text-left">Branch</th>
                        <th className="px-3 py-2 text-right">Placed %</th>
                        <th className="px-3 py-2 text-right">Avg LPA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {branches.map((b) => (
                        <tr key={b.branch} className="border-t border-border">
                          <td className="px-3 py-2">{b.branch}</td>
                          <td className="px-3 py-2 text-right">{b.placement_pct ?? "—"}</td>
                          <td className="px-3 py-2 text-right">{b.avg_package ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button size="sm" variant="outline" onClick={() => setOpenId(isOpen ? null : c.id)}>
                  {isOpen ? "Hide student feedback" : "Student feedback"}
                </Button>
                {c.website && (
                  <a href={c.website} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="ghost" className="gap-1.5">
                      <Globe className="h-4 w-4" /> Website
                    </Button>
                  </a>
                )}
              </div>

              {isOpen && <Feedback collegeId={c.id} />}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Feedback({ collegeId }: { collegeId: string }) {
  const { user, username } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const { data: feedback = [] } = useQuery({
    queryKey: ["college_feedback", collegeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("college_feedback")
        .select("id, college_id, author_name, rating, comment, created_at")
        .eq("college_id", collegeId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to leave feedback.");
      const { error } = await supabase.from("college_feedback").insert({
        college_id: collegeId,
        user_id: user.id,
        author_name: username ?? "Student",
        rating,
        comment: comment.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setComment("");
      toast.success("Thanks for your feedback!");
      queryClient.invalidateQueries({ queryKey: ["college_feedback", collegeId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const avg =
    feedback.length > 0
      ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
      : null;

  return (
    <div className="mt-5 border-t border-border pt-5">
      <p className="flex items-center gap-2 text-sm">
        <Star className="h-4 w-4 fill-primary text-primary" />
        {avg ? `${avg} / 5 from ${feedback.length} student${feedback.length > 1 ? "s" : ""}` : "No reviews yet"}
      </p>

      <ul className="mt-4 space-y-3">
        {feedback.map((f) => (
          <li key={f.id} className="rounded-xl border border-border bg-surface p-3">
            <p className="flex items-center gap-2 text-sm font-medium">
              {f.author_name}
              <span className="flex text-primary">
                {Array.from({ length: f.rating }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-current" />
                ))}
              </span>
            </p>
            {f.comment && <p className="mt-1 text-sm text-muted-foreground">{f.comment}</p>}
          </li>
        ))}
      </ul>

      {user ? (
        <div className="mt-4 space-y-3">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`}>
                <Star
                  className={[
                    "h-5 w-5 transition-colors",
                    n <= rating ? "fill-primary text-primary" : "text-muted-foreground",
                  ].join(" ")}
                />
              </button>
            ))}
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience of this college…"
            rows={3}
          />
          <Button size="sm" onClick={() => submit.mutate()} disabled={submit.isPending}>
            Post feedback
          </Button>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">Sign in to add your own review.</p>
      )}
    </div>
  );
}
