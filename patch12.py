
import io

# 1. Update operations.functions.ts
ops_file = "src/lib/operations.functions.ts"
with io.open(ops_file, "r", encoding="utf-8") as f:
    ops_content = f.read()

helper_fn = """async function getValidUrl(url: string | null, client: any) {
      if (!url) return null;
      if (url.includes("/storage/v1/object/")) {
        try {
          const match = url.match(/\/storage\/v1\/object\/(sign|public)\/([^\/]+)\/(.+)/);
          if (match) {
            const bucket = match[2];
            const filePath = decodeURIComponent(match[3]).split("?")[0];
            const { data: signedData } = await client.storage.from(bucket).createSignedUrl(filePath, 7200);
            if (signedData?.signedUrl) return signedData.signedUrl;
          }
        } catch (e) {
          console.warn("Failed to re-sign URL", e);
        }
      }
      return url;
    }"""

ops_content = ops_content.replace(
    "const adminClient = getAdminClient();",
    "const adminClient = getAdminClient();\n    " + helper_fn
)

ops_content = ops_content.replace(
    "let offerLetterUrl = app.offer_letter_url || null;",
    "let offerLetterUrl = await getValidUrl(app.offer_letter_url || null, adminClient);"
)

ops_content = ops_content.replace(
    "nocUrl = profile.noc_url || app.noc_url || null;",
    "nocUrl = await getValidUrl(profile.noc_url || app.noc_url || null, adminClient);"
)

with io.open(ops_file, "w", encoding="utf-8", newline="\n") as f:
    f.write(ops_content)

# 2. Update noc.functions.ts
noc_file = "src/lib/noc.functions.ts"
with io.open(noc_file, "r", encoding="utf-8") as f:
    noc_content = f.read()

old_fetch = """        const url = (await resolveGooglePhotosUrl(targetStr)) || targetStr;
        
        let res = await fetch(url, {"""

new_fetch = """        let url = (await resolveGooglePhotosUrl(targetStr)) || targetStr;
        if (url.startsWith("/")) {
           url = (process.env.VITE_APP_URL || "https://portal.vyntyraconsultancyservices.in") + url;
        }
        
        let res = await fetch(url, {"""

noc_content = noc_content.replace(old_fetch, new_fetch)

with io.open(noc_file, "w", encoding="utf-8", newline="\n") as f:
    f.write(noc_content)

print("Patched operations.functions.ts and noc.functions.ts")
