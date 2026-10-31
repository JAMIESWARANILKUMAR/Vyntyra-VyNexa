import React, { useState, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Database,
  Upload,
  FileSpreadsheet,
  FileText,
  Search,
  Filter,
  Download,
  Lock,
  Unlock,
  Eye,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Building2,
  GraduationCap,
  Users,
  Briefcase,
  UserCheck,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  X,
  RefreshCw,
  Plus,
  Key,
  Globe,
  Mail,
  Phone,
  MapPin,
  Tag,
  Layers,
  ArrowUpDown,
  FileDown,
  Check,
  Settings2,
  HelpCircle,
  Clock,
  CheckSquare,
  Square,
  Shield,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EnterpriseDatasetRecord,
  DatasetVaultSettings,
  getDatasetRecords,
  saveExtractedDataset,
  deleteDatasetRecord,
  bulkDeleteDatasetRecords,
  getDatasetVaultSettings,
  updateDatasetVaultSettings,
  verifyEmployeeVaultPasscode,
  logDatasetExportEvent,
} from "@/lib/dataset-vault.functions";
import { exportDataset, ExportFormat } from "@/lib/dataset-export.utils";

// ─── Standard Category Config ──────────────────────────────────────
const DATASET_CATEGORIES = [
  { id: "all", label: "All Categories", icon: Layers, color: "bg-slate-100 text-slate-800 border-slate-300" },
  { id: "companies", label: "Companies", icon: Building2, color: "bg-blue-100 text-blue-800 border-blue-300" },
  { id: "colleges", label: "Colleges", icon: GraduationCap, color: "bg-purple-100 text-purple-800 border-purple-300" },
  { id: "students", label: "Students", icon: Users, color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  { id: "interns", label: "Interns", icon: Briefcase, color: "bg-amber-100 text-amber-800 border-amber-300" },
  { id: "employees", label: "Employees", icon: UserCheck, color: "bg-indigo-100 text-indigo-800 border-indigo-300" },
  { id: "leads", label: "Leads & B2B", icon: Sparkles, color: "bg-rose-100 text-rose-800 border-rose-300" },
];

export function EnterpriseDatasetVaultView({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Server functions
  const fetchRecords = useServerFn(getDatasetRecords);
  const saveDatasetFn = useServerFn(saveExtractedDataset);
  const deleteRecordFn = useServerFn(deleteDatasetRecord);
  const bulkDeleteFn = useServerFn(bulkDeleteDatasetRecords);
  const fetchSettings = useServerFn(getDatasetVaultSettings);
  const updateSettingsFn = useServerFn(updateDatasetVaultSettings);
  const verifyPasscodeFn = useServerFn(verifyEmployeeVaultPasscode);
  const logExportFn = useServerFn(logDatasetExportEvent);

  // States
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all");
  const [selectedSector, setSelectedSector] = useState<string>("all");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [showSelectedOnly, setShowSelectedOnly] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals & Panels
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [viewRecordDetail, setViewRecordDetail] = useState<EnterpriseDatasetRecord | null>(null);

  // Passcode unlock state (for employees when passcode is active)
  const [vaultUnlocked, setVaultUnlocked] = useState<boolean>(isSuperAdmin);
  const [enteredPasscode, setEnteredPasscode] = useState<string>("");
  const [isVerifyingPasscode, setIsVerifyingPasscode] = useState(false);

  // Export Modal States
  const [exportFormat, setExportFormat] = useState<ExportFormat>("xlsx");
  const [exportScope, setExportScope] = useState<"filtered" | "selected">("filtered");
  const [exportPasswordEnabled, setExportPasswordEnabled] = useState(false);
  const [exportPassword, setExportPassword] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // CSV Extraction Workflow States
  const [csvRawText, setCsvRawText] = useState<string>("");
  const [csvFileName, setCsvFileName] = useState<string>("");
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<Record<string, boolean>>({});
  const [targetCategory, setTargetCategory] = useState<string>("companies");
  const [customCategoryInput, setCustomCategoryInput] = useState<string>("");
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({
    title: "",
    state: "",
    district: "",
    city: "",
    industry: "",
    sector: "",
    role: "",
    email: "",
    phone: "",
    website: "",
    notes: "",
  });
  const [isStoringData, setIsStoringData] = useState(false);

  // Queries
  const settingsQ = useQuery({
    queryKey: ["dataset-vault-settings"],
    queryFn: () => fetchSettings(),
    staleTime: 60_000,
  });

  const recordsQ = useQuery({
    queryKey: ["dataset-vault-records", activeCategory],
    queryFn: () => fetchRecords({ category: activeCategory, limit: 2000 }),
    enabled: isSuperAdmin || vaultUnlocked || !settingsQ.data?.passcode_required,
    refetchInterval: 30_000,
  });

  const allRecords = useMemo(() => recordsQ.data?.records || [], [recordsQ.data]);

  // Dynamic filter options derived from current records
  const filterOptions = useMemo(() => {
    const locations = new Set<string>();
    const industries = new Set<string>();
    const sectors = new Set<string>();
    const roles = new Set<string>();

    allRecords.forEach((r) => {
      if (r.location_state) locations.add(r.location_state);
      if (r.location_city && !locations.has(r.location_city)) locations.add(r.location_city);
      if (r.industry) industries.add(r.industry);
      if (r.sector) sectors.add(r.sector);
      if (r.role_designation) roles.add(r.role_designation);
    });

    return {
      locations: Array.from(locations).sort(),
      industries: Array.from(industries).sort(),
      sectors: Array.from(sectors).sort(),
      roles: Array.from(roles).sort(),
    };
  }, [allRecords]);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    let list = allRecords;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((r) => {
        return (
          r.title?.toLowerCase().includes(q) ||
          r.location_city?.toLowerCase().includes(q) ||
          r.location_district?.toLowerCase().includes(q) ||
          r.location_state?.toLowerCase().includes(q) ||
          r.industry?.toLowerCase().includes(q) ||
          r.sector?.toLowerCase().includes(q) ||
          r.role_designation?.toLowerCase().includes(q) ||
          r.contact_email?.toLowerCase().includes(q) ||
          r.contact_phone?.toLowerCase().includes(q) ||
          r.notes?.toLowerCase().includes(q) ||
          JSON.stringify(r.raw_attributes || {}).toLowerCase().includes(q)
        );
      });
    }

    if (selectedLocation !== "all") {
      const loc = selectedLocation.toLowerCase();
      list = list.filter(
        (r) =>
          r.location_state?.toLowerCase() === loc ||
          r.location_city?.toLowerCase() === loc ||
          r.location_district?.toLowerCase() === loc
      );
    }

    if (selectedIndustry !== "all") {
      list = list.filter((r) => r.industry?.toLowerCase() === selectedIndustry.toLowerCase());
    }

    if (selectedSector !== "all") {
      list = list.filter((r) => r.sector?.toLowerCase() === selectedSector.toLowerCase());
    }

    if (selectedRole !== "all") {
      list = list.filter((r) => r.role_designation?.toLowerCase() === selectedRole.toLowerCase());
    }

    if (showSelectedOnly) {
      list = list.filter((r) => selectedIds.has(r.id));
    }

    return list;
  }, [
    allRecords,
    searchQuery,
    selectedLocation,
    selectedIndustry,
    selectedSector,
    selectedRole,
    showSelectedOnly,
    selectedIds,
  ]);

  // Active Category Counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allRecords.length };
    allRecords.forEach((r) => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    return counts;
  }, [allRecords]);

  // Handle Passcode Unlock
  const handleUnlockVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredPasscode.trim()) {
      toast.error("Please enter the security passcode.");
      return;
    }
    setIsVerifyingPasscode(true);
    try {
      const res = await verifyPasscodeFn({ passcode: enteredPasscode });
      if (res.success) {
        setVaultUnlocked(true);
        toast.success("Dataset Vault unlocked successfully!");
        qc.invalidateQueries({ queryKey: ["dataset-vault-records"] });
      } else {
        toast.error(res.message || "Invalid passcode.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to verify passcode.");
    } finally {
      setIsVerifyingPasscode(false);
    }
  };

  // ─── CSV File Reader & Parser ─────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      const text = (event.target?.result as string) || "";
      setCsvRawText(text);
      parseCsv(text, file.name);
    };

    reader.readAsText(file);
  };

  const parseCsv = (text: string, filename: string) => {
    // Robust RFC 4180 CSV parser
    const cleanText = text.replace(/^\uFEFF/, "").trim(); // Remove UTF-8 BOM
    const lines = cleanText.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);

    if (lines.length < 2) {
      toast.error("The uploaded CSV must have a header row and at least one data row.");
      return;
    }

    // Parse CSV line handling quotes
    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let cur = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          if (inQuotes && line[i + 1] === char) {
            cur += char;
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if ((char === "," || char === "\t" || char === ";") && !inQuotes) {
          result.push(cur.trim());
          cur = "";
        } else {
          cur += char;
        }
      }
      result.push(cur.trim());
      return result;
    };

    const headers = parseLine(lines[0]).map((h) => h.replace(/^["']|["']$/g, "").trim());
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || "";
      });
      rows.push(row);
    }

    setParsedHeaders(headers);
    setParsedRows(rows);

    // Default select all columns
    const initialSelectedCols: Record<string, boolean> = {};
    headers.forEach((h) => {
      initialSelectedCols[h] = true;
    });
    setSelectedColumns(initialSelectedCols);

    // Auto-detect standard mappings by keywords
    const lowerHeaders = headers.map((h) => h.toLowerCase());
    const findHeader = (...keywords: string[]) => {
      for (const kw of keywords) {
        const foundIdx = lowerHeaders.findIndex((h) => h.includes(kw));
        if (foundIdx !== -1) return headers[foundIdx];
      }
      return "";
    };

    const detectedMappings: Record<string, string> = {
      title: findHeader("name", "title", "company", "college", "institution", "student", "candidate", "employee", "organization"),
      state: findHeader("state", "province", "region"),
      district: findHeader("district", "county", "zone"),
      city: findHeader("city", "town", "location", "place"),
      industry: findHeader("industry", "domain", "vertical", "field"),
      sector: findHeader("sector", "category", "business type"),
      role: findHeader("role", "designation", "job", "position", "branch", "department"),
      email: findHeader("email", "e-mail", "mail", "contact email"),
      phone: findHeader("phone", "mobile", "contact", "whatsapp", "cell"),
      website: findHeader("website", "url", "web", "link", "site"),
      notes: findHeader("notes", "remarks", "description", "details", "summary"),
    };

    setFieldMappings(detectedMappings);

    // Detect likely category from filename or columns
    const lowerFilename = filename.toLowerCase();
    if (lowerFilename.includes("college") || lowerFilename.includes("university")) {
      setTargetCategory("colleges");
    } else if (lowerFilename.includes("student") || lowerFilename.includes("candidate")) {
      setTargetCategory("students");
    } else if (lowerFilename.includes("intern")) {
      setTargetCategory("interns");
    } else if (lowerFilename.includes("employee") || lowerFilename.includes("staff")) {
      setTargetCategory("employees");
    } else if (lowerFilename.includes("lead") || lowerFilename.includes("b2b")) {
      setTargetCategory("leads");
    } else {
      setTargetCategory("companies");
    }

    setIsUploadModalOpen(true);
    toast.success(`Extracted ${rows.length} records and ${headers.length} columns from ${filename}`);
  };

  // ─── 1-Click Store Selected In Database ───────────────────────────
  const handleStoreData = async () => {
    if (!fieldMappings.title) {
      toast.error("Please map the 'Name / Title' field so records can be identified.");
      return;
    }

    const finalCategory =
      targetCategory === "custom" ? customCategoryInput.trim() || "custom" : targetCategory;

    setIsStoringData(true);
    try {
      const preparedList = parsedRows.map((row) => {
        const raw: Record<string, any> = {};
        // Store only the columns that the admin selected
        parsedHeaders.forEach((h) => {
          if (selectedColumns[h]) {
            raw[h] = row[h];
          }
        });

        return {
          title: row[fieldMappings.title] || "Untitled Record",
          location_state: fieldMappings.state ? row[fieldMappings.state] : "",
          location_district: fieldMappings.district ? row[fieldMappings.district] : "",
          location_city: fieldMappings.city ? row[fieldMappings.city] : "",
          location_country: "India",
          industry: fieldMappings.industry ? row[fieldMappings.industry] : "",
          sector: fieldMappings.sector ? row[fieldMappings.sector] : "",
          role_designation: fieldMappings.role ? row[fieldMappings.role] : "",
          contact_email: fieldMappings.email ? row[fieldMappings.email] : "",
          contact_phone: fieldMappings.phone ? row[fieldMappings.phone] : "",
          website_url: fieldMappings.website ? row[fieldMappings.website] : "",
          notes: fieldMappings.notes ? row[fieldMappings.notes] : "",
          raw_attributes: raw,
        };
      });

      const res = await saveDatasetFn({
        category: finalCategory,
        source_filename: csvFileName,
        records: preparedList,
      });

      if (res.success) {
        toast.success(
          `Successfully stored ${res.storedCount} records in category '${finalCategory.toUpperCase()}'!`
        );
        setIsUploadModalOpen(false);
        setActiveCategory(finalCategory);
        qc.invalidateQueries({ queryKey: ["dataset-vault-records"] });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to store dataset records.");
    } finally {
      setIsStoringData(false);
    }
  };

  // ─── Delete Actions ───────────────────────────────────────────────
  const handleDeleteSingle = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${title}"?`)) return;
    try {
      await deleteRecordFn({ id });
      toast.success("Record deleted successfully.");
      selectedIds.delete(id);
      setSelectedIds(new Set(selectedIds));
      qc.invalidateQueries({ queryKey: ["dataset-vault-records"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete record.");
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`Are you sure you want to permanently delete ${ids.length} selected records?`)) return;

    try {
      await bulkDeleteFn({ ids });
      toast.success(`Deleted ${ids.length} records successfully.`);
      setSelectedIds(new Set());
      qc.invalidateQueries({ queryKey: ["dataset-vault-records"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete selected records.");
    }
  };

  // ─── Export Handler ───────────────────────────────────────────────
  const handleTriggerExport = async () => {
    const listToExport = exportScope === "selected" ? allRecords.filter((r) => selectedIds.has(r.id)) : filteredRecords;

    if (listToExport.length === 0) {
      toast.error("No records selected or available to export.");
      return;
    }

    if (exportPasswordEnabled && !exportPassword.trim()) {
      toast.error("Please enter a password to protect this export file.");
      return;
    }

    setIsExporting(true);
    try {
      await exportDataset({
        format: exportFormat,
        records: listToExport,
        category: activeCategory,
        passwordProtected: exportPasswordEnabled,
        password: exportPassword.trim(),
      });

      // Audit log
      await logExportFn({
        format: exportFormat,
        recordCount: listToExport.length,
        category: activeCategory,
        passwordProtected: exportPasswordEnabled,
        selectedOnly: exportScope === "selected",
      });

      toast.success(
        exportPasswordEnabled
          ? `Generated Password-Protected ${exportFormat.toUpperCase()} file successfully!`
          : `Downloaded ${listToExport.length} records in .${exportFormat} format!`
      );
      setIsExportModalOpen(false);
      setExportPassword("");
    } catch (err: any) {
      toast.error(err.message || "Export failed.");
    } finally {
      setIsExporting(false);
    }
  };

  // Toggle selection
  const toggleSelectRow = (id: string) => {
    const updated = new Set(selectedIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedIds(updated);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRecords.length) {
      setSelectedIds(new Set());
    } else {
      const all = new Set(filteredRecords.map((r) => r.id));
      setSelectedIds(all);
    }
  };

  // Employee restricted guard
  const isEmployeeBlocked =
    !isSuperAdmin && settingsQ.data && settingsQ.data.employee_access_enabled === false;
  const isPasscodeLocked =
    !isSuperAdmin && settingsQ.data?.passcode_required && !vaultUnlocked;

  return (
    <div className="space-y-6">
      {/* ─── Top Header & Primary Actions ─── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-3xl text-white shadow-xl border border-slate-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Database className="h-6 w-6" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Enterprise Dataset Vault & CSV Hub
              </h2>
              {isSuperAdmin ? (
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] font-bold">
                  SUPER ADMIN MASTER
                </Badge>
              ) : (
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-bold">
                  EMPLOYEE PORTAL
                </Badge>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Extract, map, securely store, and export high-fidelity master datasets across{" "}
              <span className="text-white font-semibold">Companies, Colleges, Students, Interns, and Employees</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Super Admin Actions */}
            {isSuperAdmin && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,.tsv,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-2 rounded-xl shadow-md cursor-pointer transition-all hover:scale-105"
                >
                  <Upload className="h-4 w-4" />
                  Upload & Extract CSV
                </Button>

                <Button
                  onClick={() => setIsSettingsModalOpen(true)}
                  variant="outline"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-bold gap-2 rounded-xl cursor-pointer"
                >
                  <Settings2 className="h-4 w-4 text-amber-400" />
                  Access & Security Controls
                </Button>
              </>
            )}

            {/* Export Button (Available for Admin and Authorized Employees) */}
            {(isSuperAdmin || settingsQ.data?.allow_employee_export !== false) && (
              <Button
                onClick={() => setIsExportModalOpen(true)}
                disabled={filteredRecords.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 rounded-xl shadow-md cursor-pointer transition-all hover:scale-105"
              >
                <Download className="h-4 w-4" />
                Export Dataset ({selectedIds.size > 0 ? `${selectedIds.size} Selected` : filteredRecords.length})
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Security Lock Screens (If Employee Access Restricted or Passcode Locked) ─── */}
      {isEmployeeBlocked && (
        <div className="bg-rose-50 border border-rose-200 p-8 rounded-3xl text-center space-y-3">
          <ShieldAlert className="h-12 w-12 text-rose-600 mx-auto" />
          <h3 className="text-lg font-black text-rose-950">Dataset Vault Access Restricted</h3>
          <p className="text-xs sm:text-sm text-rose-700 max-w-md mx-auto">
            Super Administration has temporarily restricted employee access to this dataset vault.
            Please reach out to your administrator to request clearance.
          </p>
        </div>
      )}

      {isPasscodeLocked && !isEmployeeBlocked && (
        <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl text-center text-white space-y-4 max-w-lg mx-auto shadow-2xl">
          <div className="w-14 h-14 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/30">
            <Lock className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-white">Security Passcode Required</h3>
            <p className="text-xs text-slate-400">
              The Enterprise Dataset Vault is passcode protected. Enter the administrator-allocated security code to proceed.
            </p>
          </div>
          <form onSubmit={handleUnlockVault} className="space-y-3 max-w-sm mx-auto">
            <Input
              type="password"
              placeholder="Enter Access Passcode..."
              value={enteredPasscode}
              onChange={(e) => setEnteredPasscode(e.target.value)}
              className="bg-slate-950 border-slate-700 text-white text-center tracking-widest font-mono text-sm py-2 rounded-xl"
              autoFocus
            />
            <Button
              type="submit"
              disabled={isVerifyingPasscode}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-2 py-2.5 rounded-xl cursor-pointer"
            >
              {isVerifyingPasscode ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlock className="h-4 w-4" />}
              Unlock Dataset Vault
            </Button>
          </form>
        </div>
      )}

      {/* ─── Main Vault Content (If Unlocked or Admin) ─── */}
      {(!isEmployeeBlocked && !isPasscodeLocked) && (
        <>
          {/* Category Tabs Bar */}
          <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {DATASET_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              const count = categoryCounts[cat.id] || 0;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setShowSelectedOnly(false);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs shrink-0 transition-all cursor-pointer ${
                    isActive
                      ? "bg-slate-900 text-white shadow-sm scale-[1.02]"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? "text-amber-400" : "text-slate-500"}`} />
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                      isActive ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-700"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search, Filters, and Selective Toggle Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search by entity name, location, role, industry, sector, contact or extra attributes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-9 py-2 text-xs rounded-xl border-slate-200"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Action Buttons: Show Selected & Bulk Delete */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  onClick={() => setShowSelectedOnly(!showSelectedOnly)}
                  variant={showSelectedOnly ? "default" : "outline"}
                  size="sm"
                  className={`text-xs font-bold gap-1.5 rounded-xl cursor-pointer ${
                    showSelectedOnly ? "bg-blue-600 text-white hover:bg-blue-700" : "text-slate-700"
                  }`}
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                  {showSelectedOnly ? "Showing Selected Only" : "Show Selected Only"}
                  {selectedIds.size > 0 && (
                    <span className="ml-1 bg-white/20 px-1.5 py-0.2 rounded-full text-[10px]">
                      {selectedIds.size}
                    </span>
                  )}
                </Button>

                {selectedIds.size > 0 && (
                  <Button
                    onClick={() => setSelectedIds(new Set())}
                    variant="ghost"
                    size="sm"
                    className="text-xs text-slate-500 hover:text-slate-800 rounded-xl cursor-pointer"
                  >
                    Clear ({selectedIds.size})
                  </Button>
                )}

                {isSuperAdmin && selectedIds.size > 0 && (
                  <Button
                    onClick={handleBulkDelete}
                    variant="destructive"
                    size="sm"
                    className="text-xs font-bold gap-1.5 rounded-xl cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Selected ({selectedIds.size})
                  </Button>
                )}
              </div>
            </div>

            {/* Dynamic Filter Selectors */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100">
              {/* Location Filter */}
              <div>
                <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Location (State / City)
                </Label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="h-8 text-xs rounded-lg mt-1 border-slate-200">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="all">All Locations</SelectItem>
                    {filterOptions.locations.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Industry Filter */}
              <div>
                <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Industry / Domain
                </Label>
                <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                  <SelectTrigger className="h-8 text-xs rounded-lg mt-1 border-slate-200">
                    <SelectValue placeholder="All Industries" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="all">All Industries</SelectItem>
                    {filterOptions.industries.map((ind) => (
                      <SelectItem key={ind} value={ind}>
                        {ind}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sector Filter */}
              <div>
                <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Sector / Type
                </Label>
                <Select value={selectedSector} onValueChange={setSelectedSector}>
                  <SelectTrigger className="h-8 text-xs rounded-lg mt-1 border-slate-200">
                    <SelectValue placeholder="All Sectors" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="all">All Sectors</SelectItem>
                    {filterOptions.sectors.map((sec) => (
                      <SelectItem key={sec} value={sec}>
                        {sec}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Role / Designation Filter */}
              <div>
                <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Role / Designation
                </Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="h-8 text-xs rounded-lg mt-1 border-slate-200">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="all">All Roles</SelectItem>
                    {filterOptions.roles.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* ─── Structured Tabular Presentation ─── */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {recordsQ.isLoading ? (
              <div className="py-20 text-center space-y-3">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-500 font-medium">Loading enterprise dataset records...</p>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="py-20 text-center space-y-4 max-w-md mx-auto px-4">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <FileSpreadsheet className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-800">No matching records found</h4>
                  <p className="text-xs text-slate-500">
                    {allRecords.length === 0
                      ? "No records exist in this vault yet. Upload a CSV file using the button above to populate the database."
                      : "Try clearing your search query or adjusting your location, industry, and role filters."}
                  </p>
                </div>
                {allRecords.length > 0 && (
                  <Button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedLocation("all");
                      setSelectedIndustry("all");
                      setSelectedSector("all");
                      setSelectedRole("all");
                      setShowSelectedOnly(false);
                    }}
                    variant="outline"
                    size="sm"
                    className="text-xs rounded-xl font-bold cursor-pointer"
                  >
                    Reset All Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold border-b border-slate-800">
                      <th className="py-3 px-3 w-10 text-center">
                        <button
                          type="button"
                          onClick={toggleSelectAll}
                          className="text-slate-300 hover:text-white cursor-pointer"
                          title="Select / Deselect All Filtered"
                        >
                          {selectedIds.size === filteredRecords.length && filteredRecords.length > 0 ? (
                            <CheckSquare className="h-4 w-4 text-amber-400" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </th>
                      <th className="py-3 px-3 min-w-[200px]">Entity Name / Title</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3 min-w-[150px]">Location</th>
                      <th className="py-3 px-3 min-w-[140px]">Industry / Sector</th>
                      <th className="py-3 px-3 min-w-[140px]">Role / Designation</th>
                      <th className="py-3 px-3 min-w-[180px]">Contact Information</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredRecords.map((record) => {
                      const isSelected = selectedIds.has(record.id);
                      return (
                        <tr
                          key={record.id}
                          className={`hover:bg-blue-50/40 transition-colors ${
                            isSelected ? "bg-blue-50/60 font-semibold" : ""
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => toggleSelectRow(record.id)}
                              className="text-slate-400 hover:text-blue-600 cursor-pointer"
                            >
                              {isSelected ? (
                                <CheckSquare className="h-4 w-4 text-blue-600" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </button>
                          </td>

                          {/* Title / Entity Name */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 line-clamp-1">{record.title}</span>
                              {record.website_url && (
                                <a
                                  href={
                                    record.website_url.startsWith("http")
                                      ? record.website_url
                                      : `https://${record.website_url}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 shrink-0"
                                  title="Open Website"
                                >
                                  <Globe className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                            {record.source_filename && (
                              <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                                Source: {record.source_filename}
                              </div>
                            )}
                          </td>

                          {/* Category Badge */}
                          <td className="py-3 px-3">
                            <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] font-bold uppercase">
                              {record.category}
                            </Badge>
                          </td>

                          {/* Location */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                              <span>
                                {[record.location_city, record.location_district, record.location_state]
                                  .filter(Boolean)
                                  .join(", ") || "—"}
                              </span>
                            </div>
                          </td>

                          {/* Industry / Sector */}
                          <td className="py-3 px-3">
                            <div className="text-slate-800">{record.industry || "—"}</div>
                            {record.sector && (
                              <div className="text-[10px] text-slate-400">{record.sector}</div>
                            )}
                          </td>

                          {/* Role / Designation */}
                          <td className="py-3 px-3">
                            <div className="text-slate-800">{record.role_designation || "—"}</div>
                          </td>

                          {/* Contact */}
                          <td className="py-3 px-3">
                            <div className="space-y-0.5">
                              {record.contact_email && (
                                <div className="flex items-center gap-1 text-slate-600">
                                  <Mail className="h-2.5 w-2.5 text-slate-400" />
                                  <span className="truncate max-w-[160px]">{record.contact_email}</span>
                                </div>
                              )}
                              {record.contact_phone && (
                                <div className="flex items-center gap-1 text-slate-600">
                                  <Phone className="h-2.5 w-2.5 text-slate-400" />
                                  <span>{record.contact_phone}</span>
                                </div>
                              )}
                              {!record.contact_email && !record.contact_phone && (
                                <span className="text-slate-400">—</span>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                onClick={() => setViewRecordDetail(record)}
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-[11px] rounded-lg cursor-pointer"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Details
                              </Button>

                              {isSuperAdmin && (
                                <Button
                                  onClick={() => handleDeleteSingle(record.id, record.title)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                  title="Delete Record"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Table Footer Count */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
              <div>
                Showing <span className="font-bold text-slate-800">{filteredRecords.length}</span> of{" "}
                <span className="font-bold text-slate-800">{allRecords.length}</span> total records
                {selectedIds.size > 0 && (
                  <span className="ml-2 font-semibold text-blue-600">
                    ({selectedIds.size} row{selectedIds.size > 1 ? "s" : ""} selected)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px]">Database Sync: Real-time</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── MODAL 1: CSV Extraction & Interactive Column Selection ─── */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="h-4 w-4" />
              <span>Step 2: Column Selection & Database Mapping</span>
            </div>
            <DialogTitle className="text-xl font-black">
              Select What to Store in Database
            </DialogTitle>
            <DialogDescription>
              We extracted <strong>{parsedRows.length} rows</strong> and{" "}
              <strong>{parsedHeaders.length} columns</strong> from <code>{csvFileName}</code>. Select which
              columns you want to store, map the key attributes, and click below to save in one click.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Target Category Selection */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <Label className="text-xs font-bold text-slate-800">
                1. Select Target Category / Entity Type
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "companies", label: "Companies", icon: Building2 },
                  { id: "colleges", label: "Colleges", icon: GraduationCap },
                  { id: "students", label: "Students", icon: Users },
                  { id: "interns", label: "Interns", icon: Briefcase },
                  { id: "employees", label: "Employees", icon: UserCheck },
                  { id: "leads", label: "Leads & B2B", icon: Sparkles },
                  { id: "custom", label: "Custom Category", icon: Tag },
                ].map((c) => {
                  const Icon = c.icon;
                  const isCur = targetCategory === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setTargetCategory(c.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isCur
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{c.label}</span>
                    </button>
                  );
                })}
              </div>

              {targetCategory === "custom" && (
                <div className="pt-2">
                  <Input
                    placeholder="Enter custom category name (e.g. vendors, partners, mentors)..."
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                    className="text-xs"
                  />
                </div>
              )}
            </div>

            {/* Column Inclusion Checkboxes */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-bold text-slate-800">
                    2. Choose Columns to Include in the Database
                  </Label>
                  <p className="text-[11px] text-slate-500">
                    Only checked columns will be stored. Unchecked columns will be omitted from database storage.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-[10px] h-6 px-2 text-blue-600 cursor-pointer"
                    onClick={() => {
                      const sel: Record<string, boolean> = {};
                      parsedHeaders.forEach((h) => (sel[h] = true));
                      setSelectedColumns(sel);
                    }}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-[10px] h-6 px-2 text-slate-500 cursor-pointer"
                    onClick={() => {
                      const sel: Record<string, boolean> = {};
                      parsedHeaders.forEach((h) => (sel[h] = false));
                      setSelectedColumns(sel);
                    }}
                  >
                    Deselect All
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1 max-h-48 overflow-y-auto p-1 bg-white rounded-xl border border-slate-200">
                {parsedHeaders.map((col) => {
                  const isChecked = selectedColumns[col] !== false;
                  return (
                    <label
                      key={col}
                      className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer border transition-colors ${
                        isChecked
                          ? "bg-blue-50/60 border-blue-200 text-blue-900 font-semibold"
                          : "bg-slate-50 border-slate-200 text-slate-400"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          setSelectedColumns({ ...selectedColumns, [col]: e.target.checked })
                        }
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="truncate">{col}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Standard Field Mapping */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <Label className="text-xs font-bold text-slate-800">
                3. Map Essential Attributes for Structured Search & Filters
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {/* Title */}
                <div>
                  <Label className="text-[10px] uppercase font-bold text-slate-500">
                    Entity Name / Title *
                  </Label>
                  <Select
                    value={fieldMappings.title || "none"}
                    onValueChange={(val) => setFieldMappings({ ...fieldMappings, title: val === "none" ? "" : val })}
                  >
                    <SelectTrigger className="h-8 text-xs mt-1">
                      <SelectValue placeholder="Select column..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Not Mapped --</SelectItem>
                      {parsedHeaders.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* State */}
                <div>
                  <Label className="text-[10px] uppercase font-bold text-slate-500">State / Region</Label>
                  <Select
                    value={fieldMappings.state || "none"}
                    onValueChange={(val) => setFieldMappings({ ...fieldMappings, state: val === "none" ? "" : val })}
                  >
                    <SelectTrigger className="h-8 text-xs mt-1">
                      <SelectValue placeholder="Select column..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Not Mapped --</SelectItem>
                      {parsedHeaders.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* City */}
                <div>
                  <Label className="text-[10px] uppercase font-bold text-slate-500">City / District</Label>
                  <Select
                    value={fieldMappings.city || "none"}
                    onValueChange={(val) => setFieldMappings({ ...fieldMappings, city: val === "none" ? "" : val })}
                  >
                    <SelectTrigger className="h-8 text-xs mt-1">
                      <SelectValue placeholder="Select column..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Not Mapped --</SelectItem>
                      {parsedHeaders.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Industry */}
                <div>
                  <Label className="text-[10px] uppercase font-bold text-slate-500">Industry / Domain</Label>
                  <Select
                    value={fieldMappings.industry || "none"}
                    onValueChange={(val) => setFieldMappings({ ...fieldMappings, industry: val === "none" ? "" : val })}
                  >
                    <SelectTrigger className="h-8 text-xs mt-1">
                      <SelectValue placeholder="Select column..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Not Mapped --</SelectItem>
                      {parsedHeaders.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sector */}
                <div>
                  <Label className="text-[10px] uppercase font-bold text-slate-500">Sector / Vertical</Label>
                  <Select
                    value={fieldMappings.sector || "none"}
                    onValueChange={(val) => setFieldMappings({ ...fieldMappings, sector: val === "none" ? "" : val })}
                  >
                    <SelectTrigger className="h-8 text-xs mt-1">
                      <SelectValue placeholder="Select column..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Not Mapped --</SelectItem>
                      {parsedHeaders.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Role */}
                <div>
                  <Label className="text-[10px] uppercase font-bold text-slate-500">Role / Designation</Label>
                  <Select
                    value={fieldMappings.role || "none"}
                    onValueChange={(val) => setFieldMappings({ ...fieldMappings, role: val === "none" ? "" : val })}
                  >
                    <SelectTrigger className="h-8 text-xs mt-1">
                      <SelectValue placeholder="Select column..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Not Mapped --</SelectItem>
                      {parsedHeaders.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Email */}
                <div>
                  <Label className="text-[10px] uppercase font-bold text-slate-500">Contact Email</Label>
                  <Select
                    value={fieldMappings.email || "none"}
                    onValueChange={(val) => setFieldMappings({ ...fieldMappings, email: val === "none" ? "" : val })}
                  >
                    <SelectTrigger className="h-8 text-xs mt-1">
                      <SelectValue placeholder="Select column..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Not Mapped --</SelectItem>
                      {parsedHeaders.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Phone */}
                <div>
                  <Label className="text-[10px] uppercase font-bold text-slate-500">Contact Phone / Mobile</Label>
                  <Select
                    value={fieldMappings.phone || "none"}
                    onValueChange={(val) => setFieldMappings({ ...fieldMappings, phone: val === "none" ? "" : val })}
                  >
                    <SelectTrigger className="h-8 text-xs mt-1">
                      <SelectValue placeholder="Select column..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Not Mapped --</SelectItem>
                      {parsedHeaders.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Website */}
                <div>
                  <Label className="text-[10px] uppercase font-bold text-slate-500">Website URL</Label>
                  <Select
                    value={fieldMappings.website || "none"}
                    onValueChange={(val) => setFieldMappings({ ...fieldMappings, website: val === "none" ? "" : val })}
                  >
                    <SelectTrigger className="h-8 text-xs mt-1">
                      <SelectValue placeholder="Select column..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Not Mapped --</SelectItem>
                      {parsedHeaders.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Preview of First 3 Records */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Preview (First 3 Records)</Label>
              <div className="p-3 bg-slate-900 text-white rounded-xl text-[11px] font-mono space-y-2 overflow-x-auto">
                {parsedRows.slice(0, 3).map((r, i) => (
                  <div key={i} className="pb-1 border-b border-slate-800 last:border-none">
                    <span className="text-blue-400 font-bold">Record #{i + 1}: </span>
                    <span className="text-amber-300 font-bold">{r[fieldMappings.title] || "No title mapped"}</span>
                    <span className="text-slate-400 ml-2">
                      | Loc: {r[fieldMappings.city] || r[fieldMappings.state] || "-"} | Role: {r[fieldMappings.role] || "-"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsUploadModalOpen(false)}
              className="text-xs rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleStoreData}
              disabled={isStoringData}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-2 rounded-xl shadow-md cursor-pointer"
            >
              {isStoringData ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Storing {parsedRows.length} Records...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  1-Click Store in Database
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 2: Export Dataset with Admin Password Control ─── */}
      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
              <Download className="h-4 w-4" />
              <span>Multi-Format Dataset Export</span>
            </div>
            <DialogTitle className="text-xl font-black">
              Export Records with Security Password
            </DialogTitle>
            <DialogDescription>
              Export dataset in structured formats. You can optionally enforce a password that recipients must
              provide to open or decrypt the file.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-3">
            {/* Format Selector */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-800">Select Export Format</Label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "xlsx", label: "Excel (.xlsx)", desc: "Spreadsheet" },
                  { id: "csv", label: "CSV (.csv)", desc: "RFC 4180" },
                  { id: "pdf", label: "PDF (.pdf)", desc: "Audit Report" },
                  { id: "txt", label: "Text (.txt)", desc: "ASCII Table" },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setExportFormat(fmt.id as ExportFormat)}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      exportFormat === fmt.id
                        ? "bg-slate-900 text-white border-slate-900 shadow-md scale-105"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <div className="font-extrabold text-xs">{fmt.label}</div>
                    <div className="text-[10px] opacity-70 mt-0.5">{fmt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Scope Selector */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-800">Export Scope</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setExportScope("filtered")}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                    exportScope === "filtered"
                      ? "bg-blue-50 border-blue-500 text-blue-900 font-extrabold"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <div>All Filtered ({filteredRecords.length})</div>
                  <div className="text-[10px] font-normal text-slate-500">Includes active search & filters</div>
                </button>

                <button
                  type="button"
                  onClick={() => setExportScope("selected")}
                  disabled={selectedIds.size === 0}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                    exportScope === "selected"
                      ? "bg-blue-50 border-blue-500 text-blue-900 font-extrabold"
                      : selectedIds.size === 0
                      ? "opacity-50 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <div>Selected Only ({selectedIds.size})</div>
                  <div className="text-[10px] font-normal text-slate-500">Only rows with checked boxes</div>
                </button>
              </div>
            </div>

            {/* Password Protection Control */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-amber-700" />
                  <Label className="text-xs font-bold text-amber-950 cursor-pointer">
                    Enable Password Protection for Export
                  </Label>
                </div>
                <Switch
                  checked={exportPasswordEnabled}
                  onCheckedChange={setExportPasswordEnabled}
                />
              </div>

              {exportPasswordEnabled && (
                <div className="space-y-2 pt-2 border-t border-amber-200/80 animate-in fade-in duration-200">
                  <Label className="text-[11px] font-bold text-amber-900">
                    Allocate Security Password for This File
                  </Label>
                  <Input
                    type="text"
                    placeholder="e.g. VynSecure@2026 or CompanyPIN"
                    value={exportPassword}
                    onChange={(e) => setExportPassword(e.target.value)}
                    className="bg-white border-amber-300 text-xs font-mono font-semibold"
                    autoFocus
                  />
                  <p className="text-[10px] text-amber-800">
                    🛡️ The export will be packaged in a 256-bit AES encrypted security capsule. Recipients
                    will be required to enter this exact password to unlock and access the file.
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsExportModalOpen(false)}
              className="text-xs rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleTriggerExport}
              disabled={isExporting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 rounded-xl shadow-md cursor-pointer"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Export...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download {exportPasswordEnabled ? "Secured" : ""} File
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 3: Super Admin Access & Security Controls ─── */}
      {isSuperAdmin && (
        <DatasetVaultSettingsModal
          open={isSettingsModalOpen}
          onOpenChange={setIsSettingsModalOpen}
          currentSettings={settingsQ.data as DatasetVaultSettings}
          onSave={async (newSettings) => {
            await updateSettingsFn(newSettings);
            toast.success("Employee access & security controls updated successfully!");
            qc.invalidateQueries({ queryKey: ["dataset-vault-settings"] });
          }}
        />
      )}

      {/* ─── MODAL 4: Record Full Details Viewer ─── */}
      {viewRecordDetail && (
        <Dialog open={!!viewRecordDetail} onOpenChange={() => setViewRecordDetail(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-800 border-blue-300 uppercase text-[10px] font-bold">
                  {viewRecordDetail.category}
                </Badge>
                {viewRecordDetail.source_filename && (
                  <span className="text-[11px] text-slate-400">
                    Source: {viewRecordDetail.source_filename}
                  </span>
                )}
              </div>
              <DialogTitle className="text-xl font-black text-slate-900 mt-1">
                {viewRecordDetail.title}
              </DialogTitle>
              <DialogDescription>
                Full extracted profile attributes and dynamic database fields.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Core Information Cards */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Location</div>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {[
                      viewRecordDetail.location_city,
                      viewRecordDetail.location_district,
                      viewRecordDetail.location_state,
                      viewRecordDetail.location_country,
                    ]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Industry & Sector</div>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {[viewRecordDetail.industry, viewRecordDetail.sector].filter(Boolean).join(" · ") || "—"}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Role / Designation</div>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {viewRecordDetail.role_designation || "—"}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Contact Details</div>
                  <div className="font-semibold text-slate-800 mt-0.5 space-y-0.5">
                    {viewRecordDetail.contact_email && <div>✉ {viewRecordDetail.contact_email}</div>}
                    {viewRecordDetail.contact_phone && <div>☎ {viewRecordDetail.contact_phone}</div>}
                    {!viewRecordDetail.contact_email && !viewRecordDetail.contact_phone && <div>—</div>}
                  </div>
                </div>
              </div>

              {viewRecordDetail.website_url && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Website URL</div>
                  <a
                    href={
                      viewRecordDetail.website_url.startsWith("http")
                        ? viewRecordDetail.website_url
                        : `https://${viewRecordDetail.website_url}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-semibold mt-0.5 flex items-center gap-1"
                  >
                    <Globe className="h-3 w-3" />
                    {viewRecordDetail.website_url}
                  </a>
                </div>
              )}

              {viewRecordDetail.notes && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Notes / Remarks</div>
                  <p className="text-slate-700 mt-1 whitespace-pre-wrap">{viewRecordDetail.notes}</p>
                </div>
              )}

              {/* Dynamic Extracted Attributes from CSV */}
              {viewRecordDetail.raw_attributes && Object.keys(viewRecordDetail.raw_attributes).length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-blue-600" />
                    <span>Dynamic Extracted Attributes ({Object.keys(viewRecordDetail.raw_attributes).length})</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs p-3 bg-slate-900 text-slate-100 rounded-2xl max-h-56 overflow-y-auto font-mono">
                    {Object.entries(viewRecordDetail.raw_attributes).map(([k, v]) => (
                      <div key={k} className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                        <div className="text-[10px] text-blue-400 font-bold uppercase truncate">{k}</div>
                        <div className="text-white font-medium text-[11px] truncate mt-0.5">
                          {String(v ?? "—")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                onClick={() => setViewRecordDetail(null)}
                className="bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Close View
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ─── Sub-Component: Settings Modal (Super Admin Only) ───────────────
function DatasetVaultSettingsModal({
  open,
  onOpenChange,
  currentSettings,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSettings?: DatasetVaultSettings;
  onSave: (settings: {
    employee_access_enabled: boolean;
    passcode_required: boolean;
    access_passcode: string;
    allow_employee_export: boolean;
    allowed_categories: string[];
    authorized_employee_emails: string[];
  }) => Promise<void>;
}) {
  const [employeeAccess, setEmployeeAccess] = useState(
    currentSettings?.employee_access_enabled ?? true
  );
  const [passcodeRequired, setPasscodeRequired] = useState(
    currentSettings?.passcode_required ?? false
  );
  const [passcode, setPasscode] = useState(currentSettings?.access_passcode || "VYNEXA-2026");
  const [allowExport, setAllowExport] = useState(currentSettings?.allow_employee_export ?? true);
  const [allowedCategories, setAllowedCategories] = useState<string[]>(
    currentSettings?.allowed_categories || [
      "companies",
      "colleges",
      "students",
      "interns",
      "employees",
      "leads",
    ]
  );
  const [isSaving, setIsSaving] = useState(false);

  const toggleCategory = (cat: string) => {
    if (allowedCategories.includes(cat)) {
      setAllowedCategories(allowedCategories.filter((c) => c !== cat));
    } else {
      setAllowedCategories([...allowedCategories, cat]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        employee_access_enabled: employeeAccess,
        passcode_required: passcodeRequired,
        access_passcode: passcode.trim(),
        allow_employee_export: allowExport,
        allowed_categories: allowedCategories,
        authorized_employee_emails: [],
      });
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-wider">
            <Shield className="h-4 w-4" />
            <span>Super Admin Governance</span>
          </div>
          <DialogTitle className="text-xl font-black">
            Dataset Vault Access & Security Controls
          </DialogTitle>
          <DialogDescription>
            Configure granular permissions for employees, toggle dataset access, enable security passcodes,
            and control file export rights.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 1. Global Employee Access */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <div className="text-xs font-bold text-slate-900">Enable Employee Access</div>
              <div className="text-[11px] text-slate-500">
                Allow authenticated employees to view the Dataset Vault in their portal
              </div>
            </div>
            <Switch checked={employeeAccess} onCheckedChange={setEmployeeAccess} />
          </div>

          {/* 2. Passcode Protection */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900">Security Passcode Protection</div>
                <div className="text-[11px] text-slate-500">
                  Require employees to enter a secret security code before accessing records
                </div>
              </div>
              <Switch checked={passcodeRequired} onCheckedChange={setPasscodeRequired} />
            </div>

            {passcodeRequired && (
              <div className="pt-2 border-t border-slate-200 animate-in fade-in duration-200 space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-slate-600">
                  Master Security Passcode
                </Label>
                <Input
                  type="text"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="bg-white border-slate-300 font-mono text-xs font-bold"
                />
              </div>
            )}
          </div>

          {/* 3. Export Permission */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <div className="text-xs font-bold text-slate-900">Allow Employee Exports</div>
              <div className="text-[11px] text-slate-500">
                Allow authorized employees to download datasets in .xlsx, .csv, .pdf, or .txt
              </div>
            </div>
            <Switch checked={allowExport} onCheckedChange={setAllowExport} />
          </div>

          {/* 4. Allowed Categories */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <Label className="text-xs font-bold text-slate-900">Allowed Categories for Employees</Label>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {[
                { id: "companies", label: "Companies" },
                { id: "colleges", label: "Colleges" },
                { id: "students", label: "Students" },
                { id: "interns", label: "Interns" },
                { id: "employees", label: "Employees" },
                { id: "leads", label: "Leads & B2B" },
              ].map((cat) => {
                const isSelected = allowedCategories.includes(cat.id);
                return (
                  <label
                    key={cat.id}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-blue-50 border-blue-200 text-blue-900 font-bold"
                        : "bg-white border-slate-200 text-slate-500"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCategory(cat.id)}
                      className="rounded text-blue-600"
                    />
                    <span>{cat.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs rounded-xl cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs gap-2 rounded-xl cursor-pointer"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <SaveIcon className="h-4 w-4" />}
            Save Security Policy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SaveIcon(props: any) {
  return <CheckCircle2 {...props} />;
}
