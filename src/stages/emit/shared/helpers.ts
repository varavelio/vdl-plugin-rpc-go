import type { PluginOutputFile } from "@varavel/vdl-plugin-sdk";
import { limitBlankLines } from "@varavel/vdl-plugin-sdk/utils/strings";

/**
 * Builds a single generated output file.
 */
export function createGoFile(
  path: string,
  header: string,
  body: string,
): PluginOutputFile {
  let content = "";
  content = joinSections([header, body]);
  content = limitBlankLines(content, 1);

  return {
    path,
    content,
  };
}

/**
 * Joins non-empty file sections with a blank line between them.
 */
export function joinSections(sections: Array<string | undefined>): string {
  return `${sections.filter(Boolean).join("\n\n").trim()}\n`;
}

/**
 * Indents each non-empty line of a block by the requested tab depth.
 */
export function indent(value: string, depth = 1): string {
  const prefix = "\t".repeat(depth);

  return value
    .split("\n")
    .map((line) => (line.length > 0 ? `${prefix}${line}` : line))
    .join("\n");
}
