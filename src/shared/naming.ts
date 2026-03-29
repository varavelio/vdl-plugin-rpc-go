import { pascalCase } from "@varavel/vdl-plugin-sdk/utils/strings";

const GO_KEYWORDS = new Set([
  "break",
  "case",
  "chan",
  "const",
  "continue",
  "default",
  "defer",
  "else",
  "fallthrough",
  "for",
  "func",
  "go",
  "goto",
  "if",
  "import",
  "interface",
  "map",
  "package",
  "range",
  "return",
  "select",
  "struct",
  "switch",
  "type",
  "var",
]);

const GO_PACKAGE_RE = /^[a-z_][a-z0-9_]*$/;

/**
 * Reports whether a value is a reserved Go keyword.
 */
function isGoKeyword(value: string): boolean {
  return GO_KEYWORDS.has(value);
}

/**
 * Validates whether a value can be used as a Go package name.
 */
export function isValidGoPackageName(value: string): boolean {
  return GO_PACKAGE_RE.test(value) && !isGoKeyword(value);
}

/**
 * Converts a VDL symbol name into an exported Go type name.
 */
export function toGoTypeName(value: string): string {
  return escapeGoIdentifier(pascalCase(value));
}

/**
 * Converts a VDL field name into an exported Go field name.
 */
export function toGoFieldName(value: string): string {
  return escapeGoIdentifier(pascalCase(value));
}

/**
 * Derives the Go type name used by `vdl-plugin-go` for inline object fields.
 */
export function toInlineTypeName(
  parentTypeName: string,
  fieldName: string,
): string {
  return `${parentTypeName}${toGoFieldName(fieldName)}`;
}

/**
 * Escapes a Go identifier when it collides with a reserved keyword.
 */
function escapeGoIdentifier(value: string): string {
  return isGoKeyword(value) ? `${value}_` : value;
}
