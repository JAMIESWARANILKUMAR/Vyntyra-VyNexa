import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getAdminClient } from "@/integrations/supabase/admin";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface EnterpriseDatasetRecord {
  id: string;
  category: "companies" | "colleges" | "students" | "interns" | "employees" | "leads" | string;
  title: string;
  location_country?: string;
  location_state?: string;
  location_district?: string;
  location_city?: string;
  industry?: string;
  sector?: string;
  role_designation?: string;
  contact_email?: string;
  contact_phone?: string;
  website_url?: string;
  tags?: string[];
  notes?: string;
  raw_attributes: Record<string, any>;
  source_filename?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface DatasetVaultSettings {
  employee_access_enabled: boolean;
  passcode_required: boolean;
  access_passcode?: string;
  allow_employee_export: boolean;
  allowed_categories: string[];
  authorized_employee_emails: string[];
  updated_at?: string;
  updated_by?: string;
}

export const DEFAULT_DATASET_VAULT_SETTINGS: DatasetVaultSettings = {
  employee_access_enabled: true,
  passcode_required: false,
  access_passcode: "VYNEXA-2026",
  allow_employee_export: true,
  allowed_categories: ["companies", "colleges", "students", "interns", "employees", "leads", "other"],
  authorized_employee_emails: [],
};

// ─── Check Access Helpers ──────────────────────────────────────────
async function checkUserAccess(userId: string) {
  const admin = getAdminClient();
  const { data: roles } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const roleList = (roles || []).map((r: any) => r.role);

  const { data: profile } = await admin
    .from("profiles")
    .select("role, email, full_name")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.role) roleList.push(profile.role);

  const isAdmin = roleList.includes("admin") || roleList.includes("super_admin");
  const isEmployee =
    isAdmin ||
    roleList.includes("employee") ||
    roleList.includes("interviewer") ||
    roleList.includes("mentor") ||
    roleList.includes("staff");

  return {
    isAdmin,
    isEmployee,
    email: profile?.email || "",
    fullName: profile?.full_name || "Authorized User",
  };
}

// ─── Settings: Get Settings ─────────────────────────────────────────
export const getDatasetVaultSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const access = await checkUserAccess(context.userId);
    if (!access.isEmployee && !access.isAdmin) {
      throw new Error("Access denied: You do not have permission to view Dataset Vault settings.");
    }

    const admin = getAdminClient();
    let settings: DatasetVaultSettings = { ...DEFAULT_DATASET_VAULT_SETTINGS };

    try {
      const { data, error } = await admin
        .from("site_settings")
        .select("value")
        .eq("id", "dataset_vault_settings")
        .maybeSingle();

      if (!error && data?.value) {
        const parsed = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
        settings = { ...DEFAULT_DATASET_VAULT_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.warn("[Dataset Vault] Error fetching settings from site_settings:", e);
    }

    // Mask passcode if user is NOT an admin
    if (!access.isAdmin) {
      return {
        ...settings,
        access_passcode: undefined,
        isAdmin: false,
      };
    }

    return {
      ...settings,
      isAdmin: true,
    };
  });

// ─── Settings: Update Settings (Admin Only) ────────────────────────
export const updateDatasetVaultSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => {
    const input = (d as any)?.data !== undefined ? (d as any).data : d;
    return z
      .object({
        employee_access_enabled: z.boolean(),
        passcode_required: z.boolean(),
        access_passcode: z.string().optional(),
        allow_employee_export: z.boolean(),
        allowed_categories: z.array(z.string()),
        authorized_employee_emails: z.array(z.string()).optional(),
      })
      .parse(input);
  })
  .handler(async ({ data, context }) => {
    const access = await checkUserAccess(context.userId);
    if (!access.isAdmin) {
      throw new Error("Forbidden: Super Admin privileges are required to update Dataset Vault settings.");
    }

    const admin = getAdminClient();
    const payload: DatasetVaultSettings = {
      employee_access_enabled: data.employee_access_enabled,
      passcode_required: data.passcode_required,
      access_passcode: data.access_passcode?.trim() || "VYNEXA-2026",
      allow_employee_export: data.allow_employee_export,
      allowed_categories: data.allowed_categories,
      authorized_employee_emails: data.authorized_employee_emails || [],
      updated_at: new Date().toISOString(),
      updated_by: context.userId,
    };

    const { error } = await admin.from("site_settings").upsert({
      id: "dataset_vault_settings",
      value: JSON.stringify(payload),
      updated_at: payload.updated_at,
      updated_by: payload.updated_by,
    });

    if (error) {
      throw new Error(`Failed to update Dataset Vault settings: ${error.message}`);
    }

    return { success: true, settings: payload };
  });

