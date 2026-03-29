import { dedent } from "@varavel/vdl-plugin-sdk/utils/strings";

/**
 * Renders the shared Go runtime used by both generated targets.
 */
export function renderCoreRuntime(): string {
  return dedent(/* go */ `
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
  `);
}
