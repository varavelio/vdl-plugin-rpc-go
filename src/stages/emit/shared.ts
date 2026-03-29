import type {
  Annotation,
  LiteralValue,
  PluginOutputFile,
} from "@varavel/vdl-plugin-sdk";
import type { OperationDescriptor } from "../model/types";

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
 * Builds a single generated output file.
 */
export function createGoFile(
  path: string,
  header: string,
  body: string,
): PluginOutputFile {
  return {
    path,
    content: joinSections([header, body]),
  };
}

/**
 * Renders the generated Go operation catalogs used by runtime code.
 */
export function renderOperationCatalog(
  constName: string,
  operations: OperationDescriptor[],
): string {
  if (operations.length === 0) {
    return `var ${constName} = []OperationDefinition{}`;
  }

  const entries = operations.map((operation) => {
    return [
      "{",
      indent(
        [
          `RPCName: ${renderGoString(operation.rpcName)},`,
          `Name: ${renderGoString(operation.name)},`,
          `Type: ${
            operation.kind === "proc"
              ? "OperationTypeProc"
              : "OperationTypeStream"
          },`,
          `Annotations: ${renderAnnotationsLiteral(operation.annotations)},`,
        ].join("\n"),
      ),
      "},",
    ].join("\n");
  });

  return [
    `var ${constName} = []OperationDefinition{`,
    indent(entries.join("\n")),
    "}",
  ].join("\n");
}

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
