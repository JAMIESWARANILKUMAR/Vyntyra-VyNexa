const fs = require('fs');
const path = './src/routes/_authenticated/admin/operations.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add imports
code = code.replace(
  'deleteStoredOfferLetterAndRegenerate, deleteStoredNocAndRegenerate, deleteStoredOfferLetter, deleteStoredNoc,',
  'deleteStoredOfferLetterAndRegenerate, deleteStoredNocAndRegenerate, deleteStoredOfferLetter, deleteStoredNoc,\n  bulkDeleteOfferLetters, bulkRegenerateOfferLetters,'
);

// 2. Add the buttons to the header
const headerTarget = `              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => setProvisionOpen(true)} className="gap-2 text-xs shadow-sm">
                  <Plus className="h-4 w-4" /> Add Team Member
                </Button>`;

const headerReplacement = `              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={async () => {
                  if (confirm("Are you sure you want to completely delete all Offer Letters from the database and storage?")) {
                    const lToast = toast.loading("Deleting all Offer Letters...");
                    try {
                      await bulkDeleteOfferLetters();
                      toast.dismiss(lToast);
                      toast.success("All Offer Letters deleted successfully!");
                      teamQ.refetch();
                    } catch (e) {
                      toast.dismiss(lToast);
                      toast.error("Failed to delete offer letters.");
                    }
                  }
                }} className="gap-1.5 text-xs border-red-200 text-red-700 hover:bg-red-50 hidden md:flex">
                  <Trash2 className="h-3.5 w-3.5" /> Delete All Offer Letters
                </Button>
                <Button variant="outline" size="sm" onClick={async () => {
                  if (confirm("Are you sure you want to regenerate offer letters for all interns? This may take some time.")) {
                    const lToast = toast.loading("Regenerating all Offer Letters...");
                    try {
                      const res = await bulkRegenerateOfferLetters();
                      toast.dismiss(lToast);
                      toast.success(res.message);
                      teamQ.refetch();
                    } catch (e) {
                      toast.dismiss(lToast);
                      toast.error("Failed to regenerate offer letters.");
                    }
                  }
                }} className="gap-1.5 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 hidden md:flex">
                  <RefreshCw className="h-3.5 w-3.5" /> Regenerate All Offer Letters
                </Button>
                <Button size="sm" onClick={() => setProvisionOpen(true)} className="gap-2 text-xs shadow-sm">
                  <Plus className="h-4 w-4" /> Add Team Member
                </Button>`;

code = code.replace(headerTarget, headerReplacement);

fs.writeFileSync(path, code);
console.log('Patched admin/operations.tsx');
