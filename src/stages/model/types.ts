import type {
  Annotation,
  Field,
  IrSchema,
  PluginInput,
  Position,
} from "@varavel/vdl-plugin-sdk";

/**
 * Supported generator target values.
 */
export type GeneratorTarget = "client" | "server";

/**
 * Resolved plugin options used by later generation stages.
 */
export type GeneratorOptions = {
  packageName: string;
  target: GeneratorTarget;
  typesImport: string;
};

/**
 * Supported RPC operation kinds.
 */
export type OperationKind = "proc" | "stream";

/**
 * Structured descriptor for a procedure or stream discovered in the IR.
 */
export type OperationDescriptor = {
  kind: OperationKind;
  rpcName: string;
  rpcGoName: string;
  name: string;
  goName: string;
  operationTypeName: string;
  inputTypeName: string;
  outputTypeName: string;
  position: Position;
  doc?: string;
  deprecated?: string;
  annotations: Annotation[];
  inputField: Field;
  outputField: Field;
};

/**
 * Structured descriptor for an annotation-based RPC service.
 */
export type ServiceDescriptor = {
  name: string;
  goName: string;
  position: Position;
  doc?: string;
  deprecated?: string;
  annotations: Annotation[];
  operations: OperationDescriptor[];
  procedures: OperationDescriptor[];
  streams: OperationDescriptor[];
};

/**
 * Canonical generation context shared by emission stages.
 */
export type GeneratorContext = {
  input: PluginInput;
  schema: IrSchema;
  options: GeneratorOptions;
  services: ServiceDescriptor[];
  procedures: OperationDescriptor[];
  streams: OperationDescriptor[];
};
