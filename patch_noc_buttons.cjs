const fs = require('fs');
const path = './src/routes/_authenticated/admin/operations.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add imports
code = code.replace(
  'bulkDeleteOfferLetters, bulkRegenerateOfferLetters,',
  'bulkDeleteOfferLetters, bulkRegenerateOfferLetters, bulkDeleteNocs, bulkRegenerateNocs,'
);

// 2. Add buttons right after the offer letters buttons
const target = `<Button variant="outline" size="sm" onClick={async () => {
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
                  }} className="gap-1.5 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 flex">
                    <RefreshCw className="h-3.5 w-3.5" /> Regenerate All Offer Letters
                  </Button>`;

const replacement = target + `
                  <Button variant="outline" size="sm" onClick={async () => {
                    if (confirm("Are you sure you want to completely delete all NOCs from the database and storage?")) {
                      const lToast = toast.loading("Deleting all NOCs...");
                      try {
                        await bulkDeleteNocs();
                        toast.dismiss(lToast);
                        toast.success("All NOCs deleted successfully!");
                        teamQ.refetch();
                      } catch (e) {
                        toast.dismiss(lToast);
                        toast.error("Failed to delete NOCs.");
                      }
                    }
                  }} className="gap-1.5 text-xs border-red-200 text-red-700 hover:bg-red-50 hidden xl:flex">
                    <Trash2 className="h-3.5 w-3.5" /> Delete All NOCs
                  </Button>
                  <Button variant="outline" size="sm" onClick={async () => {
                    if (confirm("Are you sure you want to regenerate NOCs for all interns? This may take some time.")) {
                      const lToast = toast.loading("Regenerating all NOCs...");
                      try {
                        const res = await bulkRegenerateNocs();
                        toast.dismiss(lToast);
                        toast.success(res.message);
                        teamQ.refetch();
                      } catch (e) {
                        toast.dismiss(lToast);
                        toast.error("Failed to regenerate NOCs.");
                      }
                    }
                  }} className="gap-1.5 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 hidden xl:flex">
                    <RefreshCw className="h-3.5 w-3.5" /> Regenerate All NOCs
                  </Button>`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync(path, code);
  console.log('Added NOC buttons!');
} else {
  console.log('Could not find target to inject NOC buttons.');
}
