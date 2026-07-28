import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAdminClient } from "@/integrations/supabase/admin";

const supabase = new Proxy({} as any, { get: (_, prop) => (getAdminClient() as any)[prop] });

const provisionSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["employee", "intern"]),
  full_name: z.string().min(2),
});

export const provisionUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => provisionSchema.parse(data))
  .handler(async ({ data, context }) => {
    // Verify the acting user is a super admin
    const { data: adminRole } = await supabase.from("user_roles").select("role").eq("user_id", context.userId).single();
    if (adminRole?.role !== "admin") {
      throw new Error("Forbidden: Only super admins can provision users");
    }

    // 1. Create User in Supabase Auth via Admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      throw new Error(`Failed to create auth user: ${authError?.message}`);
    }

    const userId = authData.user.id;

    // 2. Assign Role
    const { error: roleError } = await supabase.from("user_roles").insert({
      user_id: userId,
      role: data.role,
    });

    if (roleError) {
      // Rollback
      await supabase.auth.admin.deleteUser(userId);
      throw new Error(`Failed to assign role: ${roleError.message}`);
    }

    // 3. Create basic profile
    const { error: profileError } = await supabase.from("user_profiles").insert({
      id: userId,
      full_name: data.full_name,
      email: data.email,
      role: data.role,
    });

    if (profileError) {
      console.error("Profile creation error:", profileError);
    }

    return { success: true, userId };
  });

const revokeSchema = z.object({
  userId: z.string().uuid(),
});

export const revokeUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => revokeSchema.parse(data))
  .handler(async ({ data, context }) => {
    // Verify the acting user is a super admin
    const { data: adminRole } = await supabase.from("user_roles").select("role").eq("user_id", context.userId).single();
    if (adminRole?.role !== "admin") {
      throw new Error("Forbidden: Only super admins can revoke users");
    }

    // Prevent self-deletion
    if (data.userId === context.userId) {
      throw new Error("Cannot delete your own admin account");
    }

    // 1. Delete user from auth (Cascade will handle user_roles and user_profiles if foreign keys are set up correctly)
    const { error } = await supabase.auth.admin.deleteUser(data.userId);
    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }

    return { success: true };
  });

export const listTeamMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: adminRole } = await supabase.from("user_roles").select("role").eq("user_id", context.userId).single();
    if (adminRole?.role !== "admin") {
      throw new Error("Forbidden: Not an admin");
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .in("role", ["employee", "intern"])
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    
    return data || [];
  });
