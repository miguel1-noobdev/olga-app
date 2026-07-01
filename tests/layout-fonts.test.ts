import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("layout fonts", () => {
  const layoutPath = path.resolve(process.cwd(), "src/app/layout.tsx");
  const layoutSource = fs.readFileSync(layoutPath, "utf-8");

  it("imports fonts from next/font/google", () => {
    expect(layoutSource).toContain("next/font/google");
  });

  it("loads Playfair Display for headlines", () => {
    expect(layoutSource).toMatch(/Playfair_Display/i);
  });

  it("loads Plus Jakarta Sans for body text", () => {
    expect(layoutSource).toMatch(/Plus_Jakarta_Sans/i);
  });

  it("applies the sans font to the body", () => {
    expect(layoutSource).toMatch(/className=.*\{.*bodyFont\.className.*\}/s);
  });

  it("applies the serif font to headings via CSS layer", () => {
    const globalsPath = path.resolve(process.cwd(), "src/styles/globals.css");
    const globalsSource = fs.readFileSync(globalsPath, "utf-8");
    expect(globalsSource).toContain("font-family: theme(\"fontFamily.serif\");");
  });
});
