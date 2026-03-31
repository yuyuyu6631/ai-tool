const fs = require("node:fs");
const path = require("node:path");

const manifestPath = path.join(__dirname, "..", ".next", "routes-manifest.json");

if (!fs.existsSync(manifestPath)) {
  process.exit(0);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

if (!Array.isArray(manifest.staticRoutes)) {
  manifest.staticRoutes = [];
}

if (!Array.isArray(manifest.dynamicRoutes)) {
  manifest.dynamicRoutes = [];
}

if (!Array.isArray(manifest.dataRoutes)) {
  manifest.dataRoutes = [];
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest), "utf8");
