import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const allowedTopLevel = new Set([
  ".github",
  ".gitattributes",
  ".githooks",
  ".gitignore",
  ".prettierrc",
  ".railwayignore",
  ".env.example",
  "AGENTS.md",
  "CLAUDE.md",
  "Containerfile.api.prod",
  "Containerfile.web.prod",
  "README.md",
  "apps",
  "doc",
  "docs",
  "deploy.sh",
  "generate_prd.js",
  "goal",
  "infra",
  "mcp",
  "package-lock.json",
  "package.json",
  "packages",
  "scripts",
  "start.py",
  "deploy_podman_prod.sh",
  "tests",
  "workflow",
  "start_podman_prod.sh",
  "xingdp_proxy_server.cjs",
]);

const forbiddenTrackedPatterns = [
  /^tmp\//,
  /^output\//,
  /^archive\//,
  /^node_modules\//,
  /^\.agent\//,
  /^\.claude\//,
  /^\.codex\//,
  /^\.codex-logs\//,
  /^\.rollback-backup\//,
  /^newfiel\//,
  /^testagentfilespace\//,
  /^\.dev-stack\.json$/,
  /^\.env(?:\.|$)(?!example$)/,
  /\.(?:7z|zip|tar|tgz|tar\.gz|db|sqlite|sqlite3)$/i,
];

const activeRuntimePatterns = [/^apps\/api\//, /^apps\/web\//, /^packages\/contracts\//];
const sourceExtensions = /\.(?:py|ts|tsx|js|jsx|mjs|cjs|css|json|sql|yml|yaml)$/i;

function git(args) {
  return execFileSync("git", [...args, "-z"])
    .toString("utf8")
    .split("\0")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replaceAll("\\", "/"));
}

function printSection(title, items) {
  console.error(`\n${title}`);
  for (const item of items) {
    console.error(`  - ${item}`);
  }
}

const trackedFiles = git(["ls-files"]);
const failures = [];

const unknownTopLevel = trackedFiles
  .map((file) => file.split("/")[0])
  .filter((name, index, names) => names.indexOf(name) === index)
  .filter((name) => !allowedTopLevel.has(name));

if (unknownTopLevel.length > 0) {
  failures.push({
    title: "Tracked files exist under unapproved top-level paths:",
    items: unknownTopLevel,
  });
}

const forbiddenTracked = trackedFiles.filter((file) =>
  forbiddenTrackedPatterns.some((pattern) => pattern.test(file)),
);

if (forbiddenTracked.length > 0) {
  failures.push({
    title: "Runtime artifacts or archived paths are tracked:",
    items: forbiddenTracked,
  });
}

const activeRuntimeImportsArchive = trackedFiles
  .filter((file) => activeRuntimePatterns.some((pattern) => pattern.test(file)))
  .filter((file) => sourceExtensions.test(file))
  .filter((file) => {
    const content = readFileSync(file, "utf8");
    return /archive[\\/](?:drawer)?/.test(content);
  });

if (activeRuntimeImportsArchive.length > 0) {
  failures.push({
    title: "Active runtime files reference archived code:",
    items: activeRuntimeImportsArchive,
  });
}

if (failures.length > 0) {
  console.error("Code tree check failed.");
  for (const failure of failures) {
    printSection(failure.title, failure.items);
  }
  process.exit(1);
}

console.log("Code tree check passed.");
