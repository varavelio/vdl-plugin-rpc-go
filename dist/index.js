"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  generate: () => generate2
});
module.exports = __toCommonJS(index_exports);

// node_modules/@varavel/vdl-plugin-sdk/dist/core/define-plugin.js
function definePlugin(handler) {
  return handler;
}
__name(definePlugin, "definePlugin");

// node_modules/@varavel/vdl-plugin-sdk/dist/_virtual/_@oxc-project_runtime@0.115.0/helpers/typeof.js
function _typeof(o) {
  "@babel/helpers - typeof";
  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
    return typeof o2;
  } : function(o2) {
    return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
  }, _typeof(o);
}
__name(_typeof, "_typeof");

// node_modules/@varavel/vdl-plugin-sdk/dist/_virtual/_@oxc-project_runtime@0.115.0/helpers/toPrimitive.js
function toPrimitive(t, r) {
  if ("object" != _typeof(t) || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != _typeof(i)) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
__name(toPrimitive, "toPrimitive");

// node_modules/@varavel/vdl-plugin-sdk/dist/_virtual/_@oxc-project_runtime@0.115.0/helpers/toPropertyKey.js
function toPropertyKey(t) {
  var i = toPrimitive(t, "string");
  return "symbol" == _typeof(i) ? i : i + "";
}
__name(toPropertyKey, "toPropertyKey");

// node_modules/@varavel/vdl-plugin-sdk/dist/_virtual/_@oxc-project_runtime@0.115.0/helpers/defineProperty.js
function _defineProperty(e, r, t) {
  return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
    value: t,
    enumerable: true,
    configurable: true,
    writable: true
  }) : e[r] = t, e;
}
__name(_defineProperty, "_defineProperty");

