import type {
  Annotation,
  LiteralValue,
  PluginOutputFile,
} from "@varavel/vdl-plugin-sdk";
import { dedent } from "@varavel/vdl-plugin-sdk/utils/strings";
import type { OperationDescriptor, ServiceDescriptor } from "../model/types";

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
  const summary =
    constName === "VDLProcedures"
      ? "VDLProcedures contains every generated procedure definition."
      : "VDLStreams contains every generated stream definition.";

  if (operations.length === 0) {
    return joinSections([
      renderCommentBlock({ summary }),
      `var ${constName} = []OperationDefinition{}`,
    ]);
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

  return joinSections([
    renderCommentBlock({ summary }),
    [
      `var ${constName} = []OperationDefinition{`,
      indent(entries.join("\n")),
      "}",
    ].join("\n"),
  ]);
}

/**
 * Renders a nested catalog of generated operation paths.
 */
export function renderPathCatalog(services: ServiceDescriptor[]): string {
  const serviceFields = services.map((service) => {
    const operationFields = service.operations
      .map((operation) => `${operation.goName} string`)
      .join("\n");

    return `${service.goName} struct {\n${indent(operationFields)}\n}`;
  });

  const serviceValues = services.map((service) => {
    const operationValues = service.operations
      .map(
        (operation) =>
          `${operation.goName}: ${renderGoString(`/${service.name}/${operation.name}`)},`,
      )
      .join("\n");
    const operationType = [
      "struct {",
      indent(
        service.operations
          .map((operation) => `${operation.goName} string`)
          .join("\n"),
      ),
      "}",
    ].join("\n");

    return [
      `${service.goName}: ${operationType}{`,
      indent(operationValues),
      "},",
    ].join("\n");
  });

  return joinSections([
    renderCommentBlock({
      summary:
        "VDLPaths contains the generated path catalog for every procedure and stream.",
    }),
    [
      "var VDLPaths = struct {",
      indent(serviceFields.join("\n")),
      "}{",
      indent(serviceValues.join("\n")),
      "}",
    ].join("\n"),
  ]);
}

/**
 * Renders the shared Go runtime used by both generated targets.
 */
export function renderCoreRuntime(): string {
  return dedent(/* go */ `
    // -----------------------------------------------------------------------------
    // Core Types
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
  `);
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
