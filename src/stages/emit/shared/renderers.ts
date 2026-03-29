import type { Annotation, LiteralValue } from "@varavel/vdl-plugin-sdk";
import { indent } from "./helpers";

/**
 * Renders a Go string literal.
 */
export function renderGoString(value: string): string {
  return JSON.stringify(value);
}

/**
 * Renders the generated Go literal for a slice of operation annotations.
 */
export function renderAnnotationsLiteral(annotations: Annotation[]): string {
  if (annotations.length === 0) {
    return "[]Annotation{}";
  }

  const items = annotations.map((annotation) => {
    return [
      "{",
      indent(
        [
          `Name: ${renderGoString(annotation.name)},`,
          `Argument: ${renderLiteralValue(annotation.argument)},`,
        ].join("\n"),
      ),
      "},",
    ].join("\n");
  });

  return ["[]Annotation{", indent(items.join("\n")), "}"].join("\n");
}

/**
 * Renders a Go literal from the VDL literal model.
 */
export function renderLiteralValue(value?: LiteralValue): string {
  if (!value) {
    return "nil";
  }

  switch (value.kind) {
    case "string":
      return renderGoString(value.stringValue ?? "");
    case "int":
      return `int64(${value.intValue ?? 0})`;
    case "float":
      return `float64(${String(value.floatValue ?? 0)})`;
    case "bool":
      return value.boolValue ? "true" : "false";
    case "array":
      return renderArrayLiteral(value.arrayItems ?? []);
    case "object":
      return renderObjectLiteral(value.objectEntries ?? []);
    default:
      return "nil";
  }
}

/**
 * Renders a Go `[]any` literal.
 */
function renderArrayLiteral(items: LiteralValue[]): string {
  if (items.length === 0) {
    return "[]any{}";
  }

  return [
    "[]any{",
    indent(items.map((item) => `${renderLiteralValue(item)},`).join("\n")),
    "}",
  ].join("\n");
}

/**
 * Renders a Go `map[string]any` literal.
 */
function renderObjectLiteral(
  entries: NonNullable<LiteralValue["objectEntries"]>,
): string {
  if (entries.length === 0) {
    return "map[string]any{}";
  }

  return [
    "map[string]any{",
    indent(
      entries
        .map(
          (entry) =>
            `${renderGoString(entry.key)}: ${renderLiteralValue(entry.value)},`,
        )
        .join("\n"),
    ),
    "}",
  ].join("\n");
}

/**
 * Renders a Go documentation comment block.
 */
export function renderDocComment(doc?: string): string {
  if (!doc) {
    return "";
  }

  return doc
    .split("\n")
    .map((line) => `// ${line}`)
    .join("\n");
}

/**
 * Renders a Go deprecation comment from a VDL `@deprecated` annotation.
 */
export function renderDeprecatedComment(message?: string): string {
  if (message === undefined) {
    return "";
  }

  const description =
    message.length > 0
      ? message
      : "This symbol is deprecated and should not be used in new code.";

  return `// Deprecated: ${description}`;
}

/**
 * Renders a complete Go comment block with a summary, optional VDL doc, and deprecation note.
 */
export function renderCommentBlock(options: {
  summary: string;
  doc?: string;
  deprecated?: string;
}): string {
  const lines = [options.summary];

  if (options.doc) {
    lines.push("", ...options.doc.split("\n"));
  }

  if (options.deprecated !== undefined) {
    const description =
      options.deprecated.length > 0
        ? options.deprecated
        : "This symbol is deprecated and should not be used in new code.";
    lines.push("", `Deprecated: ${description}`);
  }

  return lines.map((line) => `// ${line}`).join("\n");
}
