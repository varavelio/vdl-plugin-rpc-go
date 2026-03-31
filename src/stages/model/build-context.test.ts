import {
  annotation,
  field,
  objectLiteral,
  objectType,
  pluginInput,
  primitiveType,
  schema,
  stringLiteral,
  typeDef,
} from "@varavel/vdl-plugin-sdk/testing";
import { describe, expect, it } from "vitest";
import { createGeneratorContext } from "./build-context";

describe("createGeneratorContext", () => {
  it("models annotation-based RPC services and operations", () => {
    const input = pluginInput({
      ir: schema({
        types: [
          typeDef(
            "Messages",
            objectType([
              field(
                "sendMessage",
                objectType([
                  field(
                    "input",
                    objectType([field("text", primitiveType("string"))]),
                  ),
                  field(
                    "output",
                    objectType([field("accepted", primitiveType("bool"))]),
                  ),
                ]),
                {
                  annotations: [
                    annotation("proc"),
                    annotation(
                      "cache",
                      objectLiteral({
                        scope: stringLiteral("room"),
                      }),
                    ),
                  ],
                },
              ),
            ]),
            {
              annotations: [annotation("rpc")],
            },
          ),
        ],
      }),
    });

    const result = createGeneratorContext({
      input,
      generatorOptions: {
        packageName: "client",
        target: "client",
        typesImport: "fixture/internal/types",
      },
    });

    expect(result.errors).toEqual([]);
    expect(result.context?.services).toHaveLength(1);
    expect(result.context?.procedures).toHaveLength(1);

    const service = result.context?.services[0];
    const operation = result.context?.procedures[0];

    expect(service).toMatchObject({
      name: "Messages",
      goName: "Messages",
    });
    expect(operation).toMatchObject({
      rpcName: "Messages",
      name: "sendMessage",
      goName: "SendMessage",
      operationTypeName: "MessagesSendMessage",
      inputTypeName: "MessagesSendMessageInput",
      outputTypeName: "MessagesSendMessageOutput",
    });
    expect(operation?.annotations.map((item) => item.name)).toEqual(["cache"]);
  });

  it("ignores non-rpc fields inside rpc services", () => {
    const input = pluginInput({
      ir: schema({
        types: [
          typeDef(
            "Mixed",
            objectType([
              field("label", primitiveType("string")),
              field("ping", objectType([]), {
                annotations: [annotation("proc")],
              }),
            ]),
            {
              annotations: [annotation("rpc")],
            },
          ),
        ],
      }),
    });

    const result = createGeneratorContext({
      input,
      generatorOptions: {
        packageName: "client",
        target: "client",
        typesImport: "fixture/internal/types",
      },
    });

    expect(result.errors).toEqual([]);
    expect(result.context?.procedures).toHaveLength(1);
    expect(result.context?.procedures[0]?.name).toBe("ping");
  });

  it("allows operations that omit input and output entirely", () => {
    const input = pluginInput({
      ir: schema({
        types: [
          typeDef(
            "Commands",
            objectType([
              field("ping", objectType([]), {
                annotations: [annotation("proc")],
              }),
            ]),
            {
              annotations: [annotation("rpc")],
            },
          ),
        ],
      }),
    });

    const result = createGeneratorContext({
      input,
      generatorOptions: {
        packageName: "client",
        target: "client",
        typesImport: "fixture/internal/types",
      },
    });

    expect(result.errors).toEqual([]);
    expect(result.context?.procedures[0]).toMatchObject({
      name: "ping",
      inputTypeName: undefined,
      outputTypeName: undefined,
    });
  });
});