// ─── Passcode Verification (Employee) ──────────────────────────────
export const verifyEmployeeVaultPasscode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => {
    const input = (d as any)?.data !== undefined ? (d as any).data : d;
    return z.object({ passcode: z.string().min(1, "Passcode is required") }).parse(input);
  })
  .handler(async ({ data, context }) => {
    const access = await checkUserAccess(context.userId);
    if (!access.isEmployee && !access.isAdmin) {
      return { success: false, message: "Unauthorized access." };
    }

    // Admins bypass
    if (access.isAdmin) {
      return { success: true, message: "Administrator authorized." };
    }

    const admin = getAdminClient();
    try {
      const { data: dbData } = await admin
        .from("site_settings")
        .select("value")
        .eq("id", "dataset_vault_settings")
        .maybeSingle();

      const settings: DatasetVaultSettings = dbData?.value
        ? typeof dbData.value === "string"
          ? JSON.parse(dbData.value)
          : dbData.value
        : DEFAULT_DATASET_VAULT_SETTINGS;

      if (!settings.employee_access_enabled) {
        return { success: false, message: "Dataset Vault access has been disabled by Administrator." };
      }

      if (!settings.passcode_required) {
        return { success: true, message: "Passcode protection is not active." };
      }

      const cleanInput = data.passcode.trim();
      const targetPasscode = (settings.access_passcode || "VYNEXA-2026").trim();

      if (cleanInput === targetPasscode) {
        return { success: true, message: "Access granted." };
      } else {
        return { success: false, message: "Incorrect security passcode. Please check with Super Admin." };
      }
    } catch (e: any) {
      return { success: false, message: e.message || "Failed to verify passcode." };
    }
  });

