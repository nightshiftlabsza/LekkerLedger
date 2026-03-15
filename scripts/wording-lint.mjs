import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const includeRoots = [
  "src/app",
  "src/components",
  "components",
  "src/config",
  "src/lib",
];
const includeExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".md"]);
const excludePatterns = [
  /\.test\./,
  /node_modules/,
  /\.next/,
  /build/,
  /playwright-report/,
  /test-results/,
  /public\/sw\.js$/,
];

const bannedPatterns = [
  { regex: /BCEA Compliant/i, label: "BCEA Compliant" },
  { regex: /BCEA-compliant/i, label: "BCEA-compliant" },
  { regex: /BCEA COMPLIANCE SUMMARY/i, label: "BCEA COMPLIANCE SUMMARY" },
  { regex: /LEGAL\s*[•·]\s*COMPLIANT/i, label: "LEGAL • COMPLIANT" },
  { regex: /\bNON-COMPLIANT\b/i, label: "NON-COMPLIANT" },
  { regex: /\bCOMPLIANT\b\s*\(/i, label: "COMPLIANT (...)" },
  { regex: /Compliance Engine/i, label: "Compliance Engine" },
  { regex: /full legal vault/i, label: "full legal vault" },
  { regex: /legal payslip/i, label: "legal payslip" },
  { regex: /2026 rulings?/i, label: "2026 ruling" },
  { regex: /COIDA 2026/i, label: "COIDA 2026" },
  { regex: /as of 2026/i, label: "as of 2026" },
  { regex: /Last updated: March 2026/i, label: "Last updated: March 2026" },
  { regex: /Last Updated: March 2, 2026/i, label: "Last Updated: March 2, 2026" },
  { regex: /undisputed chronological history/i, label: "undisputed chronological history" },
  { regex: /automatic penalties/i, label: "automatic penalties" },
  { regex: /criminal offense/i, label: "criminal offense" },
  { regex: /fulfills the requirements/i, label: "fulfills the requirements" },
  { regex: /2026 Sectoral/i, label: "2026 Sectoral" },
  { regex: /2026 caps and rates/i, label: "2026 caps and rates" },
  { regex: /generate UIF declarations for submission/i, label: "generate UIF declarations for submission" },
];

function shouldExclude(filePath) {
  return excludePatterns.some((pattern) => pattern.test(filePath));
}

function walk(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(repoRoot, fullPath).replaceAll("\\", "/");
    if (shouldExclude(relativePath)) continue;
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }
    if (!includeExtensions.has(path.extname(entry.name))) continue;
    files.push(fullPath);
  }
  return files;
}

const findings = [];
for (const root of includeRoots) {
  const fullRoot = path.join(repoRoot, root);
  if (!fs.existsSync(fullRoot)) continue;
  for (const filePath of walk(fullRoot)) {
    const relativePath = path.relative(repoRoot, filePath).replaceAll("\\", "/");
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
      bannedPatterns.forEach(({ regex, label }) => {
        if (regex.test(line)) {
          findings.push(`${relativePath}:${index + 1} -> ${label}`);
        }
      });
    });
  }
}

if (findings.length > 0) {
  console.error("Wording lint failed. Banned phrases found:");
  findings.forEach((finding) => console.error(`- ${finding}`));
  process.exit(1);
}

console.log("Wording lint passed.");
