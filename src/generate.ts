import type { PluginInput, PluginOutput } from "@varavel/vdl-plugin-sdk";
import { validateIrForRpc } from "@varavel/vdl-plugin-sdk/utils/rpc";
import { toPluginOutputError } from "./shared/errors";
import { generateFiles } from "./stages/emit/generate-files";
import { createGeneratorContext } from "./stages/model/build-context";
import { resolveGeneratorOptions } from "./stages/options/resolve";

/**
 * Runs the complete VDL RPC Go generation pipeline.
 */
export function generate(input: PluginInput): PluginOutput {
  try {
    const optionsResult = resolveGeneratorOptions(input);
    if (optionsResult.errors.length > 0 || !optionsResult.options) {
      return { errors: optionsResult.errors };
    }

    const rpcValidationErrors = validateIrForRpc(input.ir);
    if (rpcValidationErrors) {
      return { errors: rpcValidationErrors };
    }

    const contextResult = createGeneratorContext({
      input,
      generatorOptions: optionsResult.options,
    });
    if (contextResult.errors.length > 0 || !contextResult.context) {
      return { errors: contextResult.errors };
    }

    return {
      files: generateFiles(contextResult.context),
    };
  } catch (error) {
    return {
      errors: [toPluginOutputError(error)],
    };
  }
}
