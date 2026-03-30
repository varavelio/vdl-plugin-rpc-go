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
import { CLIENT_RUNTIME } from "./runtime";

/**
 * Generates the Go client file for the prepared RPC context.
 */
export function generateClientFile(
  context: GeneratorContext,
): PluginOutputFile {
  const body = joinSections([
    `package ${context.options.packageName}`,
    renderClientImports(context),
    renderCatalog(context),
    renderCoreRuntime(),
    CLIENT_RUNTIME,
    renderClientServices(context.services),
  ]);

  return createGoFile("client.go", "", body);
}

/**
 * Renders the import block required by the generated client runtime.
 */
function renderClientImports(context: GeneratorContext): string {
  const needsTypesImport = context.services.some((service) =>
    service.operations.some(
      (operation) => operation.inputTypeName || operation.outputTypeName,
    ),
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

/**
 * Renders all client-facing service registries and operation builders.
 */
function renderClientServices(services: ServiceDescriptor[]): string {
  return services.map((service) => renderClientService(service)).join("\n\n");
}

/**
 * Renders the generated client API for a single RPC service.
 */
function renderClientService(service: ServiceDescriptor): string {
  const rpcStructName = `client${service.goName}RPC`;
  const procsStructName = `client${service.goName}Procs`;
  const streamsStructName = `client${service.goName}Streams`;

  const g = newGenerator().withTabs();

  writeComment(
    g,
    `${service.goName} returns the client registry for the ${service.name} RPC service.`,
    service.doc,
    service.deprecated,
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
    `${rpcStructName} groups the generated client builders for the ${service.name} RPC service.`,
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
    `WithRetryConfig sets the default retry configuration for every procedure in the ${service.name} RPC service.`,
  );
  g.line(
    `func (r *${rpcStructName}) WithRetryConfig(conf RetryConfig) *${rpcStructName} {`,
  );
  g.block(() => {
    g.line(
      `r.intClient.setRPCRetryConfig(${renderGoString(service.name)}, conf)`,
    );
    g.line("return r");
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `WithTimeoutConfig sets the default timeout configuration for every procedure in the ${service.name} RPC service.`,
  );
  g.line(
    `func (r *${rpcStructName}) WithTimeoutConfig(conf TimeoutConfig) *${rpcStructName} {`,
  );
  g.block(() => {
    g.line(
      `r.intClient.setRPCTimeoutConfig(${renderGoString(service.name)}, conf)`,
    );
    g.line("return r");
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `WithReconnectConfig sets the default reconnect configuration for every stream in the ${service.name} RPC service.`,
  );
  g.line(
    `func (r *${rpcStructName}) WithReconnectConfig(conf ReconnectConfig) *${rpcStructName} {`,
  );
  g.block(() => {
    g.line(
      `r.intClient.setRPCReconnectConfig(${renderGoString(service.name)}, conf)`,
    );
    g.line("return r");
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `WithMaxMessageSize sets the default maximum stream message size for the ${service.name} RPC service.`,
  );
  g.line(
    `func (r *${rpcStructName}) WithMaxMessageSize(size int64) *${rpcStructName} {`,
  );
  g.block(() => {
    g.line(
      `r.intClient.setRPCMaxMessageSize(${renderGoString(service.name)}, size)`,
    );
    g.line("return r");
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `WithHeaderProvider adds a header provider for every request in the ${service.name} RPC service.`,
  );
  g.line(
    `func (r *${rpcStructName}) WithHeaderProvider(provider HeaderProvider) *${rpcStructName} {`,
  );
  g.block(() => {
    g.line(
      `r.intClient.setRPCHeaderProvider(${renderGoString(service.name)}, provider)`,
    );
    g.line("return r");
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `WithHeader adds a static header for every request in the ${service.name} RPC service.`,
  );
  g.line(
    `func (r *${rpcStructName}) WithHeader(key string, value string) *${rpcStructName} {`,
  );
  g.block(() => {
    g.line(
      `r.intClient.setRPCHeaderProvider(${renderGoString(service.name)}, func(_ context.Context, h http.Header) error {`,
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
    `${procsStructName} exposes the generated procedure builders for the ${service.name} RPC service.`,
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
    `${streamsStructName} exposes the generated stream builders for the ${service.name} RPC service.`,
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

/**
 * Renders a client procedure builder and execute method.
 */
function renderClientProcedure(
  service: ServiceDescriptor,
  operation: OperationDescriptor,
): string {
  const registryName = `client${service.goName}Procs`;
  const builderName = `clientBuilder${operation.operationTypeName}`;
  const inputType = getClientInputType(operation);
  const outputType = getClientOutputType(operation);

  const g = newGenerator().withTabs();
  writeComment(
    g,
    `${operation.goName} creates a call builder for the ${service.name}.${operation.name} procedure.`,
    operation.doc,
    operation.deprecated,
  );
  g.line(
    `func (registry *${registryName}) ${operation.goName}() *${builderName} {`,
  );
  g.block(() => {
    g.line(
      `return &${builderName}{client: registry.intClient, headerProviders: []HeaderProvider{}, rpcName: ${renderGoString(service.name)}, name: ${renderGoString(operation.name)}}`,
    );
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `${builderName} configures and executes calls to the ${service.name}.${operation.name} procedure.`,
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
    `WithHeader adds a static header to the ${service.name}.${operation.name} procedure call.`,
  );
  g.line(
    `func (b *${builderName}) WithHeader(key string, value string) *${builderName} {`,
  );
  g.block(() => {
    g.line(
      "b.headerProviders = append(b.headerProviders, func(_ context.Context, h http.Header) error {",
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
    `WithHeaderProvider adds a dynamic header provider to the ${service.name}.${operation.name} procedure call.`,
  );
  g.line(
    `func (b *${builderName}) WithHeaderProvider(provider HeaderProvider) *${builderName} {`,
  );
  g.block(() => {
    g.line("b.headerProviders = append(b.headerProviders, provider)");
    g.line("return b");
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `WithRetryConfig overrides retry behavior for the ${service.name}.${operation.name} procedure call.`,
  );
  g.line(
    `func (b *${builderName}) WithRetryConfig(conf RetryConfig) *${builderName} {`,
  );
  g.block(() => {
    g.line("b.retryConf = &conf");
    g.line("return b");
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `WithTimeoutConfig overrides timeout behavior for the ${service.name}.${operation.name} procedure call.`,
  );
  g.line(
    `func (b *${builderName}) WithTimeoutConfig(conf TimeoutConfig) *${builderName} {`,
  );
  g.block(() => {
    g.line("b.timeoutConf = &conf");
    g.line("return b");
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `Execute sends a request to the ${service.name}.${operation.name} procedure.`,
  );
  g.line(
    `func (b *${builderName}) Execute(ctx context.Context, input ${inputType}) (${outputType}, error) {`,
  );
  g.block(() => {
    g.line(
      "raw := b.client.proc(ctx, b.rpcName, b.name, input, b.headerProviders, b.retryConf, b.timeoutConf)",
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
        `return ${outputType}{}, Error{Message: fmt.Sprintf("failed to decode ${service.name}.${operation.name} output: %v", err)}`,
      );
    });
    g.line("}");
    g.line("return out, nil");
  });
  g.line("}");
  return g.toString();
}

/**
 * Renders a client stream builder and execute method.
 */
function renderClientStream(
  service: ServiceDescriptor,
  operation: OperationDescriptor,
): string {
  const registryName = `client${service.goName}Streams`;
  const builderName = `clientBuilder${operation.operationTypeName}Stream`;
  const inputType = getClientInputType(operation);
  const outputType = getClientOutputType(operation);

  const g = newGenerator().withTabs();
  writeComment(
    g,
    `${operation.goName} creates a stream builder for the ${service.name}.${operation.name} stream.`,
    operation.doc,
    operation.deprecated,
  );
  g.line(
    `func (registry *${registryName}) ${operation.goName}() *${builderName} {`,
  );
  g.block(() => {
    g.line(
      `return &${builderName}{client: registry.intClient, headerProviders: []HeaderProvider{}, rpcName: ${renderGoString(service.name)}, name: ${renderGoString(operation.name)}}`,
    );
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `${builderName} configures and executes subscriptions to the ${service.name}.${operation.name} stream.`,
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
    `WithHeader adds a static header to the ${service.name}.${operation.name} stream subscription.`,
  );
  g.line(
    `func (b *${builderName}) WithHeader(key string, value string) *${builderName} {`,
  );
  g.block(() => {
    g.line(
      "b.headerProviders = append(b.headerProviders, func(_ context.Context, h http.Header) error {",
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
    `WithHeaderProvider adds a dynamic header provider to the ${service.name}.${operation.name} stream subscription.`,
  );
  g.line(
    `func (b *${builderName}) WithHeaderProvider(provider HeaderProvider) *${builderName} {`,
  );
  g.block(() => {
    g.line("b.headerProviders = append(b.headerProviders, provider)");
    g.line("return b");
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `WithReconnectConfig overrides reconnect behavior for the ${service.name}.${operation.name} stream subscription.`,
  );
  g.line(
    `func (b *${builderName}) WithReconnectConfig(conf ReconnectConfig) *${builderName} {`,
  );
  g.block(() => {
    g.line("b.reconnectConf = &conf");
    g.line("return b");
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `WithMaxMessageSize overrides the maximum message size for the ${service.name}.${operation.name} stream subscription.`,
  );
  g.line(
    `func (b *${builderName}) WithMaxMessageSize(size int64) *${builderName} {`,
  );
  g.block(() => {
    g.line("b.maxMessageSize = size");
    g.line("return b");
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `OnConnect registers a callback that runs after the ${service.name}.${operation.name} stream connects.`,
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
    `OnDisconnect registers a callback that runs after the ${service.name}.${operation.name} stream stops.`,
  );
  g.line(
    `func (b *${builderName}) OnDisconnect(cb func(error)) *${builderName} {`,
  );
  g.block(() => {
    g.line("b.onDisconnect = cb");
    g.line("return b");
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `OnReconnect registers a callback that runs before the ${service.name}.${operation.name} stream reconnects.`,
  );
  g.line(
    `func (b *${builderName}) OnReconnect(cb func(int, time.Duration)) *${builderName} {`,
  );
  g.block(() => {
    g.line("b.onReconnect = cb");
    g.line("return b");
  });
  g.line("}");
  g.break();

  writeComment(
    g,
    `Execute opens the ${service.name}.${operation.name} stream and returns its event channel.`,
  );
  g.line(
    `func (b *${builderName}) Execute(ctx context.Context, input ${inputType}) <-chan Response[${outputType}] {`,
  );
  g.block(() => {
    g.line(
      "rawEvents := b.client.stream(ctx, b.rpcName, b.name, input, b.headerProviders, b.reconnectConf, b.maxMessageSize, b.onConnect, b.onDisconnect, b.onReconnect)",
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
            `out <- Response[${outputType}]{Ok: false, Error: event.Error}`,
          );
          g.line("continue");
        });
        g.line("}");
        g.line(`var output ${outputType}`);
        g.line("if err := json.Unmarshal(event.Output, &output); err != nil {");
        g.block(() => {
          g.line(
            `out <- Response[${outputType}]{Ok: false, Error: Error{Message: fmt.Sprintf("failed to decode ${service.name}.${operation.name} output: %v", err)}}`,
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
 * Resolves the generated client input type for an operation.
 */
function getClientInputType(operation: OperationDescriptor): string {
  return operation.inputTypeName
    ? `vdltypes.${operation.inputTypeName}`
    : "Void";
}

/**
 * Resolves the generated client output type for an operation.
 */
function getClientOutputType(operation: OperationDescriptor): string {
  return operation.outputTypeName
    ? `vdltypes.${operation.outputTypeName}`
    : "Void";
}
