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

  it("reports invalid non-object input and output types", () => {
    const input = pluginInput({
      ir: schema({
        types: [
          typeDef(
            "Broken",
            objectType([
              field(
                "oops",
                objectType([
                  field("input", primitiveType("string")),
                  field("output", primitiveType("bool")),
                ]),
                {
                  annotations: [annotation("proc")],
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
        packageName: "server",
        target: "server",
        typesImport: "fixture/internal/types",
      },
    });

    expect(result.context).toBeUndefined();
    expect(result.errors.map((error) => error.message)).toEqual([
      'Operation "Broken"."oops" input must be an object type.',
    ]);
  });
});