// ─── Query Records: List Dataset Records ───────────────────────────
export const getDatasetRecords = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => {
    const input = (d as any)?.data !== undefined ? (d as any).data : d;
    return z
      .object({
        category: z.string().optional(),
        search: z.string().optional(),
        location: z.string().optional(),
        industry: z.string().optional(),
        sector: z.string().optional(),
        role: z.string().optional(),
        limit: z.number().optional().default(1000),
      })
      .parse(input || {});
  })
  .handler(async ({ data, context }) => {
    const access = await checkUserAccess(context.userId);
    if (!access.isEmployee && !access.isAdmin) {
      throw new Error("Access denied: You must be an authorized employee or administrator.");
    }

    const admin = getAdminClient();

    // Check Employee access settings if not admin
    if (!access.isAdmin) {
      const { data: dbSettings } = await admin
        .from("site_settings")
        .select("value")
        .eq("id", "dataset_vault_settings")
        .maybeSingle();

      const settings: DatasetVaultSettings = dbSettings?.value
        ? typeof dbSettings.value === "string"
          ? JSON.parse(dbSettings.value)
          : dbSettings.value
        : DEFAULT_DATASET_VAULT_SETTINGS;

      if (!settings.employee_access_enabled) {
        throw new Error("Dataset Vault access is disabled for employees by Super Admin.");
      }

      if (
        settings.authorized_employee_emails &&
        settings.authorized_employee_emails.length > 0 &&
        !settings.authorized_employee_emails.includes(access.email.toLowerCase())
      ) {
        throw new Error("Your account is not on the authorized employee access list.");
      }

      // Category restriction
      if (data.category && !settings.allowed_categories.includes(data.category)) {
        throw new Error(`Access to the '${data.category}' dataset category is restricted.`);
      }
    }

    // Try reading from dedicated table: public.enterprise_datasets
    try {
      let query = admin
        .from("enterprise_datasets")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(data.limit || 1000);

      if (data.category && data.category !== "all") {
        query = query.eq("category", data.category);
      }

      const { data: rows, error } = await query;

      if (!error && rows) {
        let filtered = rows as EnterpriseDatasetRecord[];

        if (data.search) {
          const s = data.search.toLowerCase();
          filtered = filtered.filter(
            (r) =>
              r.title?.toLowerCase().includes(s) ||
              r.location_city?.toLowerCase().includes(s) ||
              r.location_state?.toLowerCase().includes(s) ||
              r.industry?.toLowerCase().includes(s) ||
              r.sector?.toLowerCase().includes(s) ||
              r.role_designation?.toLowerCase().includes(s) ||
              r.contact_email?.toLowerCase().includes(s) ||
              r.contact_phone?.toLowerCase().includes(s) ||
              JSON.stringify(r.raw_attributes || {}).toLowerCase().includes(s)
          );
        }

        if (data.location && data.location !== "all") {
          const loc = data.location.toLowerCase();
          filtered = filtered.filter(
            (r) =>
              r.location_state?.toLowerCase() === loc ||
              r.location_city?.toLowerCase() === loc ||
              r.location_district?.toLowerCase() === loc
          );
        }

        if (data.industry && data.industry !== "all") {
          filtered = filtered.filter((r) => r.industry?.toLowerCase() === data.industry?.toLowerCase());
        }

        if (data.sector && data.sector !== "all") {
          filtered = filtered.filter((r) => r.sector?.toLowerCase() === data.sector?.toLowerCase());
        }

        if (data.role && data.role !== "all") {
          filtered = filtered.filter((r) => r.role_designation?.toLowerCase() === data.role?.toLowerCase());
        }

        return {
          records: filtered,
          total: filtered.length,
          source: "table",
        };
      }
    } catch (e) {
      console.warn("[Dataset Vault] Dedicated table query error or not created yet:", e);
    }

    // Fallback: Read from site_settings (ID: dataset_vault_master)
    try {
      const { data: vaultData } = await admin
        .from("site_settings")
        .select("value")
        .eq("id", "dataset_vault_master")
        .maybeSingle();

      let records: EnterpriseDatasetRecord[] = [];
      if (vaultData?.value) {
        records = typeof vaultData.value === "string" ? JSON.parse(vaultData.value) : vaultData.value;
      }

      let filtered = records;

      if (data.category && data.category !== "all") {
        filtered = filtered.filter((r) => r.category === data.category);
      }

      if (data.search) {
        const s = data.search.toLowerCase();
        filtered = filtered.filter(
          (r) =>
            r.title?.toLowerCase().includes(s) ||
            r.location_city?.toLowerCase().includes(s) ||
            r.location_state?.toLowerCase().includes(s) ||
            r.industry?.toLowerCase().includes(s) ||
            r.sector?.toLowerCase().includes(s) ||
            r.role_designation?.toLowerCase().includes(s) ||
            r.contact_email?.toLowerCase().includes(s) ||
            r.contact_phone?.toLowerCase().includes(s) ||
            JSON.stringify(r.raw_attributes || {}).toLowerCase().includes(s)
        );
      }

      if (data.location && data.location !== "all") {
        const loc = data.location.toLowerCase();
        filtered = filtered.filter(
          (r) =>
            r.location_state?.toLowerCase() === loc ||
            r.location_city?.toLowerCase() === loc ||
            r.location_district?.toLowerCase() === loc
        );
      }

      if (data.industry && data.industry !== "all") {
        filtered = filtered.filter((r) => r.industry?.toLowerCase() === data.industry?.toLowerCase());
      }

      if (data.sector && data.sector !== "all") {
        filtered = filtered.filter((r) => r.sector?.toLowerCase() === data.sector?.toLowerCase());
      }

      if (data.role && data.role !== "all") {
        filtered = filtered.filter((r) => r.role_designation?.toLowerCase() === data.role?.toLowerCase());
      }

      return {
        records: filtered,
        total: filtered.length,
        source: "settings_fallback",
      };
    } catch (err: any) {
      console.error("[Dataset Vault] Error reading fallback records:", err);
      return { records: [], total: 0, source: "none" };
    }
  });

