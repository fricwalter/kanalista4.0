import { cp, mkdir, rm, access, readdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, ".cf-pages-webroot");
const nextServerApp = path.join(root, ".next", "server", "app");
const nextStatic = path.join(root, ".next", "static");
const publicDir = path.join(root, "public");

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  await cp(path.join(nextServerApp, "index.html"), path.join(outDir, "index.html"));

  if (await exists(path.join(nextServerApp, "_not-found.html"))) {
    await cp(path.join(nextServerApp, "_not-found.html"), path.join(outDir, "404.html"));
  }

  const staticOut = path.join(outDir, "_next", "static");
  await mkdir(staticOut, { recursive: true });

  // .next/static/cache can contain >25 MiB webpack packs that Pages refuses.
  const staticEntries = await readdir(nextStatic);
  for (const entry of staticEntries) {
    if (entry === "cache") continue;
    await cp(path.join(nextStatic, entry), path.join(staticOut, entry), { recursive: true });
  }

  if (await exists(publicDir)) {
    await cp(publicDir, outDir, { recursive: true });
  }
}

await main();
