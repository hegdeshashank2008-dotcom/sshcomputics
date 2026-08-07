import { createServerFn } from "@tanstack/react-start";

const ADMIN_USERNAME = "shashank_2008";
const ADMIN_EMAIL = "shashank_2008@shashankcomputics.app";
const ADMIN_PASSWORD = "shashank@2008";

/**
 * Idempotently ensures the Shashank Computics admin account exists with the
 * admin role. Safe to call from the public auth page.
 */
export const ensureAdminAccount = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: existingRole } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("username", ADMIN_USERNAME)
    .maybeSingle();

  let userId = existingRole?.id ?? null;

  if (!userId) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { username: ADMIN_USERNAME, full_name: "Shashank Computics Admin" },
    });
    if (error && !error.message.toLowerCase().includes("already")) {
      throw new Error(error.message);
    }
    userId = data?.user?.id ?? null;

    if (!userId) {
      const { data: list } = await supabaseAdmin.auth.admin.listUsers();
      userId = list?.users.find((u) => u.email === ADMIN_EMAIL)?.id ?? null;
    }
  }

  if (!userId) return { ok: false };

  await supabaseAdmin
    .from("profiles")
    .upsert({ id: userId, username: ADMIN_USERNAME, full_name: "Shashank Computics Admin" });
  await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });

  return { ok: true };
});
