import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";
import { cloudflare } from "@cloudflare/vite-plugin";

const isVercel = Boolean(process.env.VERCEL || process.env.NOW_BUILDER);
const isCloudflare = Boolean(
  process.env.CLOUDFLARE ||
  process.env.CF_PAGES ||
  process.env.npm_lifecycle_event === "build:cf" ||
  process.env.npm_lifecycle_event === "deploy:cf" ||
  process.env.npm_lifecycle_event === "preview:cf" ||
  !isVercel
);

export default defineConfig({
  plugins: [
    tailwindcss(),
    tsconfigPaths(),
    tanstackStart({
      server: { entry: "server" },
    }),
    ...(isCloudflare && !isVercel
      ? [cloudflare({ viteEnvironment: { name: "ssr" } })]
      : []),
    nitro({
      preset: process.env.NITRO_PRESET || (isVercel ? "vercel" : "cloudflare-module"),
    }),
    viteReact(),
  ],
});
