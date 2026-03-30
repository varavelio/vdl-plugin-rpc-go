import { newGenerator } from "@varavel/gen";
import type { PluginOutputFile } from "@varavel/vdl-plugin-sdk";
import type {
  GeneratorContext,
  OperationDescriptor,
  ServiceDescriptor,
} from "../../../model/types";
import {
  createGoFile,
  joinSections,
  renderCatalog,
  renderCommentBlock,
  renderCoreRuntime,
  renderGoString,
} from "../../shared/index";
import { SERVER_RUNTIME } from "./runtime";

/**
 * Generates the Go server file for the prepared RPC context.
 */
export function generateServerFile(
  context: GeneratorContext,
): PluginOutputFile {
  const body = joinSections([
    `package ${context.options.packageName}`,
    renderServerImports(context),
    renderCatalog(context),
    renderCoreRuntime(),
    SERVER_RUNTIME,
    renderServerServices(context.services),
  ]);

  return createGoFile("server.go", "", body);
}

/**
 * Renders the import block required by the generated server runtime.
 */
function renderServerImports(context: GeneratorContext): string {
  const needsTypesImport = context.services.some((service) =>
    service.operations.some(
      (operation) => operation.inputTypeName || operation.outputTypeName,
    ),
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

/**
 * Renders all service registries and typed operation adapters for the server target.
 */
function renderServerServices(services: ServiceDescriptor[]): string {
  return services.map((service) => renderServerService(service)).join("\n\n");
}

/**
 * Renders the generated server API for a single RPC service.
 */
function renderServerService(service: ServiceDescriptor): string {
  const rpcStructName = `server${service.goName}RPC`;
  const procsStructName = `server${service.goName}Procs`;
  const streamsStructName = `server${service.goName}Streams`;

  const g = newGenerator().withTabs();

  writeComment(
    g,
    `${service.goName} returns the server registry for the ${service.name} RPC service.`,
    service.doc,
    service.deprecated,
  );
  g.line(
    `func (r *serverRPCRegistry[T]) ${service.goName}() *${rpcStructName}[T] {`,
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

  writeComment(
    g,
    `${rpcStructName} groups the generated server registration APIs for the ${service.name} RPC service.`,
  );
  g.line(`type ${rpcStructName}[T any] struct {`);
  g.block(() => {
    g.line("intServer *internalServer[T]");
    g.line(`Procs *${procsStructName}[T]`);
    g.line(`Streams *${streamsStructName}[T]`);
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `Use registers middleware that runs for every request inside the ${service.name} RPC service.`,
  );
  g.line(`func (r *${rpcStructName}[T]) Use(mw GlobalMiddlewareFunc[T]) {`);
  g.block(() => {
    g.line(`r.intServer.addRPCMiddleware(${renderGoString(service.name)}, mw)`);
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `SetStreamConfig sets the default stream configuration for the ${service.name} RPC service.`,
  );
  g.line(`func (r *${rpcStructName}[T]) SetStreamConfig(cfg StreamConfig) {`);
  g.block(() => {
    g.line(
      `r.intServer.setRPCStreamConfig(${renderGoString(service.name)}, cfg)`,
    );
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `SetErrorHandler sets the error handler for the ${service.name} RPC service.`,
  );
  g.line(
    `func (r *${rpcStructName}[T]) SetErrorHandler(handler ErrorHandlerFunc[T]) {`,
  );
  g.block(() => {
    g.line(
      `r.intServer.setRPCErrorHandler(${renderGoString(service.name)}, handler)`,
    );
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `${procsStructName} exposes the generated procedure registration APIs for the ${service.name} RPC service.`,
  );
  g.line(`type ${procsStructName}[T any] struct {`);
  g.block(() => {
    g.line("intServer *internalServer[T]");
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `${streamsStructName} exposes the generated stream registration APIs for the ${service.name} RPC service.`,
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

/**
 * Renders the typed server adapter for a single procedure.
 */
function renderServerProcedure(
  service: ServiceDescriptor,
  operation: OperationDescriptor,
): string {
  const registryName = `server${service.goName}Procs`;
  const entryName = `proc${operation.operationTypeName}Entry`;
  const handlerContextName = `${operation.operationTypeName}HandlerContext`;
  const handlerFuncName = `${operation.operationTypeName}HandlerFunc`;
  const middlewareFuncName = `${operation.operationTypeName}MiddlewareFunc`;
  const inputType = getServerInputType(operation);
  const outputType = getServerOutputType(operation);

  const g = newGenerator().withTabs();
  writeComment(
    g,
    `${operation.goName} returns the registration entry for the ${service.name}.${operation.name} procedure.`,
    operation.doc,
    operation.deprecated,
  );
  g.line(
    `func (r *${registryName}[T]) ${operation.goName}() ${entryName}[T] {`,
  );
  g.block(() => {
    g.line(`return ${entryName}[T]{intServer: r.intServer}`);
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `${entryName} contains the generated registration API for the ${service.name}.${operation.name} procedure.`,
  );
  g.line(`type ${entryName}[T any] struct {`);
  g.block(() => {
    g.line("intServer *internalServer[T]");
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `${handlerContextName} is the typed handler context passed to ${service.name}.${operation.name} procedure handlers.`,
  );
  g.line(`type ${handlerContextName}[T any] = HandlerContext[T, ${inputType}]`);
  g.break();

  writeComment(
    g,
    `${handlerFuncName} is the typed handler signature for the ${service.name}.${operation.name} procedure.`,
  );
  g.line(
    `type ${handlerFuncName}[T any] func(c *${handlerContextName}[T]) (${outputType}, error)`,
  );
  g.break();

  writeComment(
    g,
    `${middlewareFuncName} is the typed middleware signature for the ${service.name}.${operation.name} procedure.`,
  );
  g.line(
    `type ${middlewareFuncName}[T any] func(next ${handlerFuncName}[T]) ${handlerFuncName}[T]`,
  );
  g.break();

  writeComment(
    g,
    `Use registers typed middleware for the ${service.name}.${operation.name} procedure.`,
  );
  g.line(`func (e ${entryName}[T]) Use(mw ${middlewareFuncName}[T]) {`);
  g.block(() => {
    g.line(
      `adapted := func(next ProcHandlerFunc[T, any, any]) ProcHandlerFunc[T, any, any] {`,
    );
    g.block(() => {
      g.line(`return func(cGeneric *HandlerContext[T, any]) (any, error) {`);
      g.block(() => {
        g.line(
          `typedNext := func(c *${handlerContextName}[T]) (${outputType}, error) {`,
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
      `e.intServer.addProcMiddleware(${renderGoString(service.name)}, ${renderGoString(operation.name)}, adapted)`,
    );
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `Handle registers the typed business handler for the ${service.name}.${operation.name} procedure.`,
  );
  g.line(`func (e ${entryName}[T]) Handle(handler ${handlerFuncName}[T]) {`);
  g.block(() => {
    g.line(
      `adaptedHandler := func(cGeneric *HandlerContext[T, any]) (any, error) {`,
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
            `return nil, fmt.Errorf("failed to unmarshal ${service.name}.${operation.name} input: %w", err)`,
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
      `e.intServer.setProcHandler(${renderGoString(service.name)}, ${renderGoString(operation.name)}, adaptedHandler, deserializer)`,
    );
  });
  g.line("}");
  return g.toString();
}

/**
 * Renders the typed server adapter for a single stream.
 */
function renderServerStream(
  service: ServiceDescriptor,
  operation: OperationDescriptor,
): string {
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
  writeComment(
    g,
    `${operation.goName} returns the registration entry for the ${service.name}.${operation.name} stream.`,
    operation.doc,
    operation.deprecated,
  );
  g.line(
    `func (r *${registryName}[T]) ${operation.goName}() ${entryName}[T] {`,
  );
  g.block(() => {
    g.line(`return ${entryName}[T]{intServer: r.intServer}`);
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `${entryName} contains the generated registration API for the ${service.name}.${operation.name} stream.`,
  );
  g.line(`type ${entryName}[T any] struct {`);
  g.block(() => {
    g.line("intServer *internalServer[T]");
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `${handlerContextName} is the typed handler context passed to ${service.name}.${operation.name} stream handlers.`,
  );
  g.line(`type ${handlerContextName}[T any] = HandlerContext[T, ${inputType}]`);
  g.break();

  writeComment(
    g,
    `${emitFuncName} is the typed emit signature for the ${service.name}.${operation.name} stream.`,
  );
  g.line(
    `type ${emitFuncName}[T any] func(c *${handlerContextName}[T], output ${outputType}) error`,
  );
  g.break();

  writeComment(
    g,
    `${handlerFuncName} is the typed handler signature for the ${service.name}.${operation.name} stream.`,
  );
  g.line(
    `type ${handlerFuncName}[T any] func(c *${handlerContextName}[T], emit ${emitFuncName}[T]) error`,
  );
  g.break();

  writeComment(
    g,
    `${middlewareFuncName} is the typed middleware signature for the ${service.name}.${operation.name} stream.`,
  );
  g.line(
    `type ${middlewareFuncName}[T any] func(next ${handlerFuncName}[T]) ${handlerFuncName}[T]`,
  );
  g.break();

  writeComment(
    g,
    `${emitMiddlewareFuncName} is the typed emit middleware signature for the ${service.name}.${operation.name} stream.`,
  );
  g.line(
    `type ${emitMiddlewareFuncName}[T any] func(next ${emitFuncName}[T]) ${emitFuncName}[T]`,
  );
  g.break();

  writeComment(
    g,
    `SetConfig overrides stream transport configuration for the ${service.name}.${operation.name} stream.`,
  );
  g.line(`func (e ${entryName}[T]) SetConfig(cfg StreamConfig) {`);
  g.block(() => {
    g.line(
      `e.intServer.setStreamConfig(${renderGoString(service.name)}, ${renderGoString(operation.name)}, cfg)`,
    );
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `Use registers typed middleware for the ${service.name}.${operation.name} stream.`,
  );
  g.line(`func (e ${entryName}[T]) Use(mw ${middlewareFuncName}[T]) {`);
  g.block(() => {
    g.line(
      `adapted := func(next StreamHandlerFunc[T, any, any]) StreamHandlerFunc[T, any, any] {`,
    );
    g.block(() => {
      g.line(
        `return func(cGeneric *HandlerContext[T, any], emitGeneric EmitFunc[T, any, any]) error {`,
      );
      g.block(() => {
        g.line(
          `typedNext := func(c *${handlerContextName}[T], emit ${emitFuncName}[T]) error {`,
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
          `emitSpecific := func(c *${handlerContextName}[T], output ${outputType}) error {`,
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
      `e.intServer.addStreamMiddleware(${renderGoString(service.name)}, ${renderGoString(operation.name)}, adapted)`,
    );
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `UseEmit registers typed emit middleware for the ${service.name}.${operation.name} stream.`,
  );
  g.line(`func (e ${entryName}[T]) UseEmit(mw ${emitMiddlewareFuncName}[T]) {`);
  g.block(() => {
    g.line(
      `adapted := func(next EmitFunc[T, any, any]) EmitFunc[T, any, any] {`,
    );
    g.block(() => {
      g.line(
        `return func(cGeneric *HandlerContext[T, any], outputGeneric any) error {`,
      );
      g.block(() => {
        g.line(
          `typedNext := func(c *${handlerContextName}[T], output ${outputType}) error {`,
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
      `e.intServer.addStreamEmitMiddleware(${renderGoString(service.name)}, ${renderGoString(operation.name)}, adapted)`,
    );
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `Handle registers the typed business handler for the ${service.name}.${operation.name} stream.`,
  );
  g.line(`func (e ${entryName}[T]) Handle(handler ${handlerFuncName}[T]) {`);
  g.block(() => {
    g.line(
      `adaptedHandler := func(cGeneric *HandlerContext[T, any], emitGeneric EmitFunc[T, any, any]) error {`,
    );
    g.block(() => {
      g.line(
        `emitSpecific := func(c *${handlerContextName}[T], output ${outputType}) error {`,
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
            `return nil, fmt.Errorf("failed to unmarshal ${service.name}.${operation.name} input: %w", err)`,
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
      `e.intServer.setStreamHandler(${renderGoString(service.name)}, ${renderGoString(operation.name)}, adaptedHandler, deserializer)`,
    );
  });
  g.line("}");
  return g.toString();
}

/**
 * Writes a formatted Go comment block into a generator.
 */
function writeComment(
  g: ReturnType<typeof newGenerator>,
  summary: string,
  doc?: string,
  deprecated?: string,
): void {
  g.raw(renderCommentBlock({ summary, doc, deprecated }));
  g.break();
}

/**
 * Resolves the generated server input type for an operation.
 */
function getServerInputType(operation: OperationDescriptor): string {
  return operation.inputTypeName
    ? `vdltypes.${operation.inputTypeName}`
    : "Void";
}

/**
 * Resolves the generated server output type for an operation.
 */
function getServerOutputType(operation: OperationDescriptor): string {
  return operation.outputTypeName
    ? `vdltypes.${operation.outputTypeName}`
    : "Void";
}
