import { mkdir, stat } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const inputDir = path.join(projectRoot, "artifacts", "marketing", "homepage");
const outputDir = path.join(projectRoot, "public", "images", "marketing");

const assets = [
  {
    input: path.join(inputDir, "homepage-dashboard-overview.png"),
    output: path.join(outputDir, "homepage-dashboard-overview.webp"),
  },
  {
    input: path.join(inputDir, "homepage-contracts-documents.png"),
    output: path.join(outputDir, "homepage-contracts-documents.webp"),
  },
];

async function ensureExists(filePath) {
  await stat(filePath);
}

async function run() {
  const { default: sharp } = await import("sharp");
  await mkdir(outputDir, { recursive: true });

  for (const asset of assets) {
    await ensureExists(asset.input);
    await sharp(asset.input)
      .webp({ quality: 84, effort: 6 })
      .toFile(asset.output);
    console.log(`Exported ${path.relative(projectRoot, asset.output)}`);
  }
}

run().catch((error) => {
  console.error("Could not export marketing homepage assets.");
  console.error(error);
  process.exit(1);
});
