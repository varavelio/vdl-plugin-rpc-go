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
import { generate } from "./generate";

function createBaseInput() {
  return pluginInput({
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
                  objectType([
                    field("roomId", primitiveType("string")),
                    field("text", primitiveType("string")),
                  ]),
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
            field(
              "events",
              objectType([
                field(
                  "input",
                  objectType([field("roomId", primitiveType("string"))]),
                ),
                field(
                  "output",
                  objectType([field("text", primitiveType("string"))]),
                ),
              ]),
              {
                annotations: [annotation("stream")],
              },
            ),
          ]),
          {
            annotations: [annotation("rpc")],
          },
        ),
      ],
    }),
    options: {
      package: "rpcpkg",
      typesImport: "fixture/internal/types",
    },
  });
}

describe("generate", () => {
  it("generates the client target", () => {
    const output = generate({
      ...createBaseInput(),
      options: {
        ...createBaseInput().options,
        target: "client",
      },
    });

    expect(output.errors).toBeUndefined();
    expect(output.files).toHaveLength(1);
    expect(output.files?.[0]?.path).toBe("client.go");
  });

  it("generates the server target", () => {
    const output = generate({
      ...createBaseInput(),
      options: {
        ...createBaseInput().options,
        target: "server",
      },
    });

    expect(output.errors).toBeUndefined();
    expect(output.files).toHaveLength(1);
    expect(output.files?.[0]?.path).toBe("server.go");
  });

  it("uses Void for operations that omit input and output", () => {
    const output = generate(
      pluginInput({
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
        options: {
          package: "clientpkg",
          target: "client",
          typesImport: "fixture/internal/types",
        },
      }),
    );

    expect(output.errors).toBeUndefined();
    expect(output.files?.[0]?.content).toContain(
      "Execute(ctx context.Context, input Void) (Void, error)",
    );
  });
});
