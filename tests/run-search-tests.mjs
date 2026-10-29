import { build } from "esbuild";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

console.log("Bundling search service for automated testing...");

if (!fs.existsSync("dist-test")) {
  fs.mkdirSync("dist-test", { recursive: true });
}

await build({
  entryPoints: ["src/services/search/index.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: "dist-test/search-bundle.js",
  sourcemap: "inline",
});

console.log("Running Search Engine Automated Test Suite...\n");
try {
  execSync("node --test tests/search-engine.test.mjs tests/search-engine-benchmark.test.mjs", {
    stdio: "inherit",
  });
  console.log("\nAll search engine tests and benchmarks passed successfully!");
} catch (e) {
  process.exit(1);
}
