const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..");
const outputMarkdown = path.join(repoRoot, "docs", "current-implementation-baseline.md");
const outputJson = path.join(repoRoot, "docs", "current-implementation-baseline.json");

const apiRoot = path.join(repoRoot, "apps", "api", "app");
const webAppRoot = path.join(repoRoot, "apps", "web", "app");

const args = new Set(process.argv.slice(2));
const checkMode = args.has("--check");

function walkFiles(rootDir, predicate, results = []) {
  if (!fs.existsSync(rootDir)) {
    return results;
  }

  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".next") {
      continue;
    }

    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, predicate, results);
      continue;
    }

    if (predicate(fullPath)) {
      results.push(fullPath);
    }
  }

  return results;
}

function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

function readFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function relative(filePath) {
  return toPosix(path.relative(repoRoot, filePath));
}

function trimSlashes(value) {
  return value.replace(/^\/+|\/+$/g, "");
}

function routePathFromPage(filePath) {
  const relativePath = toPosix(path.relative(webAppRoot, filePath));
  const normalized = relativePath.replace(/\/page\.tsx$/, "").replace(/^page\.tsx$/, "");
  if (!normalized) {
    return "/";
  }

  return `/${trimSlashes(normalized)}`;
}

function parseRedirectTarget(source) {
  if (!source.includes("permanentRedirect(") && !source.includes("redirect(")) {
    return null;
  }

  const redirectCallMatch = source.match(/(?:permanentRedirect|redirect)\(([\s\S]*?)\);/);
  if (!redirectCallMatch) {
    return "[dynamic redirect]";
  }

  const args = redirectCallMatch[1].trim();
  const staticTargetMatch = args.match(/^([`'"])([\s\S]*?)\1$/);
  if (staticTargetMatch) {
    return staticTargetMatch[2];
  }

  return "[dynamic redirect]";
}

function collectFrontendRoutes() {
  const pageFiles = walkFiles(webAppRoot, (filePath) => filePath.endsWith("page.tsx"));
  return pageFiles
    .map((filePath) => {
      const source = readFile(filePath);
      const redirectTarget = parseRedirectTarget(source);
      return {
        route: routePathFromPage(filePath),
        kind: redirectTarget ? "redirect" : "page",
        redirectTarget,
        source: relative(filePath),
      };
    })
    .sort((a, b) => a.route.localeCompare(b.route, "en"));
}

function parseRouterPrefix(source) {
  const match = source.match(/APIRouter\(([\s\S]*?)\)/);
  if (!match) {
    return "";
  }

  const prefixMatch = match[1].match(/prefix\s*=\s*["']([^"']*)["']/);
  return prefixMatch ? prefixMatch[1] : "";
}

function collectIncludedRouterPrefixes() {
  const routerPath = path.join(apiRoot, "api", "router.py");
  if (!fs.existsSync(routerPath)) {
    return new Map();
  }

  const source = readFile(routerPath);
  const prefixes = new Map();
  const includePattern = /include_router\(\s*([A-Za-z_][A-Za-z0-9_]*)\.router([\s\S]*?)\)/g;

  for (const match of source.matchAll(includePattern)) {
    const moduleName = match[1];
    const args = match[2];
    const prefixMatch = args.match(/prefix\s*=\s*["']([^"']*)["']/);
    prefixes.set(moduleName, prefixMatch ? prefixMatch[1] : "");
  }

  return prefixes;
}

function parseDecoratedEndpoints(source, routerPrefix, filePath) {
  const endpoints = [];
  const decoratorPattern = /@router\.(get|post|put|patch|delete)\(([\s\S]*?)\)\s*\ndef\s+([A-Za-z_][A-Za-z0-9_]*)/g;

  for (const match of source.matchAll(decoratorPattern)) {
    const method = match[1].toUpperCase();
    const decoratorArgs = match[2];
    const handler = match[3];
    const pathMatch = decoratorArgs.match(/["']([^"']*)["']/);
    const responseModelMatch = decoratorArgs.match(/response_model\s*=\s*([^,\n)]+)/);
    const statusCodeMatch = decoratorArgs.match(/status_code\s*=\s*([^,\n)]+)/);
    const endpointPath = `${routerPrefix}${pathMatch ? pathMatch[1] : ""}` || "/";

    endpoints.push({
      method,
      path: endpointPath,
      handler,
      responseModel: responseModelMatch ? responseModelMatch[1].trim() : null,
      statusCode: statusCodeMatch ? statusCodeMatch[1].trim() : null,
      source: relative(filePath),
    });
  }

  return endpoints;
}

function collectApiEndpoints() {
  const routesDir = path.join(apiRoot, "api", "routes");
  const routeFiles = walkFiles(routesDir, (filePath) => filePath.endsWith(".py"));
  const includedRouterPrefixes = collectIncludedRouterPrefixes();
  const apiPrefix = "/api";
  const healthEndpoints = [
    { method: "GET", path: "/health", handler: "health_check", responseModel: null, statusCode: null, source: "apps/api/app/main.py" },
    { method: "GET", path: "/health/ready", handler: "readiness_check", responseModel: null, statusCode: "503 on failure", source: "apps/api/app/main.py" },
  ];

  const routeEndpoints = routeFiles.flatMap((filePath) => {
    const source = readFile(filePath);
    const routerPrefix = parseRouterPrefix(source);
    const moduleName = path.basename(filePath, ".py");
    const includedRouterPrefix = includedRouterPrefixes.get(moduleName) ?? "";
    return parseDecoratedEndpoints(source, `${apiPrefix}${includedRouterPrefix}${routerPrefix}`, filePath);
  });

  return [...healthEndpoints, ...routeEndpoints].sort((a, b) => {
    const pathComparison = a.path.localeCompare(b.path, "en");
    if (pathComparison !== 0) {
      return pathComparison;
    }
    return a.method.localeCompare(b.method, "en");
  });
}

function collectDataModels() {
  const modelsPath = path.join(apiRoot, "models", "models.py");
  const source = readFile(modelsPath);
  const classPattern = /class\s+([A-Za-z_][A-Za-z0-9_]*)\(([^)]*)\):([\s\S]*?)(?=\nclass\s+[A-Za-z_][A-Za-z0-9_]*\(|\s*$)/g;
  const models = [];

  for (const match of source.matchAll(classPattern)) {
    const className = match[1];
    const bases = match[2];
    const body = match[3];
    const tableMatch = body.match(/__tablename__\s*=\s*["']([^"']+)["']/);

    if (!tableMatch || !bases.includes("Base")) {
      continue;
    }

    const fieldMatches = [...body.matchAll(/^\s+([A-Za-z_][A-Za-z0-9_]*)\s*:\s*Mapped\[/gm)];
    models.push({
      className,
      tableName: tableMatch[1],
      fieldCount: fieldMatches.length,
      fieldsPreview: fieldMatches.slice(0, 8).map((fieldMatch) => fieldMatch[1]),
      source: relative(modelsPath),
    });
  }

  return models.sort((a, b) => a.tableName.localeCompare(b.tableName, "en"));
}

function collectTests() {
  const groups = [
    {
      name: "Web unit/integration",
      root: path.join(repoRoot, "apps", "web", "src", "app"),
      matcher: (filePath) => /__tests__\/.+\.(test|spec)\.[tj]sx?$/.test(toPosix(path.relative(repoRoot, filePath))),
    },
    {
      name: "Web e2e",
      root: path.join(repoRoot, "apps", "web", "src", "e2e"),
      matcher: (filePath) => /\.(test|spec)\.[tj]sx?$/.test(filePath),
    },
    {
      name: "API pytest",
      root: path.join(repoRoot, "apps", "api", "tests"),
      matcher: (filePath) => /test_.*\.py$/.test(path.basename(filePath)),
    },
  ];

  return groups.map((group) => {
    const files = walkFiles(group.root, group.matcher).map(relative).sort((a, b) => a.localeCompare(b, "en"));
    return {
      name: group.name,
      count: files.length,
      files,
    };
  });
}

function buildSnapshotBase() {
  const frontendRoutes = collectFrontendRoutes();
  const apiEndpoints = collectApiEndpoints();
  const dataModels = collectDataModels();
  const tests = collectTests();
  const trackedSources = [
    "apps/web/app/**/*/page.tsx",
    "apps/api/app/api/router.py",
    "apps/api/app/api/routes/*.py",
    "apps/api/app/main.py",
    "apps/api/app/models/models.py",
    "apps/web/src/app/**/__tests__/*",
    "apps/web/src/e2e/*",
    "apps/api/tests/*",
  ];

  return {
    summary: {
      frontendRouteCount: frontendRoutes.length,
      apiEndpointCount: apiEndpoints.length,
      dataModelCount: dataModels.length,
      testFileCount: tests.reduce((total, group) => total + group.count, 0),
    },
    frontendRoutes,
    apiEndpoints,
    dataModels,
    tests,
    trackedSources,
  };
}

function readExistingSnapshot() {
  if (!fs.existsSync(outputJson)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(outputJson, "utf8"));
  } catch {
    return null;
  }
}

function normalizeSnapshot(snapshot) {
  if (!snapshot) {
    return null;
  }

  const { generatedAt, ...rest } = snapshot;
  return rest;
}

function buildSnapshot() {
  const base = buildSnapshotBase();
  const existing = readExistingSnapshot();
  const normalizedExisting = normalizeSnapshot(existing);
  const generatedAt =
    normalizedExisting && JSON.stringify(normalizedExisting) === JSON.stringify(base)
      ? existing.generatedAt
      : new Date().toISOString();

  return {
    generatedAt,
    ...base,
  };
}

function escapePipe(value) {
  return String(value ?? "").replace(/\|/g, "\\|");
}

function buildMarkdown(snapshot) {
  const lines = [];
  lines.push("# 当前实现自动基线");
  lines.push("");
  lines.push("> 此文件由 `npm run docs:sync` 自动生成。");
  lines.push("> 代码是唯一事实来源；该文件用于让“当前实现”文档自动跟上代码。");
  lines.push("");
  lines.push("## 摘要");
  lines.push("");
  lines.push(`- 生成时间：${snapshot.generatedAt}`);
  lines.push(`- 前端路由：${snapshot.summary.frontendRouteCount}`);
  lines.push(`- API 端点：${snapshot.summary.apiEndpointCount}`);
  lines.push(`- 数据模型：${snapshot.summary.dataModelCount}`);
  lines.push(`- 测试文件：${snapshot.summary.testFileCount}`);
  lines.push("");
  lines.push("## 前端路由");
  lines.push("");
  lines.push("| Route | Type | Redirect | Source |");
  lines.push("| --- | --- | --- | --- |");
  for (const route of snapshot.frontendRoutes) {
    lines.push(`| ${escapePipe(route.route)} | ${route.kind} | ${escapePipe(route.redirectTarget ?? "-")} | ${escapePipe(route.source)} |`);
  }
  lines.push("");
  lines.push("## API 端点");
  lines.push("");
  lines.push("| Method | Path | Handler | Response | Status | Source |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  for (const endpoint of snapshot.apiEndpoints) {
    lines.push(
      `| ${endpoint.method} | ${escapePipe(endpoint.path)} | ${escapePipe(endpoint.handler)} | ${escapePipe(endpoint.responseModel ?? "-")} | ${escapePipe(endpoint.statusCode ?? "-")} | ${escapePipe(endpoint.source)} |`,
    );
  }
  lines.push("");
  lines.push("## 数据模型");
  lines.push("");
  lines.push("| Table | Class | Fields | Preview | Source |");
  lines.push("| --- | --- | --- | --- | --- |");
  for (const model of snapshot.dataModels) {
    lines.push(
      `| ${escapePipe(model.tableName)} | ${escapePipe(model.className)} | ${model.fieldCount} | ${escapePipe(model.fieldsPreview.join(", "))} | ${escapePipe(model.source)} |`,
    );
  }
  lines.push("");
  lines.push("## 测试资产");
  lines.push("");
  for (const group of snapshot.tests) {
    lines.push(`### ${group.name}`);
    lines.push("");
    lines.push(`- 数量：${group.count}`);
    for (const file of group.files) {
      lines.push(`- \`${file}\``);
    }
    lines.push("");
  }
  lines.push("## 扫描来源");
  lines.push("");
  for (const source of snapshot.trackedSources) {
    lines.push(`- \`${source}\``);
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function stableJson(snapshot) {
  return `${JSON.stringify(snapshot, null, 2)}\n`;
}

function sha(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeIfChanged(filePath, content) {
  const current = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : null;
  if (current === content) {
    return false;
  }
  ensureDir(filePath);
  fs.writeFileSync(filePath, content, "utf8");
  return true;
}

function checkIfChanged(filePath, content) {
  const current = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : null;
  return current !== content;
}

function main() {
  const snapshot = buildSnapshot();
  const markdown = buildMarkdown(snapshot);
  const json = stableJson(snapshot);

  if (checkMode) {
    const existing = readExistingSnapshot();
    const hasDiff = JSON.stringify(normalizeSnapshot(existing)) !== JSON.stringify(normalizeSnapshot(snapshot));
    if (hasDiff) {
      console.error("Documentation baseline is outdated. Run `npm run docs:sync`.");
      process.exit(1);
    }

    console.log("Documentation baseline is up to date.");
    return;
  }

  const markdownChanged = writeIfChanged(outputMarkdown, markdown);
  const jsonChanged = writeIfChanged(outputJson, json);
  const fingerprint = sha(markdown + json).slice(0, 12);

  if (!markdownChanged && !jsonChanged) {
    console.log(`Documentation baseline already up to date (${fingerprint}).`);
    return;
  }

  console.log(`Documentation baseline updated (${fingerprint}).`);
  console.log(relative(outputMarkdown));
  console.log(relative(outputJson));
}

main();
