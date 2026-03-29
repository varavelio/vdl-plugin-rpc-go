import { execSync } from "node:child_process";
import { existsSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, it } from "vitest";

const goModTemplate = ["module fixture", "", "go 1.26", ""].join("\n");

const fixturesDir = resolve(__dirname, "fixtures");
const fixtures = readdirSync(fixturesDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .filter((dirent) =>
    existsSync(join(fixturesDir, dirent.name, "vdl.config.vdl")),
  )
  .map((dirent) => dirent.name);

describe("E2E: VDL RPC Go", () => {
  it.each(fixtures)("builds fixture: %s", (fixtureName) => {
    const fixturePath = join(fixturesDir, fixtureName);
    const goModPath = join(fixturePath, "go.mod");
    const generatedRoot = join(fixturePath, "internal");

    writeFileSync(goModPath, goModTemplate);

    if (existsSync(generatedRoot)) {
      rmSync(generatedRoot, { recursive: true, force: true });
    }

    execSync("npx vdl generate", { cwd: fixturePath, stdio: "pipe" });
    execSync("go run main.go", { cwd: fixturePath, stdio: "inherit" });
  });
});