// node_modules/@varavel/vdl-plugin-sdk/dist/_virtual/_@oxc-project_runtime@0.115.0/helpers/objectSpread2.js
function ownKeys(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function(r2) {
      return Object.getOwnPropertyDescriptor(e, r2).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
__name(ownKeys, "ownKeys");
function _objectSpread2(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys(Object(t), true).forEach(function(r2) {
      _defineProperty(e, r2, t[r2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r2) {
      Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
    });
  }
  return e;
}
__name(_objectSpread2, "_objectSpread2");

// node_modules/@varavel/vdl-plugin-sdk/dist/utils/rpc/validate-ir-for-rpc.js
var RPC_ANNOTATION_NAME = "rpc";
var PROC_ANNOTATION_NAME = "proc";
var STREAM_ANNOTATION_NAME = "stream";
function validateIrForRpc(ir) {
  const rpcTypes = ir.types.filter((typeDef) => {
    return hasAnnotation(typeDef.annotations, RPC_ANNOTATION_NAME);
  });
  if (rpcTypes.length === 0) return;
  const errors = [];
  for (const rpcType of rpcTypes) validateRpcType(rpcType, errors);
  return errors.length === 0 ? void 0 : errors;
}
__name(validateIrForRpc, "validateIrForRpc");
function validateRpcType(typeDef, errors) {
  var _typeDef$typeRef$obje;
  if (typeDef.typeRef.kind !== "object") {
    errors.push({
      message: `Type ${JSON.stringify(typeDef.name)} is annotated with @rpc and must be an object type.`,
      position: typeDef.position
    });
    return;
  }
  const fields = (_typeDef$typeRef$obje = typeDef.typeRef.objectFields) !== null && _typeDef$typeRef$obje !== void 0 ? _typeDef$typeRef$obje : [];
  for (const field of fields) validateRpcOperationField(typeDef, field, errors);
}
__name(validateRpcType, "validateRpcType");
function validateRpcOperationField(rpcType, field, errors) {
  const hasProc = hasAnnotation(field.annotations, PROC_ANNOTATION_NAME);
  const hasStream = hasAnnotation(field.annotations, STREAM_ANNOTATION_NAME);
  if (!hasProc && !hasStream) return;
  if (hasProc && hasStream) {
    errors.push({
      message: `Field ${JSON.stringify(`${rpcType.name}.${field.name}`)} cannot be annotated with both @proc and @stream.`,
      position: field.position
    });
    return;
  }
  const operationAnnotation = hasProc ? PROC_ANNOTATION_NAME : STREAM_ANNOTATION_NAME;
  if (field.typeRef.kind !== "object") {
    errors.push({
      message: `Field ${JSON.stringify(`${rpcType.name}.${field.name}`)} is annotated with @${operationAnnotation} and must be an object type.`,
      position: field.position
    });
    return;
  }
  const inputField = findFieldByName(field.typeRef.objectFields, "input");
  const outputField = findFieldByName(field.typeRef.objectFields, "output");
  if (inputField && inputField.typeRef.kind !== "object") errors.push({
    message: `Field "input" in operation ${JSON.stringify(`${rpcType.name}.${field.name}`)} must be an object type when present.`,
    position: withFallbackFile(inputField.position, field.position)
  });
  if (outputField && outputField.typeRef.kind !== "object") errors.push({
    message: `Field "output" in operation ${JSON.stringify(`${rpcType.name}.${field.name}`)} must be an object type when present.`,
    position: withFallbackFile(outputField.position, field.position)
  });
}
__name(validateRpcOperationField, "validateRpcOperationField");
function hasAnnotation(annotations, name) {
  return annotations.some((annotation) => annotation.name === name);
}
__name(hasAnnotation, "hasAnnotation");
function findFieldByName(fields, name) {
  return fields === null || fields === void 0 ? void 0 : fields.find((field) => field.name === name);
}
__name(findFieldByName, "findFieldByName");
function withFallbackFile(primary, fallback) {
  if (primary.file.length > 0 || fallback.file.length === 0) return primary;
  return _objectSpread2(_objectSpread2({}, primary), {}, { file: fallback.file });
}
__name(withFallbackFile, "withFallbackFile");

// src/shared/errors.ts
var _GenerationError = class _GenerationError extends Error {
  /**
   * Creates a generation error with an optional VDL source position.
   */
  constructor(message, position) {
    super(message);
    this.name = "GenerationError";
    this.position = position;
  }
};
__name(_GenerationError, "GenerationError");
var GenerationError = _GenerationError;
function toPluginOutputError(error) {
  if (error instanceof GenerationError) {
    return {
      message: error.message,
      position: error.position
    };
  }
  if (error instanceof Error) {
    return {
      message: error.message
    };
  }
  return {
    message: "An unknown generation error occurred."
  };
}
__name(toPluginOutputError, "toPluginOutputError");

// node_modules/@varavel/gen/dist/index.js
var _a;
var Generator = (_a = class {
  constructor() {
    this.chunks = [];
    this.indentLevel = 0;
    this.indentUnit = "  ";
    this.atStartOfLine = true;
  }
  /**
  * Uses spaces for one indent level.
  *
  * Example: `withSpaces(2)` makes each level equal to two spaces.
  */
  withSpaces(spaces) {
    this.indentUnit = " ".repeat(Math.max(0, spaces));
    return this;
  }
  /**
  * Uses one tab character for each indent level.
  */
  withTabs() {
    this.indentUnit = "	";
    return this;
  }
  /**
  * Moves one indentation level deeper for future writes.
  */
  indent() {
    this.indentLevel++;
    return this;
  }
  /**
  * Moves one indentation level up for future writes.
  *
  * If already at zero, it stays at zero.
  */
  dedent() {
    if (this.indentLevel > 0) this.indentLevel--;
    return this;
  }
  /**
  * Writes text exactly as given.
  *
  * It does not add indentation or newlines.
  */
  raw(content) {
    if (content.length === 0) return this;
    this.chunks.push(content);
    this.atStartOfLine = content.endsWith("\n");
    return this;
  }
  /**
  * Writes exactly one newline character.
  */
  break() {
    this.chunks.push("\n");
    this.atStartOfLine = true;
    return this;
  }
  /**
  * Writes text on the current line.
  *
  * It adds indentation only when writing at the start of a line.
  */
  inline(content) {
    if (content.length === 0) return this;
    const sublines = content.split("\n");
    for (let index = 0; index < sublines.length; index++) {
      var _sublines$index;
      const subline = (_sublines$index = sublines[index]) !== null && _sublines$index !== void 0 ? _sublines$index : "";
      if (index > 0) {
        this.chunks.push("\n");
        this.atStartOfLine = true;
      }
      if (subline.length > 0) {
        if (this.atStartOfLine) this.chunks.push(this.indentUnit.repeat(this.indentLevel));
        this.chunks.push(subline);
        this.atStartOfLine = false;
      }
    }
    if (content.endsWith("\n")) this.atStartOfLine = true;
    return this;
  }
  /**
  * Same as `inline` but adds one newline at the end of the content.
  */
  line(content) {
    this.inline(content);
    this.break();
    return this;
  }
  /**
  * Runs a callback one level deeper, then restores the previous level.
  */
  block(run) {
    this.indent();
    try {
      run();
    } finally {
      this.dedent();
    }
    return this;
  }
  /**
  * Returns all generated content as a single string.
  */
  toString() {
    return this.chunks.join("");
  }
}, __name(_a, "Generator"), _a);
function newGenerator() {
  return new Generator();
}
__name(newGenerator, "newGenerator");

// node_modules/@varavel/vdl-plugin-sdk/dist/utils/strings/words.js
var ACRONYM_TO_CAPITALIZED_WORD_BOUNDARY_RE = /([A-Z]+)([A-Z][a-z])/g;
var LOWERCASE_OR_DIGIT_TO_UPPERCASE_BOUNDARY_RE = /([a-z0-9])([A-Z])/g;
var NON_ALPHANUMERIC_SEQUENCE_RE = /[^A-Za-z0-9]+/g;
var WHITESPACE_SEQUENCE_RE = /\s+/;
function words(str) {
  const normalized = str.replace(ACRONYM_TO_CAPITALIZED_WORD_BOUNDARY_RE, "$1 $2").replace(LOWERCASE_OR_DIGIT_TO_UPPERCASE_BOUNDARY_RE, "$1 $2").replace(NON_ALPHANUMERIC_SEQUENCE_RE, " ").trim();
  return normalized.length === 0 ? [] : normalized.split(WHITESPACE_SEQUENCE_RE);
}
__name(words, "words");

// node_modules/@varavel/vdl-plugin-sdk/dist/utils/strings/pascal-case.js
function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}
__name(capitalize, "capitalize");
function pascalCase(str) {
  return words(str).map(capitalize).join("");
}
__name(pascalCase, "pascalCase");

// node_modules/@varavel/vdl-plugin-sdk/dist/node_modules/dedent/dist/dedent.js
function ownKeys2(object, enumerableOnly) {
  var keys = Object.keys(object);
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    enumerableOnly && (symbols = symbols.filter(function(sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    })), keys.push.apply(keys, symbols);
  }
  return keys;
}
__name(ownKeys2, "ownKeys");
function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = null != arguments[i] ? arguments[i] : {};
    i % 2 ? ownKeys2(Object(source), true).forEach(function(key) {
      _defineProperty2(target, key, source[key]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys2(Object(source)).forEach(function(key) {
      Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
    });
  }
  return target;
}
__name(_objectSpread, "_objectSpread");
function _defineProperty2(obj, key, value) {
  key = _toPropertyKey(key);
  if (key in obj) Object.defineProperty(obj, key, {
    value,
    enumerable: true,
    configurable: true,
    writable: true
  });
  else obj[key] = value;
  return obj;
}
__name(_defineProperty2, "_defineProperty");
function _toPropertyKey(arg) {
  var key = _toPrimitive(arg, "string");
  return typeof key === "symbol" ? key : String(key);
}
__name(_toPropertyKey, "_toPropertyKey");
function _toPrimitive(input, hint) {
  if (typeof input !== "object" || input === null) return input;
  var prim = input[Symbol.toPrimitive];
  if (prim !== void 0) {
    var res = prim.call(input, hint || "default");
    if (typeof res !== "object") return res;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (hint === "string" ? String : Number)(input);
}
__name(_toPrimitive, "_toPrimitive");
var dedent = createDedent({});
function createDedent(options) {
  dedent3.withOptions = (newOptions) => createDedent(_objectSpread(_objectSpread({}, options), newOptions));
  return dedent3;
  function dedent3(strings, ...values) {
    const raw = typeof strings === "string" ? [strings] : strings.raw;
    const { alignValues = false, escapeSpecialCharacters = Array.isArray(strings), trimWhitespace = true } = options;
    let result = "";
    for (let i = 0; i < raw.length; i++) {
      let next = raw[i];
      if (escapeSpecialCharacters) next = next.replace(/\\\n[ \t]*/g, "").replace(/\\`/g, "`").replace(/\\\$/g, "$").replace(/\\\{/g, "{");
      result += next;
      if (i < values.length) {
        const value = alignValues ? alignValue(values[i], result) : values[i];
        result += value;
      }
    }
    const lines = result.split("\n");
    let mindent = null;
    for (const l of lines) {
      const m = l.match(/^(\s+)\S+/);
      if (m) {
        const indent2 = m[1].length;
        if (!mindent) mindent = indent2;
        else mindent = Math.min(mindent, indent2);
      }
    }
    if (mindent !== null) {
      const m = mindent;
      result = lines.map((l) => l[0] === " " || l[0] === "	" ? l.slice(m) : l).join("\n");
    }
    if (trimWhitespace) result = result.trim();
    if (escapeSpecialCharacters) result = result.replace(/\\n/g, "\n").replace(/\\t/g, "	").replace(/\\r/g, "\r").replace(/\\v/g, "\v").replace(/\\b/g, "\b").replace(/\\f/g, "\f").replace(/\\0/g, "\0").replace(/\\x([\da-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/\\u\{([\da-fA-F]{1,6})\}/g, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/\\u([\da-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
    if (typeof Bun !== "undefined") result = result.replace(/\\u(?:\{([\da-fA-F]{1,6})\}|([\da-fA-F]{4}))/g, (_, braced, unbraced) => {
      var _ref;
      const hex = (_ref = braced !== null && braced !== void 0 ? braced : unbraced) !== null && _ref !== void 0 ? _ref : "";
      return String.fromCodePoint(parseInt(hex, 16));
    });
    return result;
  }
  __name(dedent3, "dedent");
}
__name(createDedent, "createDedent");
function alignValue(value, precedingText) {
  if (typeof value !== "string" || !value.includes("\n")) return value;
  const indentMatch = precedingText.slice(precedingText.lastIndexOf("\n") + 1).match(/^(\s+)/);
  if (indentMatch) {
    const indent2 = indentMatch[1];
    return value.replace(/\n/g, `
${indent2}`);
  }
  return value;
}
__name(alignValue, "alignValue");

// node_modules/@varavel/vdl-plugin-sdk/dist/utils/strings/dedent.js
function dedent2(input) {
  return dedent(input);
}
__name(dedent2, "dedent");

// node_modules/@varavel/vdl-plugin-sdk/dist/utils/strings/limit-blank-lines.js
var cache = /* @__PURE__ */ new Map();
function limitBlankLines(str, maxConsecutive = 0) {
  const limit = Math.max(0, maxConsecutive);
  let regex = cache.get(limit);
  if (!regex) {
    regex = new RegExp(`(\\r?\\n\\s*){${limit + 2},}`, "g");
    cache.set(limit, regex);
  }
  return str.replace(regex, "\n".repeat(limit + 1));
}
__name(limitBlankLines, "limitBlankLines");

// src/stages/emit/shared/helpers.ts
function createGoFile(path, header, body) {
  let content = "";
  content = joinSections([header, body]);
  content = limitBlankLines(content, 1);
  return {
    path,
    content
  };
}
__name(createGoFile, "createGoFile");
function joinSections(sections) {
  return `${sections.filter(Boolean).join("\n\n").trim()}
`;
}
__name(joinSections, "joinSections");
function indent(value, depth = 1) {
  const prefix = "	".repeat(depth);
  return value.split("\n").map((line) => line.length > 0 ? `${prefix}${line}` : line).join("\n");
}
__name(indent, "indent");

// src/stages/emit/shared/renderers.ts
function renderGoString(value) {
  return JSON.stringify(value);
}
__name(renderGoString, "renderGoString");
function renderAnnotationsLiteral(annotations) {
  if (annotations.length === 0) {
    return "[]Annotation{}";
  }
  const items = annotations.map((annotation) => {
    return [
      "{",
      indent(
        [
          `Name: ${renderGoString(annotation.name)},`,
          `Argument: ${renderLiteralValue(annotation.argument)},`
        ].join("\n")
      ),
      "},"
    ].join("\n");
  });
  return ["[]Annotation{", indent(items.join("\n")), "}"].join("\n");
}
__name(renderAnnotationsLiteral, "renderAnnotationsLiteral");
function renderLiteralValue(value) {
  var _a2, _b, _c, _d, _e;
  if (!value) {
    return "nil";
  }
  switch (value.kind) {
    case "string":
      return renderGoString((_a2 = value.stringValue) != null ? _a2 : "");
    case "int":
      return `int64(${(_b = value.intValue) != null ? _b : 0})`;
    case "float":
      return `float64(${String((_c = value.floatValue) != null ? _c : 0)})`;
    case "bool":
      return value.boolValue ? "true" : "false";
    case "array":
      return renderArrayLiteral((_d = value.arrayItems) != null ? _d : []);
    case "object":
      return renderObjectLiteral((_e = value.objectEntries) != null ? _e : []);
    default:
      return "nil";
  }
}
__name(renderLiteralValue, "renderLiteralValue");
function renderArrayLiteral(items) {
  if (items.length === 0) {
    return "[]any{}";
  }
  return [
    "[]any{",
    indent(items.map((item) => `${renderLiteralValue(item)},`).join("\n")),
    "}"
  ].join("\n");
}
__name(renderArrayLiteral, "renderArrayLiteral");
function renderObjectLiteral(entries) {
  if (entries.length === 0) {
    return "map[string]any{}";
  }
  return [
    "map[string]any{",
    indent(
      entries.map(
        (entry) => `${renderGoString(entry.key)}: ${renderLiteralValue(entry.value)},`
      ).join("\n")
    ),
    "}"
  ].join("\n");
}
__name(renderObjectLiteral, "renderObjectLiteral");
function renderCommentBlock(options) {
  const lines = [options.summary];
  if (options.doc) {
    lines.push("", ...options.doc.split("\n"));
  }
  if (options.deprecated !== void 0) {
    const description = options.deprecated.length > 0 ? options.deprecated : "This symbol is deprecated and should not be used in new code.";
    lines.push("", `Deprecated: ${description}`);
  }
  return lines.map((line) => `// ${line}`).join("\n");
}
__name(renderCommentBlock, "renderCommentBlock");

// src/stages/emit/shared/catalog.ts
var CATALOG_HEADER = dedent2(
  /* go */
  `
  // -----------------------------------------------------------------------------
  // RPC Catalog
  // -----------------------------------------------------------------------------
`
);
function renderCatalog(context) {
  return joinSections([
    CATALOG_HEADER,
    renderPathCatalog(context.services),
    renderOperationCatalog("VDLProcedures", context.procedures),
    renderOperationCatalog("VDLStreams", context.streams)
  ]);
}
__name(renderCatalog, "renderCatalog");
function renderOperationCatalog(constName, operations) {
  const summary = constName === "VDLProcedures" ? "VDLProcedures contains every generated procedure definition." : "VDLStreams contains every generated stream definition.";
  if (operations.length === 0) {
    const g2 = newGenerator();
    g2.line(renderCommentBlock({ summary }));
    g2.line(`var ${constName} = []OperationDefinition{}`);
    return g2.toString();
  }
  const entries = operations.map((operation) => {
    const g2 = newGenerator();
    g2.line("{");
    g2.block(() => {
      g2.line(`RPCName: ${renderGoString(operation.rpcName)},`);
      g2.line(`Name: ${renderGoString(operation.name)},`);
      g2.line(
        `Type: ${operation.kind === "proc" ? "OperationTypeProc" : "OperationTypeStream"},`
      );
      g2.line(
        `Annotations: ${renderAnnotationsLiteral(operation.annotations)},`
      );
    });
    g2.line("},");
    return g2.toString().trim();
  });
  const g = newGenerator();
  g.line(renderCommentBlock({ summary }));
  g.line(`var ${constName} = []OperationDefinition{`);
  g.block(() => {
    for (const entry of entries) {
      g.line(entry);
    }
  });
  g.line("}");
  return g.toString();
}
__name(renderOperationCatalog, "renderOperationCatalog");
function renderPathCatalog(services) {
  const g = newGenerator();
  g.line(
    renderCommentBlock({
      summary: "VDLPaths contains the generated path catalog for every procedure and stream."
    })
  );
  g.line("var VDLPaths = struct {");
  g.block(() => {
    for (const service of services) {
      g.line(`${service.goName} struct {`);
      g.block(() => {
        for (const operation of service.operations) {
          g.line(`${operation.goName} string`);
        }
      });
      g.line("}");
    }
  });
  g.line("}{");
  g.block(() => {
    for (const service of services) {
      g.line(`${service.goName}: struct {`);
      g.block(() => {
        for (const operation of service.operations) {
          g.line(`${operation.goName} string`);
        }
      });
      g.line("}{");
      g.block(() => {
        for (const operation of service.operations) {
          g.line(
            `${operation.goName}: ${renderGoString(`/${service.name}/${operation.name}`)},`
          );
        }
      });
      g.line("},");
    }
  });
  g.line("}");
  return joinSections([g.toString()]);
}
__name(renderPathCatalog, "renderPathCatalog");

// src/stages/emit/shared/runtime.ts
function renderCoreRuntime() {
  return dedent2(
    /* go */
    `
    // -----------------------------------------------------------------------------
    // RPC Core Types
    // -----------------------------------------------------------------------------

    // OperationType identifies the transport behavior of an RPC operation and can
    // be proc or stream.
    type OperationType string

    const (
      // OperationTypeProc identifies a request-response procedure.
      OperationTypeProc OperationType = "proc"
      // OperationTypeStream identifies a Server-Sent Events stream.
      OperationTypeStream OperationType = "stream"
    )

    // Annotation represents operation-level annotation metadata preserved from VDL.
    type Annotation struct {
      // Name is the annotation identifier without the @ prefix.
      Name string
      // Argument contains the resolved annotation payload when one was declared.
      Argument any
    }

    // OperationDefinition describes a generated procedure or stream.
    type OperationDefinition struct {
      // RPCName is the VDL service name that owns the operation.
      RPCName string
      // Name is the VDL field name of the operation.
      Name string
      // Type indicates whether the operation is a procedure or a stream.
      Type OperationType
      // Annotations contains every non-marker annotation declared on the operation.
      Annotations []Annotation
    }

    // Path returns the transport path used by the generated client and server.
    func (o OperationDefinition) Path() string {
      return "/" + o.RPCName + "/" + o.Name
    }

    // cloneAnnotations returns a shallow copy of the given annotations slice.
    func cloneAnnotations(annotations []Annotation) []Annotation {
      if len(annotations) == 0 {
        return nil
      }
      clone := make([]Annotation, len(annotations))
      copy(clone, annotations)
      return clone
    }

    // Void represents the absence of an input or output payload.
    type Void struct{}

    // Response represents the response of a VDL call.
    type Response[T any] struct {
      Ok     bool  \`json:"ok"\`
      Output T     \`json:"output,omitempty,omitzero"\`
      Error  Error \`json:"error,omitzero"\`
    }

    // Write writes the response as JSON to the provided writer.
    func (r Response[T]) Write(w io.Writer) error {
      return json.NewEncoder(w).Encode(r)
    }

    // String returns the response as a JSON string.
    func (r Response[T]) String() string {
      encoded, err := json.Marshal(r)
      if err != nil {
        return fmt.Sprintf(\`{"ok":false,"error":{"message":%q}}\`, "failed to marshal response: "+err.Error())
      }
      return string(encoded)
    }

    // Bytes returns the response as a JSON byte slice.
    func (r Response[T]) Bytes() []byte {
      return []byte(r.String())
    }

    // Error represents a standardized error in the VDL system.
    //
    // It provides structured information about errors that occur within the system,
    // enabling consistent error handling across servers and clients.
    //
    // Fields:
    //   - Message: A human-readable description of the error.
    //   - Category: Optional. Categorizes the error by its nature or source (e.g., "ValidationError", "DatabaseError").
    //   - Code: Optional. A machine-readable identifier for the specific error condition (e.g., "INVALID_EMAIL").
    //   - Details: Optional. Additional information about the error.
    //
    // The struct implements the error interface.
    type Error struct {
      // Message provides a human-readable description of the error.
      //
      // This message can be displayed to end-users or used for logging and debugging purposes.
      //
      // Use Cases:
      //   1. Message can be directly shown to the user to inform them of the issue.
      //   2. Developers can use Message in logs to diagnose problems during development or in production.
      Message string \`json:"message"\`
      // Category categorizes the error by its nature or source.
      //
      // Examples:
      //   - "ValidationError" for input validation errors.
      //   - "DatabaseError" for errors originating from database operations.
      //   - "AuthenticationError" for authentication-related issues.
      //
      // Use Cases:
      //   1. In middleware, you can use Category to determine how to handle the error.
      //      For instance, you might log "InternalError" types and return a generic message to the client.
      //   2. Clients can inspect the Category to decide whether to prompt the user for action,
      //      such as re-authentication if the Category is "AuthenticationError".
      Category string \`json:"category,omitzero"\`
      // Code is a machine-readable identifier for the specific error condition.
      //
      // Examples:
      //   - "INVALID_EMAIL" when an email address fails validation.
      //   - "USER_NOT_FOUND" when a requested user does not exist.
      //   - "RATE_LIMIT_EXCEEDED" when a client has made too many requests.
      //
      // Use Cases:
      //   1. Clients can map Codes to localized error messages for internationalization (i18n),
      //      displaying appropriate messages based on the user's language settings.
      //   2. Clients or middleware can implement specific logic based on the Code,
      //      such as retry mechanisms for "TEMPORARY_FAILURE" or showing captcha for "RATE_LIMIT_EXCEEDED".
      Code string \`json:"code,omitzero"\`
      // Details contains optional additional information about the error.
      //
      // This field can include any relevant data that provides more context about the error.
      // The contents should be serializable to JSON.
      //
      // Use Cases:
      //   1. Providing field-level validation errors, e.g., Details could be:
      //      {"fields": {"email": "Email is invalid", "password": "Password is too short"}}
      //   2. Including diagnostic information such as timestamps, request IDs, or stack traces
      //      (ensure sensitive information is not exposed to clients).
      Details map[string]any \`json:"details,omitempty"\`
    }

    // Error implements the standard error interface.
    func (e Error) Error() string {
      return e.Message
    }

    // String implements fmt.Stringer.
    func (e Error) String() string {
      return e.Message
    }

    // Is reports whether the target error matches this error.
    //
    // It checks if the target is of type Error (or *Error) and compares
    // their Code and Message fields.
    //
    // Matching Logic:
    //  1. If both errors have a Code, they match if the Codes are identical.
    //  2. If one or both lack a Code, they match if the Messages are identical.
    //  3. Details and Category are ignored for comparison to avoid issues with non-comparable map types.
    func (e Error) Is(target error) bool {
      var t Error
      switch err := target.(type) {
      case Error:
        t = err
      case *Error:
        t = *err
      default:
        return false
      }
      if e.Code != "" && t.Code != "" {
        return e.Code == t.Code
      }
      return e.Message == t.Message
    }

    // ToJSON returns the Error as a JSON-formatted string including all its fields.
    // This is useful for logging and debugging purposes.
    func (e Error) ToJSON() string {
      b, err := json.Marshal(e)
      if err != nil {
        return fmt.Sprintf(
          \`{"message":%q,"details":{"message":%q}}\`,
          "failed to marshal VDL Error: "+err.Error(), e.Message,
        )
      }
      return string(b)
    }

    // ToError converts any error into an Error.
    //
    // If the provided error is already a Error, it returns it as is.
    // Otherwise, it wraps the error message into a new Error.
    //
    // This function ensures that all errors conform to the Error structure,
    // facilitating consistent error handling across the system.
    func ToError(err error) Error {
      switch e := err.(type) {
      case Error:
        return e
      case *Error:
        return *e
      default:
        return Error{
          Message: err.Error(),
        }
      }
    }
  `
  );
}
__name(renderCoreRuntime, "renderCoreRuntime");

// src/stages/emit/files/client/runtime.ts
var CLIENT_RUNTIME = dedent2(
  /* go */
  `
	// -----------------------------------------------------------------------------
	// Client Types
	// -----------------------------------------------------------------------------

	// RequestInfo contains information about the RPC request currently being executed.
	//
	// It is passed through interceptors and retry/reconnect deciders so callers can
	// inspect the targeted RPC, operation, request payload, transport mode, and the
	// non-marker annotations declared on the VDL operation.
	type RequestInfo struct {
		RPCName string
		OperationName string
		Input any
		Type OperationType
		Annotations []Annotation
	}

	// RetryDecisionContext contains the information passed to a retry decider.
	//
	// The generated client evaluates this context after each failed attempt so
	// callers can decide whether the request should be retried.
	type RetryDecisionContext struct {
		Request RequestInfo
		Attempt int
		ResponseStatus int
		Error error
	}

	// RetryDecider determines whether a failed procedure attempt should be retried.
	type RetryDecider func(ctx context.Context, info RetryDecisionContext) bool

	// RetryConfig defines retry behavior for generated procedure calls.
	//
	// Parameters:
	//   - MaxAttempts: Maximum number of retry attempts (default: 1)
	//   - InitialDelay: Initial delay between retries (default: 0)
	//   - MaxDelay: Maximum delay between retries (default: 0)
	//   - DelayMultiplier: Cumulative multiplier applied to InitialDelay on each retry (default: 1.0)
	//   - Jitter: Randomness factor used to avoid synchronized retries (default: 0.2)
	//   - ShouldRetry: Optional callback that can override the default retry decision function
	type RetryConfig struct {
		MaxAttempts int
		InitialDelay time.Duration
		MaxDelay time.Duration
		DelayMultiplier float64
		Jitter float64
		ShouldRetry RetryDecider
	}

	// TimeoutConfig defines timeout behavior for procedure calls.
	type TimeoutConfig struct {
		// Request Timeout (default: 30 seconds)
		Timeout time.Duration
	}

	// ReconnectDecisionContext contains the information passed to a reconnect decider.
	//
	// The generated client evaluates this context after a stream connection fails or
	// breaks unexpectedly so callers can decide whether the stream should reconnect.
	type ReconnectDecisionContext struct {
		Request RequestInfo
		Attempt int
		ResponseStatus int
		Error error
	}

	// ReconnectDecider determines whether a failed stream connection should reconnect.
	type ReconnectDecider func(ctx context.Context, info ReconnectDecisionContext) bool

	// ReconnectConfig defines reconnection behavior for generated stream calls.
	//
	// Parameters:
	//   - MaxAttempts: Maximum number of reconnection attempts (default: 30)
	//   - InitialDelay: Initial delay between reconnection attempts (default: 1 second)
	//   - MaxDelay: Maximum delay between reconnection attempts (default: 30 seconds)
	//   - DelayMultiplier: Cumulative multiplier applied to InitialDelay on each retry (default: 1.5)
	//   - Jitter: Randomness factor used to avoid synchronized reconnects (default: 0.2)
	//   - ShouldReconnect: Optional callback that can override the default reconnect decision function
	type ReconnectConfig struct {
		MaxAttempts int
		InitialDelay time.Duration
		MaxDelay time.Duration
		DelayMultiplier float64
		Jitter float64
		ShouldReconnect ReconnectDecider
	}

	// HeaderProvider receives the current headers and mutates them in place.
	//
	// It is called before every request, including retries and stream reconnects.
	// If an error is returned, the request is aborted.
	type HeaderProvider func(ctx context.Context, h http.Header) error

	// Invoker is the final step in the interceptor chain that performs the actual request.
	type Invoker func(ctx context.Context, req RequestInfo) (Response[json.RawMessage], error)

	// Interceptor is middleware that wraps request execution.
	type Interceptor func(ctx context.Context, req RequestInfo, next Invoker) (Response[json.RawMessage], error)

  // -----------------------------------------------------------------------------
  // Internal Client Implementation
  // -----------------------------------------------------------------------------

	// internalClient is the core engine used by the generated client abstraction.
	//
	// It is safe for concurrent use and can be reused across procedure calls and
	// stream subscriptions. The zero value is not usable; use newInternalClient.
	//
	// The zero value is not usable \u2013 use newInternalClient to construct one.
	type internalClient struct {
		// Immutable after construction.
		baseURL string
		httpClient *http.Client
		operationDefs map[string]map[string]OperationDefinition

		// Dynamic components
		headerProviders []HeaderProvider
		interceptors []Interceptor

		// RPC specific header providers
		rpcHeaderProviders map[string][]HeaderProvider

		// Default Configurations
		globalRetryConf *RetryConfig
		globalTimeoutConf *TimeoutConfig
		globalReconnectConf *ReconnectConfig
		globalMaxMessageSize int64

		// Per-RPC Default Configurations
		rpcRetryConf map[string]*RetryConfig
		rpcTimeoutConf map[string]*TimeoutConfig
		rpcReconnectConf map[string]*ReconnectConfig
		rpcMaxMessageSize map[string]int64

		// mu protects concurrent access to the configuration maps
		mu sync.RWMutex
	}

	// internalClientOption configures an internal client during construction.
	type internalClientOption func(*internalClient)

	// withHTTPClient supplies a custom HTTP client implementation.
	func withHTTPClient(client *http.Client) internalClientOption {
		return func(value *internalClient) {
			if client != nil {
				value.httpClient = client
			}
		}
	}

	// withGlobalHeader registers a static header for every request.
	func withGlobalHeader(key string, value string) internalClientOption {
		return func(client *internalClient) {
			client.headerProviders = append(client.headerProviders, func(_ context.Context, h http.Header) error {
				h.Set(key, value)
				return nil
			})
		}
	}

	// withHeaderProvider registers a dynamic header provider.
	func withHeaderProvider(provider HeaderProvider) internalClientOption {
		return func(client *internalClient) {
			client.headerProviders = append(client.headerProviders, provider)
		}
	}

	// withInterceptor adds a transport interceptor.
	func withInterceptor(interceptor Interceptor) internalClientOption {
		return func(client *internalClient) {
			client.interceptors = append(client.interceptors, interceptor)
		}
	}

	// withGlobalRetryConfig sets the global default retry configuration.
	func withGlobalRetryConfig(conf RetryConfig) internalClientOption {
		return func(client *internalClient) {
			client.globalRetryConf = &conf
		}
	}

	// withGlobalTimeoutConfig sets the global default timeout configuration.
	func withGlobalTimeoutConfig(conf TimeoutConfig) internalClientOption {
		return func(client *internalClient) {
			client.globalTimeoutConf = &conf
		}
	}

	// withGlobalReconnectConfig sets the global default reconnection configuration.
	func withGlobalReconnectConfig(conf ReconnectConfig) internalClientOption {
		return func(client *internalClient) {
			client.globalReconnectConf = &conf
		}
	}

	// withGlobalMaxMessageSize sets the global maximum message size for streams.
	func withGlobalMaxMessageSize(size int64) internalClientOption {
		return func(client *internalClient) {
			client.globalMaxMessageSize = size
		}
	}

	// newInternalClient creates a new internalClient capable of talking to the VDL server.
	//
	// The caller can optionally pass functional options to customize transport
	// behavior, headers, interceptors, and retry/reconnect policies.
	func newInternalClient(baseURL string, procDefs []OperationDefinition, streamDefs []OperationDefinition, opts ...internalClientOption) *internalClient {
		operationDefs := make(map[string]map[string]OperationDefinition)

		ensureRPC := func(rpcName string) {
			if _, ok := operationDefs[rpcName]; !ok {
				operationDefs[rpcName] = make(map[string]OperationDefinition)
			}
		}

		for _, def := range procDefs {
			ensureRPC(def.RPCName)
			operationDefs[def.RPCName][def.Name] = def
		}

		for _, def := range streamDefs {
			ensureRPC(def.RPCName)
			operationDefs[def.RPCName][def.Name] = def
		}

		client := &internalClient{
			baseURL: strings.TrimRight(baseURL, "/"),
			httpClient: http.DefaultClient,
			operationDefs: operationDefs,
			headerProviders: []HeaderProvider{},
			interceptors: []Interceptor{},
			rpcHeaderProviders: make(map[string][]HeaderProvider),
			rpcRetryConf: make(map[string]*RetryConfig),
			rpcTimeoutConf: make(map[string]*TimeoutConfig),
			rpcReconnectConf: make(map[string]*ReconnectConfig),
			rpcMaxMessageSize: make(map[string]int64),
		}

		// Apply functional options.
		for _, opt := range opts {
			opt(client)
		}

		return client
	}

	// setRPCRetryConfig sets the default retry configuration for a specific RPC service.
	func (c *internalClient) setRPCRetryConfig(rpcName string, conf RetryConfig) {
		c.mu.Lock()
		defer c.mu.Unlock()
		c.rpcRetryConf[rpcName] = &conf
	}

	// setRPCTimeoutConfig sets the default timeout configuration for a specific RPC service.
	func (c *internalClient) setRPCTimeoutConfig(rpcName string, conf TimeoutConfig) {
		c.mu.Lock()
		defer c.mu.Unlock()
		c.rpcTimeoutConf[rpcName] = &conf
	}

	// setRPCReconnectConfig sets the default reconnect configuration for a specific RPC service.
	func (c *internalClient) setRPCReconnectConfig(rpcName string, conf ReconnectConfig) {
		c.mu.Lock()
		defer c.mu.Unlock()
		c.rpcReconnectConf[rpcName] = &conf
	}

	// setRPCMaxMessageSize sets the default maximum stream message size for a specific RPC service.
	func (c *internalClient) setRPCMaxMessageSize(rpcName string, size int64) {
		c.mu.Lock()
		defer c.mu.Unlock()
		c.rpcMaxMessageSize[rpcName] = size
	}

	// setRPCHeaderProvider adds a header provider for a specific RPC service.
	func (c *internalClient) setRPCHeaderProvider(rpcName string, provider HeaderProvider) {
		c.mu.Lock()
		defer c.mu.Unlock()
		c.rpcHeaderProviders[rpcName] = append(c.rpcHeaderProviders[rpcName], provider)
	}

	// mergeRetryConfig resolves retry configuration using this precedence:
	// operation override > RPC override > global override > default.
	func (c *internalClient) mergeRetryConfig(rpcName string, opConf *RetryConfig) *RetryConfig {
		if opConf != nil {
			return opConf
		}
		c.mu.RLock()
		defer c.mu.RUnlock()
		if rpcConf, ok := c.rpcRetryConf[rpcName]; ok {
			return rpcConf
		}
		if c.globalRetryConf != nil {
			return c.globalRetryConf
		}
		return &RetryConfig{
			MaxAttempts: 1,
			InitialDelay: 0,
			MaxDelay: 0,
			DelayMultiplier: 1.0,
			Jitter: 0.2,
		}
	}

	// mergeTimeoutConfig resolves timeout configuration using this precedence:
	// operation override > RPC override > global override > default.
	func (c *internalClient) mergeTimeoutConfig(rpcName string, opConf *TimeoutConfig) *TimeoutConfig {
		if opConf != nil {
			return opConf
		}
		c.mu.RLock()
		defer c.mu.RUnlock()

		if rpcConf, ok := c.rpcTimeoutConf[rpcName]; ok {
			return rpcConf
		}
		if c.globalTimeoutConf != nil {
			return c.globalTimeoutConf
		}
		return &TimeoutConfig{Timeout: 30 * time.Second}
	}

	// mergeReconnectConfig resolves reconnect configuration using this precedence:
	// operation override > RPC override > global override > default.
	func (c *internalClient) mergeReconnectConfig(rpcName string, opConf *ReconnectConfig) *ReconnectConfig {
		if opConf != nil {
			return opConf
		}
		c.mu.RLock()
		defer c.mu.RUnlock()
		if rpcConf, ok := c.rpcReconnectConf[rpcName]; ok {
			return rpcConf
		}
		if c.globalReconnectConf != nil {
			return c.globalReconnectConf
		}
		return &ReconnectConfig{
			MaxAttempts: 30,
			InitialDelay: time.Second,
			MaxDelay: 30 * time.Second,
			DelayMultiplier: 1.5,
			Jitter: 0.2,
		}
	}

	// mergeMaxMessageSize resolves the maximum stream message size using this precedence:
	// operation override > RPC override > global override > default.
	func (c *internalClient) mergeMaxMessageSize(rpcName string, opSize int64) int64 {
		if opSize > 0 {
			return opSize
		}
		c.mu.RLock()
		defer c.mu.RUnlock()
		if rpcSize, ok := c.rpcMaxMessageSize[rpcName]; ok && rpcSize > 0 {
			return rpcSize
		}
		if c.globalMaxMessageSize > 0 {
			return c.globalMaxMessageSize
		}
		return 4 * 1024 * 1024
	}

	// executeChain builds the interceptor chain and executes the final invoker.
	func (c *internalClient) executeChain(ctx context.Context, req RequestInfo, final Invoker) (Response[json.RawMessage], error) {
		chain := final
		for index := len(c.interceptors) - 1; index >= 0; index-- {
			middleware := c.interceptors[index]
			next := chain
			chain = func(callCtx context.Context, callReq RequestInfo) (Response[json.RawMessage], error) {
				return middleware(callCtx, callReq, next)
			}
		}
		return chain(ctx, req)
	}

	// lookupOperation returns the generated operation definition for the requested RPC member.
	func (c *internalClient) lookupOperation(rpcName string, operationName string) (OperationDefinition, bool) {
		if operations, ok := c.operationDefs[rpcName]; ok {
			operation, ok := operations[operationName]
			return operation, ok
		}
		return OperationDefinition{}, false
	}

	// proc invokes the given procedure and returns the raw wire envelope.
	func (c *internalClient) proc(
		ctx context.Context, 
		rpcName string, 
		procName string, 
		input any, 
		opHeaderProviders []HeaderProvider, 
		opRetryConf *RetryConfig,
		opTimeoutConf *TimeoutConfig,
	) Response[json.RawMessage] {
		operation, ok := c.lookupOperation(rpcName, procName)
		if !ok {
			return Response[json.RawMessage]{
				Ok: false,
				Error: Error{
					Category: "ClientError",
					Code: "INVALID_PROC",
					Message: fmt.Sprintf("%s.%s procedure not found in schema", rpcName, procName),
					Details: map[string]any{"rpc": rpcName, "procedure": procName},
				},
			}
		}

		reqInfo := RequestInfo{
			RPCName: rpcName,
			OperationName: procName,
			Input: input,
			Type: OperationTypeProc,
			Annotations: cloneAnnotations(operation.Annotations),
		}

		invoker := func(callCtx context.Context, req RequestInfo) (Response[json.RawMessage], error) {
			retryConf := c.mergeRetryConfig(req.RPCName, opRetryConf)
			timeoutConf := c.mergeTimeoutConfig(req.RPCName, opTimeoutConf)
			maxAttempts := retryConf.MaxAttempts
			if maxAttempts < 1 {
				maxAttempts = 1
			}

			payload, err := encodeRequestPayload(req.Input)
			if err != nil {
				return Response[json.RawMessage]{
					Ok: false,
					Error: Error{
						Category: "ClientError",
						Code: "ENCODE_INPUT",
						Message: fmt.Sprintf("failed to marshal input for %s.%s: %v", req.RPCName, req.OperationName, err),
					},
				}, nil
			}

			url := fmt.Sprintf("%s/%s/%s", c.baseURL, req.RPCName, req.OperationName)
			var last Response[json.RawMessage]

			for attempt := 1; attempt <= maxAttempts; attempt++ {
				attemptCtx := callCtx
				var cancel context.CancelFunc
				if timeoutConf.Timeout > 0 {
					attemptCtx, cancel = context.WithTimeout(callCtx, timeoutConf.Timeout)
				}

				res, defaultRetry, statusCode, decisionErr := c.doRequest(attemptCtx, req, url, payload, opHeaderProviders)
				if cancel != nil {
					cancel()
				}

				last = res
				shouldRetry := defaultRetry
				if retryConf.ShouldRetry != nil {
					shouldRetry = retryConf.ShouldRetry(callCtx, RetryDecisionContext{
						Request: req,
						Attempt: attempt,
						ResponseStatus: statusCode,
						Error: decisionErr,
					})
				}

				if !shouldRetry || attempt >= maxAttempts {
					return res, nil
				}

				if err := waitForBackoff(callCtx, calculateBackoff(retryConf, attempt)); err != nil {
					return Response[json.RawMessage]{Ok: false, Error: ToError(err)}, nil
				}
			}

			return last, nil
		}

		res, err := c.executeChain(ctx, reqInfo, invoker)
		if err != nil {
			return Response[json.RawMessage]{Ok: false, Error: ToError(err)}
		}

		return res
	}

	// doRequest performs a single HTTP request attempt.
	func (c *internalClient) doRequest(
		ctx context.Context, 
		req RequestInfo, 
		url string, 
		payload []byte, 
		opHeaderProviders []HeaderProvider,
	) (Response[json.RawMessage], bool, int, error) {
		httpRequest, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(payload))
		if err != nil {
			wrapped := fmt.Errorf("failed to create HTTP request: %w", err)
			return Response[json.RawMessage]{Ok: false, Error: ToError(wrapped)}, false, 0, wrapped
		}

		httpRequest.Header.Set("Content-Type", "application/json")
		httpRequest.Header.Set("Accept", "application/json")

		if err := c.applyHeaderProviders(ctx, req.RPCName, httpRequest.Header, opHeaderProviders); err != nil {
			wrapped := fmt.Errorf("failed to apply headers: %w", err)
			return Response[json.RawMessage]{Ok: false, Error: ToError(wrapped)}, false, 0, wrapped
		}

		response, err := c.httpClient.Do(httpRequest)
		if err != nil {
			if errors.Is(ctx.Err(), context.Canceled) {
				wrapped := context.Canceled
				return Response[json.RawMessage]{Ok: false, Error: ToError(wrapped)}, false, 0, wrapped
			}

			if errors.Is(ctx.Err(), context.DeadlineExceeded) {
				timeoutErr := Error{
					Category: "TimeoutError",
					Code: "REQUEST_TIMEOUT",
					Message: "Request timeout",
				}
				return Response[json.RawMessage]{Ok: false, Error: timeoutErr}, true, 0, timeoutErr
			}

			wrapped := fmt.Errorf("http request failed: %w", err)
			return Response[json.RawMessage]{Ok: false, Error: ToError(wrapped)}, true, 0, wrapped
		}
		defer response.Body.Close()

		if response.StatusCode >= 500 {
			httpErr := Error{
				Category: "HTTPError",
				Code: "BAD_STATUS",
				Message: fmt.Sprintf("unexpected HTTP status: %s", response.Status),
				Details: map[string]any{"status": response.StatusCode},
			}
			return Response[json.RawMessage]{Ok: false, Error: httpErr}, true, response.StatusCode, httpErr
		}

		if response.StatusCode < 200 || response.StatusCode >= 300 {
			httpErr := Error{
				Category: "HTTPError",
				Code: "BAD_STATUS",
				Message: fmt.Sprintf("unexpected HTTP status: %s", response.Status),
				Details: map[string]any{"status": response.StatusCode},
			}
			return Response[json.RawMessage]{Ok: false, Error: httpErr}, false, response.StatusCode, httpErr
		}

		var raw struct {
			Ok bool \`json:"ok"\`
			Output json.RawMessage \`json:"output"\`
			Error Error \`json:"error"\`
		}

		if err := json.NewDecoder(response.Body).Decode(&raw); err != nil {
			wrapped := fmt.Errorf("failed to decode VDL response: %w", err)
			return Response[json.RawMessage]{Ok: false, Error: ToError(wrapped)}, false, response.StatusCode, wrapped
		}

		if !raw.Ok {
			return Response[json.RawMessage]{Ok: false, Error: raw.Error}, false, response.StatusCode, raw.Error
		}

		return Response[json.RawMessage]{Ok: true, Output: raw.Output}, false, response.StatusCode, nil
	}

	// applyHeaderProviders applies global, RPC-scoped, and per-operation header providers in order.
	func (c *internalClient) applyHeaderProviders(ctx context.Context, rpcName string, header http.Header, opHeaderProviders []HeaderProvider) error {
		for _, provider := range c.headerProviders {
			if err := provider(ctx, header); err != nil {
				return fmt.Errorf("global header provider failed: %w", err)
			}
		}

		c.mu.RLock()
		rpcProviders := append([]HeaderProvider(nil), c.rpcHeaderProviders[rpcName]...)
		c.mu.RUnlock()

		for _, provider := range rpcProviders {
			if err := provider(ctx, header); err != nil {
				return fmt.Errorf("rpc header provider failed: %w", err)
			}
		}

		for _, provider := range opHeaderProviders {
			if err := provider(ctx, header); err != nil {
				return fmt.Errorf("operation header provider failed: %w", err)
			}
		}

		return nil
	}

	// stream establishes a Server-Sent Events subscription for the given stream.
	func (c *internalClient) stream(ctx context.Context, rpcName string, streamName string, input any, opHeaderProviders []HeaderProvider, opReconnectConf *ReconnectConfig, opMaxMessageSize int64, onConnect func(), onDisconnect func(error), onReconnect func(int, time.Duration)) <-chan Response[json.RawMessage] {
		events := make(chan Response[json.RawMessage], 1)

		operation, ok := c.lookupOperation(rpcName, streamName)
		if !ok {
			errValue := Error{
				Category: "ClientError",
				Code: "INVALID_STREAM",
				Message: fmt.Sprintf("%s.%s stream not found in schema", rpcName, streamName),
				Details: map[string]any{"rpc": rpcName, "stream": streamName},
			}
			events <- Response[json.RawMessage]{
				Ok: false,
				Error: errValue,
			}
			close(events)
			if onDisconnect != nil {
				onDisconnect(errValue)
			}
			return events
		}

		reqInfo := RequestInfo{
			RPCName: rpcName,
			OperationName: streamName,
			Input: input,
			Type: OperationTypeStream,
			Annotations: cloneAnnotations(operation.Annotations),
		}

		invoker := func(callCtx context.Context, req RequestInfo) (Response[json.RawMessage], error) {
			reconnectConf := c.mergeReconnectConfig(req.RPCName, opReconnectConf)
			maxMessageSize := c.mergeMaxMessageSize(req.RPCName, opMaxMessageSize)
			payload, err := encodeRequestPayload(req.Input)
			if err != nil {
				errValue := ToError(fmt.Errorf("failed to marshal input for %s.%s: %w", req.RPCName, req.OperationName, err))
				events <- Response[json.RawMessage]{Ok: false, Error: errValue}
				close(events)
				if onDisconnect != nil {
					onDisconnect(errValue)
				}
				return Response[json.RawMessage]{Ok: false, Error: errValue}, nil
			}

			url := fmt.Sprintf("%s/%s/%s", c.baseURL, req.RPCName, req.OperationName)

			go func() {
				defer close(events)
				var finalErr error
				defer func() {
					if onDisconnect != nil {
						onDisconnect(finalErr)
					}
				}()

				reconnectAttempt := 0
				for {
					if callCtx.Err() != nil {
						finalErr = callCtx.Err()
						return
					}

					httpRequest, err := http.NewRequestWithContext(callCtx, http.MethodPost, url, bytes.NewReader(payload))
					if err != nil {
						finalErr = err
						events <- Response[json.RawMessage]{Ok: false, Error: ToError(err)}
						return
					}

					httpRequest.Header.Set("Content-Type", "application/json")
					httpRequest.Header.Set("Accept", "text/event-stream")

					if err := c.applyHeaderProviders(callCtx, req.RPCName, httpRequest.Header, opHeaderProviders); err != nil {
						finalErr = err
						events <- Response[json.RawMessage]{Ok: false, Error: ToError(err)}
						return
					}

					response, err := c.httpClient.Do(httpRequest)
					if err != nil {
						shouldReconnect := true
						if reconnectConf.ShouldReconnect != nil {
							shouldReconnect = reconnectConf.ShouldReconnect(callCtx, ReconnectDecisionContext{
								Request: req,
								Attempt: reconnectAttempt + 1,
								ResponseStatus: 0,
								Error: err,
							})
						}

						if shouldReconnect && reconnectAttempt < reconnectConf.MaxAttempts {
							reconnectAttempt++
							delay := calculateReconnectBackoff(reconnectConf, reconnectAttempt)
							if onReconnect != nil {
								onReconnect(reconnectAttempt, delay)
							}
							if waitErr := waitForBackoff(callCtx, delay); waitErr != nil {
								finalErr = waitErr
								return
							}
							continue
						}

						finalErr = err
						events <- Response[json.RawMessage]{Ok: false, Error: ToError(err)}
						return
					}

					if response.StatusCode >= 500 {
						httpErr := Error{
							Category: "HTTPError",
							Code: "BAD_STATUS",
							Message: fmt.Sprintf("unexpected HTTP status: %s", response.Status),
							Details: map[string]any{"status": response.StatusCode},
						}

						shouldReconnect := true
						if reconnectConf.ShouldReconnect != nil {
							shouldReconnect = reconnectConf.ShouldReconnect(callCtx, ReconnectDecisionContext{
								Request: req,
								Attempt: reconnectAttempt + 1,
								ResponseStatus: response.StatusCode,
								Error: httpErr,
							})
						}
						response.Body.Close()

						if shouldReconnect && reconnectAttempt < reconnectConf.MaxAttempts {
							reconnectAttempt++
							delay := calculateReconnectBackoff(reconnectConf, reconnectAttempt)
							if onReconnect != nil {
								onReconnect(reconnectAttempt, delay)
							}
							if waitErr := waitForBackoff(callCtx, delay); waitErr != nil {
								finalErr = waitErr
								return
							}
							continue
						}

						finalErr = httpErr
						events <- Response[json.RawMessage]{Ok: false, Error: httpErr}
						return
					}

					if response.StatusCode < 200 || response.StatusCode >= 300 {
						httpErr := Error{
							Category: "HTTPError",
							Code: "BAD_STATUS",
							Message: fmt.Sprintf("unexpected HTTP status: %s", response.Status),
							Details: map[string]any{"status": response.StatusCode},
						}
						response.Body.Close()
						finalErr = httpErr
						events <- Response[json.RawMessage]{Ok: false, Error: httpErr}
						return
					}

					if onConnect != nil {
						onConnect()
					}
					reconnectAttempt = 0

					result := handleStreamEvents(callCtx, response, maxMessageSize, events)
					response.Body.Close()

					if result.reconnectable {
						shouldReconnect := true
						if reconnectConf.ShouldReconnect != nil {
							shouldReconnect = reconnectConf.ShouldReconnect(callCtx, ReconnectDecisionContext{
								Request: req,
								Attempt: reconnectAttempt + 1,
								ResponseStatus: http.StatusOK,
								Error: result.err,
							})
						}

						if shouldReconnect && reconnectAttempt < reconnectConf.MaxAttempts {
							reconnectAttempt++
							delay := calculateReconnectBackoff(reconnectConf, reconnectAttempt)
							if onReconnect != nil {
								onReconnect(reconnectAttempt, delay)
							}
							if waitErr := waitForBackoff(callCtx, delay); waitErr != nil {
								finalErr = waitErr
								return
							}
							continue
						}
					}

					if result.err != nil {
						finalErr = result.err
						if result.deliverErrorEvent {
							events <- Response[json.RawMessage]{Ok: false, Error: ToError(result.err)}
						}
					}
					return
				}
			}()

			return Response[json.RawMessage]{Ok: true}, nil
		}

		_, _ = c.executeChain(ctx, reqInfo, invoker)
		return events
	}

	// streamReadResult describes the outcome of processing an SSE response body.
	type streamReadResult struct {
		reconnectable bool
		deliverErrorEvent bool
		err error
	}

	// handleStreamEvents consumes Server-Sent Events from the response body.
	func handleStreamEvents(ctx context.Context, response *http.Response, maxMessageSize int64, events chan<- Response[json.RawMessage]) streamReadResult {
		scanner := bufio.NewScanner(response.Body)
		scanner.Buffer(make([]byte, 4096), int(maxMessageSize))

		var dataBuffer bytes.Buffer
		flush := func() {
			if dataBuffer.Len() == 0 {
				return
			}

			var event Response[json.RawMessage]
			if err := json.Unmarshal(dataBuffer.Bytes(), &event); err != nil {
				events <- Response[json.RawMessage]{
					Ok: false,
					Error: ToError(fmt.Errorf("received invalid SSE payload: %w", err)),
				}
				dataBuffer.Reset()
				return
			}

			select {
			case events <- event:
			case <-ctx.Done():
			}

			dataBuffer.Reset()
		}

		for {
			select {
			case <-ctx.Done():
				return streamReadResult{}
			default:
			}

			if !scanner.Scan() {
				if err := scanner.Err(); err != nil {
					if err == bufio.ErrTooLong {
						return streamReadResult{
							reconnectable: false,
							deliverErrorEvent: true,
							err: Error{
								Category: "ProtocolError",
								Code: "MESSAGE_TOO_LARGE",
								Message: fmt.Sprintf("stream message exceeded maximum size of %d bytes", maxMessageSize),
							},
						}
					}

					return streamReadResult{reconnectable: true, err: err}
				}

				return streamReadResult{}
			}

			line := scanner.Text()
			if line == "" {
				flush()
				continue
			}

			if strings.HasPrefix(line, ":") {
				continue
			}

			if strings.HasPrefix(line, "data:") {
				chunk := strings.TrimSpace(strings.TrimPrefix(line, "data:"))
				if int64(dataBuffer.Len()+len(chunk)) > maxMessageSize {
					return streamReadResult{
						reconnectable: false,
						deliverErrorEvent: true,
						err: Error{
							Category: "ProtocolError",
							Code: "MESSAGE_TOO_LARGE",
							Message: fmt.Sprintf("stream message accumulation exceeded maximum size of %d bytes", maxMessageSize),
						},
					}
				}

				dataBuffer.WriteString(chunk)
			}
		}
	}

	// encodeRequestPayload marshals the request input using an empty JSON object when the input is nil.
	func encodeRequestPayload(input any) ([]byte, error) {
		if input == nil {
			return []byte("{}"), nil
		}

		return json.Marshal(input)
	}

	// calculateBackoff computes the delay for a retry attempt.
	func calculateBackoff(config *RetryConfig, attempt int) time.Duration {
		delay := config.InitialDelay
		for index := 1; index < attempt; index++ {
			delay = time.Duration(float64(delay) * config.DelayMultiplier)
		}

		if config.MaxDelay > 0 && delay > config.MaxDelay {
			delay = config.MaxDelay
		}

		return applyJitter(delay, config.Jitter)
	}

	// calculateReconnectBackoff computes the delay for a reconnect attempt.
	func calculateReconnectBackoff(config *ReconnectConfig, attempt int) time.Duration {
		delay := config.InitialDelay
		for index := 1; index < attempt; index++ {
			delay = time.Duration(float64(delay) * config.DelayMultiplier)
		}

		if config.MaxDelay > 0 && delay > config.MaxDelay {
			delay = config.MaxDelay
		}

		return applyJitter(delay, config.Jitter)
	}

	// applyJitter applies bounded randomness to the given delay.
	func applyJitter(delay time.Duration, factor float64) time.Duration {
		if factor <= 0 || delay <= 0 {
			return delay
		}

		if factor > 1 {
			factor = 1
		}

		delta := float64(delay) * factor
		minimum := float64(delay) - delta
		maximum := float64(delay) + delta
		if minimum < 0 {
			minimum = 0
		}

		return time.Duration(minimum + (rand.Float64() * (maximum - minimum)))
	}

	// waitForBackoff waits for the given delay or returns when the context is cancelled.
	func waitForBackoff(ctx context.Context, delay time.Duration) error {
		if delay <= 0 {
			return nil
		}

		timer := time.NewTimer(delay)
		defer timer.Stop()

		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-timer.C:
			return nil
		}
	}

	// -----------------------------------------------------------------------------
  // Client Builder
  // -----------------------------------------------------------------------------

	// clientBuilder collects configuration before a generated client is built.
	type clientBuilder struct {
		baseURL string
		opts []internalClientOption
	}

	// WithHTTPClient supplies a custom HTTP client implementation.
	func (b *clientBuilder) WithHTTPClient(client *http.Client) *clientBuilder {
		b.opts = append(b.opts, withHTTPClient(client))
		return b
	}

	// WithHeader registers a static header that is sent with every request.
	func (b *clientBuilder) WithHeader(key string, value string) *clientBuilder {
		b.opts = append(b.opts, withGlobalHeader(key, value))
		return b
	}

	// WithHeaderProvider registers a dynamic header provider.
	func (b *clientBuilder) WithHeaderProvider(provider HeaderProvider) *clientBuilder {
		b.opts = append(b.opts, withHeaderProvider(provider))
		return b
	}

	// WithInterceptor registers a transport interceptor.
	func (b *clientBuilder) WithInterceptor(interceptor Interceptor) *clientBuilder {
		b.opts = append(b.opts, withInterceptor(interceptor))
		return b
	}

	// WithRetryConfig sets the default retry configuration for procedures.
	func (b *clientBuilder) WithRetryConfig(conf RetryConfig) *clientBuilder {
		b.opts = append(b.opts, withGlobalRetryConfig(conf))
		return b
	}

	// WithTimeoutConfig sets the default timeout configuration for procedures.
	func (b *clientBuilder) WithTimeoutConfig(conf TimeoutConfig) *clientBuilder {
		b.opts = append(b.opts, withGlobalTimeoutConfig(conf))
		return b
	}

	// WithReconnectConfig sets the default reconnect configuration for streams.
	func (b *clientBuilder) WithReconnectConfig(conf ReconnectConfig) *clientBuilder {
		b.opts = append(b.opts, withGlobalReconnectConfig(conf))
		return b
	}

	// WithMaxMessageSize sets the default maximum message size for streams.
	func (b *clientBuilder) WithMaxMessageSize(size int64) *clientBuilder {
		b.opts = append(b.opts, withGlobalMaxMessageSize(size))
		return b
	}

	// Build creates the generated RPC client.
	func (b *clientBuilder) Build() *Client {
		intClient := newInternalClient(b.baseURL, VDLProcedures, VDLStreams, b.opts...)
		return &Client{RPCs: &clientRPCRegistry{intClient: intClient}}
	}

  // -----------------------------------------------------------------------------
  // Client Implementation
  // -----------------------------------------------------------------------------

	// Client is the public entrypoint for generated RPC calls.
	type Client struct {
		RPCs *clientRPCRegistry
	}

	// NewClient creates a new generated RPC client builder.
	func NewClient(baseURL string) *clientBuilder {
		return &clientBuilder{baseURL: baseURL, opts: []internalClientOption{}}
	}

	// clientRPCRegistry exposes the generated RPC services.
	type clientRPCRegistry struct {
		intClient *internalClient
	}
`
);

// src/stages/emit/files/client/generate.ts
function generateClientFile(context) {
  const body = joinSections([
    `package ${context.options.packageName}`,
    renderClientImports(context),
    renderCatalog(context),
    renderCoreRuntime(),
    CLIENT_RUNTIME,
    renderClientServices(context.services)
  ]);
  return createGoFile("client.go", "", body);
}
__name(generateClientFile, "generateClientFile");
function renderClientImports(context) {
  const needsTypesImport = context.services.some(
    (service) => service.operations.some(
      (operation) => operation.inputTypeName || operation.outputTypeName
    )
  );
  const g = newGenerator().withTabs();
  g.line("import (");
  g.block(() => {
    g.line('"bufio"');
    g.line('"bytes"');
    g.line('"context"');
    g.line('"encoding/json"');
    g.line('"errors"');
    g.line('"fmt"');
    g.line('"io"');
    g.line('"math/rand"');
    g.line('"net/http"');
    g.line('"strings"');
    g.line('"sync"');
    g.line('"time"');
    if (needsTypesImport) {
      g.break();
      g.line(`vdltypes ${renderGoString(context.options.typesImport)}`);
    }
  });
  g.line(")");
  return g.toString();
}
__name(renderClientImports, "renderClientImports");
function renderClientServices(services) {
  return services.map((service) => renderClientService(service)).join("\n\n");
}
__name(renderClientServices, "renderClientServices");
function renderClientService(service) {
  const rpcStructName = `client${service.goName}RPC`;
  const procsStructName = `client${service.goName}Procs`;
  const streamsStructName = `client${service.goName}Streams`;
  const g = newGenerator().withTabs();
  writeComment(
    g,
    `${service.goName} returns the client registry for the ${service.name} RPC service.`,
    service.doc,
    service.deprecated
  );
  g.line(`func (r *clientRPCRegistry) ${service.goName}() *${rpcStructName} {`);
  g.block(() => {
    g.line(`return &${rpcStructName}{`);
    g.block(() => {
      g.line("intClient: r.intClient,");
      g.line(`Procs: &${procsStructName}{intClient: r.intClient},`);
      g.line(`Streams: &${streamsStructName}{intClient: r.intClient},`);
    });
    g.line("}");
  });
  g.line("}");
  g.break();
  writeComment(
    g,
    `${rpcStructName} groups the generated client builders for the ${service.name} RPC service.`
  );
  g.line(`type ${rpcStructName} struct {`);
  g.block(() => {
    g.line("intClient *internalClient");
    g.line(`Procs *${procsStructName}`);
    g.line(`Streams *${streamsStructName}`);
  });
  g.line("}");
  g.break();
  writeComment(
    g,
    `WithRetryConfig sets the default retry configuration for every procedure in the ${service.name} RPC service.`
  );
  g.line(
    `func (r *${rpcStructName}) WithRetryConfig(conf RetryConfig) *${rpcStructName} {`
  );
  g.block(() => {
    g.line(
      `r.intClient.setRPCRetryConfig(${renderGoString(service.name)}, conf)`
    );
    g.line("return r");
  });
  g.line("}");
  g.break();
  writeComment(
    g,
    `WithTimeoutConfig sets the default timeout configuration for every procedure in the ${service.name} RPC service.`
  );
  g.line(
    `func (r *${rpcStructName}) WithTimeoutConfig(conf TimeoutConfig) *${rpcStructName} {`
  );
  g.block(() => {
    g.line(
      `r.intClient.setRPCTimeoutConfig(${renderGoString(service.name)}, conf)`
    );
    g.line("return r");
  });
  g.line("}");
  g.break();
  writeComment(
    g,
    `WithReconnectConfig sets the default reconnect configuration for every stream in the ${service.name} RPC service.`
  );
  g.line(
    `func (r *${rpcStructName}) WithReconnectConfig(conf ReconnectConfig) *${rpcStructName} {`
  );
  g.block(() => {
    g.line(
      `r.intClient.setRPCReconnectConfig(${renderGoString(service.name)}, conf)`
    );
    g.line("return r");
  });
  g.line("}");
  g.break();
  writeComment(
    g,
    `WithMaxMessageSize sets the default maximum stream message size for the ${service.name} RPC service.`
  );
  g.line(
    `func (r *${rpcStructName}) WithMaxMessageSize(size int64) *${rpcStructName} {`
  );
  g.block(() => {
    g.line(
      `r.intClient.setRPCMaxMessageSize(${renderGoString(service.name)}, size)`
    );
    g.line("return r");
  });
  g.line("}");
  g.break();
  writeComment(
    g,
    `WithHeaderProvider adds a header provider for every request in the ${service.name} RPC service.`
  );
  g.line(
    `func (r *${rpcStructName}) WithHeaderProvider(provider HeaderProvider) *${rpcStructName} {`
  );
  g.block(() => {
    g.line(
      `r.intClient.setRPCHeaderProvider(${renderGoString(service.name)}, provider)`
    );
    g.line("return r");
  });
  g.line("}");
  g.break();
  writeComment(
    g,
    `WithHeader adds a static header for every request in the ${service.name} RPC service.`
  );
  g.line(
    `func (r *${rpcStructName}) WithHeader(key string, value string) *${rpcStructName} {`
  );
  g.block(() => {
    g.line(
      `r.intClient.setRPCHeaderProvider(${renderGoString(service.name)}, func(_ context.Context, h http.Header) error {`
    );
    g.block(() => {
      g.line("h.Set(key, value)");
      g.line("return nil");
    });
    g.line("})");
    g.line("return r");
  });
  g.line("}");
  g.break();
  writeComment(
    g,
    `${procsStructName} exposes the generated procedure builders for the ${service.name} RPC service.`
  );
  g.line(`type ${procsStructName} struct {`);
  g.block(() => {
    g.line("intClient *internalClient");
  });
  g.line("}");
  g.break();
  for (const operation of service.procedures) {
    g.break();
    g.break();
    g.raw(renderClientProcedure(service, operation));
  }
  writeComment(
    g,
    `${streamsStructName} exposes the generated stream builders for the ${service.name} RPC service.`
  );
  g.line(`type ${streamsStructName} struct {`);
  g.block(() => {
    g.line("intClient *internalClient");
  });
  g.line("}");
  for (const operation of service.streams) {
    g.break();
    g.break();
    g.raw(renderClientStream(service, operation));
  }
  return g.toString();
}
__name(renderClientService, "renderClientService");
function renderClientProcedure(service, operation) {
  const registryName = `client${service.goName}Procs`;
  const builderName = `clientBuilder${operation.operationTypeName}`;
  const inputType = getClientInputType(operation);
  const outputType = getClientOutputType(operation);
  const g = newGenerator().withTabs();
  writeComment(
    g,
    `${operation.goName} creates a call builder for the ${service.name}.${operation.name} procedure.`,
    operation.doc,
    operation.deprecated
  );
  g.line(
    `func (registry *${registryName}) ${operation.goName}() *${builderName} {`
  );
  g.block(() => {
    g.line(
      `return &${builderName}{client: registry.intClient, headerProviders: []HeaderProvider{}, rpcName: ${renderGoString(service.name)}, name: ${renderGoString(operation.name)}}`
    );
  });
  g.line("}");
  g.break();
  writeComment(
    g,
    `${builderName} configures and executes calls to the ${service.name}.${operation.name} procedure.`
  );
  g.line(`type ${builderName} struct {`);
  g.block(() => {
    g.line("rpcName string");
    g.line("name string");
    g.line("client *internalClient");
    g.line("headerProviders []HeaderProvider");
    g.line("retryConf *RetryConfig");
    g.line("timeoutConf *TimeoutConfig");
  });
  g.line("}");
  g.break();
  writeComment(
    g,
    `WithHeader adds a static header to the ${service.name}.${operation.name} procedure call.`
  );
  g.line(
    `func (b *${builderName}) WithHeader(key string, value string) *${builderName} {`
  );
  g.block(() => {
    g.line(
      "b.headerProviders = append(b.headerProviders, func(_ context.Context, h http.Header) error {"
    );
    g.block(() => {
      g.line("h.Set(key, value)");
      g.line("return nil");
    });
    g.line("})");
    g.line("return b");
  });
  g.line("}");
  g.break();
  writeComment(
    g,
    `WithHeaderProvider adds a dynamic header provider to the ${service.name}.${operation.name} procedure call.`
  );
  g.line(
    `func (b *${builderName}) WithHeaderProvider(provider HeaderProvider) *${builderName} {`
  );
  g.block(() => {
    g.line("b.headerProviders = append(b.headerProviders, provider)");
    g.line("return b");
  });
  g.line("}");
  g.break();
  writeComment(
    g,
    `WithRetryConfig overrides retry behavior for the ${service.name}.${operation.name} procedure call.`
  );
  g.line(
    `func (b *${builderName}) WithRetryConfig(conf RetryConfig) *${builderName} {`
  );
  g.block(() => {
    g.line("b.retryConf = &conf");
    g.line("return b");
  });
  g.line("}");
  g.break();
  writeComment(
    g,
    `WithTimeoutConfig overrides timeout behavior for the ${service.name}.${operation.name} procedure call.`
  );
  g.line(
    `func (b *${builderName}) WithTimeoutConfig(conf TimeoutConfig) *${builderName} {`
  );
  g.block(() => {
    g.line("b.timeoutConf = &conf");
    g.line("return b");
  });
  g.line("}");
  g.break();
  writeComment(
    g,
    `Execute sends a request to the ${service.name}.${operation.name} procedure.`
  );
  g.line(
    `func (b *${builderName}) Execute(ctx context.Context, input ${inputType}) (${outputType}, error) {`
  );
  g.block(() => {
    g.line(
      "raw := b.client.proc(ctx, b.rpcName, b.name, input, b.headerProviders, b.retryConf, b.timeoutConf)"
    );
    g.line("if !raw.Ok {");
    g.block(() => {
      g.line(`return ${outputType}{}, raw.Error`);
    });
    g.line("}");
    g.line(`var out ${outputType}`);
    g.line("if err := json.Unmarshal(raw.Output, &out); err != nil {");
    g.block(() => {
      g.line(
        `return ${outputType}{}, Error{Message: fmt.Sprintf("failed to decode ${service.name}.${operation.name} output: %v", err)}`
      );
    });
    g.line("}");
    g.line("return out, nil");
  });
  g.line("}");
  return g.toString();
}
__name(renderClientProcedure, "renderClientProcedure");
function renderClientStream(service, operation) {
  const registryName = `client${service.goName}Streams`;
  const builderName = `clientBuilder${operation.operationTypeName}Stream`;
  const inputType = getClientInputType(operation);
  const outputType = getClientOutputType(operation);
  const g = newGenerator().withTabs();
  writeComment(
    g,
    `${operation.goName} creates a stream builder for the ${service.name}.${operation.name} stream.`,
    operation.doc,
    operation.deprecated
  );
  g.line(
    `func (registry *${registryName}) ${operation.goName}() *${builderName} {`
  );
  g.block(() => {
    g.line(
      `return &${builderName}{client: registry.intClient, headerProviders: []HeaderProvider{}, rpcName: ${renderGoString(service.name)}, name: ${renderGoString(operation.name)}}`
    );
  });
  g.line("}");
  g.break();
  writeComment(
    g,
    `${builderName} configures and executes subscriptions to the ${service.name}.${operation.name} stream.`
  );
  g.line(`type ${builderName} struct {`);
  g.block(() => {
    g.line("rpcName string");
    g.line("name string");
    g.line("client *internalClient");
    g.line("headerProviders []HeaderProvider");
    g.line("reconnectConf *ReconnectConfig");
    g.line("maxMessageSize int64");
    g.line("onConnect func()");
    g.line("onDisconnect func(error)");
    g.line("onReconnect func(int, time.Duration)");
  });
  g.line("}");
  g.break();
  writeComment(
    g,
    `WithHeader adds a static header to the ${service.name}.${operation.name} stream subscription.`
  );
  g.line(
    `func (b *${builderName}) WithHeader(key string, value string) *${builderName} {`
  );
  g.block(() => {
    g.line(
      "b.headerProviders = append(b.headerProviders, func(_ context.Context, h http.Header) error {"
    );
    g.block(() => {
      g.line("h.Set(key, value)");
      g.line("return nil");
    });
    g.line("})");
    g.line("return b");
  });
  g.line("}");
  g.break();
  writeComment(
    g,
    `WithHeaderProvider adds a dynamic header provider to the ${service.name}.${operation.name} stream subscription.`
  );
  g.line(
    `func (b *${builderName}) WithHeaderProvider(provider HeaderProvider) *${builderName} {`
  );
  g.block(() => {
    g.line("b.headerProviders = append(b.headerProviders, provider)");
    g.line("return b");
  });
  g.line("}");
  g.break();
  writeComment(
    g,
    `WithReconnectConfig overrides reconnect behavior for the ${service.name}.${operation.name} stream subscription.`
  );
  g.line(
    `func (b *${builderName}) WithReconnectConfig(conf ReconnectConfig) *${builderName} {`
  );
  g.block(() => {
    g.line("b.reconnectConf = &conf");
    g.line("return b");
  });
  g.line("}");
  g.break();
  writeComment(
    g,
    `WithMaxMessageSize overrides the maximum message size for the ${service.name}.${operation.name} stream subscription.`
  );
  g.line(
    `func (b *${builderName}) WithMaxMessageSize(size int64) *${builderName} {`
  );
  g.block(() => {
    g.line("b.maxMessageSize = size");
    g.line("return b");
  });
  g.line("}");
  g.break();
  writeComment(
    g,
    `OnConnect registers a callback that runs after the ${service.name}.${operation.name} stream connects.`
  );
  g.line(`func (b *${builderName}) OnConnect(cb func()) *${builderName} {`);
  g.block(() => {
    g.line("b.onConnect = cb");
    g.line("return b");
  });
  g.line("}");
  g.break();
  writeComment(
    g,
    `OnDisconnect registers a callback that runs after the ${service.name}.${operation.name} stream stops.`
  );
  g.line(
    `func (b *${builderName}) OnDisconnect(cb func(error)) *${builderName} {`
  );
  g.block(() => {
    g.line("b.onDisconnect = cb");
    g.line("return b");
  });
  g.line("}");
  g.break();
  writeComment(
    g,
    `OnReconnect registers a callback that runs before the ${service.name}.${operation.name} stream reconnects.`
  );
  g.line(
    `func (b *${builderName}) OnReconnect(cb func(int, time.Duration)) *${builderName} {`
  );
  g.block(() => {
    g.line("b.onReconnect = cb");
    g.line("return b");
  });
  g.line("}");
  g.break();
  writeComment(
    g,
    `Execute opens the ${service.name}.${operation.name} stream and returns its event channel.`
  );
  g.line(
    `func (b *${builderName}) Execute(ctx context.Context, input ${inputType}) <-chan Response[${outputType}] {`
  );
  g.block(() => {
    g.line(
      "rawEvents := b.client.stream(ctx, b.rpcName, b.name, input, b.headerProviders, b.reconnectConf, b.maxMessageSize, b.onConnect, b.onDisconnect, b.onReconnect)"
    );
    g.line(`out := make(chan Response[${outputType}])`);
    g.line("go func() {");
    g.block(() => {
      g.line("defer close(out)");
      g.line("for event := range rawEvents {");
      g.block(() => {
        g.line("if !event.Ok {");
        g.block(() => {
          g.line(
            `out <- Response[${outputType}]{Ok: false, Error: event.Error}`
          );
          g.line("continue");
        });
        g.line("}");
        g.line(`var output ${outputType}`);
        g.line("if err := json.Unmarshal(event.Output, &output); err != nil {");
        g.block(() => {
          g.line(
            `out <- Response[${outputType}]{Ok: false, Error: Error{Message: fmt.Sprintf("failed to decode ${service.name}.${operation.name} output: %v", err)}}`
          );
          g.line("continue");
        });
        g.line("}");
        g.line(`out <- Response[${outputType}]{Ok: true, Output: output}`);
      });
      g.line("}");
    });
    g.line("}()");
    g.line("return out");
  });
  g.line("}");
  return g.toString();
}
__name(renderClientStream, "renderClientStream");
function writeComment(g, summary, doc, deprecated) {
  g.raw(renderCommentBlock({ summary, doc, deprecated }));
  g.break();
}
__name(writeComment, "writeComment");
function getClientInputType(operation) {
  return operation.inputTypeName ? `vdltypes.${operation.inputTypeName}` : "Void";
}
__name(getClientInputType, "getClientInputType");
function getClientOutputType(operation) {
  return operation.outputTypeName ? `vdltypes.${operation.outputTypeName}` : "Void";
}
__name(getClientOutputType, "getClientOutputType");

// src/stages/emit/files/server/runtime.ts
var SERVER_RUNTIME = dedent2(
  /* go */
  `
  // -----------------------------------------------------------------------------
  // Server Types
  // -----------------------------------------------------------------------------

  // HTTPAdapter defines the interface required by VDL server to handle
  // incoming HTTP requests and write responses to clients. This abstraction allows
  // the server to work with different HTTP frameworks while maintaining the same
  // core functionality.
  //
  // Implementations must provide methods to read request bodies, set response headers,
  // write response data, and flush the response buffer to ensure immediate delivery
  // to the client.
  type HTTPAdapter interface {
    // RequestBody returns the body reader for the incoming HTTP request.
    // The returned io.Reader allows the server to read the request payload
    // containing RPC call data.
    RequestBody() io.Reader
    // SetHeader sets a response header with the specified key-value pair.
    // This is used to configure response headers like Content-Type and
    // caching directives for both procedure and stream responses.
    SetHeader(key, value string)
    // Write writes the provided data to the response body.
    // Returns the number of bytes written and any error encountered.
    // For procedures, this writes the complete JSON response. For streams,
    // this writes individual Server-Sent Events data chunks.
    Write(data []byte) (int, error)
    // Flush immediately sends any buffered response data to the client.
    // This is crucial for streaming responses to ensure real-time delivery
    // of events. Returns an error if the flush operation fails.
    Flush() error
  }

  // NetHTTPAdapter implements HTTPAdapter for Go's standard net/http package.
  // This adapter bridges the VDL server with the standard HTTP library, allowing
  // seamless integration with existing HTTP servers and middlewares.
  type NetHTTPAdapter struct {
    responseWriter http.ResponseWriter
    request        *http.Request
  }

  // NewNetHTTPAdapter creates a new NetHTTPAdapter that implements the
  // HTTPAdapter interface for net/http.
  //
  // Parameters:
  //   - w: The http.ResponseWriter to write responses to
  //   - r: The *http.Request containing the incoming request data
  //
  // Returns a HTTPAdapter implementation ready for use with VDL server.
  func NewNetHTTPAdapter(w http.ResponseWriter, r *http.Request) HTTPAdapter {
    return &NetHTTPAdapter{
      responseWriter: w,
      request:        r,
    }
  }

  // RequestBody returns the body reader for the HTTP request.
  // This provides access to the request payload containing the RPC call data.
  func (r *NetHTTPAdapter) RequestBody() io.Reader {
    return r.request.Body
  }

  // SetHeader sets a response header with the specified key-value pair.
  // This configures headers for the HTTP response, such as Content-Type
  // for JSON responses or streaming-specific headers.
  func (r *NetHTTPAdapter) SetHeader(key, value string) {
    r.responseWriter.Header().Set(key, value)
  }

  // Write writes the provided data to the HTTP response body.
  // Returns the number of bytes written and any error encountered during writing.
  func (r *NetHTTPAdapter) Write(data []byte) (int, error) {
    return r.responseWriter.Write(data)
  }

  // Flush immediately sends any buffered response data to the client.
  // For streaming responses, this ensures real-time delivery of events.
  // If the underlying ResponseWriter doesn't support flushing, this is a no-op.
  func (r *NetHTTPAdapter) Flush() error {
    if f, ok := r.responseWriter.(http.Flusher); ok {
      f.Flush()
    }
    return nil
  }

  // -----------------------------------------------------------------------------
  // Middleware-based Server Architecture
  // -----------------------------------------------------------------------------

  // HandlerContext is the unified container for all request information and state
  // that flows through the entire request processing pipeline.
  //
  // The generic type P represents the user-defined container for application
  // dependencies and request data (e.g., UserID, DB connection, etc.).
  //
  // The generic type I represents the input type, which can be any type depending
  // on the operation.
  //
  //   - T: The type of the Props field, which is a user-defined container for application and request data.
  //   - I: The type of the Input field, which contains the deserialized request body. For global middlewares, this will be any.
  type HandlerContext[T any, I any] struct {
    // Props is the user-defined container, created per request,
    // for application dependencies and request data (e.g., UserID).
    Props T
    // Input contains the request body, already deserialized and typed.
    // For global middlewares, the type I will be any.
    Input I
    // Context is the standard Go context.Context for cancellations and deadlines.
    Context context.Context
    // Annotations is a slice of annotation objects associated with the request.
    Annotations []Annotation
    // operation is the details of the RPC operation including it's RPC name, operation name and type.
    operation OperationDefinition
  }

  // RPCName returns the name of the RPC service
  func (h *HandlerContext[T, I]) RPCName() string { return h.operation.RPCName }

  // OperationName returns the name of the operation (e.g. "CreateUser", "GetPost", etc.)
  func (h *HandlerContext[T, I]) OperationName() string { return h.operation.Name }

  // OperationType returns the type of operation, can be [OperationTypeProc] ("proc") or [OperationTypeStream] ("stream")
  func (h *HandlerContext[T, I]) OperationType() OperationType { return h.operation.Type }

  // GlobalHandlerFunc is the signature for a global handler function for procedures and streams.
  //
  //   - T: Application-defined context type (props).
  type GlobalHandlerFunc[T any] func(c *HandlerContext[T, any]) (any, error)

  // GlobalMiddlewareFunc is the signature for a middleware applied to all requests.
  //
  //   - T: Application-defined context type (props).
  type GlobalMiddlewareFunc[T any] func(next GlobalHandlerFunc[T]) GlobalHandlerFunc[T]

  // ProcHandlerFunc is the signature of the final business handler for a proc.
  //
  //   - T: Application-defined context type (props).
  //   - I: Input payload type for the procedure.
  //   - O: Output payload type for the procedure.
  type ProcHandlerFunc[T any, I any, O any] func(c *HandlerContext[T, I]) (O, error)

  // ProcMiddlewareFunc is the signature for a proc-specific typed middleware.
  // It uses a wrapper pattern for a clean composition.
  //
  // This is the same as [GlobalMiddlewareFunc] but for specific procedures and with types.
  //
  //   - T: Application-defined context type (props).
  //   - I: Input payload type for the procedure.
  //   - O: Output payload type for the procedure.
  type ProcMiddlewareFunc[T any, I any, O any] func(next ProcHandlerFunc[T, I, O]) ProcHandlerFunc[T, I, O]

  // StreamHandlerFunc is the signature of the main handler that initializes a stream.
  //
  //   - T: Application-defined context type (props).
  //   - I: Input payload type for the stream (subscription parameters).
  //   - O: Output payload type for the stream (event data).
  type StreamHandlerFunc[T any, I any, O any] func(c *HandlerContext[T, I], emit EmitFunc[T, I, O]) error

  // StreamMiddlewareFunc is the signature for a middleware that wraps the main stream handler.
  //
  //   - T: Application-defined context type (props).
  //   - I: Input payload type for the stream.
  //   - O: Output payload type for the stream.
  type StreamMiddlewareFunc[T any, I any, O any] func(next StreamHandlerFunc[T, I, O]) StreamHandlerFunc[T, I, O]

  // EmitFunc is the signature for emitting events from a stream.
  //
  //   - T: Application-defined context type (props).
  //   - I: Input payload type for the stream.
  //   - O: Output payload type for the stream.
  type EmitFunc[T any, I any, O any] func(c *HandlerContext[T, I], output O) error

  // EmitMiddlewareFunc is the signature for a middleware that wraps each call to emit.
  //
  //   - T: Application-defined context type (props).
  //   - I: Input payload type for the stream.
  //   - O: Output payload type for the stream.
  type EmitMiddlewareFunc[T any, I any, O any] func(next EmitFunc[T, I, O]) EmitFunc[T, I, O]

  // DeserializerFunc function convert raw JSON input into typed input prior to handler execution.
  type DeserializerFunc func(raw json.RawMessage) (any, error)

  // ErrorHandlerFunc transforms an internal Go error into a public VDL Error.
  //
  // The handler receives the full request context, enabling structured logging
  // with access to Props, RPC Name, Operation Name, and other metadata.
  //
  //   - T: Application-defined context type (props).
  type ErrorHandlerFunc[T any] func(c *HandlerContext[T, any], err error) Error

  // StreamConfig allows configuring the behavior of streams.
  type StreamConfig struct {
    // PingInterval is the interval at which ping events are sent to the client
    // to keep the connection alive. Defaults to 30 seconds.
    PingInterval time.Duration
  }

  // -----------------------------------------------------------------------------
  // Internal Server Implementation
  // -----------------------------------------------------------------------------

  // internalServer manages RPC request handling and middleware execution for
  // both procedures and streams. It maintains handler registrations, middleware
  // chains, and coordinates the complete request lifecycle.
  //
  // The generic type P represents the user context type, allowing users to pass
  // custom data (authentication info, user sessions, etc.) through the entire
  // request processing pipeline.
  //
  //   - T: Application-defined context type (props).
  type internalServer[T any] struct {
    // handlersMu protects all handler maps and middleware slices from concurrent access
    handlersMu sync.RWMutex

    // operationDefs contains the definition of all registered operations.
    // Map format: rpcName -> operationName -> OperationDefinition.
    operationDefs map[string]map[string]OperationDefinition

    // procHandlers stores the final implementation functions for procedures
    // Map format: rpcName -> procName -> handler
    procHandlers map[string]map[string]ProcHandlerFunc[T, any, any]

    // streamHandlers stores the final implementation functions for streams
    // Map format: rpcName -> streamName -> handler
    streamHandlers map[string]map[string]StreamHandlerFunc[T, any, any]

    // globalMiddlewares contains middlewares that run for every request (both procs and streams)
    globalMiddlewares []GlobalMiddlewareFunc[T]

    // rpcMiddlewares contains middlewares that run for every request within a specific RPC
    // Map format: rpcName -> middlewares
    rpcMiddlewares map[string][]GlobalMiddlewareFunc[T]

    // procMiddlewares contains per-procedure middlewares
    // Map format: rpcName -> procName -> middlewares
    procMiddlewares map[string]map[string][]ProcMiddlewareFunc[T, any, any]

    // streamMiddlewares contains per-stream middlewares
    // Map format: rpcName -> streamName -> middlewares
    streamMiddlewares map[string]map[string][]StreamMiddlewareFunc[T, any, any]

    // streamEmitMiddlewares contains per-stream emit middlewares
    // Map format: rpcName -> streamName -> middlewares
    streamEmitMiddlewares map[string]map[string][]EmitMiddlewareFunc[T, any, any]

    // procDeserializers contains per-procedure input deserializers
    // Map format: rpcName -> procName -> deserializer
    procDeserializers map[string]map[string]DeserializerFunc

    // streamDeserializers contains per-stream input deserializers
    // Map format: rpcName -> streamName -> deserializer
    streamDeserializers map[string]map[string]DeserializerFunc

    // globalStreamConfig contains the global configuration for streams
    globalStreamConfig StreamConfig

    // rpcStreamConfigs contains per-RPC configuration for streams
    // Map format: rpcName -> config
    rpcStreamConfigs map[string]StreamConfig

    // streamConfigs contains per-stream configuration
    // Map format: rpcName -> streamName -> config
    streamConfigs map[string]map[string]StreamConfig

    // globalErrorHandler is the global error handler
    globalErrorHandler ErrorHandlerFunc[T]

    // rpcErrorHandlers contains per-RPC error handlers
    // Map format: rpcName -> handler
    rpcErrorHandlers map[string]ErrorHandlerFunc[T]
  }

  // newInternalServer creates a new VDL server instance with the specified
  // procedure and stream definitions. The server is initialized with empty handler
  // maps and middleware slices, ready for registration.
  //
  // The generic type T represents the user context type, used to pass additional
  // data to handlers, such as authentication information, user sessions, or any
  // other request-scoped data.
  //
  // Parameters:
  //   - procDefs: List of procedure definitions that this server will handle
  //   - streamDefs: List of stream definitions that this server will handle
  //   - T: Application-defined context type (props).
  //
  // Returns a new internalServer instance ready for handler and middleware registration.
  func newInternalServer[T any](procDefs []OperationDefinition, streamDefs []OperationDefinition) *internalServer[T] {
    // Initialize maps
    operationDefs := make(map[string]map[string]OperationDefinition)
    procHandlers := make(map[string]map[string]ProcHandlerFunc[T, any, any])
    streamHandlers := make(map[string]map[string]StreamHandlerFunc[T, any, any])
    rpcMiddlewares := make(map[string][]GlobalMiddlewareFunc[T])
    procMiddlewares := make(map[string]map[string][]ProcMiddlewareFunc[T, any, any])
    streamMiddlewares := make(map[string]map[string][]StreamMiddlewareFunc[T, any, any])
    streamEmitMiddlewares := make(map[string]map[string][]EmitMiddlewareFunc[T, any, any])
    procDeserializers := make(map[string]map[string]DeserializerFunc)
    streamDeserializers := make(map[string]map[string]DeserializerFunc)
    rpcStreamConfigs := make(map[string]StreamConfig)
    streamConfigs := make(map[string]map[string]StreamConfig)
    rpcErrorHandlers := make(map[string]ErrorHandlerFunc[T])

    // Helper to ensure RPC map existence
    ensureRPC := func(rpcName string) {
      if _, ok := operationDefs[rpcName]; !ok {
        operationDefs[rpcName] = make(map[string]OperationDefinition)
        procHandlers[rpcName] = make(map[string]ProcHandlerFunc[T, any, any])
        streamHandlers[rpcName] = make(map[string]StreamHandlerFunc[T, any, any])
        procMiddlewares[rpcName] = make(map[string][]ProcMiddlewareFunc[T, any, any])
        streamMiddlewares[rpcName] = make(map[string][]StreamMiddlewareFunc[T, any, any])
        streamEmitMiddlewares[rpcName] = make(map[string][]EmitMiddlewareFunc[T, any, any])
        procDeserializers[rpcName] = make(map[string]DeserializerFunc)
        streamDeserializers[rpcName] = make(map[string]DeserializerFunc)
        streamConfigs[rpcName] = make(map[string]StreamConfig)
      }
    }

    for _, def := range procDefs {
      ensureRPC(def.RPCName)
      operationDefs[def.RPCName][def.Name] = def
    }
    for _, def := range streamDefs {
      ensureRPC(def.RPCName)
      operationDefs[def.RPCName][def.Name] = def
    }

    return &internalServer[T]{
      handlersMu:            sync.RWMutex{},
      operationDefs:         operationDefs,
      procHandlers:          procHandlers,
      streamHandlers:        streamHandlers,
      globalMiddlewares:     []GlobalMiddlewareFunc[T]{},
      rpcMiddlewares:        rpcMiddlewares,
      procMiddlewares:       procMiddlewares,
      streamMiddlewares:     streamMiddlewares,
      streamEmitMiddlewares: streamEmitMiddlewares,
      procDeserializers:     procDeserializers,
      streamDeserializers:   streamDeserializers,
      globalStreamConfig:    StreamConfig{PingInterval: 30 * time.Second},
      rpcStreamConfigs:      rpcStreamConfigs,
      streamConfigs:         streamConfigs,
      globalErrorHandler:    nil,
      rpcErrorHandlers:      rpcErrorHandlers,
    }
  }

  // addGlobalMiddleware registers a global middleware that executes for every request (proc and stream).
  // Middlewares are executed in the order they were registered.
  func (s *internalServer[T]) addGlobalMiddleware(
    mw GlobalMiddlewareFunc[T],
  ) *internalServer[T] {
    s.handlersMu.Lock()
    defer s.handlersMu.Unlock()
    s.globalMiddlewares = append(s.globalMiddlewares, mw)
    return s
  }

  // addRPCMiddleware registers a middleware that executes for every request within a specific RPC.
  // Middlewares are executed in the order they were registered.
  func (s *internalServer[T]) addRPCMiddleware(
    rpcName string,
    mw GlobalMiddlewareFunc[T],
  ) *internalServer[T] {
    s.handlersMu.Lock()
    defer s.handlersMu.Unlock()
    s.rpcMiddlewares[rpcName] = append(s.rpcMiddlewares[rpcName], mw)
    return s
  }

  // addProcMiddleware registers a wrapper middleware for a specific procedure.
  // Middlewares are executed in the order they were registered.
  func (s *internalServer[T]) addProcMiddleware(
    rpcName string,
    procName string,
    mw ProcMiddlewareFunc[T, any, any],
  ) *internalServer[T] {
    s.handlersMu.Lock()
    defer s.handlersMu.Unlock()
    s.procMiddlewares[rpcName][procName] = append(s.procMiddlewares[rpcName][procName], mw)
    return s
  }

  // addStreamMiddleware registers a wrapper middleware for a specific stream.
  // Middlewares are executed in the order they were registered.
  func (s *internalServer[T]) addStreamMiddleware(
    rpcName string,
    streamName string,
    mw StreamMiddlewareFunc[T, any, any],
  ) *internalServer[T] {
    s.handlersMu.Lock()
    defer s.handlersMu.Unlock()
    s.streamMiddlewares[rpcName][streamName] = append(s.streamMiddlewares[rpcName][streamName], mw)
    return s
  }

  // addStreamEmitMiddleware registers an emit wrapper middleware for a specific stream.
  // Middlewares are executed in the order they were registered.
  func (s *internalServer[T]) addStreamEmitMiddleware(
    rpcName string,
    streamName string,
    mw EmitMiddlewareFunc[T, any, any],
  ) *internalServer[T] {
    s.handlersMu.Lock()
    defer s.handlersMu.Unlock()
    s.streamEmitMiddlewares[rpcName][streamName] = append(s.streamEmitMiddlewares[rpcName][streamName], mw)
    return s
  }

  // setGlobalStreamConfig sets the global configuration for streams.
  func (s *internalServer[T]) setGlobalStreamConfig(cfg StreamConfig) *internalServer[T] {
    s.handlersMu.Lock()
    defer s.handlersMu.Unlock()
    if cfg.PingInterval <= 0 {
      cfg.PingInterval = 30 * time.Second
    }
    s.globalStreamConfig = cfg
    return s
  }

  // setRPCStreamConfig sets the configuration for streams within a specific RPC.
  func (s *internalServer[T]) setRPCStreamConfig(rpcName string, cfg StreamConfig) *internalServer[T] {
    s.handlersMu.Lock()
    defer s.handlersMu.Unlock()
    s.rpcStreamConfigs[rpcName] = cfg
    return s
  }

  // setStreamConfig sets the configuration for a specific stream.
  func (s *internalServer[T]) setStreamConfig(rpcName, streamName string, cfg StreamConfig) *internalServer[T] {
    s.handlersMu.Lock()
    defer s.handlersMu.Unlock()
    s.streamConfigs[rpcName][streamName] = cfg
    return s
  }

  // setGlobalErrorHandler sets the global error handler.
  func (s *internalServer[T]) setGlobalErrorHandler(handler ErrorHandlerFunc[T]) *internalServer[T] {
    s.handlersMu.Lock()
    defer s.handlersMu.Unlock()
    s.globalErrorHandler = handler
    return s
  }

  // setRPCErrorHandler sets the error handler for a specific RPC.
  func (s *internalServer[T]) setRPCErrorHandler(rpcName string, handler ErrorHandlerFunc[T]) *internalServer[T] {
    s.handlersMu.Lock()
    defer s.handlersMu.Unlock()
    s.rpcErrorHandlers[rpcName] = handler
    return s
  }

  // resolveErrorHandler returns the appropriate error handler for the given RPC name.
  // Precedence: RPC > Global > Default (Passthrough)
  func (s *internalServer[T]) resolveErrorHandler(rpcName string) ErrorHandlerFunc[T] {
    s.handlersMu.RLock()
    defer s.handlersMu.RUnlock()

    if handler, ok := s.rpcErrorHandlers[rpcName]; ok && handler != nil {
      return handler
    }
    if s.globalErrorHandler != nil {
      return s.globalErrorHandler
    }

    // Default: Passthrough
    return func(c *HandlerContext[T, any], err error) Error {
      return ToError(err)
    }
  }

  // setProcHandler registers the final implementation function and deserializer for the specified procedure name.
  // The provided functions are stored as-is. Middlewares are composed at request time.
  //
  // Panics if a handler is already registered for the given procedure name.
  func (s *internalServer[T]) setProcHandler(
    rpcName string,
    procName string,
    handler ProcHandlerFunc[T, any, any],
    deserializer DeserializerFunc,
  ) *internalServer[T] {
    s.handlersMu.Lock()
    defer s.handlersMu.Unlock()
    if _, exists := s.procHandlers[rpcName][procName]; exists {
      panic(fmt.Sprintf("the procedure handler for %s.%s is already registered", rpcName, procName))
    }
    s.procHandlers[rpcName][procName] = handler
    s.procDeserializers[rpcName][procName] = deserializer
    return s
  }

  // setStreamHandler registers the final implementation function and deserializer for the specified stream name.
  // The provided functions are stored as-is. Middlewares are composed at request time.
  //
  // Panics if a handler is already registered for the given stream name.
  func (s *internalServer[T]) setStreamHandler(
    rpcName string,
    streamName string,
    handler StreamHandlerFunc[T, any, any],
    deserializer DeserializerFunc,
  ) *internalServer[T] {
    s.handlersMu.Lock()
    defer s.handlersMu.Unlock()
    if _, exists := s.streamHandlers[rpcName][streamName]; exists {
      panic(fmt.Sprintf("the stream handler for %s.%s is already registered", rpcName, streamName))
    }
    s.streamHandlers[rpcName][streamName] = handler
    s.streamDeserializers[rpcName][streamName] = deserializer
    return s
  }

  // handleRequest processes an incoming RPC request by parsing the request body,
  // building the global middleware chain, and dispatching to the appropriate
  // adapter (procedure or stream).
  //
  // The request body must contain a JSON object with the input data for the handler.
  //
  // Parameters:
  //   - ctx: The request context
  //   - props: The VDL context containing user-defined data
  //   - rpcName: The name of the RPC service to invoke
  //   - operationName: The name of the procedure or stream to invoke
  //   - httpAdapter: The HTTP adapter for reading requests and writing responses
  //
  // Returns an error if request processing fails at the transport level.
  func (s *internalServer[T]) handleRequest(
    ctx context.Context,
    props T,
    rpcName string,
    operationName string,
    httpAdapter HTTPAdapter,
  ) error {
    if httpAdapter == nil {
      return fmt.Errorf("the HTTP adapter is nil, please provide a valid adapter")
    }

    // Decode the request body into a json.RawMessage as the initial input container
    var rawInput json.RawMessage
    if err := json.NewDecoder(httpAdapter.RequestBody()).Decode(&rawInput); err != nil {
      res := Response[any]{
        Ok:    false,
        Error: Error{Message: "Invalid request body"},
      }
      return s.writeProcResponse(httpAdapter, res)
    }

    operation, operationExists := s.operationDefs[rpcName][operationName]
    if !operationExists {
      res := Response[any]{
        Ok:    false,
        Error: Error{Message: fmt.Sprintf("Invalid operation: %s.%s", rpcName, operationName)},
      }
      return s.writeProcResponse(httpAdapter, res)
    }

    // Build the unified handler context (raw input at this point).
    c := &HandlerContext[T, any]{
      Input:   rawInput,
      Props:   props,
      Context: ctx,
      Annotations: cloneAnnotations(operation.Annotations),
      operation: OperationDefinition{
        RPCName:     operation.RPCName,
        Name:        operation.Name,
        Type:        operation.Type,
        Annotations: cloneAnnotations(operation.Annotations),
      },
    }

    // Handle Stream
    if operation.Type == OperationTypeStream {
      err := s.handleStreamRequest(c, rpcName, operationName, rawInput, httpAdapter)

      // If no error, return without sending any response
      if err == nil {
        return nil
      }

      // Send an event with the error before closing the connection
      errorHandler := s.resolveErrorHandler(rpcName)
      response := Response[any]{
        Ok:    false,
        Error: errorHandler(c, err),
      }

      jsonData, marshalErr := json.Marshal(response)
      if marshalErr != nil {
        return fmt.Errorf("failed to marshal stream error: %w", marshalErr)
      }
      resPayload := fmt.Sprintf("data: %s\\n\\n", jsonData)
      if _, writeErr := httpAdapter.Write([]byte(resPayload)); writeErr != nil {
        return writeErr
      }
      if flushErr := httpAdapter.Flush(); flushErr != nil {
        return flushErr
      }
    }

    // Handle Procedure
    output, err := s.handleProcRequest(c, rpcName, operationName, rawInput)
    response := Response[any]{}
    if err != nil {
      response.Ok = false
      errorHandler := s.resolveErrorHandler(rpcName)
      response.Error = errorHandler(c, err)
    } else {
      response.Ok = true
      response.Output = output
    }

    return s.writeProcResponse(httpAdapter, response)
  }

  // handleProcRequest builds the per-request middleware chain for a procedure and executes it.
  // It returns the procedure output (as any) and an error if the handler failed.
  func (s *internalServer[T]) handleProcRequest(
    c *HandlerContext[T, any],
    rpcName string,
    procName string,
    rawInput json.RawMessage,
  ) (any, error) {
    // Snapshot handler, middlewares, and deserializer under read lock
    s.handlersMu.RLock()
    baseHandler, ok := s.procHandlers[rpcName][procName]
    mws := s.procMiddlewares[rpcName][procName]
    rpcMws := s.rpcMiddlewares[rpcName]
    deserialize := s.procDeserializers[rpcName][procName]
    s.handlersMu.RUnlock()

    if !ok {
      return nil, fmt.Errorf("%s.%s procedure not implemented", rpcName, procName)
    }
    if deserialize == nil {
      return nil, fmt.Errorf("%s.%s procedure deserializer not registered", rpcName, procName)
    }

    // Deserialize, validate and transform input into its typed form
    typedInput, err := deserialize(rawInput)
    if err != nil {
      return nil, err
    }
    c.Input = typedInput

    // Compose specific per-proc middlewares around the base handler (reverse registration order)
    final := baseHandler
    if len(mws) > 0 {
      mwChain := append([]ProcMiddlewareFunc[T, any, any](nil), mws...)
      for i := len(mwChain) - 1; i >= 0; i-- {
        final = mwChain[i](final)
      }
    }

    // Wrap the specific chain with RPC-level middlewares (executed before specific ones)
    exec := func(c *HandlerContext[T, any]) (any, error) { return final(c) }
    if len(rpcMws) > 0 {
      mwChain := append([]GlobalMiddlewareFunc[T](nil), rpcMws...)
      for i := len(mwChain) - 1; i >= 0; i-- {
        exec = mwChain[i](exec)
      }
    }

    // Wrap the chain with global middlewares (executed before RPC-level ones)
    if len(s.globalMiddlewares) > 0 {
      mwChain := append([]GlobalMiddlewareFunc[T](nil), s.globalMiddlewares...)
      for i := len(mwChain) - 1; i >= 0; i-- {
        exec = mwChain[i](exec)
      }
    }

    return exec(c)
  }

  // handleStreamRequest builds the per-request middleware chain for a stream, sets up SSE,
  // composes emit middlewares, and executes the stream handler.
  func (s *internalServer[T]) handleStreamRequest(
    c *HandlerContext[T, any],
    rpcName string,
    streamName string,
    rawInput json.RawMessage,
    httpAdapter HTTPAdapter,
  ) error {
    // Snapshot handler, middlewares, emit middlewares and deserializer under read lock
    s.handlersMu.RLock()
    baseHandler, ok := s.streamHandlers[rpcName][streamName]
    streamMws := s.streamMiddlewares[rpcName][streamName]
    emitMws := s.streamEmitMiddlewares[rpcName][streamName]
    rpcMws := s.rpcMiddlewares[rpcName]
    deserialize := s.streamDeserializers[rpcName][streamName]

    // Determine configuration (Precedence: Stream > RPC > Global)
    pingInterval := s.globalStreamConfig.PingInterval
    if cfg, ok := s.rpcStreamConfigs[rpcName]; ok && cfg.PingInterval > 0 {
      pingInterval = cfg.PingInterval
    }
    if cfg, ok := s.streamConfigs[rpcName][streamName]; ok && cfg.PingInterval > 0 {
      pingInterval = cfg.PingInterval
    }

    s.handlersMu.RUnlock()

    // Set SSE headers to the response
    httpAdapter.SetHeader("Content-Type", "text/event-stream")
    httpAdapter.SetHeader("Cache-Control", "no-cache")
    httpAdapter.SetHeader("Connection", "keep-alive")

    if !ok {
      return fmt.Errorf("%s.%s stream not implemented", rpcName, streamName)
    }
    if deserialize == nil {
      return fmt.Errorf("%s.%s stream deserializer not registered", rpcName, streamName)
    }

    // Deserialize, validate and transform input into its typed form
    typedInput, err := deserialize(rawInput)
    if err != nil {
      return err
    }
    c.Input = typedInput

    // We need to synchronize writes to the httpAdapter because pings run in a separate goroutine.
    // The closed flag prevents writes after the handler returns (when the response writer is invalid).
    var writeMu sync.Mutex
    var closed bool
    safeWrite := func(parts ...[]byte) error {
      writeMu.Lock()
      defer writeMu.Unlock()
      if closed {
        return nil
      }
      for _, part := range parts {
        if _, err := httpAdapter.Write(part); err != nil {
          return err
        }
      }
      return httpAdapter.Flush()
    }

    // Start Ping Loop, use a done channel to wait for goroutine exit before returning
    ctx, cancel := context.WithCancel(c.Context)
    pingDone := make(chan struct{})

    go func() {
      defer close(pingDone)
      ticker := time.NewTicker(pingInterval)
      defer ticker.Stop()
      for {
        select {
        case <-ctx.Done():
          return
        case <-ticker.C:
          _ = safeWrite([]byte(": ping\\n\\n"))
        }
      }
    }()

    // Ensure ping goroutine exits and mark response as closed before handler returns
    defer func() {
      cancel()
      <-pingDone
      writeMu.Lock()
      closed = true
      writeMu.Unlock()
    }()

    // Base emit writes SSE envelope with {ok:true, output}
    baseEmit := func(_ *HandlerContext[T, any], data any) error {
      response := Response[any]{
        Ok:     true,
        Output: data,
      }
      jsonData, err := json.Marshal(response)
      if err != nil {
        return fmt.Errorf("failed to marshal stream data: %w", err)
      }
      return safeWrite([]byte("data: "), jsonData, []byte("\\n\\n"))
    }

    // Compose emit middlewares (reverse registration order)
    emitFinal := baseEmit
    if len(emitMws) > 0 {
      mwChain := append([]EmitMiddlewareFunc[T, any, any](nil), emitMws...)
      for i := len(mwChain) - 1; i >= 0; i-- {
        emitFinal = mwChain[i](emitFinal)
      }
    }

    // Compose stream middlewares around the base handler (reverse order)
    final := baseHandler
    if len(streamMws) > 0 {
      mwChain := append([]StreamMiddlewareFunc[T, any, any](nil), streamMws...)
      for i := len(mwChain) - 1; i >= 0; i-- {
        final = mwChain[i](final)
      }
    }

    // Wrap the specific stream chain with RPC-level middlewares (executed before specific ones)
    exec := func(c *HandlerContext[T, any]) (any, error) { return nil, final(c, emitFinal) }
    if len(rpcMws) > 0 {
      mwChain := append([]GlobalMiddlewareFunc[T](nil), rpcMws...)
      for i := len(mwChain) - 1; i >= 0; i-- {
        exec = mwChain[i](exec)
      }
    }

    // Wrap with global middlewares (executed before RPC-level ones)
    if len(s.globalMiddlewares) > 0 {
      mwChain := append([]GlobalMiddlewareFunc[T](nil), s.globalMiddlewares...)
      for i := len(mwChain) - 1; i >= 0; i-- {
        exec = mwChain[i](exec)
      }
    }

    _, err = exec(c)
    return err
  }

  // writeProcResponse writes a procedure response to the client as JSON.
  // This helper method sets the appropriate Content-Type header and marshals
  // the response data before sending it to the client.
  //
  // Parameters:
  //   - httpAdapter: The HTTP adapter for writing the response
  //   - response: The response data to send to the client
  //
  // Returns an error if writing the response fails.
  func (s *internalServer[T]) writeProcResponse(
    httpAdapter HTTPAdapter,
    response Response[any],
  ) error {
    httpAdapter.SetHeader("Content-Type", "application/json")
    _, err := httpAdapter.Write(response.Bytes())
    if err != nil {
      return fmt.Errorf("failed to write response: %w", err)
    }
    return nil
  }

  // -----------------------------------------------------------------------------
  // Server Implementation
  // -----------------------------------------------------------------------------

	// Server provides a high-level, type-safe API for building a VDL RPC server.
  //
	// It exposes:
	//   - Procs: typed entries to register middlewares and the business handler per procedure
	//   - Streams: typed entries to register middlewares, emit middlewares and the handler per stream
	//   - Use: a global middleware API that runs for every operation (procedures and streams)
	//
	// The generic type parameter T is your application context (props) that flows through
	// the entire request lifecycle (authentication, per-request data, dependencies, etc.).
  type Server[T any] struct {
    intServer *internalServer[T]
    RPCs      *serverRPCRegistry[T]
  }

	// NewServer creates a new VDL RPC server instance ready to handle all
	// defined procedures and streams using the middleware-based architecture.
	//
	// The generic type parameter T is your application context (props) that flows through
	// the entire request lifecycle (authentication, per-request data, dependencies, etc.).
	//
	// Example:
  //
	//   type AppProps struct {
	//       UserID string
	//   }
	//   s := NewServer[AppProps]()
  func NewServer[T any]() *Server[T] {
    intServer := newInternalServer[T](VDLProcedures, VDLStreams)
    return &Server[T]{
      intServer: intServer,
      RPCs: newServerRPCRegistry(intServer),
    }
  }

	// Use registers a global middleware that executes for every request (procedures and streams).
	//
	// Middlewares are executed in registration order and can:
	//   - read/augment the HandlerContext
	//   - short-circuit by returning an error
	//   - call next to continue the chain
  func (s *Server[T]) Use(mw GlobalMiddlewareFunc[T]) {
    s.intServer.addGlobalMiddleware(mw)
  }

  // SetStreamConfig sets the global configuration for all streams.
	//
	// This applies to all streams unless overridden by RPC-level or stream-specific configurations (if set).
  func (s *Server[T]) SetStreamConfig(cfg StreamConfig) {
    s.intServer.setGlobalStreamConfig(cfg)
  }

  // SetErrorHandler sets a global error handler that intercepts and transforms errors
	// from all RPCs before sending them to the client.
	//
	// This handler applies to all RPCs unless a specific handler is registered for an RPC.
	func (s *Server[T]) SetErrorHandler(handler ErrorHandlerFunc[T]) {
    s.intServer.setGlobalErrorHandler(handler)
  }

  // HandleRequest processes an incoming RPC request and drives the complete
	// request lifecycle (parsing, middleware chains, handler dispatch, response).
	//
	// rpcName and operationName must be extracted from the request URL (e.g. /rpc/MyService/GetUser -> "MyService", "GetUser").
  //
	// httpAdapter bridges VDL RPC with your HTTP framework (use NewNetHTTPAdapter for net/http or compatible).
	//
	// Example (net/http):
  //
	//   http.HandleFunc("POST /rpc/{rpcName}/{operationName}", func(w http.ResponseWriter, r *http.Request) {
	//       ctx := r.Context()
	//       props := AppProps{UserID: "abc"}
	//       adapter := NewNetHTTPAdapter(w, r)
	//       _ = server.HandleRequest(ctx, props, r.PathValue("rpcName"), r.PathValue("operationName"), adapter)
	//   })
  func (s *Server[T]) HandleRequest(ctx context.Context, props T, rpcName string, operationName string, httpAdapter HTTPAdapter) error {
    return s.intServer.handleRequest(ctx, props, rpcName, operationName, httpAdapter)
  }

  // serverRPCRegistry provides typed access to register handlers and middlewares for procedures and streams within a specific RPC service.
  type serverRPCRegistry[T any] struct {
    intServer *internalServer[T]
  }

  // newServerRPCRegistry creates a new serverRPCRegistry for the given internal server instance.
  func newServerRPCRegistry[T any](intServer *internalServer[T]) *serverRPCRegistry[T] {
    return &serverRPCRegistry[T]{intServer: intServer}
  }
`
);

// src/stages/emit/files/server/generate.ts
function generateServerFile(context) {
  const body = joinSections([
    `package ${context.options.packageName}`,
    renderServerImports(context),
    renderCatalog(context),
    renderCoreRuntime(),
    SERVER_RUNTIME,
    renderServerServices(context.services)
  ]);
  return createGoFile("server.go", "", body);
}
__name(generateServerFile, "generateServerFile");
function renderServerImports(context) {
  const needsTypesImport = context.services.some(
    (service) => service.operations.some(
      (operation) => operation.inputTypeName || operation.outputTypeName
    )
  );
  const g = newGenerator().withTabs();
  g.line("import (");
  g.block(() => {
    g.line('"context"');
    g.line('"encoding/json"');
    g.line('"fmt"');
    g.line('"io"');
    g.line('"net/http"');
    g.line('"sync"');
    g.line('"time"');
    if (needsTypesImport) {
      g.break();
      g.line(`vdltypes ${renderGoString(context.options.typesImport)}`);
    }
  });
  g.line(")");
  return g.toString();
}
__name(renderServerImports, "renderServerImports");
function renderServerServices(services) {
  return services.map((service) => renderServerService(service)).join("\n\n");
}
__name(renderServerServices, "renderServerServices");
function renderServerService(service) {
  const rpcStructName = `server${service.goName}RPC`;
  const procsStructName = `server${service.goName}Procs`;
  const streamsStructName = `server${service.goName}Streams`;
  const g = newGenerator().withTabs();
  writeComment2(
    g,
    `${service.goName} returns the server registry for the ${service.name} RPC service.`,
    service.doc,
    service.deprecated
  );
  g.line(
    `func (r *serverRPCRegistry[T]) ${service.goName}() *${rpcStructName}[T] {`
  );
  g.block(() => {
    g.line(`return &${rpcStructName}[T]{`);
    g.block(() => {
      g.line("intServer: r.intServer,");
      g.line(`Procs: &${procsStructName}[T]{intServer: r.intServer},`);
      g.line(`Streams: &${streamsStructName}[T]{intServer: r.intServer},`);
    });
    g.line("}");
  });
  g.line("}");
  g.break();
  writeComment2(
    g,
    `${rpcStructName} groups the generated server registration APIs for the ${service.name} RPC service.`
  );
  g.line(`type ${rpcStructName}[T any] struct {`);
  g.block(() => {
    g.line("intServer *internalServer[T]");
    g.line(`Procs *${procsStructName}[T]`);
    g.line(`Streams *${streamsStructName}[T]`);
  });
  g.line("}");
  g.break();
  writeComment2(
    g,
    `Use registers middleware that runs for every request inside the ${service.name} RPC service.`
  );
  g.line(`func (r *${rpcStructName}[T]) Use(mw GlobalMiddlewareFunc[T]) {`);
  g.block(() => {
    g.line(`r.intServer.addRPCMiddleware(${renderGoString(service.name)}, mw)`);
  });
  g.line("}");
  g.break();
  writeComment2(
    g,
    `SetStreamConfig sets the default stream configuration for the ${service.name} RPC service.`
  );
  g.line(`func (r *${rpcStructName}[T]) SetStreamConfig(cfg StreamConfig) {`);
  g.block(() => {
    g.line(
      `r.intServer.setRPCStreamConfig(${renderGoString(service.name)}, cfg)`
    );
  });
  g.line("}");
  g.break();
  writeComment2(
    g,
    `SetErrorHandler sets the error handler for the ${service.name} RPC service.`
  );
  g.line(
    `func (r *${rpcStructName}[T]) SetErrorHandler(handler ErrorHandlerFunc[T]) {`
  );
  g.block(() => {
    g.line(
      `r.intServer.setRPCErrorHandler(${renderGoString(service.name)}, handler)`
    );
  });
  g.line("}");
  g.break();
  writeComment2(
    g,
    `${procsStructName} exposes the generated procedure registration APIs for the ${service.name} RPC service.`
  );
  g.line(`type ${procsStructName}[T any] struct {`);
  g.block(() => {
    g.line("intServer *internalServer[T]");
  });
  g.line("}");
  g.break();
  writeComment2(
    g,
    `${streamsStructName} exposes the generated stream registration APIs for the ${service.name} RPC service.`
  );
  g.line(`type ${streamsStructName}[T any] struct {`);
  g.block(() => {
    g.line("intServer *internalServer[T]");
  });
  g.line("}");
  for (const operation of service.procedures) {
    g.break();
    g.break();
    g.raw(renderServerProcedure(service, operation));
  }
  for (const operation of service.streams) {
    g.break();
    g.break();
    g.raw(renderServerStream(service, operation));
  }
  return g.toString();
}
__name(renderServerService, "renderServerService");
function renderServerProcedure(service, operation) {
  const registryName = `server${service.goName}Procs`;
  const entryName = `proc${operation.operationTypeName}Entry`;
  const handlerContextName = `${operation.operationTypeName}HandlerContext`;
  const handlerFuncName = `${operation.operationTypeName}HandlerFunc`;
  const middlewareFuncName = `${operation.operationTypeName}MiddlewareFunc`;
  const inputType = getServerInputType(operation);
  const outputType = getServerOutputType(operation);
  const g = newGenerator().withTabs();
  writeComment2(
    g,
    `${operation.goName} returns the registration entry for the ${service.name}.${operation.name} procedure.`,
    operation.doc,
    operation.deprecated
  );
  g.line(
    `func (r *${registryName}[T]) ${operation.goName}() ${entryName}[T] {`
  );
  g.block(() => {
    g.line(`return ${entryName}[T]{intServer: r.intServer}`);
  });
  g.line("}");
  g.break();
  writeComment2(
    g,
    `${entryName} contains the generated registration API for the ${service.name}.${operation.name} procedure.`
  );
  g.line(`type ${entryName}[T any] struct {`);
  g.block(() => {
    g.line("intServer *internalServer[T]");
  });
  g.line("}");
  g.break();
  writeComment2(
    g,
    `${handlerContextName} is the typed handler context passed to ${service.name}.${operation.name} procedure handlers.`
  );
  g.line(`type ${handlerContextName}[T any] = HandlerContext[T, ${inputType}]`);
  g.break();
  writeComment2(
    g,
    `${handlerFuncName} is the typed handler signature for the ${service.name}.${operation.name} procedure.`
  );
  g.line(
    `type ${handlerFuncName}[T any] func(c *${handlerContextName}[T]) (${outputType}, error)`
  );
  g.break();
  writeComment2(
    g,
    `${middlewareFuncName} is the typed middleware signature for the ${service.name}.${operation.name} procedure.`
  );
  g.line(
    `type ${middlewareFuncName}[T any] func(next ${handlerFuncName}[T]) ${handlerFuncName}[T]`
  );
  g.break();
  writeComment2(
    g,
    `Use registers typed middleware for the ${service.name}.${operation.name} procedure.`
  );
  g.line(`func (e ${entryName}[T]) Use(mw ${middlewareFuncName}[T]) {`);
  g.block(() => {
    g.line(
      `adapted := func(next ProcHandlerFunc[T, any, any]) ProcHandlerFunc[T, any, any] {`
    );
    g.block(() => {
      g.line(`return func(cGeneric *HandlerContext[T, any]) (any, error) {`);
      g.block(() => {
        g.line(
          `typedNext := func(c *${handlerContextName}[T]) (${outputType}, error) {`
        );
        g.block(() => {
          g.line("cGeneric.Props = c.Props");
          g.line("cGeneric.Input = c.Input");
          g.line("cGeneric.Annotations = cloneAnnotations(c.Annotations)");
          g.line("genericOutput, err := next(cGeneric)");
          g.line("if err != nil {");
          g.block(() => {
            g.line(`return ${outputType}{}, err`);
          });
          g.line("}");
          g.line(`typedOutput, _ := genericOutput.(${outputType})`);
          g.line("return typedOutput, nil");
        });
        g.line("}");
        g.line("typedChain := mw(typedNext)");
        g.line(`typedInput, _ := cGeneric.Input.(${inputType})`);
        g.line(`cSpecific := &${handlerContextName}[T]{`);
        g.block(() => {
          g.line("Props: cGeneric.Props,");
          g.line("Input: typedInput,");
          g.line("Context: cGeneric.Context,");
          g.line("Annotations: cloneAnnotations(cGeneric.Annotations),");
          g.line("operation: cGeneric.operation,");
        });
        g.line("}");
        g.line("return typedChain(cSpecific)");
      });
      g.line("}");
    });
    g.line("}");
    g.line(
      `e.intServer.addProcMiddleware(${renderGoString(service.name)}, ${renderGoString(operation.name)}, adapted)`
    );
  });
  g.line("}");
  g.break();
  writeComment2(
    g,
    `Handle registers the typed business handler for the ${service.name}.${operation.name} procedure.`
  );
  g.line(`func (e ${entryName}[T]) Handle(handler ${handlerFuncName}[T]) {`);
  g.block(() => {
    g.line(
      `adaptedHandler := func(cGeneric *HandlerContext[T, any]) (any, error) {`
    );
    g.block(() => {
      g.line(`typedInput, _ := cGeneric.Input.(${inputType})`);
      g.line(`cSpecific := &${handlerContextName}[T]{`);
      g.block(() => {
        g.line("Props: cGeneric.Props,");
        g.line("Input: typedInput,");
        g.line("Context: cGeneric.Context,");
        g.line("Annotations: cloneAnnotations(cGeneric.Annotations),");
        g.line("operation: cGeneric.operation,");
      });
      g.line("}");
      g.line("return handler(cSpecific)");
    });
    g.line("}");
    g.line(`deserializer := func(raw json.RawMessage) (any, error) {`);
    g.block(() => {
      if (operation.inputTypeName) {
        g.line(`var input ${inputType}`);
        g.line("if err := json.Unmarshal(raw, &input); err != nil {");
        g.block(() => {
          g.line(
            `return nil, fmt.Errorf("failed to unmarshal ${service.name}.${operation.name} input: %w", err)`
          );
        });
        g.line("}");
        g.line("return input, nil");
      } else {
        g.line("return Void{}, nil");
      }
    });
    g.line("}");
    g.line(
      `e.intServer.setProcHandler(${renderGoString(service.name)}, ${renderGoString(operation.name)}, adaptedHandler, deserializer)`
    );
  });
  g.line("}");
  return g.toString();
}
__name(renderServerProcedure, "renderServerProcedure");
function renderServerStream(service, operation) {
  const registryName = `server${service.goName}Streams`;
  const entryName = `stream${operation.operationTypeName}Entry`;
  const handlerContextName = `${operation.operationTypeName}HandlerContext`;
  const emitFuncName = `${operation.operationTypeName}EmitFunc`;
  const handlerFuncName = `${operation.operationTypeName}HandlerFunc`;
  const middlewareFuncName = `${operation.operationTypeName}MiddlewareFunc`;
  const emitMiddlewareFuncName = `${operation.operationTypeName}EmitMiddlewareFunc`;
  const inputType = getServerInputType(operation);
  const outputType = getServerOutputType(operation);
  const g = newGenerator().withTabs();
  writeComment2(
    g,
    `${operation.goName} returns the registration entry for the ${service.name}.${operation.name} stream.`,
    operation.doc,
    operation.deprecated
  );
  g.line(
    `func (r *${registryName}[T]) ${operation.goName}() ${entryName}[T] {`
  );
  g.block(() => {
    g.line(`return ${entryName}[T]{intServer: r.intServer}`);
  });
  g.line("}");
  g.break();
  writeComment2(
    g,
    `${entryName} contains the generated registration API for the ${service.name}.${operation.name} stream.`
  );
  g.line(`type ${entryName}[T any] struct {`);
  g.block(() => {
    g.line("intServer *internalServer[T]");
  });
  g.line("}");
  g.break();
  writeComment2(
    g,
    `${handlerContextName} is the typed handler context passed to ${service.name}.${operation.name} stream handlers.`
  );
  g.line(`type ${handlerContextName}[T any] = HandlerContext[T, ${inputType}]`);
  g.break();
  writeComment2(
    g,
    `${emitFuncName} is the typed emit signature for the ${service.name}.${operation.name} stream.`
  );
  g.line(
    `type ${emitFuncName}[T any] func(c *${handlerContextName}[T], output ${outputType}) error`
  );
  g.break();
  writeComment2(
    g,
    `${handlerFuncName} is the typed handler signature for the ${service.name}.${operation.name} stream.`
  );
  g.line(
    `type ${handlerFuncName}[T any] func(c *${handlerContextName}[T], emit ${emitFuncName}[T]) error`
  );
  g.break();
  writeComment2(
    g,
    `${middlewareFuncName} is the typed middleware signature for the ${service.name}.${operation.name} stream.`
  );
  g.line(
    `type ${middlewareFuncName}[T any] func(next ${handlerFuncName}[T]) ${handlerFuncName}[T]`
  );
  g.break();
  writeComment2(
    g,
    `${emitMiddlewareFuncName} is the typed emit middleware signature for the ${service.name}.${operation.name} stream.`
  );
  g.line(
    `type ${emitMiddlewareFuncName}[T any] func(next ${emitFuncName}[T]) ${emitFuncName}[T]`
  );
  g.break();
  writeComment2(
    g,
    `SetConfig overrides stream transport configuration for the ${service.name}.${operation.name} stream.`
  );
  g.line(`func (e ${entryName}[T]) SetConfig(cfg StreamConfig) {`);
  g.block(() => {
    g.line(
      `e.intServer.setStreamConfig(${renderGoString(service.name)}, ${renderGoString(operation.name)}, cfg)`
    );
  });
  g.line("}");
  g.break();
  writeComment2(
    g,
    `Use registers typed middleware for the ${service.name}.${operation.name} stream.`
  );
  g.line(`func (e ${entryName}[T]) Use(mw ${middlewareFuncName}[T]) {`);
  g.block(() => {
    g.line(
      `adapted := func(next StreamHandlerFunc[T, any, any]) StreamHandlerFunc[T, any, any] {`
    );
    g.block(() => {
      g.line(
        `return func(cGeneric *HandlerContext[T, any], emitGeneric EmitFunc[T, any, any]) error {`
      );
      g.block(() => {
        g.line(
          `typedNext := func(c *${handlerContextName}[T], emit ${emitFuncName}[T]) error {`
        );
        g.block(() => {
          g.line("cGeneric.Props = c.Props");
          g.line("cGeneric.Input = c.Input");
          g.line("cGeneric.Annotations = cloneAnnotations(c.Annotations)");
          g.line("return next(cGeneric, emitGeneric)");
        });
        g.line("}");
        g.line("typedChain := mw(typedNext)");
        g.line(
          `emitSpecific := func(c *${handlerContextName}[T], output ${outputType}) error {`
        );
        g.block(() => {
          g.line("cGeneric.Props = c.Props");
          g.line("cGeneric.Input = c.Input");
          g.line("cGeneric.Annotations = cloneAnnotations(c.Annotations)");
          g.line("return emitGeneric(cGeneric, output)");
        });
        g.line("}");
        g.line(`typedInput, _ := cGeneric.Input.(${inputType})`);
        g.line(`cSpecific := &${handlerContextName}[T]{`);
        g.block(() => {
          g.line("Props: cGeneric.Props,");
          g.line("Input: typedInput,");
          g.line("Context: cGeneric.Context,");
          g.line("Annotations: cloneAnnotations(cGeneric.Annotations),");
          g.line("operation: cGeneric.operation,");
        });
        g.line("}");
        g.line("return typedChain(cSpecific, emitSpecific)");
      });
      g.line("}");
    });
    g.line("}");
    g.line(
      `e.intServer.addStreamMiddleware(${renderGoString(service.name)}, ${renderGoString(operation.name)}, adapted)`
    );
  });
  g.line("}");
  g.break();
  writeComment2(
    g,
    `UseEmit registers typed emit middleware for the ${service.name}.${operation.name} stream.`
  );
  g.line(`func (e ${entryName}[T]) UseEmit(mw ${emitMiddlewareFuncName}[T]) {`);
  g.block(() => {
    g.line(
      `adapted := func(next EmitFunc[T, any, any]) EmitFunc[T, any, any] {`
    );
    g.block(() => {
      g.line(
        `return func(cGeneric *HandlerContext[T, any], outputGeneric any) error {`
      );
      g.block(() => {
        g.line(
          `typedNext := func(c *${handlerContextName}[T], output ${outputType}) error {`
        );
        g.block(() => {
          g.line("cGeneric.Props = c.Props");
          g.line("cGeneric.Input = c.Input");
          g.line("cGeneric.Annotations = cloneAnnotations(c.Annotations)");
          g.line("return next(cGeneric, output)");
        });
        g.line("}");
        g.line("emitChain := mw(typedNext)");
        g.line(`typedInput, _ := cGeneric.Input.(${inputType})`);
        g.line(`typedOutput, _ := outputGeneric.(${outputType})`);
        g.line(`cSpecific := &${handlerContextName}[T]{`);
        g.block(() => {
          g.line("Props: cGeneric.Props,");
          g.line("Input: typedInput,");
          g.line("Context: cGeneric.Context,");
          g.line("Annotations: cloneAnnotations(cGeneric.Annotations),");
          g.line("operation: cGeneric.operation,");
        });
        g.line("}");
        g.line("return emitChain(cSpecific, typedOutput)");
      });
      g.line("}");
    });
    g.line("}");
    g.line(
      `e.intServer.addStreamEmitMiddleware(${renderGoString(service.name)}, ${renderGoString(operation.name)}, adapted)`
    );
  });
  g.line("}");
  g.break();
  writeComment2(
    g,
    `Handle registers the typed business handler for the ${service.name}.${operation.name} stream.`
  );
  g.line(`func (e ${entryName}[T]) Handle(handler ${handlerFuncName}[T]) {`);
  g.block(() => {
    g.line(
      `adaptedHandler := func(cGeneric *HandlerContext[T, any], emitGeneric EmitFunc[T, any, any]) error {`
    );
    g.block(() => {
      g.line(
        `emitSpecific := func(c *${handlerContextName}[T], output ${outputType}) error {`
      );
      g.block(() => {
        g.line("cGeneric.Props = c.Props");
        g.line("cGeneric.Input = c.Input");
        g.line("cGeneric.Annotations = cloneAnnotations(c.Annotations)");
        g.line("return emitGeneric(cGeneric, output)");
      });
      g.line("}");
      g.line(`typedInput, _ := cGeneric.Input.(${inputType})`);
      g.line(`cSpecific := &${handlerContextName}[T]{`);
      g.block(() => {
        g.line("Props: cGeneric.Props,");
        g.line("Input: typedInput,");
        g.line("Context: cGeneric.Context,");
        g.line("Annotations: cloneAnnotations(cGeneric.Annotations),");
        g.line("operation: cGeneric.operation,");
      });
      g.line("}");
      g.line("return handler(cSpecific, emitSpecific)");
    });
    g.line("}");
    g.line(`deserializer := func(raw json.RawMessage) (any, error) {`);
    g.block(() => {
      if (operation.inputTypeName) {
        g.line(`var input ${inputType}`);
        g.line("if err := json.Unmarshal(raw, &input); err != nil {");
        g.block(() => {
          g.line(
            `return nil, fmt.Errorf("failed to unmarshal ${service.name}.${operation.name} input: %w", err)`
          );
        });
        g.line("}");
        g.line("return input, nil");
      } else {
        g.line("return Void{}, nil");
      }
    });
    g.line("}");
    g.line(
      `e.intServer.setStreamHandler(${renderGoString(service.name)}, ${renderGoString(operation.name)}, adaptedHandler, deserializer)`
    );
  });
  g.line("}");
  return g.toString();
}
__name(renderServerStream, "renderServerStream");
function writeComment2(g, summary, doc, deprecated) {
  g.raw(renderCommentBlock({ summary, doc, deprecated }));
  g.break();
}
__name(writeComment2, "writeComment");
function getServerInputType(operation) {
  return operation.inputTypeName ? `vdltypes.${operation.inputTypeName}` : "Void";
}
__name(getServerInputType, "getServerInputType");
function getServerOutputType(operation) {
  return operation.outputTypeName ? `vdltypes.${operation.outputTypeName}` : "Void";
}
__name(getServerOutputType, "getServerOutputType");

// src/stages/emit/generate-files.ts
function generateFiles(context) {
  if (context.procedures.length === 0 && context.streams.length === 0) {
    return [];
  }
  return [
    context.options.target === "client" ? generateClientFile(context) : generateServerFile(context)
  ];
}
__name(generateFiles, "generateFiles");

// node_modules/@varavel/vdl-plugin-sdk/dist/utils/ir/get-annotation.js
function getAnnotation(annotations, name) {
  if (!annotations) return void 0;
  return annotations.find((anno) => anno.name === name);
}
__name(getAnnotation, "getAnnotation");

// node_modules/@varavel/vdl-plugin-sdk/dist/utils/ir/get-annotation-arg.js
function getAnnotationArg(annotations, name) {
  const anno = getAnnotation(annotations, name);
  return anno === null || anno === void 0 ? void 0 : anno.argument;
}
__name(getAnnotationArg, "getAnnotationArg");

// node_modules/@varavel/vdl-plugin-sdk/dist/utils/ir/unwrap-literal.js
function unwrapLiteral(value) {
  return unwrapLiteralValue(value);
}
__name(unwrapLiteral, "unwrapLiteral");
function unwrapLiteralValue(value) {
  switch (value.kind) {
    case "string":
      return value.stringValue;
    case "int":
      return value.intValue;
    case "float":
      return value.floatValue;
    case "bool":
      return value.boolValue;
    case "object": {
      var _value$objectEntries;
      const resolvedObject = {};
      const entries = (_value$objectEntries = value.objectEntries) !== null && _value$objectEntries !== void 0 ? _value$objectEntries : [];
      for (const entry of entries) resolvedObject[entry.key] = unwrapLiteralValue(entry.value);
      return resolvedObject;
    }
    case "array":
      var _value$arrayItems;
      return ((_value$arrayItems = value.arrayItems) !== null && _value$arrayItems !== void 0 ? _value$arrayItems : []).map((item) => unwrapLiteralValue(item));
    default:
      return null;
  }
}
__name(unwrapLiteralValue, "unwrapLiteralValue");

// src/shared/naming.ts
var GO_KEYWORDS = /* @__PURE__ */ new Set([
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
  "var"
]);
var GO_PACKAGE_RE = /^[a-z_][a-z0-9_]*$/;
function isGoKeyword(value) {
  return GO_KEYWORDS.has(value);
}
__name(isGoKeyword, "isGoKeyword");
function isValidGoPackageName(value) {
  return GO_PACKAGE_RE.test(value) && !isGoKeyword(value);
}
__name(isValidGoPackageName, "isValidGoPackageName");
function toGoTypeName(value) {
  return escapeGoIdentifier(pascalCase(value));
}
__name(toGoTypeName, "toGoTypeName");
function toGoFieldName(value) {
  return escapeGoIdentifier(pascalCase(value));
}
__name(toGoFieldName, "toGoFieldName");
function toInlineTypeName(parentTypeName, fieldName) {
  return `${parentTypeName}${toGoFieldName(fieldName)}`;
}
__name(toInlineTypeName, "toInlineTypeName");
function escapeGoIdentifier(value) {
  return isGoKeyword(value) ? `${value}_` : value;
}
__name(escapeGoIdentifier, "escapeGoIdentifier");

// src/stages/model/build-context.ts
function createGeneratorContext(options) {
  const services = [];
  for (const typeDef of options.input.ir.types) {
    if (!getAnnotation(typeDef.annotations, "rpc")) {
      continue;
    }
    services.push(buildServiceDescriptor(typeDef));
  }
  const procedures = [];
  const streams = [];
  for (const service of services) {
    procedures.push(...service.procedures);
    streams.push(...service.streams);
  }
  return {
    errors: [],
    context: {
      input: options.input,
      schema: options.input.ir,
      options: options.generatorOptions,
      services,
      procedures,
      streams
    }
  };
}
__name(createGeneratorContext, "createGeneratorContext");
function buildServiceDescriptor(typeDef) {
  var _a2;
  const operations = [];
  for (const field of (_a2 = typeDef.typeRef.objectFields) != null ? _a2 : []) {
    const operation = buildOperationDescriptor(typeDef, field);
    if (operation) {
      operations.push(operation);
    }
  }
  return {
    name: typeDef.name,
    goName: toGoTypeName(typeDef.name),
    position: typeDef.position,
    doc: typeDef.doc,
    deprecated: getDeprecatedMessage(typeDef.annotations),
    annotations: typeDef.annotations,
    operations,
    procedures: operations.filter((operation) => operation.kind === "proc"),
    streams: operations.filter((operation) => operation.kind === "stream")
  };
}
__name(buildServiceDescriptor, "buildServiceDescriptor");
function buildOperationDescriptor(serviceType, field) {
  const isProc = Boolean(getAnnotation(field.annotations, "proc"));
  const isStream = Boolean(getAnnotation(field.annotations, "stream"));
  if (!isProc && !isStream) {
    return void 0;
  }
  if (isProc && isStream) {
    return void 0;
  }
  const inputField = findOperationField(field, "input");
  const outputField = findOperationField(field, "output");
  const rpcGoName = toGoTypeName(serviceType.name);
  const goName = toGoFieldName(field.name);
  const operationTypeName = toInlineTypeName(rpcGoName, field.name);
  return {
    kind: isProc ? "proc" : "stream",
    rpcName: serviceType.name,
    rpcGoName,
    name: field.name,
    goName,
    operationTypeName,
    inputTypeName: inputField ? toInlineTypeName(operationTypeName, inputField.name) : void 0,
    outputTypeName: outputField ? toInlineTypeName(operationTypeName, outputField.name) : void 0,
    position: field.position,
    doc: field.doc,
    deprecated: getDeprecatedMessage(field.annotations),
    annotations: filterOperationalAnnotations(
      field.annotations,
      isProc ? "proc" : "stream"
    ),
    inputField,
    outputField
  };
}
__name(buildOperationDescriptor, "buildOperationDescriptor");
function findOperationField(operationField, name) {
  var _a2;
  return (_a2 = operationField.typeRef.objectFields) == null ? void 0 : _a2.find(
    (field) => field.name === name
  );
}
__name(findOperationField, "findOperationField");
function getDeprecatedMessage(annotations) {
  const argument = getAnnotationArg(annotations, "deprecated");
  if (!getAnnotation(annotations, "deprecated")) {
    return void 0;
  }
  if (!argument) {
    return "";
  }
  return unwrapLiteral(argument);
}
__name(getDeprecatedMessage, "getDeprecatedMessage");
function filterOperationalAnnotations(annotations, kind) {
  return annotations.filter((annotation) => annotation.name !== kind);
}
__name(filterOperationalAnnotations, "filterOperationalAnnotations");

// node_modules/@varavel/vdl-plugin-sdk/dist/utils/options/get-option-string.js
function getOptionString(options, key, defaultValue) {
  const value = options === null || options === void 0 ? void 0 : options[key];
  return value === void 0 ? defaultValue : value;
}
__name(getOptionString, "getOptionString");

// src/stages/options/resolve.ts
var DEFAULT_PACKAGE_NAME = "vdlrpc";
function resolveGeneratorOptions(input) {
  const packageName = getOptionString(input.options, "package", DEFAULT_PACKAGE_NAME).trim();
  const typesImport = getOptionString(input.options, "typesImport", "").trim();
  const targetRaw = getOptionString(input.options, "target", "").trim();
  const target = isGeneratorTarget(targetRaw) ? targetRaw : void 0;
  const errors = [];
  if (!typesImport) {
    errors.push({
      message: 'Missing required option "typesImport". Point it to the Go package generated by varavelio/vdl-plugin-go plugin.'
    });
  }
  if (!target) {
    errors.push({
      message: 'Missing or invalid option "target". Use either "client" or "server".'
    });
  }
  if (!packageName) {
    errors.push({
      message: 'Option "package" cannot be empty when provided.'
    });
  } else if (!isValidGoPackageName(packageName)) {
    errors.push({
      message: `Invalid Go package name ${JSON.stringify(packageName)}. Use a lowercase Go identifier.`
    });
  }
  if (errors.length > 0 || !target) {
    return { errors };
  }
  return {
    errors: [],
    options: {
      packageName,
      target,
      typesImport
    }
  };
}
__name(resolveGeneratorOptions, "resolveGeneratorOptions");
function isGeneratorTarget(value) {
  return value === "client" || value === "server";
}
__name(isGeneratorTarget, "isGeneratorTarget");

// src/generate.ts
function generate(input) {
  try {
    const optionsResult = resolveGeneratorOptions(input);
    if (optionsResult.errors.length > 0 || !optionsResult.options) {
      return { errors: optionsResult.errors };
    }
    const rpcValidationErrors = validateIrForRpc(input.ir);
    if (rpcValidationErrors) {
      return { errors: rpcValidationErrors };
    }
    const contextResult = createGeneratorContext({
      input,
      generatorOptions: optionsResult.options
    });
    if (contextResult.errors.length > 0 || !contextResult.context) {
      return { errors: contextResult.errors };
    }
    return {
      files: generateFiles(contextResult.context)
    };
  } catch (error) {
    return {
      errors: [toPluginOutputError(error)]
    };
  }
}
__name(generate, "generate");

// src/index.ts
var generate2 = definePlugin((input) => generate(input));
