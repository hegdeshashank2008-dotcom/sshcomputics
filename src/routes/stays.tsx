import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Building, Star, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/stays")({
  head: () => ({
    meta: [
      { title: "Hostel & PG Reviews by State, District and City | Shashank Computics" },
      {
        name: "description",
        content:
          "Honest student reviews of hostels and PGs near colleges, searchable by state, district and city, with monthly rent, ratings and comments.",
      },
      { property: "og:title", content: "Hostel & PG Reviews | Shashank Computics" },
      {
        property: "og:description",
        content: "Read and publish real hostel and PG reviews with rent and ratings.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StaysPage,
});

const EMPTY = {
  stay_type: "hostel",
  name: "",
  state: "",
  district: "",
  city: "",
  address: "",
  rent_monthly: "",
  rating: 5,
  comment: "",
};

type StayRow = {
  id: string;
  user_id?: string | null;
  stay_type: string;
  name: string;
  state: string;
  district: string;
  city: string;
  address: string | null;
  rent_monthly: number | null;
  rating: number;
  author_name: string;
  comment: string | null;
  approved: boolean;
  created_at: string;
};

function StaysPage() {
  const { user, username, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ state: "", district: "", city: "", type: "" });
  const [form, setForm] = useState({ ...EMPTY });

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["stay_reviews", user?.id ?? "anon"],
    queryFn: async () => {
      // user_id is only readable by signed-in users; anonymous visitors get
      // review content without the submitter's account id.
      const publicCols =
        "id, stay_type, name, state, district, city, address, rent_monthly, rating, author_name, comment, approved, created_at";
      const cols = user ? `${publicCols}, user_id` : publicCols;
      const { data, error } = await supabase
        .from("stay_reviews")
        .select(cols)
        .order("created_at", { ascending: false })
        .returns<StayRow[]>();
      if (error) throw error;
      return data;
    },
  });

  const states = Array.from(new Set(reviews.map((r) => r.state))).sort();
  const districts = Array.from(
    new Set(reviews.filter((r) => !filters.state || r.state === filters.state).map((r) => r.district)),
  ).sort();
  const cities = Array.from(
    new Set(
      reviews
        .filter((r) => !filters.district || r.district === filters.district)
        .map((r) => r.city),
    ),
  ).sort();

  const filtered = reviews.filter(
    (r) =>
      (!filters.state || r.state === filters.state) &&
      (!filters.district || r.district === filters.district) &&
      (!filters.city || r.city === filters.city) &&
      (!filters.type || r.stay_type === filters.type),
  );

  const publish = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to publish a review.");
      if (!form.name.trim() || !form.state.trim() || !form.district.trim() || !form.city.trim())
        throw new Error("Name, state, district and city are required.");
      const { error } = await supabase.from("stay_reviews").insert({
        user_id: user.id,
        stay_type: form.stay_type,
        name: form.name.trim(),
        state: form.state.trim(),
        district: form.district.trim(),
        city: form.city.trim(),
        address: form.address.trim() || null,
        rent_monthly: form.rent_monthly ? Number(form.rent_monthly) : null,
        rating: form.rating,
        author_name: username ?? "Student",
        comment: form.comment.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setForm({ ...EMPTY });
      toast.success("Review published. Thanks!");
      qc.invalidateQueries({ queryKey: ["stay_reviews"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stay_reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stay_reviews"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="section-shell pt-28 pb-24">
      <h1 className="text-4xl font-bold md:text-5xl">
        Hostel & <span className="text-gradient">PG Reviews</span>
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Real reviews from students who actually stayed there. Filter by state, district and city —
        anyone signed in can publish a review.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          className="rounded-xl border border-border bg-surface px-4 py-2 text-sm text-foreground"
        >
          <option value="">Hostels & PGs</option>
          <option value="hostel">Hostel</option>
          <option value="pg">PG</option>
        </select>
        <select
          value={filters.state}
          onChange={(e) => setFilters({ ...filters, state: e.target.value, district: "", city: "" })}
          className="rounded-xl border border-border bg-surface px-4 py-2 text-sm text-foreground"
        >
          <option value="">All states</option>
          {states.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          value={filters.district}
          onChange={(e) => setFilters({ ...filters, district: e.target.value, city: "" })}
          className="rounded-xl border border-border bg-surface px-4 py-2 text-sm text-foreground"
        >
          <option value="">All districts</option>
          {districts.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <select
          value={filters.city}
          onChange={(e) => setFilters({ ...filters, city: e.target.value })}
          className="rounded-xl border border-border bg-surface px-4 py-2 text-sm text-foreground"
        >
          <option value="">All cities</option>
          {cities.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {isLoading && <p className="text-muted-foreground">Loading reviews…</p>}
        {!isLoading && filtered.length === 0 && (
          <p className="text-muted-foreground">No reviews yet — be the first to publish one.</p>
        )}
        {filtered.map((r) => (
          <article key={r.id} className="glass-card flex h-full flex-col p-6">
            <div className="flex items-start justify-between gap-3">
              <span className="inline-flex w-fit rounded-lg bg-primary/15 p-2.5 text-primary">
                <Building className="h-4 w-4" />
              </span>
              <span className="rounded-full border border-border px-3 py-1 text-xs capitalize text-muted-foreground">
                {r.stay_type}
              </span>
            </div>
            <h2 className="mt-4 text-lg font-semibold">{r.name}</h2>
            <p className="mt-1 text-xs tracking-wider text-primary uppercase">
              {r.city}, {r.district}, {r.state}
            </p>
            <p className="mt-2 flex text-primary">
              {Array.from({ length: r.rating }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
            </p>
            {r.comment && <p className="mt-3 flex-1 text-sm text-muted-foreground">{r.comment}</p>}
            <p className="mt-4 text-xs text-muted-foreground">
              {r.rent_monthly ? `₹${r.rent_monthly}/month · ` : ""}
              {r.author_name}
            </p>
            {(isAdmin || ("user_id" in r && r.user_id === user?.id)) && (
              <button
                type="button"
                onClick={() => remove.mutate(r.id)}
                className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete review
              </button>
            )}
          </article>
        ))}
      </div>

      <section className="glass-card mt-14 p-6">
        <h2 className="text-2xl font-semibold">Publish your hostel / PG review</h2>
        {!user ? (
          <p className="mt-3 text-sm text-muted-foreground">Sign in to publish a review.</p>
        ) : (
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <select
              value={form.stay_type}
              onChange={(e) => setForm({ ...form, stay_type: e.target.value })}
              className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground"
            >
              <option value="hostel">Hostel</option>
              <option value="pg">PG</option>
            </select>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Hostel / PG name"
            />
            <Input
              value={form.rent_monthly}
              onChange={(e) => setForm({ ...form, rent_monthly: e.target.value })}
              placeholder="Rent per month (₹)"
              type="number"
            />
            <Input
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              placeholder="State"
            />
            <Input
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
              placeholder="District"
            />
            <Input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="City"
            />
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Address / landmark"
              className="md:col-span-2"
            />
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setForm({ ...form, rating: n })}
                  aria-label={`${n} stars`}
                >
                  <Star
                    className={[
                      "h-5 w-5",
                      n <= form.rating ? "fill-primary text-primary" : "text-muted-foreground",
                    ].join(" ")}
                  />
                </button>
              ))}
            </div>
            <Textarea
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              placeholder="Food, cleanliness, distance from college, warden rules…"
              rows={3}
              className="md:col-span-3"
            />
            <Button
              onClick={() => publish.mutate()}
              disabled={publish.isPending}
              className="w-fit"
            >
              Publish review
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