// ─── Store Records: Save / Import Extracted Dataset (Admin Only) ────
export const saveExtractedDataset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => {
    const input = (d as any)?.data !== undefined ? (d as any).data : d;
    return z
      .object({
        category: z.string().min(1, "Category is required"),
        source_filename: z.string().optional(),
        records: z.array(
          z.object({
            title: z.string().optional().default("Untitled Record"),
            location_country: z.string().optional(),
            location_state: z.string().optional(),
            location_district: z.string().optional(),
            location_city: z.string().optional(),
            industry: z.string().optional(),
            sector: z.string().optional(),
            role_designation: z.string().optional(),
            contact_email: z.string().optional(),
            contact_phone: z.string().optional(),
            website_url: z.string().optional(),
            tags: z.array(z.string()).optional(),
            notes: z.string().optional(),
            raw_attributes: z.record(z.any()).optional(),
          })
        ),
      })
      .parse(input);
  })
  .handler(async ({ data, context }) => {
    const access = await checkUserAccess(context.userId);
    if (!access.isAdmin) {
      throw new Error("Forbidden: Only Super Admins can import and store datasets.");
    }

    const admin = getAdminClient();
    const now = new Date().toISOString();

    const preparedRecords: EnterpriseDatasetRecord[] = data.records.map((r, idx) => ({
      id: `ds_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
      category: data.category.toLowerCase().trim(),
      title: (r.title || "Untitled Record").trim(),
      location_country: r.location_country?.trim() || "India",
      location_state: r.location_state?.trim() || "",
      location_district: r.location_district?.trim() || "",
      location_city: r.location_city?.trim() || "",
      industry: r.industry?.trim() || "",
      sector: r.sector?.trim() || "",
      role_designation: r.role_designation?.trim() || "",
      contact_email: r.contact_email?.trim() || "",
      contact_phone: r.contact_phone?.trim() || "",
      website_url: r.website_url?.trim() || "",
      tags: r.tags || [],
      notes: r.notes?.trim() || "",
      raw_attributes: r.raw_attributes || {},
      source_filename: data.source_filename || "imported.csv",
      created_at: now,
      updated_at: now,
      created_by: context.userId,
    }));

    // 1. Attempt writing to dedicated Postgres table
    let savedToTable = false;
    try {
      // Chunk inserts in batches of 100
      const chunkSize = 100;
      for (let i = 0; i < preparedRecords.length; i += chunkSize) {
        const chunk = preparedRecords.slice(i, i + chunkSize);
        const { error } = await admin.from("enterprise_datasets").upsert(chunk);
        if (error) {
          console.warn("[Dataset Vault] Insert chunk table error:", error.message);
          throw error;
        }
      }
      savedToTable = true;
    } catch (tableErr: any) {
      console.warn("[Dataset Vault] Falling back to site_settings storage due to:", tableErr.message);
    }

    // 2. Fallback or Sync into site_settings (ID: dataset_vault_master)
    try {
      const { data: existingData } = await admin
        .from("site_settings")
        .select("value")
        .eq("id", "dataset_vault_master")
        .maybeSingle();

      let currentList: EnterpriseDatasetRecord[] = [];
      if (existingData?.value) {
        currentList = typeof existingData.value === "string" ? JSON.parse(existingData.value) : existingData.value;
      }

      // Append new records to the front
      const updatedList = [...preparedRecords, ...currentList].slice(0, 5000);

      await admin.from("site_settings").upsert({
        id: "dataset_vault_master",
        value: JSON.stringify(updatedList),
        updated_at: now,
        updated_by: context.userId,
      });
    } catch (fallbackErr: any) {
      console.warn("[Dataset Vault] Fallback write error:", fallbackErr.message);
      if (!savedToTable) {
        throw new Error(`Failed to store records: ${fallbackErr.message}`);
      }
    }

    return {
      success: true,
      storedCount: preparedRecords.length,
      category: data.category,
      storageMode: savedToTable ? "database_table" : "resilient_vault",
    };
  });

// ─── Delete Record: Delete Single Record (Admin Only) ───────────────
export const deleteDatasetRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => {
    const input = (d as any)?.data !== undefined ? (d as any).data : d;
    return z.object({ id: z.string() }).parse(input);
  })
  .handler(async ({ data, context }) => {
    const access = await checkUserAccess(context.userId);
    if (!access.isAdmin) {
      throw new Error("Forbidden: Super Admin privilege required.");
    }

    const admin = getAdminClient();

    // Delete from table
    try {
      await admin.from("enterprise_datasets").delete().eq("id", data.id);
    } catch (_) {}

    // Delete from site_settings fallback
    try {
      const { data: vaultData } = await admin
        .from("site_settings")
        .select("value")
        .eq("id", "dataset_vault_master")
        .maybeSingle();

      if (vaultData?.value) {
        let currentList: EnterpriseDatasetRecord[] =
          typeof vaultData.value === "string" ? JSON.parse(vaultData.value) : vaultData.value;
        currentList = currentList.filter((r) => r.id !== data.id);
        await admin.from("site_settings").upsert({
          id: "dataset_vault_master",
          value: JSON.stringify(currentList),
          updated_at: new Date().toISOString(),
          updated_by: context.userId,
        });
      }
    } catch (_) {}

    return { success: true, deletedId: data.id };
  });

// ─── Bulk Delete Records (Admin Only) ──────────────────────────────
export const bulkDeleteDatasetRecords = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => {
    const input = (d as any)?.data !== undefined ? (d as any).data : d;
    return z.object({ ids: z.array(z.string()) }).parse(input);
  })
  .handler(async ({ data, context }) => {
    const access = await checkUserAccess(context.userId);
    if (!access.isAdmin) {
      throw new Error("Forbidden: Super Admin privilege required.");
    }

    const admin = getAdminClient();

    try {
      await admin.from("enterprise_datasets").delete().in("id", data.ids);
    } catch (_) {}

    try {
      const { data: vaultData } = await admin
        .from("site_settings")
        .select("value")
        .eq("id", "dataset_vault_master")
        .maybeSingle();

      if (vaultData?.value) {
        let currentList: EnterpriseDatasetRecord[] =
          typeof vaultData.value === "string" ? JSON.parse(vaultData.value) : vaultData.value;
        const set = new Set(data.ids);
        currentList = currentList.filter((r) => !set.has(r.id));
        await admin.from("site_settings").upsert({
          id: "dataset_vault_master",
          value: JSON.stringify(currentList),
          updated_at: new Date().toISOString(),
          updated_by: context.userId,
        });
      }
    } catch (_) {}

    return { success: true, deletedCount: data.ids.length };
  });

// ─── Log Export Event ───────────────────────────────────────────────
export const logDatasetExportEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => {
    const input = (d as any)?.data !== undefined ? (d as any).data : d;
    return z
      .object({
        format: z.enum(["xlsx", "csv", "pdf", "txt"]),
        recordCount: z.number(),
        category: z.string(),
        passwordProtected: z.boolean(),
        selectedOnly: z.boolean(),
      })
      .parse(input);
  })
  .handler(async ({ data, context }) => {
    const access = await checkUserAccess(context.userId);
    const admin = getAdminClient();
    const now = new Date().toISOString();

    try {
      await admin.from("site_settings").upsert({
        id: `dataset_export_audit_${Date.now()}`,
        value: JSON.stringify({
          ...data,
          exported_by_email: access.email,
          exported_by_name: access.fullName,
          is_admin: access.isAdmin,
          timestamp: now,
        }),
        updated_at: now,
        updated_by: context.userId,
      });
    } catch (_) {}

    return { success: true };
  });
