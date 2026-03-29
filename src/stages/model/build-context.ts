import type {
  Annotation,
  Field,
  PluginInput,
  PluginOutputError,
  Position,
  TypeDef,
} from "@varavel/vdl-plugin-sdk";
import {
  getAnnotation,
  getAnnotationArg,
  unwrapLiteral,
} from "@varavel/vdl-plugin-sdk/utils/ir";
import {
  toGoFieldName,
  toGoTypeName,
  toInlineTypeName,
} from "../../shared/naming";
import type {
  GeneratorContext,
  GeneratorOptions,
  OperationDescriptor,
  OperationKind,
  ServiceDescriptor,
} from "./types";

/**
 * Builds the intermediate RPC generation context from the annotation-based IR.
 */
export function createGeneratorContext(options: {
  input: PluginInput;
  generatorOptions: GeneratorOptions;
}): { context?: GeneratorContext; errors: PluginOutputError[] } {
  const services: ServiceDescriptor[] = [];
  const errors: PluginOutputError[] = [];

  for (const typeDef of options.input.ir.types) {
    if (!getAnnotation(typeDef.annotations, "rpc")) {
      continue;
    }

    const service = buildServiceDescriptor(typeDef, errors);
    if (service) {
      services.push(service);
    }
  }

  if (errors.length > 0) {
    return { errors };
  }

  const procedures: OperationDescriptor[] = [];
  const streams: OperationDescriptor[] = [];

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
      streams,
    },
  };
}

/**
 * Converts a `@rpc`-annotated type into a service descriptor.
 */
function buildServiceDescriptor(
  typeDef: TypeDef,
  errors: PluginOutputError[],
): ServiceDescriptor | undefined {
  if (typeDef.typeRef.kind !== "object") {
    errors.push({
      message: `@rpc type ${JSON.stringify(typeDef.name)} must be an object type.`,
      position: typeDef.position,
    });
    return undefined;
  }

  const operations: OperationDescriptor[] = [];

  for (const field of typeDef.typeRef.objectFields ?? []) {
    const operation = buildOperationDescriptor(typeDef, field, errors);
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
    streams: operations.filter((operation) => operation.kind === "stream"),
  };
}

/**
 * Converts a `@proc` or `@stream` field into an operation descriptor.
 */
function buildOperationDescriptor(
  serviceType: TypeDef,
  field: Field,
  errors: PluginOutputError[],
): OperationDescriptor | undefined {
  const isProc = Boolean(getAnnotation(field.annotations, "proc"));
  const isStream = Boolean(getAnnotation(field.annotations, "stream"));

  if (!isProc && !isStream) {
    return undefined;
  }

  if (isProc && isStream) {
    errors.push({
      message: `Operation ${JSON.stringify(serviceType.name)}.${JSON.stringify(field.name)} cannot be annotated with both @proc and @stream.`,
      position: field.position,
    });
    return undefined;
  }

  if (field.typeRef.kind !== "object") {
    errors.push({
      message: `@${isProc ? "proc" : "stream"} field ${JSON.stringify(serviceType.name)}.${JSON.stringify(field.name)} must be an object type.`,
      position: field.position,
    });
    return undefined;
  }

  const inputField = findOperationField(field, "input");
  const outputField = findOperationField(field, "output");

  if (inputField && inputField.typeRef.kind !== "object") {
    errors.push({
      message: `Operation ${JSON.stringify(serviceType.name)}.${JSON.stringify(field.name)} input must be an object type.`,
      position: fallbackPosition(inputField.position, field.position),
    });
    return undefined;
  }

  if (outputField && outputField.typeRef.kind !== "object") {
    errors.push({
      message: `Operation ${JSON.stringify(serviceType.name)}.${JSON.stringify(field.name)} output must be an object type.`,
      position: fallbackPosition(outputField.position, field.position),
    });
    return undefined;
  }

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
    inputTypeName: inputField
      ? toInlineTypeName(operationTypeName, inputField.name)
      : undefined,
    outputTypeName: outputField
      ? toInlineTypeName(operationTypeName, outputField.name)
      : undefined,
    position: field.position,
    doc: field.doc,
    deprecated: getDeprecatedMessage(field.annotations),
    annotations: filterOperationalAnnotations(
      field.annotations,
      isProc ? "proc" : "stream",
    ),
    inputField,
    outputField,
  };
}

/**
 * Finds the named `input` or `output` field inside an operation object.
 */
function findOperationField(
  operationField: Field,
  name: string,
): Field | undefined {
  return operationField.typeRef.objectFields?.find(
    (field) => field.name === name,
  );
}

/**
 * Extracts the deprecation message from an annotation list when present.
 */
function getDeprecatedMessage(annotations: Annotation[]): string | undefined {
  const argument = getAnnotationArg(annotations, "deprecated");
  if (!getAnnotation(annotations, "deprecated")) {
    return undefined;
  }

  if (!argument) {
    return "";
  }

  return unwrapLiteral<string>(argument);
}

/**
 * Removes the marker annotation itself and keeps the remaining operation annotations.
 */
function filterOperationalAnnotations(
  annotations: Annotation[],
  kind: OperationKind,
): Annotation[] {
  return annotations.filter((annotation) => annotation.name !== kind);
}

/**
 * Uses a fallback position when inline IR nodes do not carry a file path.
 */
function fallbackPosition(
  primary: Position | undefined,
  fallback: Position,
): Position {
  if (!primary) {
    return fallback;
  }

  if (!primary.file) {
    return {
      ...primary,
      file: fallback.file,
    };
  }

  return primary;
}
