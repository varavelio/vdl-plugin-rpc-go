import { definePlugin } from "@varavel/vdl-plugin-sdk";
import { generate as generateOutput } from "./generate";

/**
 * SDK-facing entrypoint for the VDL Go RPC plugin.
 */
export const generate = definePlugin((input) => generateOutput(input));
