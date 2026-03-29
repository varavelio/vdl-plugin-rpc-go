import { newGenerator } from "@varavel/gen";
import { dedent } from "@varavel/vdl-plugin-sdk/utils/strings";
import type {
  GeneratorContext,
  OperationDescriptor,
  ServiceDescriptor,
} from "../../model/types";
import { joinSections } from "./helpers";
import {
  renderAnnotationsLiteral,
  renderCommentBlock,
  renderGoString,
} from "./renderers";

const CATALOG_HEADER = dedent(/* go */ `
  // -----------------------------------------------------------------------------
  // RPC Catalog
  // -----------------------------------------------------------------------------
`);

export function renderCatalog(context: GeneratorContext) {
  return joinSections([
    CATALOG_HEADER,
    renderPathCatalog(context.services),
    renderOperationCatalog("VDLProcedures", context.procedures),
    renderOperationCatalog("VDLStreams", context.streams),
  ]);
}

/**
 * Renders the generated Go operation catalogs used by runtime code.
 */
function renderOperationCatalog(
  constName: string,
  operations: OperationDescriptor[],
): string {
  const summary =
    constName === "VDLProcedures"
      ? "VDLProcedures contains every generated procedure definition."
      : "VDLStreams contains every generated stream definition.";

  if (operations.length === 0) {
    const g = newGenerator();
    g.line(renderCommentBlock({ summary }));
    g.line(`var ${constName} = []OperationDefinition{}`);
    return g.toString();
  }

  const entries = operations.map((operation) => {
    const g = newGenerator();
    g.line("{");
    g.block(() => {
      g.line(`RPCName: ${renderGoString(operation.rpcName)},`);
      g.line(`Name: ${renderGoString(operation.name)},`);
      g.line(
        `Type: ${
          operation.kind === "proc"
            ? "OperationTypeProc"
            : "OperationTypeStream"
        },`,
      );
      g.line(
        `Annotations: ${renderAnnotationsLiteral(operation.annotations)},`,
      );
    });
    g.line("},");
    return g.toString().trim();
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

/**
 * Renders a nested catalog of generated operation paths.
 */
function renderPathCatalog(services: ServiceDescriptor[]): string {
  const g = newGenerator();
  g.line(
    renderCommentBlock({
      summary:
        "VDLPaths contains the generated path catalog for every procedure and stream.",
    }),
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
            `${operation.goName}: ${renderGoString(`/${service.name}/${operation.name}`)},`,
          );
        }
      });
      g.line("},");
    }
  });
  g.line("}");

  return joinSections([g.toString()]);
}
